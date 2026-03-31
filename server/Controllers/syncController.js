const User = require('../Model/User');
const syncService = require('../Services/syncService');
const dashboardService = require('../Services/dashboardService');

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
module.exports = { handleManualRefresh };
