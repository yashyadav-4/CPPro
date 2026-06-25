const User = require('../Model/User');
const Platform = require('../Model/Platform');
const LeetCodeData = require('../Model/LeetCodeData');
const Submission = require('../Model/Submissions');
const UpsolveRecommendation = require('../Model/UpsolveRecommendation');

const { getCFProblems } = require('./cfProblemsService');
const { getLCProblems } = require('./lcProblemsService');
const { getCCProblems } = require('./ccProblemsService');
const { getCFWeakTopics, getCCWeakTopics, getLCWeakTags } = require('./weaknessService');
const { fetchPopularProblems } = require('./popularSheetsService');

const EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

// ── Utility ──────────────────────────────────────────────────────────────────

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function ratingToInt(tierStr) {
    return parseInt(tierStr, 10) || 1200;
}

function enforceVariety(pool, limit, linkedCount) {
    if (linkedCount <= 1) return pool.slice(0, limit);
    
    // User explicitly requested max 4 per platform
    const maxPerPlatform = limit === 6 ? 4 : Math.ceil(limit * 0.66);
    let selected = [];
    let counts = {};
    let skipped = [];

    for (const p of pool) {
        if (selected.length >= limit) break;
        counts[p.platform] = (counts[p.platform] || 0) + 1;
        if (counts[p.platform] <= maxPerPlatform) {
            selected.push(p);
        } else {
            skipped.push(p);
        }
    }

    for (const p of skipped) {
        if (selected.length >= limit) break;
        selected.push(p);
    }

    return selected;
}

function weakScore(problem, weakList) {
    if (!weakList.length || !problem.tags?.length) return 0;
    return problem.tags.filter(t => weakList.includes(t)).length;
}

// ── Level mapping ─────────────────────────────────────────────────────────────

function getLCDifficultyForUser(lcData) {
    const lastRating = lcData?.contestHistory?.slice(-1)[0]?.rating;
    if (lastRating) {
        if (lastRating >= 1900) return 'Hard';
        if (lastRating >= 1600) return 'Medium';
        return 'Easy';
    }
    const hard = lcData?.profile?.hardSolved || 0;
    const medium = lcData?.profile?.mediumSolved || 0;
    if (hard >= 20) return 'Medium';
    if (medium >= 50) return 'Medium';
    return 'Easy';
}

function getCCWorkoutBand(rating) {
    if (rating < 1400) return { min: 0,    max: 1200 };
    if (rating < 1600) return { min: 800,  max: 1800 };
    if (rating < 1800) return { min: 1200, max: 2400 };
    if (rating < 2000) return { min: 1800, max: 3000 };
    if (rating < 2200) return { min: 2500, max: 3800 };
    return               { min: 3500, max: 5500 };
}

async function buildAttemptedSet(userId, linkedPlatforms) {
    const submissions = await Submission.find(
        { userId, platform: { $in: linkedPlatforms } },
        { problemId: 1, platform: 1, _id: 0 }
    ).lean();
    return new Set(submissions.map(s => `${s.platform}::${s.problemId}`));
}

function _buildLCResult(p, weakTags) {
    return {
        platform:         'leetcode',
        problemId:        p.problemId,
        title:            p.title,
        url:              p.url,
        difficulty:       p.difficulty,
        tags:             p.tags || [],
        sheets:           p.sheets || [],
        fromPopularSheet: !!p.sheets?.length,
        weakTag:          p.tags?.find(t => weakTags?.includes(t)) || null,
        solvedCount:      p.solvedCount || 0,
    };
}

function _buildCFResult(p, weakTopics) {
    return {
        platform:         'codeforces',
        problemId:        p.problemId,
        title:            p.title,
        url:              p.url,
        difficulty:       p.difficulty,
        tags:             p.tags || [],
        solvedCount:      p.solvedCount || 0,
        sheets:           p.sheets || [],
        fromPopularSheet: !!p.sheets?.length,
        weakTag:          p.tags?.find(t => weakTopics?.includes(t)) || null,
    };
}

