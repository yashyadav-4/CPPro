const User        = require('../Model/User');
const Platform    = require('../Model/Platform');
const LeetCodeData= require('../Model/LeetCodeData');
const Submission  = require('../Model/Submissions');
const DailyProblem= require('../Model/DailyProblem');
const Notification= require('../Model/Notification');

const { getCFProblems }   = require('./cfProblemsService');
const { getLCProblems }   = require('./lcProblemsService');
const { getCCProblems }   = require('./ccProblemsService');
const { getCFWeakTopics, getCCWeakTopics, getLCWeakTags } = require('./weaknessService');
const { getTodayIST, getNDaysAgoIST } = require('../Utils/dateUtils');

// ── Utility ──────────────────────────────────────────────────────────────────

function weightedRandomPick(arr, weightFn) {
    if (!arr || arr.length === 0) return null;
    const weights = arr.map(weightFn);
    const total = weights.reduce((s, w) => s + Math.max(0, w), 0);
    if (total === 0) return arr[Math.floor(Math.random() * arr.length)];
    let rand = Math.random() * total;
    for (let i = 0; i < arr.length; i++) {
        rand -= Math.max(0, weights[i]);
        if (rand <= 0) return arr[i];
    }
    return arr[arr.length - 1];
}

// ── Level mapping ─────────────────────────────────────────────────────────────

function getLCDifficultyForUser(lcData) {
    const lastRating = lcData?.contestHistory?.slice(-1)[0]?.rating;
    if (lastRating) {
        if (lastRating >= 1900) return 'Hard';
        if (lastRating >= 1600) return 'Medium';
        return 'Easy';
    }
    const hard   = lcData?.profile?.hardSolved   || 0;
    const medium = lcData?.profile?.mediumSolved  || 0;
    if (hard >= 20)   return 'Medium';
    if (medium >= 50) return 'Medium';
    return 'Easy';
}

function getLCChallengerDifficulty(lcData) {
    const lastRating = lcData?.contestHistory?.slice(-1)[0]?.rating;
    if (lastRating) {
        if (lastRating >= 1600) return 'Hard';
        return 'Medium';
    }
    return getLCDifficultyForUser(lcData) === 'Easy' ? 'Medium' : 'Hard';
}

function getCCWorkoutBand(rating) {
    if (rating < 1400) return { min: 0,    max: 1200 };
    if (rating < 1600) return { min: 800,  max: 1800 };
    if (rating < 1800) return { min: 1200, max: 2400 };
    if (rating < 2000) return { min: 1800, max: 3000 };
    if (rating < 2200) return { min: 2500, max: 3800 };
    return               { min: 3500, max: 5500 };
}

function getCCDifficultyBand(rating) {
    if (rating < 1400) return { min: 0,    max: 1500 };
    if (rating < 1600) return { min: 1000, max: 2200 };
    if (rating < 1800) return { min: 1500, max: 2800 };
    if (rating < 2000) return { min: 2200, max: 3500 };
    if (rating < 2200) return { min: 3000, max: 4500 };
    return               { min: 4000, max: 6500 };
}

function getCCChallengerBand(rating) {
    const b = getCCDifficultyBand(rating);
    return { min: Math.max(0, b.max - 500), max: b.max + 1500 };
}

// ── Block list construction ───────────────────────────────────────────────────

