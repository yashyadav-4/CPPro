const axios = require('axios');

const CC_SYNC_API    = (process.env.CC_SYNC_API || '').replace(/\/$/, '');
const CC_SYNC_SECRET = process.env.CC_SYNC_SECRET || '';

const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours

// Cache keyed by "min:max"
const cache = {};

async function getCCProblems(diffMin, diffMax, tags = []) {
    const key = `${diffMin}:${diffMax}`;
    const bucket = cache[key];
    if (bucket && Date.now() - bucket.timestamp < CACHE_TTL) {
        return bucket.data;
    }
    // Coalesce concurrent callers onto one in-flight fetch per band
    if (bucket?.inflight) return bucket.inflight;

    if (!CC_SYNC_API) throw new Error('CC_SYNC_API not configured');

    const params = { diffMin, diffMax };
    if (tags.length) params.tags = tags.join(',');

    const inflight = axios.get(`${CC_SYNC_API}/problems`, {
        params,
        headers: { Authorization: `Bearer ${CC_SYNC_SECRET}` },
        timeout: 15_000,
    })
        .then(res => {
            if (res.data?.error === 'CLOUDFLARE_BLOCK') throw new Error('CLOUDFLARE_BLOCK');
            const problems = res.data?.problems || [];
            cache[key] = { data: problems, timestamp: Date.now(), inflight: null };
            console.log(`[CC-PROBLEMS] Cached ${problems.length} problems for band ${key}`);
            return problems;
        })
        .catch(err => {
            if (cache[key]) cache[key].inflight = null;
            throw err;
        });

    cache[key] = { ...(cache[key] || {}), inflight };
    return inflight;
}

module.exports = { getCCProblems };
