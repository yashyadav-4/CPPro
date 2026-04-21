const axios = require('axios');
const User = require('../Model/User');
const Notification = require('../Model/Notification');

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const ADMIN_COOLDOWN  = 10 * 1000; // 10 s for admins

// ── NexusLC connection (set in .env) ──────────────────────────────────────
// LC_SYNC_API  : full base URL of your NexusLC server, e.g. https://nexuslc.onrender.com
// LC_SYNC_SECRET: the Bearer token NexusLC expects (matches its API_SECRET)
const LC_SYNC_API    = (process.env.LC_SYNC_API || '').replace(/\/$/, '');
const LC_SYNC_SECRET = process.env.LC_SYNC_SECRET || '';

if (!LC_SYNC_API) {
    console.warn('[LC-SYNC] WARNING: LC_SYNC_API is not set — LeetCode sync will fail.');
}
if (!LC_SYNC_SECRET) {
    console.warn('[LC-SYNC] WARNING: LC_SYNC_SECRET is not set — NexusLC auth will fail.');
}

/** Shared axios instance pre-configured with NexusLC auth. */
const nexusLC = axios.create({
    baseURL: LC_SYNC_API,
    headers: { Authorization: `Bearer ${LC_SYNC_SECRET}` },
    timeout: 10_000,
});

function getCooldown(role) {
    return role === 'admin' ? ADMIN_COOLDOWN : FIFTEEN_MINUTES;
}

// ══════════════════════════════════════════════════════════════════════════
// Role-based freshness gate — 15 min for users, 10 s for admins.
// If stale: stamps lastLcUpdate immediately then fires a background sync
// via NexusLC (single GraphQL call → writes directly to MongoDB).
// ══════════════════════════════════════════════════════════════════════════
const getLeetcodeData = async (userId, handle, role = 'user') => {
    const user = await User.findById(userId).lean();
    const cooldown = getCooldown(role);
    const timeSinceUpdate = user.lastLcUpdate
        ? Date.now() - new Date(user.lastLcUpdate).getTime()
        : Infinity;

    if (timeSinceUpdate < cooldown) {
        const remainingSeconds = Math.ceil((cooldown - timeSinceUpdate) / 1000);
        console.log(`[LC-SYNC] >> ${handle} | Fresh | ${remainingSeconds}s remaining`);
        return { freshness: 'fresh', remainingSeconds };
    }

    console.log(`[LC-SYNC] >> ${handle} | Stale | Queuing NexusLC sync`);

    // Stamp NOW to prevent duplicate dispatches before async work starts.
    await User.findByIdAndUpdate(userId, { $set: { lastLcUpdate: new Date() } });

    // Fire-and-forget: enqueue job on NexusLC, then poll until done.
    syncLeetcodeProfile(userId, handle)
        .then(() => console.log(`[LC-SYNC] >> ${handle} | NexusLC sync complete`))
        .catch(async (err) => {
            console.error(`[LC-SYNC] >> ${handle} | NexusLC sync failed:`, err.message);
            // Roll back timestamp so user can retry.
            await User.findByIdAndUpdate(userId, {
                $set: { lastLcUpdate: user.lastLcUpdate || null },
            });
        });

    return { freshness: 'updating' };
};

// ══════════════════════════════════════════════════════════════════════════
// Enqueue a sync job on NexusLC and poll until completion.
// NexusLC does ONE combined GraphQL query and writes directly to MongoDB —
// no data is returned here; CPPro reads from the DB as usual.
// ══════════════════════════════════════════════════════════════════════════
const syncLeetcodeProfile = async (userId, handle, sessionToken = null) => {
    if (!LC_SYNC_API || !LC_SYNC_SECRET) {
        throw new Error('LC_SYNC_API / LC_SYNC_SECRET not configured');
    }

    // Build job payload. Session token is passed to NexusLC so it can make
    // authenticated GraphQL calls for full submission history.
    const payload = { userId: String(userId), lcUsername: handle, force: true };
    if (sessionToken) payload.sessionToken = sessionToken;

    // 1. Enqueue the job on NexusLC.
    let jobId;
    try {
        const enqRes = await nexusLC.post('/sync', payload);
        jobId = enqRes.data && enqRes.data.jobId;
        if (!jobId) throw new Error('NexusLC did not return a jobId');
        console.log(`[LC-SYNC] >> ${handle} | job queued: ${jobId}`);
    } catch (err) {
        const msg = err.response ? JSON.stringify(err.response.data) : err.message;
        throw new Error(`NexusLC enqueue failed: ${msg}`);
    }

    // 2. Poll /sync/status/:jobId until the job finishes (max ~2 min).
    const POLL_INTERVAL_MS = 3_000;
    const MAX_POLLS        = 40;
    let lastLoggedState    = null;

    for (let attempt = 0; attempt < MAX_POLLS; attempt++) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

        let state, failedReason;
        try {
            const statusRes = await nexusLC.get(`/sync/status/${jobId}`);
            state        = statusRes.data && statusRes.data.state;
            failedReason = statusRes.data && statusRes.data.failedReason;
        } catch (err) {
            console.warn(`[LC-SYNC] >> ${handle} | poll error: ${err.message} (retrying)`);
            continue;
        }

        // Only log when state changes to avoid spamming 'delayed' on every poll tick.
        if (state !== lastLoggedState) {
            console.log(`[LC-SYNC] >> ${handle} | job ${jobId} state: ${state}`);
            lastLoggedState = state;
        }

        if (state === 'completed') {
            await User.findByIdAndUpdate(userId, { $set: { lastLcUpdate: new Date() } });
            console.log(`[LC-SYNC] >> ${handle} | sync done ✓`);
            return { success: true };
        }

        if (state === 'failed') {
            const reason = failedReason || 'unknown';

            if (/USER_NOT_FOUND/i.test(reason)) {
                throw new Error('invalid leetcode handle');
            }

            // Session expired — mark it and notify the user.
            if (/SESSION_EXPIRED/i.test(reason)) {
                try {
                    await User.findByIdAndUpdate(userId, { $set: { 'lcSession.status': 'expired' } });
                    await Notification.create({
                        userId,
                        type:      'lc_session_expired',
                        title:     'LeetCode Session Expired',
                        message:   'Your LeetCode session has expired. Go to Settings → LeetCode Session to update it.',
                        actionUrl: '/settings',
                    });
                } catch (notifErr) {
                    console.warn('[LC-SYNC] failed to create session-expired notification:', notifErr.message);
                }
                throw new Error('LC_SESSION_EXPIRED');
            }

            throw new Error(`NexusLC job failed: ${reason}`);
        }
    }

    throw new Error(`NexusLC job ${jobId} did not complete within the poll window`);
};

// ══════════════════════════════════════════════════════════════════════════
// Health-check: ping GET /health on NexusLC (no auth required).
// Returns the raw health payload or throws.
// ══════════════════════════════════════════════════════════════════════════
const checkNexusLCHealth = async () => {
    if (!LC_SYNC_API) throw new Error('LC_SYNC_API not configured');
    const res = await nexusLC.get(`${LC_SYNC_API}/data`, { timeout: 8_000 });
    return res.data;
};

module.exports = {
    getLeetcodeData,
    syncLeetcodeProfile,
    checkNexusLCHealth,
};