function _buildCCResult(p, weakTopics) {
    return {
        platform:         'codechef',
        problemId:        p.problemId,
        title:            p.title,
        url:              p.url,
        difficulty:       p.difficulty,
        tags:             p.tags || [],
        solvedCount:      p.solvedCount || 0,
        sheets:           [],
        fromPopularSheet: false,
        weakTag:          p.tags?.find(t => weakTopics?.includes(t)) || null,
    };
}

// ── Generators ────────────────────────────────────────────────────────────────

async function generateWorkout(limit, { cfLinked, lcLinked, ccLinked, linkedCount, cfRating, ccRating, lcData, cfWeak, lcWeak, ccWeak, attemptedSet, popularData }) {
    let pool = [];
    let seenInPool = new Set();

    if (lcLinked) {
        let lcUnsolved = popularData.lc.filter(p => !attemptedSet.has(`leetcode::${p.problemId}`));
        let eligible = lcUnsolved.filter(p => p.difficulty === 'Easy' || p.difficulty === 'Medium');
        pool.push(...eligible.map(p => {
            seenInPool.add(`leetcode::${p.problemId}`);
            return { ..._buildLCResult(p, lcWeak), _source: 'sheet', _weakScore: weakScore(p, lcWeak), _ratingDiff: 0 };
        }));

        let diff = getLCDifficultyForUser(lcData);
        if (diff === 'Hard') diff = 'Medium';
        const all = await getLCProblems(diff);
        let catEligible = all.filter(p => !attemptedSet.has(`leetcode::${p.problemId}`) && !seenInPool.has(`leetcode::${p.problemId}`));
        pool.push(...catEligible.map(p => ({ ..._buildLCResult(p, lcWeak), _source: 'catalog', _weakScore: weakScore(p, lcWeak), _ratingDiff: 0 })));
    }

    if (cfLinked) {
        let cfUnsolved = popularData.cf.filter(p => !attemptedSet.has(`codeforces::${p.problemId}`));
        let eligible = cfUnsolved.filter(p => ratingToInt(p.ratingTier) <= cfRating);
        pool.push(...eligible.map(p => {
            seenInPool.add(`codeforces::${p.problemId}`);
            return { ..._buildCFResult(p, cfWeak), _source: 'sheet', _weakScore: weakScore(p, cfWeak), _ratingDiff: Math.max(0, cfRating - ratingToInt(p.ratingTier)) };
        }));

        const all = await getCFProblems();
        let catEligible = all.filter(p => 
            p.difficulty <= cfRating && p.difficulty >= Math.max(800, cfRating - 400) &&
            !attemptedSet.has(`codeforces::${p.problemId}`) && !seenInPool.has(`codeforces::${p.problemId}`)
        );
        pool.push(...catEligible.map(p => ({ ..._buildCFResult(p, cfWeak), _source: 'catalog', _weakScore: weakScore(p, cfWeak), _ratingDiff: Math.max(0, cfRating - p.difficulty) })));
    }

    const includeCC = ccLinked && !cfLinked && !lcLinked;
    if (includeCC) {
        const band = getCCWorkoutBand(ccRating);
        const all = await getCCProblems(band.min, band.max);
        let catEligible = all.filter(p => !attemptedSet.has(`codechef::${p.problemId}`) && !seenInPool.has(`codechef::${p.problemId}`));
        pool.push(...catEligible.map(p => ({ ..._buildCCResult(p, ccWeak), _source: 'catalog', _weakScore: weakScore(p, ccWeak), _ratingDiff: Math.max(0, ccRating - p.difficulty) })));
    }

    pool = shuffleArray(pool);
    pool.sort((a, b) => {
        const sa = a._source === 'sheet' ? 1 : 0;
        const sb = b._source === 'sheet' ? 1 : 0;
        if (sa !== sb) return sb - sa;

        if (a._weakScore !== b._weakScore) return b._weakScore - a._weakScore;

        if (a._ratingDiff !== b._ratingDiff) return a._ratingDiff - b._ratingDiff; // Ascending: smaller diff is better

        return 0;
    });

    return enforceVariety(pool, limit, linkedCount).map(p => { delete p._source; delete p._weakScore; delete p._ratingDiff; return p; });
}