async function buildAttemptedSet(userId, linkedPlatforms, lcData) {
    const [submissions, recentDaily] = await Promise.all([
        Submission.find(
            { userId, platform: { $in: linkedPlatforms }, verdict: 'AC' },
            { problemId: 1, platform: 1, _id: 0 }
        ).lean(),
        DailyProblem.find(
            { userId, date: { $gte: getNDaysAgoIST(14) } },
            { 'workout.problemId': 1, 'workout.platform': 1,
              'challenger.problemId': 1, 'challenger.platform': 1,
              'bonus.problemId': 1, 'bonus.platform': 1 }
        ).lean(),
    ]);

    const set = new Set(submissions.map(s => `${s.platform}::${s.problemId}`));

    // Block problems shown in last 14 days to prevent repeats
    for (const d of recentDaily) {
        if (d.workout?.problemId)    set.add(`${d.workout.platform}::${d.workout.problemId}`);
        if (d.challenger?.problemId) set.add(`${d.challenger.platform}::${d.challenger.problemId}`);
        if (d.bonus?.problemId)      set.add(`${d.bonus.platform}::${d.bonus.problemId}`);
    }

    // Block all accumulated LC AC slugs (NexusLC grows this set over every sync)
    if (lcData?.acSlugs?.length) {
        for (const slug of lcData.acSlugs) set.add(`leetcode::${slug}`);
    }

    // Also block recentSubmissions titleSlugs — with a session token NexusLC returns
    // up to 200 mixed-verdict entries; AC ones extend coverage beyond the 100-slug window.
    // For public-only sync every recentSubmissions entry is already AC (statusDisplay = 'Accepted').
    if (lcData?.recentSubmissions?.length) {
        for (const s of lcData.recentSubmissions) {
            if (s.titleSlug && s.statusDisplay === 'Accepted') {
                set.add(`leetcode::${s.titleSlug}`);
            }
        }
    }

    return set;
}

// ── CF problem selection ──────────────────────────────────────────────────────

async function pickCFWorkout(cfRating, attemptedSet) {
    const all = await getCFProblems();
    const candidates = all.filter(p =>
        p.difficulty >= cfRating - 300 &&
        p.difficulty <= cfRating &&
        p.solvedCount >= 500 &&
        !attemptedSet.has(`codeforces::${p.problemId}`)
    );
    if (!candidates.length) return null;
    const top30 = candidates.sort((a, b) => b.solvedCount - a.solvedCount).slice(0, 30);
    return weightedRandomPick(top30, p => p.solvedCount);
}

async function pickCFChallenger(cfRating, weakTopics, attemptedSet) {
    const all = await getCFProblems();
    let candidates = all.filter(p =>
        p.difficulty >= cfRating + 100 &&
        p.difficulty <= cfRating + 350 &&
        p.solvedCount >= 200 &&
        p.tags.some(t => weakTopics.includes(t)) &&
        !attemptedSet.has(`codeforces::${p.problemId}`)
    );
    // Fallback: no tag constraint
    if (!candidates.length) {
        candidates = all.filter(p =>
            p.difficulty >= cfRating + 100 &&
            p.difficulty <= cfRating + 350 &&
            !attemptedSet.has(`codeforces::${p.problemId}`)
        );
    }
    if (!candidates.length) return null;
    const sorted = candidates.sort((a, b) => {
        const aRel = weakTopics.length ? a.tags.filter(t => weakTopics.includes(t)).length : 0;
        const bRel = weakTopics.length ? b.tags.filter(t => weakTopics.includes(t)).length : 0;
        return bRel !== aRel ? bRel - aRel : b.solvedCount - a.solvedCount;
    });
    const picked = sorted[0];
    return { ...picked, weakTag: picked.tags.find(t => weakTopics.includes(t)) || picked.tags[0] || null };
}

// ── LC problem selection ──────────────────────────────────────────────────────

async function pickLCWorkout(difficulty, attemptedSet) {
    const all = await getLCProblems(difficulty);
    const candidates = all.filter(p => !attemptedSet.has(`leetcode::${p.problemId}`));
    if (!candidates.length) return null;
    return weightedRandomPick(candidates.slice(0, 50), p => p.solvedCount || 1);
}

