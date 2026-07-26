// global automatic contest sync worker , works everyr 6 hours can manually sync too
const { syncContests } = require('../Services/contestSyncService');
const GlobalSyncState  = require('../Model/GlobalSyncState');
const { delCache } = require('../Utils/redisClient');

const INTERVAL_MS = 6 * 60 * 60 * 1000;

async function runOnce() {
    try{
        const state =await GlobalSyncState.findOne({syncKey: 'contests'});
        const now= Date.now();

        if (state && state.lastSyncedAt) {
            const timeSinceLastSync = now - state.lastSyncedAt.getTime();
            
            if (timeSinceLastSync < INTERVAL_MS) {
                const minsLeft = Math.round((INTERVAL_MS - timeSinceLastSync) / 60000);
                console.log(`[contestWorker] Database has fresh data. Skipping API sync. Next run in ~${minsLeft} mins.`);
                return;
            }
        }

        const count = await syncContests();
        console.log(`[contestWorker] Sync done — ${count} contests in window.`);

        await GlobalSyncState.updateOne(
            { syncKey: 'contests' },
            { $set: { lastSyncedAt: new Date(now) } },
            { upsert: true }
        );

        await delCache('contests:list');//previously i forgot to clear the cache and so it kept taking old one from redis
    }catch(err){
        console.error('[contestWorker] Sync error:', err.message);
    }
}

function startContestSyncWorker() {
    console.log('[contestWorker] Starting — will sync every 6 hours.');
    runOnce();
    setInterval(runOnce, INTERVAL_MS);
}

async function forceSyncContests(){ //for my admin panel
    const now = Date.now();
    const count = await syncContests();
    await GlobalSyncState.updateOne(
        { syncKey: 'contests' },
        { $set: { lastSyncedAt: new Date(now) } },
        { upsert: true }
    );
    await delCache('contests:list');
    return count;
}

module.exports = {startContestSyncWorker, forceSyncContests};
