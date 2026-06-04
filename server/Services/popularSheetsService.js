// Services/popularSheetsService.js
// ─────────────────────────────────────────────────────────────────────────────
// Optimised popular-sheets recommendation engine.
//
// KEY DESIGN: `fetchPopularProblems()` runs ONE aggregation per platform
// (popularlcproblems ⟶ lcproblems, popularcfproblems ⟶ cfproblems).
// The caller caches the result and passes it to every picker — so a single
// generateDailyProblems() call triggers exactly 2 DB queries regardless of
// how many slots (workout / challenger / bonus) we fill.
//
// Picker API (all pure functions, no DB access):
//   pickPopularLCWorkout   (lcPool, weakTags,   attemptedSet)
//   pickPopularLCChallenger(lcPool, weakTags,   attemptedSet)
//   pickPopularCFWorkout   (cfPool, weakTopics, attemptedSet, cfRating)
//   pickPopularCFChallenger(cfPool, weakTopics, attemptedSet, cfRating)
//
// Rules enforced:
//   LC Workout   : Easy ✓  Medium ✓  Hard ✓ only if tag NOT in weakTags
//   LC Challenger: Hard + weakTag → Medium + weakTag → any Hard
//   CF Workout   : ratingTier (int) ≤ cfRating
//   CF Challenger: cfRating < ratingTier ≤ cfRating + 200, weak-topic preferred
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const mongoose = require('mongoose');

// ── helpers ───────────────────────────────────────────────────────────────────

function ratingToInt(tierStr) {
    return parseInt(tierStr, 10) || 1200;
}

/** Pick randomly from the first `n` items of a sorted array */
function randomFromTop(arr, n = 20) {
    if (!arr.length) return null;
    const pool = arr.slice(0, n);
    return pool[Math.floor(Math.random() * pool.length)];
}

/** Count how many of a problem's tags appear in the weak list */
function weakScore(problem, weakList) {
    if (!weakList.length || !problem.tags?.length) return 0;
    return problem.tags.filter(t => weakList.includes(t)).length;
}

// ── one-time fetch (called once per daily generation) ─────────────────────────

/**
 * Fetch and JOIN both popular collections against their full catalogs.
 * Returns { lc: Problem[], cf: Problem[] }.
 * Each item contains all catalog fields (title, url, difficulty, tags, …)
 * plus `sheets` from the popular collection and `ratingTier` for CF.
 *
 * The caller should pass the result to every pick* function — do NOT call
 * this more than once per request.
 */
async function fetchPopularProblems() {
    const db = mongoose.connection.db;

    const [lcRaw, cfRaw] = await Promise.all([
        // LC: join popularlcproblems → lcproblems
        db.collection('popularlcproblems').aggregate([
            {
                $lookup: {
                    from: 'lcproblems',
                    localField: 'problemId',
                    foreignField: 'problemId',
                    as: 'detail',
                },
            },
            { $unwind: { path: '$detail', preserveNullAndEmptyArrays: false } },
            {
                $replaceRoot: {
                    newRoot: {
                        $mergeObjects: [
                            '$detail',
                            { sheets: '$sheets', seededAt: '$seededAt' },
                        ],
                    },
                },
            },
        ]).toArray(),

        // CF: join popularcfproblems → cfproblems
        db.collection('popularcfproblems').aggregate([
            {
                $lookup: {
                    from: 'cfproblems',
                    localField: 'problemId',
                    foreignField: 'problemId',
                    as: 'detail',
                },
            },
            { $unwind: { path: '$detail', preserveNullAndEmptyArrays: false } },
            {
                $replaceRoot: {
                    newRoot: {
                        $mergeObjects: [
                            '$detail',
                            { sheets: '$sheets', ratingTier: '$ratingTier', seededAt: '$seededAt' },
                        ],
                    },
                },
            },
        ]).toArray(),
    ]);

    return { lc: lcRaw, cf: cfRaw };
}

// ── LC pickers ────────────────────────────────────────────────────────────────

