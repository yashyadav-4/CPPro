const LCProblem = require('../Model/LCProblem');

const _cache  = {};
const _inFlight = {};
const TTL = 30 * 60 * 1000;

function isFresh(key) {
    return _cache[key] && (Date.now() - _cache[key].ts < TTL);
}

async function getLCProblems(difficulty = 'Medium') {
    const diff = difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
    const key  = diff.toLowerCase();

    if (isFresh(key)) return _cache[key].data;

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