async function pickLCChallenger(difficulty, weakTags, attemptedSet) {
    const all = await getLCProblems(difficulty);
    let candidates = all.filter(p =>
        p.tags?.some(t => weakTags.includes(t)) &&
        !attemptedSet.has(`leetcode::${p.problemId}`)
    );
    if (!candidates.length) {
        candidates = all.filter(p => !attemptedSet.has(`leetcode::${p.problemId}`));
    }
    if (!candidates.length) return null;
    const sorted = candidates.sort((a, b) => {
        const aRel = a.tags?.filter(t => weakTags.includes(t)).length || 0;
        const bRel = b.tags?.filter(t => weakTags.includes(t)).length || 0;
        return bRel !== aRel ? bRel - aRel : (b.solvedCount || 0) - (a.solvedCount || 0);
    });
    const picked = sorted[0];
    return { ...picked, weakTag: picked.tags?.find(t => weakTags.includes(t)) || null };
}

// ── CC problem selection ──────────────────────────────────────────────────────

async function pickCCWorkout(ccRating, attemptedSet) {
    const band = getCCWorkoutBand(ccRating);
    const all = await getCCProblems(band.min, band.max);
    const candidates = all.filter(p =>
        p.solvedCount >= 100 &&
        !attemptedSet.has(`codechef::${p.problemId}`)
    );
    if (!candidates.length) return null;
    return weightedRandomPick(candidates.sort((a, b) => b.solvedCount - a.solvedCount).slice(0, 30), p => p.solvedCount);
}

async function pickCCChallenger(ccRating, weakTopics, attemptedSet) {
    const band = getCCChallengerBand(ccRating);
    const all = await getCCProblems(band.min, band.max);
    let candidates = all.filter(p =>
        p.tags?.some(t => weakTopics.includes(t)) &&
        !attemptedSet.has(`codechef::${p.problemId}`)
    );
    if (!candidates.length) {
        candidates = all.filter(p => !attemptedSet.has(`codechef::${p.problemId}`));
    }
    if (!candidates.length) return null;
    const sorted = candidates.sort((a, b) => {
        const aRel = a.tags?.filter(t => weakTopics.includes(t)).length || 0;
        const bRel = b.tags?.filter(t => weakTopics.includes(t)).length || 0;
        return bRel !== aRel ? bRel - aRel : (b.solvedCount || 0) - (a.solvedCount || 0);
    });
    const picked = sorted[0];
    return { ...picked, weakTag: picked.tags?.find(t => weakTopics.includes(t)) || null };
}

// ── Bonus problem selection ───────────────────────────────────────────────────
// Picks a problem from a platform NOT used by either workout or challenger.
// Returns null if no unused linked platform has available problems.

async function pickBonus(workoutPlatform, challengerPlatform, { cfRating, ccRating, lcData, cfLinked, lcLinked, ccLinked, attemptedSet }) {
    // Rule: all three problems must NOT be from the same platform.
    // If workout and challenger are already different, the set is diverse — bonus can be any linked platform.
    // If workout and challenger are the same, bonus MUST come from a different platform.
    const allLinked = [
        cfLinked && 'codeforces',
        lcLinked && 'leetcode',
        ccLinked && 'codechef',
    ].filter(Boolean);

    if (allLinked.length === 0) return null;

    const sameUsed = workoutPlatform && challengerPlatform && workoutPlatform === challengerPlatform;

    let candidates;
    if (sameUsed) {
        // Must differ from the shared platform
        candidates = allLinked.filter(p => p !== workoutPlatform);
    } else {
        // Any linked platform is fine — prefer unused ones first for variety
        const used = new Set([workoutPlatform, challengerPlatform].filter(Boolean));
        candidates = [
            ...allLinked.filter(p => !used.has(p)),
            ...allLinked.filter(p =>  used.has(p)),
        ];
    }

    if (candidates.length === 0) return null;

    for (const platform of candidates) {
        let problem = null;
        if (platform === 'leetcode') {
            const diff = getLCDifficultyForUser(lcData);
            problem = await pickLCWorkout(diff, attemptedSet).catch(() => null);
        } else if (platform === 'codeforces') {
            problem = await pickCFWorkout(cfRating, attemptedSet).catch(() => null);
        } else if (platform === 'codechef') {
            problem = await pickCCWorkout(ccRating, attemptedSet).catch(err => {
                console.warn('[DAILY] CC bonus failed:', err.message);
                return null;
            });
        }
        if (problem) return problem;
    }
    return null;
}

