const axios = require('axios');

const CF_PROBLEMSET_URL = 'https://codeforces.com/api/problemset.problems';
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

let cache = { data: null, timestamp: 0, inflight: null };

async function getCFProblems() {
    if (cache.data && Date.now() - cache.timestamp < CACHE_TTL) {
        return cache.data;
    }
    // Coalesce concurrent callers onto one in-flight fetch
    if (cache.inflight) return cache.inflight;

    cache.inflight = axios.get(CF_PROBLEMSET_URL, { timeout: 15_000 })
        .then(res => {
            if (res.data?.status !== 'OK') throw new Error('CF API returned non-OK status');

            const { problems, problemStatistics } = res.data.result;
            const statMap = new Map();
            for (const s of problemStatistics) {
                statMap.set(`${s.contestId}${s.index}`, s.solvedCount || 0);
            }

            const enriched = problems
                .filter(p => p.rating)
                .map(p => ({
                    problemId:   `${p.contestId}${p.index}`,
                    contestId:   p.contestId,
                    index:       p.index,
                    title:       p.name,
                    url:         `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`,
                    difficulty:  p.rating,
                    tags:        p.tags || [],
                    solvedCount: statMap.get(`${p.contestId}${p.index}`) || 0,
                    platform:    'codeforces',
                }));

            cache = { data: enriched, timestamp: Date.now(), inflight: null };
            console.log(`[CF-PROBLEMS] Cached ${enriched.length} problems`);
            return enriched;
        })
        .catch(err => {
            cache.inflight = null;
            throw err;
        });

    return cache.inflight;
}

module.exports = { getCFProblems };
