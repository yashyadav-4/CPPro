const axios = require('axios');
const User = require('../Model/User');
const syncService = require('../Services/cfSyncService');
const lcSyncService = require('../Services/lcSyncService');
const ccSyncService = require('../Services/ccSyncService');
const dashboardService = require('../Services/cfDashboardService');
const LeetCodeData = require('../Model/LeetCodeData');
const Platform = require('../Model/Platform');
const { getDecryptedLcSession } = require('../Services/settingsService');

const CF_SYNC_API    = (process.env.CF_SYNC_API    || 'http://localhost:3001').replace(/\/$/, '');
const CF_SYNC_SECRET = process.env.CF_SYNC_SECRET  || '';

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const ADMIN_COOLDOWN  = 10 * 1000;

async function handleManualRefresh(req, res) {
    try {
        const userId = req.user._id;
        const user   = await User.findById(userId);

        if (!user || !user.linkedAccounts || !user.linkedAccounts.codeforces) {
            return res.status(400).json({ success: false, message: 'no codeforces account linked' });
        }
        const handle  = user.linkedAccounts.codeforces;
        const role    = user.role || 'user';
        const cooldown = role === 'admin' ? ADMIN_COOLDOWN : FIFTEEN_MINUTES;

        const timeSinceUpdate = user.lastCfUpdate
            ? Date.now() - new Date(user.lastCfUpdate).getTime()
            : Infinity;

        // Still within cooldown — return current MongoDB data immediately.
        if (timeSinceUpdate < cooldown) {
            const remainingSeconds = Math.ceil((cooldown - timeSinceUpdate) / 1000);
            const profileData = await dashboardService.getProfileSummary(userId);
            return res.status(200).json({
                success: true,
                freshness: 'fresh',
                remainingSeconds,
                message: `Data is up to date (cooldown: ${role === 'admin' ? '10s' : '15min'})`,
                data: profileData,
            });
        }

        // Stamp NOW to prevent duplicate dispatches on double-click.
        await User.findByIdAndUpdate(userId, { $set: { lastCfUpdate: new Date() } });

        // Await the sync so the response carries fresh data (mirrors LC behaviour).
        try {
            await syncService.syncCodeforcesProfile(userId, handle);
        } catch (err) {
            console.error('[LEAN-NEXUS] sync failed:', err.message);
            // Roll back timestamp so the user can retry.
            await User.findByIdAndUpdate(userId, { $set: { lastCfUpdate: user.lastCfUpdate || null } });
            return res.status(500).json({ success: false, message: `Sync failed: ${err.message}` });
        }

        const profileData = await dashboardService.getProfileSummary(userId);
        return res.status(200).json({
            success: true,
            freshness: 'synced',
            remainingSeconds: Math.ceil(cooldown / 1000),
            message: 'Codeforces data synced successfully',
            data: profileData,
        });
    } catch (error) {
        console.error('[LEAN-NEXUS] manual refresh error:', error);
        return res.status(500).json({ success: false, message: 'internal server error during sync' });
    }
}

async function handleLcManualRefresh(req, res) {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);

        if (!user || !user.linkedAccounts || !user.linkedAccounts.leetcode) {
            return res.status(400).json({ success: false, message: 'no leetcode account linked' });
        }
        const handle = user.linkedAccounts.leetcode;
        const role = user.role || 'user';
        const cooldown = role === 'admin' ? ADMIN_COOLDOWN : FIFTEEN_MINUTES;

        const timeSinceUpdate = user.lastLcUpdate
            ? Date.now() - new Date(user.lastLcUpdate).getTime()
            : Infinity;

        // Data is still fresh — return immediately without syncing.
        if (timeSinceUpdate < cooldown) {
            const remainingSeconds = Math.ceil((cooldown - timeSinceUpdate) / 1000);
            const lcData = await LeetCodeData.findOne({ userId }).lean();
            return res.status(200).json({
                success: true,
                freshness: 'fresh',
                remainingSeconds,
                message: `LeetCode data is up to date`,
                data: lcData,
            });
        }

        // Stamp NOW to prevent duplicate dispatches if the user double-clicks.
        await User.findByIdAndUpdate(userId, { $set: { lastLcUpdate: new Date() } });

        const sessionToken = await getDecryptedLcSession(userId, { allowExpired: true });

        // Await the sync so this response only returns once MongoDB has fresh data.
        try {
            await lcSyncService.syncLeetcodeProfile(userId, handle, sessionToken);
        } catch (err) {
            console.error('[LEAN-NEXUS-LC] sync failed:', err.message);
            // Roll back the timestamp so the user can retry after a page reload.
            await User.findByIdAndUpdate(userId, { $set: { lastLcUpdate: user.lastLcUpdate || null } });
            return res.status(500).json({ success: false, message: `Sync failed: ${err.message}` });
        }

        const lcData = await LeetCodeData.findOne({ userId }).lean();
        return res.status(200).json({
            success: true,
            freshness: 'synced',
            remainingSeconds: Math.ceil(cooldown / 1000),
            message: 'LeetCode data synced successfully',
            data: lcData,
        });
    } catch (error) {
        console.error('[LEAN-NEXUS-LC] manual refresh error:', error);
        return res.status(500).json({ success: false, message: 'internal server error during leetcode sync' });
    }
}