// ── Main generation ───────────────────────────────────────────────────────────

async function generateDailyProblems(userId) {
    const [user, cfPlatform, ccPlatform, lcData] = await Promise.all([
        User.findById(userId, 'linkedAccounts dailyStreak').lean(),
        Platform.findOne({ userId, platform: 'codeforces' }, 'currentRating solvedByTopics').lean(),
        Platform.findOne({ userId, platform: 'codechef' },   'currentRating solvedByTopics').lean(),
        LeetCodeData.findOne({ userId }, 'skillStats contestHistory profile acSlugs recentSubmissions').lean(),
    ]);

    const cfLinked = !!(user?.linkedAccounts?.codeforces);
    const ccLinked = !!(user?.linkedAccounts?.codechef);
    const lcLinked = !!(user?.linkedAccounts?.leetcode);

    if (!cfLinked && !ccLinked && !lcLinked) return { status: 'no_account_linked' };

    const linkedPlatforms = [
        cfLinked && 'codeforces',
        ccLinked && 'codechef',
        lcLinked && 'leetcode',
    ].filter(Boolean);

    const attemptedSet = await buildAttemptedSet(userId, linkedPlatforms, lcData);

    const cfRating = cfPlatform?.currentRating || 1200;
    const ccRating = ccPlatform?.currentRating || 1400;
    const lcDiff   = getLCDifficultyForUser(lcData);
    const lcChDiff = getLCChallengerDifficulty(lcData);

    const cfWeak = cfLinked ? getCFWeakTopics(cfPlatform) : [];
    const ccWeak = ccLinked ? getCCWeakTopics(ccPlatform) : [];
    const lcWeak = lcLinked ? getLCWeakTags(lcData) : [];

    // ── WORKOUT: LC > CF > CC ────────────────────────────────────────────
    let workout = null;
    if (lcLinked) {
        workout = await pickLCWorkout(lcDiff, attemptedSet).catch(() => null);
    }
    if (!workout && cfLinked) {
        workout = await pickCFWorkout(cfRating, attemptedSet).catch(() => null);
    }
    if (!workout && ccLinked) {
        workout = await pickCCWorkout(ccRating, attemptedSet).catch(err => {
            console.warn('[DAILY] CC workout failed:', err.message);
            return null;
        });
    }

    // ── CHALLENGER: LC > CF > CC ─────────────────────────────────────────
    let challenger = null;
    if (lcLinked && lcWeak.length) {
        challenger = await pickLCChallenger(lcChDiff, lcWeak, attemptedSet).catch(() => null);
    }
    if (!challenger && cfLinked) {
        challenger = await pickCFChallenger(cfRating, cfWeak, attemptedSet).catch(() => null);
    }
    if (!challenger && ccLinked) {
        challenger = await pickCCChallenger(ccRating, ccWeak, attemptedSet).catch(err => {
            console.warn('[DAILY] CC challenger failed:', err.message);
            return null;
        });
    }

    // ── BONUS: must come from a platform different from both workout and challenger ──
    const bonusCtx = { cfRating, ccRating, lcData, cfLinked, lcLinked, ccLinked, attemptedSet };
    const bonus = await pickBonus(
        workout?.platform   || null,
        challenger?.platform || null,
        bonusCtx
    ).catch(err => {
        console.warn('[DAILY] bonus failed:', err.message);
        return null;
    });

    const today = getTodayIST();
    const doc = await DailyProblem.findOneAndUpdate(
        { userId, date: today },
        { $setOnInsert: { userId, date: today, workout, challenger, bonus, generatedAt: new Date() } },
        { upsert: true, new: true }
    );

    // Create "problems ready" notification
    try {
        await Notification.create({
            userId,
            type: 'daily_problem',
            title: 'Daily Problems Ready',
            message: `Your daily problems for ${today} are ready. Keep your streak alive!`,
            actionUrl: '/daily',
        });
    } catch (_) { /* non-critical */ }

    return doc;
}

