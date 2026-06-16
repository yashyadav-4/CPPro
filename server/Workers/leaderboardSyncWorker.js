const { getLeaderboardData } = require('../Repositories/leaderboardRepository');
const GlobalSyncState  = require('../Model/GlobalSyncState');
const { getCache, setCache } = require('../Utils/redisClient');

const INTERVAL_MS  = 15 * 60 * 1000; // 15 minutes
const CATEGORIES   = ['cpscore', 'totalQuestions', 'leetcodeRating', 'codeforcesRating', 'codechefRating'];
const SYNC_KEY     = 'leaderboard';

async function computeAndCache() {
    const now = new Date();
    await Promise.all(
        CATEGORIES.map(async category => {
            const entries = await getLeaderboardData('global', null, category);
            // Cache in Redis without TTL (will be overwritten next run)
            await setCache(`leaderboard:global:${category}`, entries);
        })
    );
    await GlobalSyncState.updateOne(
        { syncKey: SYNC_KEY },
        { $set: { lastSyncedAt: now } },
        { upsert: true }
    );
    console.log(`[leaderboardWorker] Cache refreshed — ${CATEGORIES.length} categories.`);
}

async function runOnce() {
    try {
        const state = await GlobalSyncState.findOne({ syncKey: SYNC_KEY }).lean();
        const hasCache = await getCache(`leaderboard:global:cpscore`);
        
        if (state?.lastSyncedAt && hasCache) {
            const elapsed = Date.now() - state.lastSyncedAt.getTime();
            if (elapsed < INTERVAL_MS) {
                const minsLeft = Math.round((INTERVAL_MS - elapsed) / 60000);
                console.log(`[leaderboardWorker] Cache is fresh. Next recompute in ~${minsLeft} mins.`);
                return;
            }
        }
        await computeAndCache();
    } catch (err) {
        console.error('[leaderboardWorker] Error:', err.message);
    }
}

function startLeaderboardSyncWorker() {
    console.log('[leaderboardWorker] Starting — will recompute every 15 minutes.');
    runOnce();
    setInterval(runOnce, INTERVAL_MS);
}

async function forceRefreshLeaderboard() {
    await computeAndCache();
}

module.exports = { startLeaderboardSyncWorker, forceRefreshLeaderboard };