async function handleLcHealthCheck(_req, res) {
    try {
        const health = await lcSyncService.checkNexusLCHealth();
        return res.status(200).json({ success: true, nexusLC: health });
    } catch (error) {
        console.error('[LC-HEALTH] NexusLC health check failed:', error.message);
        return res.status(503).json({
            success: false,
            message: 'NexusLC is unreachable',
            detail: error.message,
        });
    }
}

async function handleCfHealthCheck(_req, res) {
    try {
        const headers = CF_SYNC_SECRET ? { Authorization: `Bearer ${CF_SYNC_SECRET}` } : {};
        const response = await axios.get(`${CF_SYNC_API}/data`, { headers, timeout: 8_000 });
        return res.status(200).json({ success: true, cfWorker: response.data });
    } catch (error) {
        return res.status(503).json({
            success: false,
            message: 'CF worker is unreachable',
            detail: error.response ? JSON.stringify(error.response.data) : error.message,
        });
    }
}

async function handleCcManualRefresh(req, res) {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);

        if (!user || !user.linkedAccounts || !user.linkedAccounts.codechef) {
            return res.status(400).json({ success: false, message: 'no codechef account linked' });
        }
        const handle = user.linkedAccounts.codechef;
        const role = user.role || 'user';
        const cooldown = role === 'admin' ? ADMIN_COOLDOWN : FIFTEEN_MINUTES;

        const timeSinceUpdate = user.lastCcUpdate
            ? Date.now() - new Date(user.lastCcUpdate).getTime()
            : Infinity;

        if (timeSinceUpdate < cooldown) {
            const remainingSeconds = Math.ceil((cooldown - timeSinceUpdate) / 1000);
            const ccData = await Platform.findOne({ userId, platform: 'codechef' }).lean();
            return res.status(200).json({
                success: true,
                freshness: 'fresh',
                remainingSeconds,
                message: 'CodeChef data is up to date',
                data: ccData,
            });
        }

        await User.findByIdAndUpdate(userId, { $set: { lastCcUpdate: new Date() } });

        try {
            await ccSyncService.syncCodeChefProfile(userId, handle);
        } catch (err) {
            console.error('[CC-SYNC] sync failed:', err.message);
            await User.findByIdAndUpdate(userId, { $set: { lastCcUpdate: user.lastCcUpdate || null } });
            return res.status(500).json({ success: false, message: `Sync failed: ${err.message}` });
        }

        const ccData = await Platform.findOne({ userId, platform: 'codechef' }).lean();
        return res.status(200).json({
            success: true,
            freshness: 'synced',
            remainingSeconds: Math.ceil(cooldown / 1000),
            message: 'CodeChef data synced successfully',
            data: ccData,
        });
    } catch (error) {
        console.error('[CC-SYNC] manual refresh error:', error);
        return res.status(500).json({ success: false, message: 'internal server error during codechef sync' });
    }
}

async function handleCcHealthCheck(_req, res) {
    try {
        const health = await ccSyncService.checkCcServerHealth();
        return res.status(200).json({ success: true, ccServer: health });
    } catch (error) {
        console.error('[CC-HEALTH] CC server health check failed:', error.message);
        return res.status(503).json({
            success: false,
            message: 'CC server is unreachable',
            detail: error.message,
        });
    }
}

// ── Hard Sync Handlers ────────────────────────────────────────────────────
// Requirements:
// 1. 30-day cooldown on hard sync (admin bypass)
// 2. Regular 15-min sync cooldown must ALSO be expired (no spam)
// 3. Fire-and-forget background sync with syncDepth: 'hard'

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
const ADMIN_HARD_SYNC_COOLDOWN = 30 * 1000; // 30 seconds for testing

