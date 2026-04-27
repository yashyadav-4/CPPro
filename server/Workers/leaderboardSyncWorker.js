const { getLeaderboardData } = require('../Repositories/leaderboardRepository');
const LeaderboardCache = require('../Model/LeaderboardCache');
const GlobalSyncState  = require('../Model/GlobalSyncState');

const INTERVAL_MS  = 15 * 60 * 1000; // 15 minutes
const CATEGORIES   = ['cpscore', 'totalQuestions', 'leetcodeRating', 'codeforcesRating'];
const SYNC_KEY     = 'leaderboard';

async function computeAndCache() {
    const now = new Date();
    await Promise.all(
        CATEGORIES.map(async category => {
            const entries = await getLeaderboardData('global', null, category);
            await LeaderboardCache.updateOne(
                { cacheKey: `global:${category}` },
                { $set: { entries, computedAt: now } },
                { upsert: true }
            );
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
        const state = await GlobalSyncState.findOne({ syncKey: SYNC_KEY });
        if (state?.lastSyncedAt) {
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