// ── Auto-solve detection (called after each sync) ─────────────────────────────

async function checkDailyProblemSolves(userId, platform, acProblemIds) {
    if (!acProblemIds || !acProblemIds.length) return;

    const today = getTodayIST();
    const daily = await DailyProblem.findOne({ userId, date: today });
    if (!daily) return;

    const acSet = new Set(acProblemIds.map(String));
    let changed = false;

    for (const slot of ['workout', 'challenger', 'bonus']) {
        const p = daily[slot];
        if (!p || p.platform !== platform || p.isSolved) continue;
        if (!acSet.has(p.problemId)) continue;

        p.isSolved = true;
        p.solvedAt = new Date();
        changed = true;

        const msg = slot === 'challenger'
            ? `Challenger solved! You tackled ${p.weakTag || p.tags[0] || 'a hard problem'} today.`
            : slot === 'bonus'
            ? 'Bonus challenge solved! Cross-platform sweep complete.'
            : 'Daily Workout complete! Great consistency.';

        Notification.create({
            userId,
            type: 'daily_problem',
            title: slot === 'challenger' ? 'Challenger Solved!' : slot === 'bonus' ? 'Bonus Solved!' : 'Workout Complete',
            message: msg,
            actionUrl: '/daily',
        }).catch(() => {});
    }

    if (!changed) return;

    await daily.save();
    await updateDailyStreak(userId);
}

// ── Streak update ─────────────────────────────────────────────────────────────

async function updateDailyStreak(userId) {
    const user = await User.findById(userId, 'dailyStreak').lean();
    const today     = getTodayIST();
    const yesterday = getNDaysAgoIST(1);

    const lastStr = user?.dailyStreak?.lastSolved
        ? require('../Utils/dateUtils').getISTDate(user.dailyStreak.lastSolved)
        : null;

    if (lastStr === today) return; // already counted today

    const current = lastStr === yesterday
        ? (user?.dailyStreak?.current || 0) + 1
        : 1;

    const longest = Math.max(current, user?.dailyStreak?.longest || 0);

    await User.findByIdAndUpdate(userId, {
        $set: {
            'dailyStreak.current':    current,
            'dailyStreak.longest':    longest,
            'dailyStreak.lastSolved': new Date(),
        },
    });

    // Milestone notifications at 7, 14, 30, 60, 100 days
    const milestones = [7, 14, 30, 60, 100];
    if (milestones.includes(current)) {
        Notification.create({
            userId,
            type: 'streak_milestone',
            title: `${current}-Day Daily Streak!`,
            message: `You've solved daily problems for ${current} consecutive days. Keep it up!`,
            actionUrl: '/daily',
        }).catch(() => {});
    }
}

// ── Manual mark solved ────────────────────────────────────────────────────────

async function markSolved(userId, type) {
    if (!['workout', 'challenger', 'bonus'].includes(type)) throw new Error('Invalid type');
    const today = getTodayIST();
    const daily = await DailyProblem.findOne({ userId, date: today });
    if (!daily) throw new Error('No daily problem found for today');
    if (!daily[type]) throw new Error(`No ${type} problem assigned today`);
    if (daily[type].isSolved) return daily;

    daily[type].isSolved = true;
    daily[type].solvedAt = new Date();
    await daily.save();
    await updateDailyStreak(userId);
    return daily;
}

module.exports = {
    generateDailyProblems,
    checkDailyProblemSolves,
    markSolved,
};
