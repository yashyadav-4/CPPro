
const CCProblem = require('../Model/CCProblem');

const _cache    = {};
const _inFlight = {};
const TTL = 30 * 60 * 1000; 

function isFresh(key) {
    return _cache[key] && (Date.now() - _cache[key].ts < TTL);
}

async function getCCProblems(diffMin, diffMax, tags = []) {
    const key = `${diffMin}:${diffMax}`;

    if (isFresh(key)) return _cache[key].data;

    //already getting this particular problem band
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