/**
 * Pick a popular LC WORKOUT problem.
 *
 * Fitness: Easy ✓  Medium ✓  Hard ✓ only when tags don't overlap weakTags
 * Priority: weak-tag overlap → lower difficulty → higher acRate
 *
 * @param {Object[]} lcPool     - pre-fetched popular LC problems (from fetchPopularProblems)
 * @param {string[]} weakTags   - LC tag slugs the user struggles with
 * @param {Set}      attemptedSet
 * @returns {Object|null}
 */
function pickPopularLCWorkout(lcPool, weakTags, attemptedSet) {
    const unsolved = lcPool.filter(p => !attemptedSet.has(`leetcode::${p.problemId}`));
    if (!unsolved.length) return null;

    const eligible = unsolved.filter(p => {
        const d = p.difficulty;
        if (d === 'Easy' || d === 'Medium') return true;
        // Hard: only if this problem's tags do NOT touch any weak tag
        // (Hard problems on weak topics are reserved for the Challenger slot)
        if (d === 'Hard') {
            return weakTags.length === 0 || !p.tags?.some(t => weakTags.includes(t));
        }
        return false;
    });

    if (!eligible.length) return null;

    const diffOrder = { Easy: 0, Medium: 1, Hard: 2 };
    eligible.sort((a, b) => {
        const wa = weakScore(a, weakTags), wb = weakScore(b, weakTags);
        if (wb !== wa) return wb - wa;
        const da = diffOrder[a.difficulty] ?? 1, db = diffOrder[b.difficulty] ?? 1;
        if (da !== db) return da - db;
        return (b.acRate || 0) - (a.acRate || 0);
    });

    const picked = randomFromTop(eligible, 15);
    if (!picked) return null;

    return _buildLCResult(picked, weakTags);
}

/**
 * Pick a popular LC CHALLENGER problem.
 *
 * Pass 1: Hard + tags overlap weakTags
 * Pass 2: Medium + tags overlap weakTags  (beginner fallback)
 * Pass 3: Any Hard from popular sheets
 *
 * @param {Object[]} lcPool
 * @param {string[]} weakTags
 * @param {Set}      attemptedSet
 * @returns {Object|null}
 */
function pickPopularLCChallenger(lcPool, weakTags, attemptedSet) {
    const unsolved = lcPool.filter(p => !attemptedSet.has(`leetcode::${p.problemId}`));
    if (!unsolved.length) return null;

    // Pass 1: Hard + weak tag match
    let candidates = unsolved.filter(p =>
        p.difficulty === 'Hard' && weakTags.length && p.tags?.some(t => weakTags.includes(t))
    );

    // Pass 2: Medium + weak tag match (when user is a beginner)
    if (!candidates.length && weakTags.length) {
        candidates = unsolved.filter(p =>
            p.difficulty === 'Medium' && p.tags?.some(t => weakTags.includes(t))
        );
    }

    // Pass 3: Any Hard problem (no tag constraint)
    if (!candidates.length) {
        candidates = unsolved.filter(p => p.difficulty === 'Hard');
    }

    if (!candidates.length) return null;

    candidates.sort((a, b) => {
        const wa = weakScore(a, weakTags), wb = weakScore(b, weakTags);
        if (wb !== wa) return wb - wa;
        return (b.acRate || 0) - (a.acRate || 0);
    });

    const picked = randomFromTop(candidates, 10);
    if (!picked) return null;

    return _buildLCResult(picked, weakTags);
}

// ── CF pickers ────────────────────────────────────────────────────────────────

/**
 * Pick a popular CF WORKOUT problem.
 *
 * Fitness: ratingTier (int) ≤ cfRating — user is comfortable at this level.
 * Priority: closest to cfRating (most challenging but still comfortable),
 *           then weak-topic overlap, then solvedCount.
 *
 * @param {Object[]} cfPool
 * @param {string[]} weakTopics
 * @param {Set}      attemptedSet
 * @param {number}   cfRating
 * @returns {Object|null}
 */
