
'use strict';

const mongoose = require('mongoose');

function ratingToInt(tierStr) {
    return parseInt(tierStr, 10) || 1200;
}

function randomFromTop(arr, n = 20) {
    if (!arr.length) return null;
    const pool = arr.slice(0, n);
    return pool[Math.floor(Math.random() * pool.length)];
}

function weakScore(problem, weakList) {
    if (!weakList.length || !problem.tags?.length) return 0;
    return problem.tags.filter(t => weakList.includes(t)).length;
}


async function fetchPopularProblems() {
    const db = mongoose.connection.db;

    const [lcRaw, cfRaw] = await Promise.all([
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

function pickPopularLCWorkout(lcPool, weakTags, attemptedSet) {
    const unsolved = lcPool.filter(p => !attemptedSet.has(`leetcode::${p.problemId}`));
    if (!unsolved.length) return null;

    const eligible = unsolved.filter(p => {
        const d = p.difficulty;
        if (d === 'Easy' || d === 'Medium') return true;
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

function pickPopularLCChallenger(lcPool, weakTags, attemptedSet) {
    const unsolved = lcPool.filter(p => !attemptedSet.has(`leetcode::${p.problemId}`));
    if (!unsolved.length) return null;

    let candidates = unsolved.filter(p =>
        p.difficulty === 'Hard' && weakTags.length && p.tags?.some(t => weakTags.includes(t))
    );

    if (!candidates.length && weakTags.length) {
        candidates = unsolved.filter(p =>
            p.difficulty === 'Medium' && p.tags?.some(t => weakTags.includes(t))
        );
    }

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

function pickPopularCFWorkout(cfPool, weakTopics, attemptedSet, cfRating) {
    const unsolved = cfPool.filter(p => !attemptedSet.has(`codeforces::${p.problemId}`));
    if (!unsolved.length) return null;

    const eligible = unsolved.filter(p => ratingToInt(p.ratingTier) <= cfRating);
    if (!eligible.length) return null;

    eligible.sort((a, b) => {
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

function _buildLCResult(p, weakTags) {
    return {
        platform:         'leetcode',
        problemId:        p.problemId,
        title:            p.title,
        url:              p.url,
        difficulty:       p.difficulty,
        tags:             p.tags || [],
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