async function handleCfHardSync(req, res) {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);

        if (!user || !user.linkedAccounts || !user.linkedAccounts.codeforces) {
            return res.status(400).json({ success: false, message: 'no codeforces account linked' });
        }

        const role = user.role || 'user';
        const regularCooldown = role === 'admin' ? ADMIN_COOLDOWN : FIFTEEN_MINUTES;

        // Gate 1: regular sync cooldown must be expired
        const timeSinceUpdate = user.lastCfUpdate ? (Date.now() - new Date(user.lastCfUpdate).getTime()) : Infinity;
        if (timeSinceUpdate < regularCooldown) {
            const remainingSeconds = Math.ceil((regularCooldown - timeSinceUpdate) / 1000);
            return res.status(429).json({ success: false, message: `Regular sync cooldown active. Try again in ${remainingSeconds}s`, remainingSeconds });
        }

        // Gate 2: Hard sync cooldown
        if (role === 'admin') {
            const timeSinceHard = user.lastCfHardSync ? (Date.now() - new Date(user.lastCfHardSync).getTime()) : Infinity;
            if (timeSinceHard < ADMIN_HARD_SYNC_COOLDOWN) {
                const nextAvailable = new Date(new Date(user.lastCfHardSync).getTime() + ADMIN_HARD_SYNC_COOLDOWN);
                return res.status(429).json({ success: false, message: 'Admin hard sync on cooldown', nextAvailableAt: nextAvailable.toISOString() });
            }
        } else {
            const timeSinceHard = user.lastCfHardSync ? (Date.now() - new Date(user.lastCfHardSync).getTime()) : Infinity;
            if (timeSinceHard < THIRTY_DAYS) {
                const nextAvailable = new Date(new Date(user.lastCfHardSync).getTime() + THIRTY_DAYS);
                return res.status(429).json({ success: false, message: 'Hard sync on cooldown', nextAvailableAt: nextAvailable.toISOString() });
            }
        }

        // Stamp both timestamps immediately to prevent spam
        await User.findByIdAndUpdate(userId, { $set: { lastCfHardSync: new Date(), lastCfUpdate: new Date() } });

        const handle = user.linkedAccounts.codeforces;
        syncService.syncCodeforcesProfile(userId, handle, { syncDepth: 'hard' })
            .then(() => console.log(`[HARD-SYNC-CF] ${handle} | done`))
            .catch(async (err) => {
                console.error(`[HARD-SYNC-CF] ${handle} | failed:`, err.message);
                await User.findByIdAndUpdate(userId, { $set: { lastCfHardSync: user.lastCfHardSync || null, lastCfUpdate: user.lastCfUpdate || null } });
            });

        return res.status(200).json({ success: true, status: 'queued', message: 'Deep sync started for Codeforces' });
    } catch (error) {
        console.error('[HARD-SYNC-CF] error:', error);
        return res.status(500).json({ success: false, message: 'internal server error' });
    }
}

async function handleLcHardSync(req, res) {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);

        if (!user || !user.linkedAccounts || !user.linkedAccounts.leetcode) {
            return res.status(400).json({ success: false, message: 'no leetcode account linked' });
        }

        const role = user.role || 'user';
        const regularCooldown = role === 'admin' ? ADMIN_COOLDOWN : FIFTEEN_MINUTES;

        const timeSinceUpdate = user.lastLcUpdate ? (Date.now() - new Date(user.lastLcUpdate).getTime()) : Infinity;
        if (timeSinceUpdate < regularCooldown) {
            const remainingSeconds = Math.ceil((regularCooldown - timeSinceUpdate) / 1000);
            return res.status(429).json({ success: false, message: `Regular sync cooldown active. Try again in ${remainingSeconds}s`, remainingSeconds });
        }

        if (role === 'admin') {
            const timeSinceHard = user.lastLcHardSync ? (Date.now() - new Date(user.lastLcHardSync).getTime()) : Infinity;
            if (timeSinceHard < ADMIN_HARD_SYNC_COOLDOWN) {
                const nextAvailable = new Date(new Date(user.lastLcHardSync).getTime() + ADMIN_HARD_SYNC_COOLDOWN);
                return res.status(429).json({ success: false, message: 'Admin hard sync on cooldown', nextAvailableAt: nextAvailable.toISOString() });
            }
        } else {
            const timeSinceHard = user.lastLcHardSync ? (Date.now() - new Date(user.lastLcHardSync).getTime()) : Infinity;
            if (timeSinceHard < THIRTY_DAYS) {
                const nextAvailable = new Date(new Date(user.lastLcHardSync).getTime() + THIRTY_DAYS);
                return res.status(429).json({ success: false, message: 'Hard sync on cooldown', nextAvailableAt: nextAvailable.toISOString() });
            }
        }

        await User.findByIdAndUpdate(userId, { $set: { lastLcHardSync: new Date(), lastLcUpdate: new Date() } });

        const handle = user.linkedAccounts.leetcode;
        const sessionToken = await getDecryptedLcSession(userId, { allowExpired: true });
        lcSyncService.syncLeetcodeProfile(userId, handle, sessionToken, { syncDepth: 'hard' })
            .then(() => console.log(`[HARD-SYNC-LC] ${handle} | done`))
            .catch(async (err) => {
                console.error(`[HARD-SYNC-LC] ${handle} | failed:`, err.message);
                await User.findByIdAndUpdate(userId, { $set: { lastLcHardSync: user.lastLcHardSync || null, lastLcUpdate: user.lastLcUpdate || null } });
            });

        return res.status(200).json({ success: true, status: 'queued', message: 'Deep sync started for LeetCode' });
    } catch (error) {
        console.error('[HARD-SYNC-LC] error:', error);
        return res.status(500).json({ success: false, message: 'internal server error' });
    }
}