function pickPopularCFWorkout(cfPool, weakTopics, attemptedSet, cfRating) {
    const unsolved = cfPool.filter(p => !attemptedSet.has(`codeforces::${p.problemId}`));
    if (!unsolved.length) return null;

    const eligible = unsolved.filter(p => ratingToInt(p.ratingTier) <= cfRating);
    if (!eligible.length) return null;

    eligible.sort((a, b) => {
        // Prefer tier closest to cfRating (smallest gap = most challenging)
        const aDiff = cfRating - ratingToInt(a.ratingTier);
        const bDiff = cfRating - ratingToInt(b.ratingTier);
        if (aDiff !== bDiff) return aDiff - bDiff;
        const wa = weakScore(a, weakTopics), wb = weakScore(b, weakTopics);
        if (wb !== wa) return wb - wa;
        return (b.solvedCount || 0) - (a.solvedCount || 0);
    });

    const picked = randomFromTop(eligible, 15);
    if (!picked) return null;

    return _buildCFResult(picked, weakTopics);
}

/**
 * Pick a popular CF CHALLENGER problem.
 *
 * Fitness: cfRating < ratingTier ≤ cfRating + 200
 * Priority: weak-topic match → closest to cfRating → solvedCount
 *
 * @param {Object[]} cfPool
 * @param {string[]} weakTopics
 * @param {Set}      attemptedSet
 * @param {number}   cfRating
 * @returns {Object|null}
 */
function pickPopularCFChallenger(cfPool, weakTopics, attemptedSet, cfRating) {
    const unsolved = cfPool.filter(p => !attemptedSet.has(`codeforces::${p.problemId}`));
    if (!unsolved.length) return null;

    const band = unsolved.filter(p => {
        const rt = ratingToInt(p.ratingTier);
        return rt > cfRating && rt <= cfRating + 200;
    });

    if (!band.length) return null;

    band.sort((a, b) => {
        const wa = weakScore(a, weakTopics), wb = weakScore(b, weakTopics);
        if (wb !== wa) return wb - wa;
        const aDiff = ratingToInt(a.ratingTier) - cfRating;
        const bDiff = ratingToInt(b.ratingTier) - cfRating;
        if (aDiff !== bDiff) return aDiff - bDiff;
        return (b.solvedCount || 0) - (a.solvedCount || 0);
    });

    const picked = randomFromTop(band, 10);
    if (!picked) return null;

    return _buildCFResult(picked, weakTopics);
}

// ── result builders ───────────────────────────────────────────────────────────

function _buildLCResult(p, weakTags) {
    return {
        platform:         'leetcode',
        problemId:        p.problemId,
        title:            p.title,
        url:              p.url,
        difficulty:       p.difficulty,
        tags:             p.tags || [],
        // solvedCount defaults to 0 — lcproblems uses acRate, not solvedCount
        sheets:           p.sheets || [],
        fromPopularSheet: true,
        weakTag:          p.tags?.find(t => weakTags.includes(t)) || null,
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
        fromPopularSheet: true,
        weakTag:          p.tags?.find(t => weakTopics.includes(t)) || null,
    };
}

// ── stats helper ──────────────────────────────────────────────────────────────

async function getPopularSheetStats(userId, linkedPlatforms) {
    const db = mongoose.connection.db;
    const Submission = require('../Model/Submissions');

    const acSubs = await Submission.find(
        { userId, platform: { $in: linkedPlatforms }, verdict: 'AC' },
        { problemId: 1, platform: 1, _id: 0 }
    ).lean();

    const solvedLC = new Set(acSubs.filter(s => s.platform === 'leetcode').map(s => s.problemId));
    const solvedCF = new Set(acSubs.filter(s => s.platform === 'codeforces').map(s => s.problemId));

    const [lcIds, cfIds] = await Promise.all([
        db.collection('popularlcproblems').distinct('problemId'),
        db.collection('popularcfproblems').distinct('problemId'),
    ]);

    return {
        lc: {
            total:     lcIds.length,
            solved:    lcIds.filter(id => solvedLC.has(id)).length,
            remaining: lcIds.filter(id => !solvedLC.has(id)).length,
        },
        cf: {
            total:     cfIds.length,
            solved:    cfIds.filter(id => solvedCF.has(id)).length,
            remaining: cfIds.filter(id => !solvedCF.has(id)).length,
        },
    };
}

module.exports = {
    fetchPopularProblems,
    pickPopularLCWorkout,
    pickPopularLCChallenger,
    pickPopularCFWorkout,
    pickPopularCFChallenger,
    getPopularSheetStats,
};
