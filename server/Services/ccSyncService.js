const axios = require('axios');
const User = require('../Model/User');

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const ADMIN_COOLDOWN  = 10 * 1000;

const CC_SYNC_API    = (process.env.CC_SYNC_API || '').replace(/\/$/, '');
const CC_SYNC_SECRET = process.env.CC_SYNC_SECRET || '';

if (!CC_SYNC_API) {
    console.warn('[CC-SYNC] WARNING: CC_SYNC_API is not set — CodeChef sync will fail.');
}
if (!CC_SYNC_SECRET) {
    console.warn('[CC-SYNC] WARNING: CC_SYNC_SECRET is not set — CC server auth will fail.');
}

const ccApi = axios.create({
    baseURL: CC_SYNC_API,
    headers: { Authorization: `Bearer ${CC_SYNC_SECRET}` },
    timeout: 10_000,
});

function getCooldown(role) {
    return role === 'admin' ? ADMIN_COOLDOWN : FIFTEEN_MINUTES;
}

// ══════════════════════════════════════════════════════════════════════════
// Freshness gate — 15 min for users, 10 s for admins.
// Stamps lastCcUpdate immediately then fires background sync via CC server.
// ══════════════════════════════════════════════════════════════════════════
const getCodeChefData = async (userId, handle, role = 'user') => {
    const user = await User.findById(userId).lean();
    const cooldown = getCooldown(role);
    const timeSinceUpdate = user.lastCcUpdate
        ? Date.now() - new Date(user.lastCcUpdate).getTime()
        : Infinity;

    if (timeSinceUpdate < cooldown) {
        const remainingSeconds = Math.ceil((cooldown - timeSinceUpdate) / 1000);
        console.log(`[CC-SYNC] >> ${handle} | Fresh | ${remainingSeconds}s remaining`);
        return { freshness: 'fresh', remainingSeconds };
    }

    console.log(`[CC-SYNC] >> ${handle} | Stale | Queuing CC sync`);

    await User.findByIdAndUpdate(userId, { $set: { lastCcUpdate: new Date() } });

    syncCodeChefProfile(userId, handle)
        .then(() => console.log(`[CC-SYNC] >> ${handle} | CC sync complete`))
        .catch(async (err) => {
            console.error(`[CC-SYNC] >> ${handle} | CC sync failed:`, err.message);
            await User.findByIdAndUpdate(userId, {
                $set: { lastCcUpdate: user.lastCcUpdate || null },
            });
        });

    return { freshness: 'updating' };
};

// ══════════════════════════════════════════════════════════════════════════
// Enqueue a sync job on the CC server and poll until completion.
// The CC server scrapes CodeChef and writes directly to MongoDB.
// ══════════════════════════════════════════════════════════════════════════
const syncCodeChefProfile = async (userId, handle) => {
    if (!CC_SYNC_API || !CC_SYNC_SECRET) {
        throw new Error('CC_SYNC_API / CC_SYNC_SECRET not configured');
    }

    let jobId;
    try {
        const enqRes = await ccApi.post('/sync', { userId: String(userId), ccHandle: handle, force: true });
        jobId = enqRes.data && enqRes.data.jobId;
        if (!jobId) throw new Error('CC server did not return a jobId');
        console.log(`[CC-SYNC] >> ${handle} | job queued: ${jobId}`);
    } catch (err) {
        let msg;
        if (err.response) {
            msg = JSON.stringify(err.response.data) || `HTTP ${err.response.status}`;
        } else {
            msg = err.message || err.code || 'unknown error';
        }
        throw new Error(`CC enqueue failed: ${msg}`);
    }

    const POLL_INTERVAL_MS = 3_000;
    const MAX_POLLS        = 40;
    let lastLoggedState    = null;

    for (let attempt = 0; attempt < MAX_POLLS; attempt++) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

        let state, failedReason;
        try {
            const statusRes = await ccApi.get(`/sync/status/${jobId}`);
            state        = statusRes.data && statusRes.data.state;
            failedReason = statusRes.data && statusRes.data.failedReason;
        } catch (err) {
            console.warn(`[CC-SYNC] >> ${handle} | poll error: ${err.message} (retrying)`);
            continue;
        }

        if (state !== lastLoggedState) {
            console.log(`[CC-SYNC] >> ${handle} | job ${jobId} state: ${state}`);
            lastLoggedState = state;
        }

        if (state === 'completed') {
            await User.findByIdAndUpdate(userId, { $set: { lastCcUpdate: new Date() } });
            console.log(`[CC-SYNC] >> ${handle} | sync done ✓`);
            return { success: true };
        }

        if (state === 'failed') {
            const reason = failedReason || 'unknown';
            if (/USER_NOT_FOUND|HANDLE_NOT_FOUND/i.test(reason)) {
                throw new Error('invalid codechef handle');
            }
            throw new Error(`CC job failed: ${reason}`);
        }
    }

    throw new Error(`CC job ${jobId} did not complete within the poll window`);
};

// ══════════════════════════════════════════════════════════════════════════
// Health-check: ping GET /data on CC server.
// ══════════════════════════════════════════════════════════════════════════
const checkCcServerHealth = async () => {
    if (!CC_SYNC_API) throw new Error('CC_SYNC_API not configured');
    const res = await ccApi.get('/data', { timeout: 8_000 });
    return res.data;
};

module.exports = {
    getCodeChefData,
    syncCodeChefProfile,
    checkCcServerHealth,
};
