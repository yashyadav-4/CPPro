const axios = require('axios');

const LC_SYNC_API    = (process.env.LC_SYNC_API || '').replace(/\/$/, '');
const LC_SYNC_SECRET = process.env.LC_SYNC_SECRET || '';

const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours

// One cache bucket per difficulty: Easy / Medium / Hard
const cache = {};

async function getLCProblems(difficulty = 'Medium') {
    const key = difficulty.toLowerCase();
    const bucket = cache[key];
    if (bucket && Date.now() - bucket.timestamp < CACHE_TTL) {
        return bucket.data;
    }
    // Coalesce concurrent callers onto one in-flight fetch per difficulty
    if (bucket?.inflight) return bucket.inflight;

    if (!LC_SYNC_API) throw new Error('LC_SYNC_API not configured');

    const inflight = axios.get(`${LC_SYNC_API}/problems`, {
        params: { difficulty },
        headers: { Authorization: `Bearer ${LC_SYNC_SECRET}` },
        timeout: 15_000,
    })
        .then(res => {
            const problems = res.data?.problems || [];
            cache[key] = { data: problems, timestamp: Date.now(), inflight: null };
            console.log(`[LC-PROBLEMS] Cached ${problems.length} ${difficulty} problems`);
            return problems;
        })
        .catch(err => {
            if (cache[key]) cache[key].inflight = null;
            throw err;
        });

    cache[key] = { ...(cache[key] || {}), inflight };
    return inflight;
}

module.exports = { getLCProblems };
