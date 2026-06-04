const User        = require('../Model/User');
const Platform    = require('../Model/Platform');
const LeetCodeData= require('../Model/LeetCodeData');
const Submission  = require('../Model/Submissions');
const DailyProblem= require('../Model/DailyProblem');
const Notification= require('../Model/Notification');
const ErrorLog    = require('../Model/ErrorLog');

const { getCFProblems }   = require('./cfProblemsService');
const { getLCProblems }   = require('./lcProblemsService');
const { getCCProblems }   = require('./ccProblemsService');
const { getCFWeakTopics, getCCWeakTopics, getLCWeakTags } = require('./weaknessService');
const {
    fetchPopularProblems,
    pickPopularLCWorkout,
    pickPopularLCChallenger,
    pickPopularCFWorkout,
    pickPopularCFChallenger,
} = require('./popularSheetsService');
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

async function buildAttemptedSet(userId, linkedPlatforms) {
    const [submissions, recentDaily] = await Promise.all([
        // All AC submissions — permanent block (solved problems never re-appear).
        Submission.find(
            { userId, platform: { $in: linkedPlatforms }, verdict: 'AC' },
            { problemId: 1, platform: 1, _id: 0 }
        ).lean(),
        // Block workout/challenger shown in last 60 days.
        // NOTE: bonus is intentionally excluded — bonus can repeat recent problems
        // and its history must not pollute the workout/challenger block list.
        DailyProblem.find(
            { userId, date: { $gte: getNDaysAgoIST(60) } },
            { 'workout.problemId':    1, 'workout.platform':    1,
              'challenger.problemId': 1, 'challenger.platform': 1 }
        ).lean(),
    ]);

    // solvedSet: only permanently-solved problems (used for bonus to avoid re-solving)
    const solvedSet = new Set(submissions.map(s => `${s.platform}::${s.problemId}`));

    // full: solvedSet + 60-day workout/challenger history (used for workout & challenger)
    const full = new Set(solvedSet);
    for (const d of recentDaily) {
        if (d.workout?.problemId)    full.add(`${d.workout.platform}::${d.workout.problemId}`);
        if (d.challenger?.problemId) full.add(`${d.challenger.platform}::${d.challenger.problemId}`);
    }

    return { full, solvedSet };
}

// ── Platform probability ─────────────────────────────────────────────────────
// Returns an ordered array of platforms to try for a workout/challenger slot.
// 65% chance LC is tried first (and wins if it finds a problem), 35% CF.
// If only one platform is linked it is always tried.

