const axios = require('axios');
const User = require('../Model/User');

const CF_SYNC_API = (process.env.CF_SYNC_API || 'http://localhost:3001').replace(/\/$/, '');
const CF_SYNC_SECRET = process.env.CF_SYNC_SECRET || '';

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const ADMIN_COOLDOWN = 10 * 1000; // 10 seconds for admins

/**
 * Returns the appropriate cooldown duration based on user role.
 * Admins get a 10-second cooldown; everyone else gets 15 minutes.
 */
function getCooldown(role) {
    return role === 'admin' ? ADMIN_COOLDOWN : FIFTEEN_MINUTES;
}

/**
 * Freshness gate — checks lastCfUpdate against role-based cooldown.
 * Stamps lastCfUpdate IMMEDIATELY on dispatch to prevent duplicate syncs.
 * @param {string} userId
 * @param {string} handle
 * @param {string} role - user role ('user' | 'admin' | 'moderator')
 */
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

    // IMMEDIATELY stamp lastCfUpdate to prevent duplicate dispatches
    // from concurrent requests hitting the stale window
    await User.findByIdAndUpdate(userId, { $set: { lastCfUpdate: new Date() } });

    // background sync — fire-and-forget to worker service
    syncCodeforcesProfile(userId, handle)
        .then(() => console.log(`[LEAN-NEXUS] >> ${handle} | Background update dispatched`))
        .catch(async (err) => {
            console.error(`[LEAN-NEXUS] >> ${handle} | Background update failed:`, err.message);
            // rollback the timestamp so the user can retry
            await User.findByIdAndUpdate(userId, { $set: { lastCfUpdate: user.lastCfUpdate || null } });
        });

    return { freshness: 'updating' };
};

// Enqueues a sync job on the CF worker and polls until completion — mirrors lcSyncService polling.
const syncCodeforcesProfile = async (userId, handle) => {
    const headers = { 'Content-Type': 'application/json' };
    if (CF_SYNC_SECRET) headers['Authorization'] = `Bearer ${CF_SYNC_SECRET}`;

    // 1. Enqueue the job.
    let jobId;
    try {
        const { data } = await axios.post(`${CF_SYNC_API}/sync`, {
            userId: userId.toString(),
            cfHandle: handle,
        }, { headers, timeout: 10_000 });
        jobId = data && data.jobId;
        if (!jobId) throw new Error('CF worker did not return a jobId');
        console.log(`[LEAN-NEXUS] >> ${handle} | job queued: ${jobId}`);
    } catch (err) {
        const msg = err.response ? JSON.stringify(err.response.data) : err.message;
        throw new Error(`CF worker enqueue failed: ${msg}`);
    }

    // 2. Poll /sync/status/:jobId until done (max ~2 min, matching LC pattern).
    const POLL_INTERVAL_MS = 3_000;
    const MAX_POLLS        = 40; // 40 × 3 s = 120 s

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
            return { success: true };
        }

        if (state === 'failed') {
            const reason = failedReason || 'unknown';
            throw new Error(`CF worker job failed: ${reason}`);
        }
        // waiting | active | delayed → keep polling
    }

    throw new Error(`CF worker job ${jobId} did not complete within the poll window`);
};

module.exports = {
    syncCodeforcesProfile,
    getCodeforcesData,
};
