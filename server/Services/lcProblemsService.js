/**
 * lcProblemsService.js
 *
 * Previously fetched problems from an external LC sync microservice.
 * Now queries the synced LCProblem catalog in MongoDB directly.
 *
 * Return shape is identical to the old API shape so all callers are unaffected:
 *   { problemId, title, url, difficulty, tags, solvedCount, platform }
 *
 * LCProblem has no solvedCount — we use acRate*100 as a popularity proxy weight.
 */

const LCProblem = require('../Model/LCProblem');

// ── In-memory cache ──────────────────────────────────────────────────────────
// Keyed per difficulty string (easy / medium / hard).
const _cache  = {};
const _inFlight = {};
const TTL = 30 * 60 * 1000; // 30 minutes

function isFresh(key) {
    return _cache[key] && (Date.now() - _cache[key].ts < TTL);
}

async function getLCProblems(difficulty = 'Medium') {
    // Normalise to Title-case to match the DB enum (Easy / Medium / Hard)
    const diff = difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
    const key  = diff.toLowerCase();

    if (isFresh(key)) return _cache[key].data;

    // Deduplicate concurrent callers
    if (_inFlight[key]) return _inFlight[key];

    _inFlight[key] = (async () => {
        try {
            const docs = await LCProblem.find(
                { difficulty: diff, isPaidOnly: false },
                { problemId: 1, title: 1, url: 1, difficulty: 1, tags: 1, acRate: 1, _id: 0 }
            ).lean();

            const result = docs.map(p => ({
                problemId:  p.problemId,
                title:      p.title,
                url:        p.url,
                difficulty: p.difficulty,
                tags:       p.tags || [],
                // acRate is 0–100; scale to a synthetic solvedCount for weighting
                solvedCount: Math.round((p.acRate || 0) * 100),
                platform:   'leetcode',
            }));

            _cache[key] = { data: result, ts: Date.now() };
            return result;
        } finally {
            delete _inFlight[key];
        }
    })();

    return _inFlight[key];
}

module.exports = { getLCProblems };