async function generateChallenge(limit, { cfLinked, lcLinked, ccLinked, linkedCount, cfRating, ccRating, cfWeak, lcWeak, ccWeak, attemptedSet, popularData }) {
    let pool = [];
    let seenInPool = new Set();

    if (lcLinked) {
        let lcUnsolved = popularData.lc.filter(p => !attemptedSet.has(`leetcode::${p.problemId}`));
        let eligible = lcUnsolved.filter(p => p.difficulty === 'Medium' || p.difficulty === 'Hard');
        pool.push(...eligible.map(p => {
            seenInPool.add(`leetcode::${p.problemId}`);
            return { ..._buildLCResult(p, lcWeak), _source: 'sheet', _weakScore: weakScore(p, lcWeak) };
        }));

        const all = await getLCProblems('Hard');
        let catEligible = all.filter(p => !attemptedSet.has(`leetcode::${p.problemId}`) && !seenInPool.has(`leetcode::${p.problemId}`));
        pool.push(...catEligible.map(p => ({ ..._buildLCResult(p, lcWeak), _source: 'catalog', _weakScore: weakScore(p, lcWeak) })));
    }

    if (cfLinked) {
        let cfUnsolved = popularData.cf.filter(p => !attemptedSet.has(`codeforces::${p.problemId}`));
        let eligible = cfUnsolved.filter(p => {
            const rt = ratingToInt(p.ratingTier);
            return rt >= cfRating && rt <= cfRating + 200;
        });
        pool.push(...eligible.map(p => {
            seenInPool.add(`codeforces::${p.problemId}`);
            return { ..._buildCFResult(p, cfWeak), _source: 'sheet', _weakScore: weakScore(p, cfWeak) };
        }));

        const all = await getCFProblems();
        let catEligible = all.filter(p => 
            p.difficulty >= cfRating && p.difficulty <= cfRating + 200 &&
            !attemptedSet.has(`codeforces::${p.problemId}`) && !seenInPool.has(`codeforces::${p.problemId}`)
        );
        pool.push(...catEligible.map(p => ({ ..._buildCFResult(p, cfWeak), _source: 'catalog', _weakScore: weakScore(p, cfWeak) })));
    }

    const includeCC = ccLinked && !cfLinked && !lcLinked;
    if (includeCC) {
        const all = await getCCProblems(ccRating, ccRating + 200);
        let catEligible = all.filter(p => !attemptedSet.has(`codechef::${p.problemId}`) && !seenInPool.has(`codechef::${p.problemId}`));
        pool.push(...catEligible.map(p => ({ ..._buildCCResult(p, ccWeak), _source: 'catalog', _weakScore: weakScore(p, ccWeak) })));
    }

    pool = shuffleArray(pool);
    pool.sort((a, b) => {
        const sa = a._source === 'sheet' ? 1 : 0;
        const sb = b._source === 'sheet' ? 1 : 0;
        if (sa !== sb) return sb - sa;

        if (a._weakScore !== b._weakScore) return b._weakScore - a._weakScore;

        return 0;
    });

    return enforceVariety(pool, limit, linkedCount).map(p => { delete p._source; delete p._weakScore; return p; });
}

async function generateBonus(limit, { cfLinked, lcLinked, ccLinked, linkedCount, cfRating, ccRating, lcData, attemptedSet }) {
    let pool = [];
    let seenInPool = new Set();
    
    if (cfLinked) {
        const all = await getCFProblems();
        let candidates = all.filter(p => 
            p.difficulty >= Math.max(800, cfRating - 200) && p.difficulty <= cfRating + 200 &&
            !attemptedSet.has(`codeforces::${p.problemId}`)
        );
        pool.push(...candidates.map(p => {
            seenInPool.add(`codeforces::${p.problemId}`);
            return _buildCFResult(p, []);
        }));
    }

    if (lcLinked) {
        const diff = getLCDifficultyForUser(lcData);
        const all = await getLCProblems(diff);
        let candidates = all.filter(p => !attemptedSet.has(`leetcode::${p.problemId}`) && !seenInPool.has(`leetcode::${p.problemId}`));
        pool.push(...candidates.map(p => {
            seenInPool.add(`leetcode::${p.problemId}`);
            return _buildLCResult(p, []);
        }));
    }

    if (ccLinked) {
        const all = await getCCProblems(Math.max(0, ccRating - 200), ccRating + 200);
        let candidates = all.filter(p => !attemptedSet.has(`codechef::${p.problemId}`) && !seenInPool.has(`codechef::${p.problemId}`));
        pool.push(...candidates.map(p => _buildCCResult(p, [])));
    }

    pool = shuffleArray(pool);
    return enforceVariety(pool, limit, linkedCount);
}

