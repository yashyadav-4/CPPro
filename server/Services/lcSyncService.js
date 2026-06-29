const axios = require('axios');
const User = require('../Model/User');
const Notification = require('../Model/Notification');
const LeetCodeData = require('../Model/LeetCodeData');
const Submission = require('../Model/Submissions');
const ErrorLog = require('../Model/ErrorLog');
const { checkDailyProblemSolves } = require('./dailyProblemService');
const { checkUpsolveProblemSolves } = require('./upsolveRecommendationService');

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

    // Retrieve the stored session token (active OR expired status) so the sync
    // attempt can detect a newly-expired session and mark it accordingly.
    const { getDecryptedLcSession } = require('./settingsService');
    const sessionToken = await getDecryptedLcSession(userId, { allowExpired: true });

    // If the pending sync flag is set and the user now has a valid session,
    // escalate to 'first' depth (3000 subs) so full history is imported.
    // This handles the case where the dashboard refreshes before the background
    // sync triggered by saveLcSession() has completed.
    let autoSyncDepth = 'incremental';
    if (user.lcSessionPendingSync && sessionToken) {
        autoSyncDepth = 'first';
        console.log(`[LC-SYNC] >> ${handle} | lcSessionPendingSync=true + session present → escalating to depth='first'`);
    }

    // Fire-and-forget: enqueue job on NexusLC, then poll until done.
    syncLeetcodeProfile(userId, handle, sessionToken, { syncDepth: autoSyncDepth })
        .then(() => console.log(`[LC-SYNC] >> ${handle} | NexusLC sync complete (depth=${autoSyncDepth})`))
        .catch(async (err) => {
            console.error(`[LC-SYNC] >> ${handle} | NexusLC sync failed:`, err.message);
            // Log to ErrorLog so admin page shows this failure with full context
            ErrorLog.create({
                source: 'LC-Sync-Service',
                level: 'error',
                message: `[LC_SYNC_FAILED] handle=${handle} | userId=${userId} | platform=leetcode | reason=${err.message}`,
            }).catch(() => {});
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
const syncLeetcodeProfile = async (userId, handle, sessionToken = null, opts = {}) => {
    const syncDepth = opts.syncDepth || 'incremental';
    if (!LC_SYNC_API || !LC_SYNC_SECRET) {
        throw new Error('LC_SYNC_API / LC_SYNC_SECRET not configured');
    }

    // Build job payload. Session token is passed to NexusLC so it can make
    // authenticated GraphQL calls for full submission history.
    const payload = { userId: String(userId), lcUsername: handle, force: true, syncDepth };
    if (sessionToken) payload.sessionToken = sessionToken;

    // 1. Enqueue the job on NexusLC.
    let jobId;
    try {
        const enqRes = await nexusLC.post('/sync', payload);
        jobId = enqRes.data && enqRes.data.jobId;
        if (!jobId) throw new Error('NexusLC did not return a jobId');
        console.log(`[LC-SYNC] >> ${handle} | job queued: ${jobId} (syncDepth=${syncDepth})`);
    } catch (err) {
        const msg = err.response ? JSON.stringify(err.response.data) : err.message;
        ErrorLog.create({
            source: 'LC-Sync-Service',
            level: 'error',
            message: `[LC_ENQUEUE_FAILED] handle=${handle} | userId=${userId} | platform=leetcode | reason=${msg}`,
        }).catch(() => {});
        throw new Error(`NexusLC enqueue failed: ${msg}`);
    }

    // 2. Poll /sync/status/:jobId until the job finishes (max ~100s).
    const POLL_INTERVAL_MS = 2_000;
    const MAX_POLLS        = 50;
    let lastLoggedState    = null;

    for (let attempt = 0; attempt < MAX_POLLS; attempt++) {
        // First poll after 1s (incremental syncs often finish very quickly);
        // subsequent polls every 2s.
        await new Promise((r) => setTimeout(r, attempt === 0 ? 1_000 : POLL_INTERVAL_MS));

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
            // Build update set — always stamp lastLcUpdate
            const completedUpdates = { lastLcUpdate: new Date() };

            // Clear the pending flag if it was set, but ONLY when we had a valid session.
            // Without a session the pending flag stays so the next session-save triggers
            // a proper deep sync.
            if (sessionToken) {
                const freshUser = await User.findById(userId, 'lcSessionPendingSync').lean();
                if (freshUser?.lcSessionPendingSync) {
                    completedUpdates.lcSessionPendingSync = false;
                    console.log(`[LC-SYNC] >> ${handle} | Cleared lcSessionPendingSync flag after successful authenticated sync`);
                }
            }

            await User.findByIdAndUpdate(userId, { $set: completedUpdates });
            console.log(`[LC-SYNC] >> ${handle} | sync done ✓`);

            // If sync completed WITHOUT a session and LC is linked but no session ever set,
            // send a weekly warning notification explaining partial data.
            if (!sessionToken) {
                (async () => {
                    try {
                        const freshUser = await User.findById(userId, 'lcSession linkedAccounts').lean();
                        if (freshUser?.linkedAccounts?.leetcode && freshUser?.lcSession?.status === 'not_set') {
                            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                            const recentWarn = await Notification.findOne({
                                userId, type: 'lc_no_session_warning',
                                createdAt: { $gte: sevenDaysAgo },
                            });
                            if (!recentWarn) {
                                await Notification.create({
                                    userId,
                                    type:      'lc_no_session_warning',
                                    title:     '⚠️ LeetCode Sync is Incomplete',
                                    message:   'Without a Session Key, CPPro can only see your last 20 accepted submissions — not your full history. This means previously solved problems may appear in your Daily Problems. Go to Settings → LeetCode Session to add your session key and unlock full sync.',
                                    actionUrl: '/settings',
                                });
                                console.log(`[LC-SYNC] >> ${handle} | Sent lc_no_session_warning notification`);
                            }
                        }
                    } catch (warnErr) {
                        console.warn('[LC-SYNC] no-session warning notification failed:', warnErr.message);
                    }
                })();
            }

            // Post-sync fire-and-forget: persist LC AC slugs to Submissions collection so
            // buildAttemptedSet's Submission.find query starts working for LC over time.
            // Uses bulkWrite with updateOne+upsert so repeated syncs don't create duplicates.
            LeetCodeData.findOne({ userId }, 'acSlugs recentSubmissions').lean()
                .then(async lcData => {
                    const acIds = [
                        ...(lcData?.acSlugs || []),
                        ...(lcData?.recentSubmissions || [])
                            .filter(s => s.statusDisplay === 'Accepted')
                            .map(s => s.titleSlug),
                    ];

                    // Persist unique AC slugs to Submissions — one doc per slug, fake date
                    // of epoch+slug-hash avoids the unique(userId,problemId,submittedAt) conflict
                    // while still deduplicating naturally across syncs.
                    const recentMap = new Map();
                    (lcData?.recentSubmissions || []).forEach(s => {
                        if (s.statusDisplay === 'Accepted' && s.timestamp) {
                            if (!recentMap.has(s.titleSlug) || Number(s.timestamp) > Number(recentMap.get(s.titleSlug))) {
                                recentMap.set(s.titleSlug, s.timestamp);
                            }
                        }
                    });

                    const uniqueSlugs = [...new Set(acIds.filter(Boolean))];
                    const ops = uniqueSlugs.map(slug => {
                        const ts = recentMap.get(slug);
                        const date = ts ? new Date(Number(ts) * 1000) : new Date(0);
                        return {
                            updateOne: {
                                filter: { userId, problemId: slug, platform: 'leetcode', submittedAt: date },
                                update: {
                                    $setOnInsert: {
                                        userId,
                                        problemId: slug,
                                        problemTitle: slug,
                                        platform: 'leetcode',
                                        verdict: 'AC',
                                        submittedAt: date,
                                        difficulty: '0',
                                    },
                                },
                                upsert: true,
                            },
                        };
                    });

                    // Also persist failed attempts from recentSubmissions so they appear in Upsolve Queue
                    const failedSubs = (lcData?.recentSubmissions || []).filter(s => s.statusDisplay !== 'Accepted');
                    failedSubs.forEach(s => {
                        const date = s.timestamp ? new Date(Number(s.timestamp) * 1000) : new Date();
                        let stdVerdict = 'OTHER';
                        const display = s.statusDisplay || '';
                        if (display === 'Wrong Answer') stdVerdict = 'WA';
                        else if (display === 'Time Limit Exceeded') stdVerdict = 'TLE';
                        else if (display === 'Memory Limit Exceeded') stdVerdict = 'MLE';
                        else if (display === 'Runtime Error') stdVerdict = 'RE';
                        else if (display === 'Compile Error') stdVerdict = 'CE';
                        else if (display) stdVerdict = display;

                        ops.push({
                            updateOne: {
                                filter: { userId, problemId: s.titleSlug, platform: 'leetcode', submittedAt: date },
                                update: {
                                    $setOnInsert: {
                                        userId,
                                        problemId: s.titleSlug,
                                        problemTitle: s.title,
                                        platform: 'leetcode',
                                        verdict: stdVerdict,
                                        submittedAt: date,
                                        difficulty: '0',
                                    },
                                },
                                upsert: true,
                            },
                        });
                    });

                    if (ops.length > 0) {
                        const result = await Submission.bulkWrite(ops, { ordered: false });
                        console.log(`[LC-SYNC] >> ${handle} | persisted ${ops.length} submissions (AC + Failed) to Submissions (inserted=${result.upsertedCount || 0})`);
                    }
                    checkDailyProblemSolves(userId, 'leetcode', acIds);
                    await checkUpsolveProblemSolves(userId, 'leetcode', acIds);
                    
                    // Recalculate Level Up Data after sync
                    const { recalculateLevelUpData } = require('./levelUpRecalculationService');
                    recalculateLevelUpData(userId);
                })
                .catch(err => console.warn('[DAILY-LC] post-sync hook failed:', err.message));
            return { success: true };
        }

        if (state === 'failed') {
            const reason = failedReason || 'unknown';

            if (/USER_NOT_FOUND/i.test(reason)) {
                ErrorLog.create({
                    source: 'LC-Sync-Service',
                    level: 'error',
                    message: `[LC_USER_NOT_FOUND] handle=${handle} | userId=${userId} | platform=leetcode | reason=LeetCode account not found — handle may be wrong`,
                }).catch(() => {});
                throw new Error('invalid leetcode handle');
            }

            // Session expired — mark it in DB and notify the user (once).
            if (/SESSION_EXPIRED/i.test(reason)) {
                try {
                    const freshUser = await User.findById(userId, 'lcSession').lean();
                    const alreadyMarked = freshUser?.lcSession?.status === 'expired';
                    await User.findByIdAndUpdate(userId, { $set: { 'lcSession.status': 'expired' } });
                    if (!alreadyMarked) {
                        await Notification.create({
                            userId,
                            type:      'lc_session_expired',
                            title:     'LeetCode Session Expired',
                            message:   'Your LeetCode session has expired. Go to Settings → LeetCode Session to update it.',
                            actionUrl: '/settings',
                        });
                        ErrorLog.create({
                            source: 'LC-Sync-Service',
                            level: 'warn',
                            message: `[LC_SESSION_EXPIRED] handle=${handle} | userId=${userId} | platform=leetcode | action=User notified, ask them to update session in Settings`,
                        }).catch(() => {});
                        console.warn(`[LC-SYNC] >> session expired for ${userId} — notification sent`);
                    }
                } catch (notifErr) {
                    console.warn('[LC-SYNC] failed to handle session-expired:', notifErr.message);
                }
                throw new Error('LC_SESSION_EXPIRED');
            }

            ErrorLog.create({
                source: 'LC-Sync-Service',
                level: 'error',
                message: `[LC_JOB_FAILED] handle=${handle} | userId=${userId} | platform=leetcode | jobId=${jobId} | reason=${reason}`,
            }).catch(() => {});
            throw new Error(`NexusLC job failed: ${reason}`);
        }
    }

    ErrorLog.create({
        source: 'LC-Sync-Service',
        level: 'error',
        message: `[LC_POLL_TIMEOUT] handle=${handle} | userId=${userId} | platform=leetcode | jobId=${jobId} | reason=Job did not complete within poll window (~100s) — NexusLC may be overloaded`,
    }).catch(() => {});
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
