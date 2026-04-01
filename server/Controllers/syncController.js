const User = require('../Model/User');
const syncService = require('../Services/cfSyncService');
const lcSyncService = require('../Services/lcSyncService');
const dashboardService = require('../Services/cfDashboardService');
const LeetCodeData = require('../Model/LeetCodeData');

async function handleManualRefresh(req, res) {
    try {
        const userId= req.user._id;
        const user= await User.findById(userId);

        if (!user || !user.linkedAccounts || !user.linkedAccounts.codeforces){
            return res.status(400).json({ success: false, message:'no codeforces account linked' });
        }
        const handle = user.linkedAccounts.codeforces;

        const { freshness, remainingSeconds } = await syncService.getCodeforcesData(userId, handle);
        const profileData = await dashboardService.getProfileSummary(userId);

        return res.status(200).json({
            success: true,
            freshness,
            remainingSeconds: remainingSeconds || 0,
            message: freshness === 'fresh'
                ? 'Data is up to date (< 10 min old)'
                : 'Returning current data — background update in progress',
            data: profileData
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

        const { freshness, remainingSeconds } = await lcSyncService.getLeetcodeData(userId, handle);

        //return whatever cached data we have right now
        const lcData = await LeetCodeData.findOne({ userId }).lean();

        return res.status(200).json({
            success: true,
            freshness,
            remainingSeconds: remainingSeconds || 0,
            message: freshness === 'fresh'
                ? 'LeetCode data is up to date (< 10 min old)'
                : 'Returning current data — background update in progress',
            data: lcData
        });
    } catch (error) {
        console.error('[LEAN-NEXUS-LC] manual refresh error:', error);
        return res.status(500).json({ success: false, message: 'internal server error during leetcode sync' });
    }
}

module.exports = { handleManualRefresh, handleLcManualRefresh };