async function handleCcHardSync(req, res) {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);

        if (!user || !user.linkedAccounts || !user.linkedAccounts.codechef) {
            return res.status(400).json({ success: false, message: 'no codechef account linked' });
        }

        const role = user.role || 'user';
        const regularCooldown = role === 'admin' ? ADMIN_COOLDOWN : FIFTEEN_MINUTES;

        const timeSinceUpdate = user.lastCcUpdate ? (Date.now() - new Date(user.lastCcUpdate).getTime()) : Infinity;
        if (timeSinceUpdate < regularCooldown) {
            const remainingSeconds = Math.ceil((regularCooldown - timeSinceUpdate) / 1000);
            return res.status(429).json({ success: false, message: `Regular sync cooldown active. Try again in ${remainingSeconds}s`, remainingSeconds });
        }

        if (role === 'admin') {
            const timeSinceHard = user.lastCcHardSync ? (Date.now() - new Date(user.lastCcHardSync).getTime()) : Infinity;
            if (timeSinceHard < ADMIN_HARD_SYNC_COOLDOWN) {
                const nextAvailable = new Date(new Date(user.lastCcHardSync).getTime() + ADMIN_HARD_SYNC_COOLDOWN);
                return res.status(429).json({ success: false, message: 'Admin hard sync on cooldown', nextAvailableAt: nextAvailable.toISOString() });
            }
        } else {
            const timeSinceHard = user.lastCcHardSync ? (Date.now() - new Date(user.lastCcHardSync).getTime()) : Infinity;
            if (timeSinceHard < THIRTY_DAYS) {
                const nextAvailable = new Date(new Date(user.lastCcHardSync).getTime() + THIRTY_DAYS);
                return res.status(429).json({ success: false, message: 'Hard sync on cooldown', nextAvailableAt: nextAvailable.toISOString() });
            }
        }

        await User.findByIdAndUpdate(userId, { $set: { lastCcHardSync: new Date(), lastCcUpdate: new Date() } });

        const handle = user.linkedAccounts.codechef;
        ccSyncService.syncCodeChefProfile(userId, handle, { syncDepth: 'hard' })
            .then(() => console.log(`[HARD-SYNC-CC] ${handle} | done`))
            .catch(async (err) => {
                console.error(`[HARD-SYNC-CC] ${handle} | failed:`, err.message);
                await User.findByIdAndUpdate(userId, { $set: { lastCcHardSync: user.lastCcHardSync || null, lastCcUpdate: user.lastCcUpdate || null } });
            });

        return res.status(200).json({ success: true, status: 'queued', message: 'Deep sync started for CodeChef' });
    } catch (error) {
        console.error('[HARD-SYNC-CC] error:', error);
        return res.status(500).json({ success: false, message: 'internal server error' });
    }
}

module.exports = {
    handleManualRefresh,
    handleLcManualRefresh,
    handleLcHealthCheck,
    handleCfHealthCheck,
    handleCcManualRefresh,
    handleCcHealthCheck,
    handleCfHardSync,
    handleLcHardSync,
    handleCcHardSync,
};
