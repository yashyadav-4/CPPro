/**
 * cfProblemsService.js
 *
 * Previously fetched problems from the live Codeforces public API
 * (https://codeforces.com/api/problemset.problems).
 * Now queries the synced CFProblem catalog in MongoDB directly.
 *
 * Return shape is identical to the old API shape so all callers are unaffected:
 *   { problemId, contestId, index, title, url, difficulty, tags, solvedCount, platform }
 */

const CFProblem = require('../Model/CFProblem');

// ── In-memory cache ──────────────────────────────────────────────────────────
// Single global cache — the full problemset is fetched at once.
let _cache    = null;
let _cacheTs  = 0;
let _inFlight = null;
const TTL = 30 * 60 * 1000; // 30 minutes

async function getCFProblems() {
    if (_cache && (Date.now() - _cacheTs < TTL)) return _cache;

    // Deduplicate concurrent callers
    if (_inFlight) return _inFlight;

    _inFlight = (async () => {
        try {
            const docs = await CFProblem.find(
                // Only problems that have a rated difficulty
                { difficulty: { $gt: 0 } },
                { problemId: 1, contestId: 1, index: 1, title: 1, url: 1,
                  difficulty: 1, tags: 1, solvedCount: 1, _id: 0 }
            ).lean();

            const result = docs.map(p => ({
                problemId:  p.problemId,
                contestId:  p.contestId,
                index:      p.index,
                title:      p.title,
                url:        p.url,
                difficulty: p.difficulty,
                tags:       p.tags || [],
                solvedCount: p.solvedCount || 0,
                platform:   'codeforces',
            }));

            _cache   = result;
            _cacheTs = Date.now();
            return result;
        } finally {
            _inFlight = null;
        }
    })();

    return _inFlight;
}

module.exports = { getCFProblems };
