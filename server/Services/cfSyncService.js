const axios = require('axios');
const User = require('../Model/User');

const CF_SYNC_API = process.env.CF_SYNC_API || 'http://localhost:3001';
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

//delegates sync to the Codeforces-Api Server worker via HTTP
const syncCodeforcesProfile = async (userId, handle) => {
    try {
        console.log(`[LEAN-NEXUS] dispatching sync to worker for: ${handle}`);

        const headers = { 'Content-Type': 'application/json' };
        if (CF_SYNC_SECRET) {
            headers['Authorization'] = `Bearer ${CF_SYNC_SECRET}`;
        }

        const { data } = await axios.post(`${CF_SYNC_API}/sync`, {
            userId: userId.toString(),
            cfHandle: handle,
        }, { headers, timeout: 10000 });

        console.log(`[LEAN-NEXUS] >> ${handle} | Worker accepted job: ${data.jobId || 'unknown'}`);
        return { success: true, jobId: data.jobId };
    } catch (error) {
        console.error(`[LEAN-NEXUS] >> ${handle} | Worker dispatch error:`, error.message);
        throw new Error('Codeforces sync worker is currently unavailable');
    }
};

module.exports = {
    syncCodeforcesProfile,
    getCodeforcesData,
};
