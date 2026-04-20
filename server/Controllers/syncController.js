const User = require('../Model/User');
const syncService = require('../Services/cfSyncService');
const lcSyncService = require('../Services/lcSyncService');
const dashboardService = require('../Services/cfDashboardService');
const LeetCodeData = require('../Model/LeetCodeData');

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

        // Await the sync so this response only returns once MongoDB has fresh data.
        try {
            await lcSyncService.syncLeetcodeProfile(userId, handle);
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

module.exports = { handleManualRefresh, handleLcManualRefresh, handleLcHealthCheck };