function pickPlatformOrder(lcLinked, cfLinked) {
    if (lcLinked && cfLinked) {
        return Math.random() < 0.65 ? ['lc', 'cf'] : ['cf', 'lc'];
    }
    if (lcLinked) return ['lc'];
    if (cfLinked) return ['cf'];
    return [];
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
            // Bonus LC: any difficulty (Easy/Medium/Hard all allowed)
            // Try each difficulty in order: user's level first, then others
            const diffs = ['Easy', 'Medium', 'Hard'];
            const userDiff = getLCDifficultyForUser(lcData);
            const ordered = [userDiff, ...diffs.filter(d => d !== userDiff)];
            for (const diff of ordered) {
                problem = await pickLCWorkout(diff, attemptedSet).catch(() => null);
                if (problem) break;
            }
        } else if (platform === 'codeforces') {
            // Bonus CF: cfRating ± 200 range
            const all = await getCFProblems();
            const candidates_cf = all.filter(p =>
                p.difficulty >= cfRating - 200 &&
                p.difficulty <= cfRating + 200 &&
                !attemptedSet.has(`codeforces::${p.problemId}`)
            );
            if (candidates_cf.length) {
                const sorted = candidates_cf.sort((a, b) => b.solvedCount - a.solvedCount).slice(0, 30);
                problem = weightedRandomPick(sorted, p => p.solvedCount);
            }
        } else if (platform === 'codechef') {
            // Bonus CC: ccRating ± 200 range
            const all = await getCCProblems(ccRating - 200, ccRating + 200);
            const candidates_cc = all.filter(p =>
                p.solvedCount >= 100 &&
                !attemptedSet.has(`codechef::${p.problemId}`)
            );
            if (candidates_cc.length) {
                problem = weightedRandomPick(
                    candidates_cc.sort((a, b) => b.solvedCount - a.solvedCount).slice(0, 30),
                    p => p.solvedCount
                );
            }
            if (!problem) {
                problem = await pickCCWorkout(ccRating, attemptedSet).catch(err => {
                    console.warn('[DAILY] CC bonus failed:', err.message);
                    ErrorLog.create({ source: 'DailyProblemService:pickBonus', level: 'error', message: err.message || String(err) }).catch(() => {});
                    return null;
                });
            }
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
        LeetCodeData.findOne({ userId }, 'skillStats contestHistory profile').lean(),
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

    const { full: attemptedSet, solvedSet } = await buildAttemptedSet(userId, linkedPlatforms);

    const cfRating = cfPlatform?.currentRating || 1200;
    const ccRating = ccPlatform?.currentRating || 1400;
    const lcDiff   = getLCDifficultyForUser(lcData);
    const lcChDiff = getLCChallengerDifficulty(lcData);

    const cfWeak = cfLinked ? getCFWeakTopics(cfPlatform) : [];
    // ccWeak intentionally omitted — CC only appears in bonus slot which
    // does not target weak topics (bonus is a lighter variety slot).
    const lcWeak = lcLinked ? getLCWeakTags(lcData) : [];

    // ── Fetch popular problems ONCE (2 DB aggregations total) ──────────────
    const popularData = await fetchPopularProblems().catch(() => ({ lc: [], cf: [] }));

    // ── Single-platform mode ──────────────────────────────────────────────────
    // When exactly ONE platform is linked (LC, CF, CC, or any future platform):
    //   All 3 slots come from that platform — no CC restriction, no diversity rule.
    // Multi-platform: 65%/35% LC/CF + CC-only-in-bonus + diversity rules.
    const singlePlatformMode = linkedPlatforms.length === 1;

    // ── WORKOUT ──────────────────────────────────────────────────────────────
    let workout = null;

    if (singlePlatformMode) {
        if (lcLinked) {
            workout = pickPopularLCWorkout(popularData.lc, lcWeak, attemptedSet);
            if (!workout) workout = await pickLCWorkout(lcDiff, attemptedSet).catch(() => null);
        } else if (cfLinked) {
            workout = pickPopularCFWorkout(popularData.cf, cfWeak, attemptedSet, cfRating);
            if (!workout) workout = await pickCFWorkout(cfRating, attemptedSet).catch(() => null);
        } else if (ccLinked) {
            workout = await pickCCWorkout(ccRating, attemptedSet).catch(() => null);
        }
        // Future platforms (e.g. AtCoder): add else-if branch here
    } else {
        // Multi-platform: 65%/35% LC/CF. CC never in workout.
        const workoutOrder = pickPlatformOrder(lcLinked, cfLinked);
        for (const platform of workoutOrder) {
            if (platform === 'lc') {
                workout = pickPopularLCWorkout(popularData.lc, lcWeak, attemptedSet);
                if (!workout) workout = await pickLCWorkout(lcDiff, attemptedSet).catch(() => null);
            } else {
                workout = pickPopularCFWorkout(popularData.cf, cfWeak, attemptedSet, cfRating);
                if (!workout) workout = await pickCFWorkout(cfRating, attemptedSet).catch(() => null);
            }
            if (workout) break;
        }
    }

    // Exclude workout from challenger pool
    const challengerAttemptedSet = new Set(attemptedSet);
    if (workout?.problemId && workout?.platform) {
        challengerAttemptedSet.add(`${workout.platform}::${workout.problemId}`);
    }

    // ── CHALLENGER ───────────────────────────────────────────────────────────
    let challenger = null;

    if (singlePlatformMode) {
        if (lcLinked) {
            challenger = pickPopularLCChallenger(popularData.lc, lcWeak, challengerAttemptedSet);
            if (!challenger) challenger = await pickLCChallenger(lcChDiff, lcWeak, challengerAttemptedSet).catch(() => null);
        } else if (cfLinked) {
            challenger = pickPopularCFChallenger(popularData.cf, cfWeak, challengerAttemptedSet, cfRating);
            if (!challenger) challenger = await pickCFChallenger(cfRating, cfWeak, challengerAttemptedSet).catch(() => null);
        } else if (ccLinked) {
            const ccWeak = getCCWeakTopics(ccPlatform);
            challenger = await pickCCChallenger(ccRating, ccWeak, challengerAttemptedSet).catch(() => null);
        }
    } else {
        const challengerOrder = pickPlatformOrder(lcLinked, cfLinked);
        for (const platform of challengerOrder) {
            if (platform === 'lc') {
                challenger = pickPopularLCChallenger(popularData.lc, lcWeak, challengerAttemptedSet);
                if (!challenger) challenger = await pickLCChallenger(lcChDiff, lcWeak, challengerAttemptedSet).catch(() => null);
            } else {
                challenger = pickPopularCFChallenger(popularData.cf, cfWeak, challengerAttemptedSet, cfRating);
                if (!challenger) challenger = await pickCFChallenger(cfRating, cfWeak, challengerAttemptedSet).catch(() => null);
            }
            if (challenger) break;
        }
    }

    // ── BONUS: uses solvedSet only (no 60-day history block) ──────────────────
    // Bonus can repeat recently-seen problems — only permanently-solved problems
    // are excluded. Today's workout and challenger are excluded to avoid same-day dupes.
    // Bonus does NOT use popular sheets — picks from the full algo problem lists.
    const bonusAttemptedSet = new Set(solvedSet);
    if (workout?.problemId   && workout?.platform)    bonusAttemptedSet.add(`${workout.platform}::${workout.problemId}`);
    if (challenger?.problemId && challenger?.platform) bonusAttemptedSet.add(`${challenger.platform}::${challenger.problemId}`);

    let bonus = null;

    if (singlePlatformMode) {
        // Single platform: bonus also from the same platform, no diversity constraint.
        if (lcLinked) {
            const primary = getLCDifficultyForUser(lcData);
            const ordered = [primary, ...['Easy', 'Medium', 'Hard'].filter(d => d !== primary)];
            for (const diff of ordered) {
                bonus = await pickLCWorkout(diff, bonusAttemptedSet).catch(() => null);
                if (bonus) break;
            }
        } else if (cfLinked) {
            const all = await getCFProblems().catch(() => []);
            const cands = all.filter(p =>
                p.difficulty >= cfRating - 200 &&
                p.difficulty <= cfRating + 200 &&
                !bonusAttemptedSet.has(`codeforces::${p.problemId}`)
            );
            if (cands.length) {
                bonus = weightedRandomPick(
                    cands.sort((a, b) => b.solvedCount - a.solvedCount).slice(0, 30),
                    p => p.solvedCount
                );
            }
        } else if (ccLinked) {
            bonus = await pickCCWorkout(ccRating, bonusAttemptedSet).catch(() => null);
        }
        // Future platforms: add else-if branch here
    } else {
        // Multi-platform: diversity rules apply (CC allowed in bonus only).
        const bonusCtx = { cfRating, ccRating, lcData, cfLinked, lcLinked, ccLinked, attemptedSet: bonusAttemptedSet };
        bonus = await pickBonus(
            workout?.platform    || null,
            challenger?.platform || null,
            bonusCtx
        ).catch(err => {
            console.warn('[DAILY] bonus failed:', err.message);
            ErrorLog.create({ source: 'DailyProblemService:generateDailyProblems', level: 'error', message: err.message || String(err) }).catch(() => {});
            return null;
        });
    }


    const today = getTodayIST();
    const doc = await DailyProblem.findOneAndUpdate(
        { userId, date: today },
        { $setOnInsert: { userId, date: today, workout, challenger, bonus, generatedAt: new Date() } },
        { upsert: true, new: true }
    );

    // NOTE: Notification is now sent by dailyWarmup middleware (combined with topic)

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
