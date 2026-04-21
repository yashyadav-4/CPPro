// Workers/contestSyncWorker.js
// Runs a global contest sync every 6 hours using a simple setInterval loop.
// On startup it immediately checks the DB time, and repeats every 6h.
const { syncContests } = require('../Services/contestSyncService');
const GlobalSyncState  = require('../Model/GlobalSyncState');

const INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

async function runOnce() {
    try {
        // 1. check database for last sync time
        const state = await GlobalSyncState.findOne({ syncKey: 'contests' });
        const now = Date.now();

        if (state && state.lastSyncedAt) {
            const timeSinceLastSync = now - state.lastSyncedAt.getTime();
            
            if (timeSinceLastSync < INTERVAL_MS) {
                const minsLeft = Math.round((INTERVAL_MS - timeSinceLastSync) / 60000);
                console.log(`[contestWorker] Database has fresh data. Skipping API sync. Next run in ~${minsLeft} mins.`);
                return;
            }
        }

        // 2. Data is stale or it's our first time ever: perform the API sync
        const count = await syncContests();
        console.log(`[contestWorker] Sync done — ${count} contests in window.`);

        // 3. Mark the current time in DB
        await GlobalSyncState.updateOne(
            { syncKey: 'contests' },
            { $set: { lastSyncedAt: new Date(now) } },
            { upsert: true }
        );

    } catch (err) {
        console.error('[contestWorker] Sync error:', err.message);
    }
}

function startContestSyncWorker() {
    console.log('[contestWorker] Starting — will sync every 6 hours.');

    //fire immediately on startup so the DB is populated before any request
    runOnce();

    //then repeat every 6 hours
    setInterval(runOnce, INTERVAL_MS);
}

async function forceSyncContests() {
    const now = Date.now();
    const count = await syncContests();
    await GlobalSyncState.updateOne(
        { syncKey: 'contests' },
        { $set: { lastSyncedAt: new Date(now) } },
        { upsert: true }
    );
    return count;
}

module.exports = { startContestSyncWorker, forceSyncContests };
