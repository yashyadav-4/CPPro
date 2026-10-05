const axios = require('axios');
const User = require('../Model/User');
const Submission = require('../Model/Submissions');
const ErrorLog = require('../Model/ErrorLog');
const { checkDailyProblemSolves } = require('./dailyProblemService');
const { checkUpsolveProblemSolves } = require('./upsolveRecommendationService');
const { recalculateLevelUpData } = require('./levelUpRecalculationService');

const CF_SYNC_API = (process.env.CF_SYNC_API || 'http://localhost:3001').replace(/\/$/, '');
const CF_SYNC_SECRET = process.env.CF_SYNC_SECRET || '';

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const ADMIN_COOLDOWN = 10 * 1000; 

function getCooldown(role) {
    return role === 'admin' ? ADMIN_COOLDOWN : FIFTEEN_MINUTES;
}

const getCodeforcesData = async (userId, handle, role = 'user') => {
    const user = await User.findById(userId).lean();
    const cooldown = getCooldown(role);
    const timeSinceUpdate = user.lastCfUpdate ? (Date.now() - new Date(user.lastCfUpdate).getTime()) : Infinity;

    if (timeSinceUpdate < cooldown) {
        const remainingMs = cooldown - timeSinceUpdate;
        const remainingSeconds = Math.ceil(remainingMs / 1000);
        console.log(`[LEAN-NEXUS] >> ${handle} | Fresh | Served | ${remainingSeconds}s remaining`);
        return { freshness: 'fresh', remainingSeconds };
    }

    console.log(`[LEAN-NEXUS] >> ${handle} | Stale | Updating`);

    await User.findByIdAndUpdate(userId, { $set: { lastCfUpdate: new Date() } });

    syncCodeforcesProfile(userId, handle)
        .then(() => console.log(`[LEAN-NEXUS] >> ${handle} | Background update dispatched`))
        .catch(async (err) => {
            console.error(`[LEAN-NEXUS] >> ${handle} | Background update failed:`, err.message);
            ErrorLog.create({
                source: 'CF-Sync-Service',
                level: 'error',
                message: `[CF_SYNC_DISPATCH_FAILED] handle=${handle} | userId=${userId} | reason=${err.message}`,
            }).catch(() => {});
            await User.findByIdAndUpdate(userId, { $set: { lastCfUpdate: user.lastCfUpdate || null } });
        });

    return { freshness: 'updating' };
};

const syncCodeforcesProfile = async (userId, handle, opts = {}) => {
    const syncDepth = opts.syncDepth || 'incremental';
    const headers = { 'Content-Type': 'application/json' };
    if (CF_SYNC_SECRET) headers['Authorization'] = `Bearer ${CF_SYNC_SECRET}`;

    let jobId;
    try {
        const { data } = await axios.post(`${CF_SYNC_API}/sync`, {
            userId: userId.toString(),
            cfHandle: handle,
            syncDepth,
        }, { headers, timeout: 10_000 });
        jobId = data && data.jobId;
        if (!jobId) throw new Error('CF worker did not return a jobId');
        console.log(`[LEAN-NEXUS] >> ${handle} | job queued: ${jobId} (syncDepth=${syncDepth})`);
    } catch (err) {
        const msg = err.response ? JSON.stringify(err.response.data) : err.message;
        throw new Error(`CF worker enqueue failed: ${msg}`);
    }

    const POLL_INTERVAL_MS = 3_000;
    const MAX_POLLS        = 40;

    for (let attempt = 0; attempt < MAX_POLLS; attempt++) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

        let state, failedReason;
        try {
            const { data } = await axios.get(`${CF_SYNC_API}/sync/status/${jobId}`, { headers, timeout: 8_000 });
            state        = data && data.state;
            failedReason = data && data.failedReason;
        } catch (err) {
            console.warn(`[LEAN-NEXUS] >> ${handle} | poll error: ${err.message} (retrying)`);
            continue;
        }

        console.log(`[LEAN-NEXUS] >> ${handle} | job ${jobId} state: ${state}`);

        if (state === 'completed') {
            console.log(`[LEAN-NEXUS] >> ${handle} | sync done ✓`);
            Submission.find(
                { userId, platform: 'codeforces', verdict: 'AC' },
                { problemId: 1, _id: 0 }
            ).sort({ submittedAt: -1 }).limit(50).lean()
                .then(async subs => {
                    checkDailyProblemSolves(userId, 'codeforces', subs.map(s => s.problemId));
                    await checkUpsolveProblemSolves(userId, 'codeforces', subs.map(s => s.problemId));
                    recalculateLevelUpData(userId);
                })
                .catch(err => console.warn('[DAILY-CF] solve check failed:', err.message));
            return { success: true };
        }

        if (state === 'failed') {
            const reason = failedReason || 'unknown';
            throw new Error(`CF worker job failed: ${reason}`);
        }
    }

    throw new Error(`CF worker job ${jobId} did not complete within the poll window`);
};

module.exports = {
    syncCodeforcesProfile,
    getCodeforcesData,
};