// ── Main Interface ────────────────────────────────────────────────────────────

async function getUpsolveRecommendations(userId) {
    const [user, cfPlatform, ccPlatform, lcData] = await Promise.all([
        User.findById(userId, 'linkedAccounts').lean(),
        Platform.findOne({ userId, platform: 'codeforces' }, 'currentRating solvedByTopics').lean(),
        Platform.findOne({ userId, platform: 'codechef' }, 'currentRating solvedByTopics').lean(),
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

    const linkedCount = linkedPlatforms.length;

    const attemptedSet = await buildAttemptedSet(userId, linkedPlatforms);

    const cfRating = cfPlatform?.currentRating || 1200;
    const ccRating = ccPlatform?.currentRating || 1400;
    const cfWeak = cfLinked ? getCFWeakTopics(cfPlatform) : [];
    const ccWeak = ccLinked ? getCCWeakTopics(ccPlatform) : [];
    const lcWeak = lcLinked ? getLCWeakTags(lcData) : [];

    const popularData = await fetchPopularProblems().catch(() => ({ lc: [], cf: [] }));

    const ctx = { cfLinked, lcLinked, ccLinked, linkedCount, cfRating, ccRating, lcData, cfWeak, lcWeak, ccWeak, attemptedSet, popularData };

    const workout = await generateWorkout(6, ctx);
    workout.forEach(p => attemptedSet.add(`${p.platform}::${p.problemId}`));

    const challenge = await generateChallenge(6, ctx);
    challenge.forEach(p => attemptedSet.add(`${p.platform}::${p.problemId}`));

    const bonus = await generateBonus(6, ctx);

    return {
        workout,
        challenge,
        bonus,
        generatedAt: new Date()
    };
}

// ── Auto-solve detection ─────────────────────────────────────────────────────

async function checkUpsolveProblemSolves(userId, platform, acProblemIds) {
    if (!acProblemIds || !acProblemIds.length) return;
    
    const recs = await UpsolveRecommendation.findOne({ userId });
    if (!recs) return;

    const acSet = new Set(acProblemIds.map(String));
    let changed = false;

    // Fetch actual submission timestamps to reflect when the problem was solved
    const recentAc = await Submission.find({
        userId, platform, problemId: { $in: acProblemIds }, verdict: 'AC'
    }, 'problemId submittedAt').lean();
    
    const acMap = new Map();
    for (const sub of recentAc) {
        if (!acMap.has(sub.problemId) || sub.submittedAt < acMap.get(sub.problemId)) {
            acMap.set(sub.problemId, sub.submittedAt);
        }
    }

    for (const slotName of ['workout', 'challenge', 'bonus']) {
        const slotArray = recs[slotName] || [];
        for (const p of slotArray) {
            if (p.platform !== platform || p.isSolved) continue;
            if (acSet.has(p.problemId)) {
                p.isSolved = true;
                p.solvedAt = acMap.get(p.problemId) || new Date();
                changed = true;
            }
        }
    }

    if (changed) {
        // Mongoose nested arrays modifications require marking as modified or saving
        recs.markModified('workout');
        recs.markModified('challenge');
        recs.markModified('bonus');
        await recs.save();
    }
}

module.exports = {
    getUpsolveRecommendations,
    checkUpsolveProblemSolves,
};
