/**
 * ccProblemsService.js
 *
 * Previously fetched problems from a private CodeChef sync microservice.
 * Now queries the synced CCProblem catalog in MongoDB directly.
 *
 * Return shape is identical to the old API shape so all callers are unaffected:
 *   { problemId, title, url, difficulty, tags, solvedCount, platform }
 *
 * The `tags` parameter is retained for API compatibility but CC problems are
 * not tag-filtered at the service level — callers filter on the returned array.
 */

const CCProblem = require('../Model/CCProblem');

// ── In-memory cache ──────────────────────────────────────────────────────────
// Keyed by "diffMin:diffMax" band so different rating ranges stay independent.
const _cache    = {};
const _inFlight = {};
const TTL = 30 * 60 * 1000; // 30 minutes

function isFresh(key) {
    return _cache[key] && (Date.now() - _cache[key].ts < TTL);
}

async function getCCProblems(diffMin, diffMax, tags = []) {
    const key = `${diffMin}:${diffMax}`;

    if (isFresh(key)) return _cache[key].data;

    // Deduplicate concurrent callers for the same band
    if (_inFlight[key]) return _inFlight[key];

    _inFlight[key] = (async () => {
        try {
            const docs = await CCProblem.find(
                { difficulty: { $gte: diffMin, $lte: diffMax } },
                { problemId: 1, title: 1, url: 1, difficulty: 1, tags: 1, solvedCount: 1, _id: 0 }
            ).lean();

            const result = docs.map(p => ({
                problemId:  p.problemId,
                title:      p.title,
                url:        p.url,
                difficulty: p.difficulty,
                tags:       p.tags || [],
                solvedCount: p.solvedCount || 0,
                platform:   'codechef',
            }));

            _cache[key] = { data: result, ts: Date.now() };
            return result;
        } finally {
            delete _inFlight[key];
        }
    })();

    return _inFlight[key];
}

module.exports = { getCCProblems };
