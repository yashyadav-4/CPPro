const mongoose = require('mongoose');
const LevelUpData = require('../Model/LevelUpData');
const User = require('../Model/User');
const { recalculateLevelUpData } = require('../Services/levelUpRecalculationService');

const STALE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

const getLevelUpDataSafe = async (userId, force = false) => {
    let data = await LevelUpData.findOne({ userId }).lean();
    if (!data) {
        // First time — calculate synchronously so caller gets real data
        await recalculateLevelUpData(userId);
        data = await LevelUpData.findOne({ userId }).lean();
    } else {
        // Check staleness — if stale, fire background recalc (Lean Nexus pattern)
        const age = data.lastRecalculatedAt
            ? Date.now() - new Date(data.lastRecalculatedAt).getTime()
            : Infinity;
        if (force || age > STALE_THRESHOLD_MS) {
            // Fire-and-forget: serve cached data now, fresh data arrives on next request
            recalculateLevelUpData(userId).catch(err =>
                console.error('[LevelUp] Background recalc failed:', err)
            );
        }
    }
    return data || { upsolveQueue: [], performanceStats: {}, recommendations: null };
};

const getUpsolveQueue = async (req, res) => {
    try {
        const userId = req.user._id;
        const { platform } = req.query; // 'codeforces', 'leetcode', 'codechef', or undefined

        const data = await getLevelUpDataSafe(userId);
        let upsolveList = data.upsolveQueue || [];

        if (platform && ['codeforces', 'leetcode', 'codechef'].includes(platform)) {
            upsolveList = upsolveList.filter(u => u.platform === platform);
        }

        const userObj = await User.findById(userId, 'lcSession').lean();
        const lcSessionActive = userObj?.lcSession?.status === 'active';

        return res.status(200).json({ success: true, data: upsolveList, lcSessionActive });
        
    } catch (error) {
        console.error('Error in getUpsolveQueue:', error);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const getPerformanceStats = async (req, res) => {
    try {
        const userId = req.user._id;
        const data = await getLevelUpDataSafe(userId);
        return res.json({ success: true, data: data.performanceStats || {} });
    } catch (error) {
        console.error('Error in getPerformanceStats:', error);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const getRecommendations = async (req, res) => {
    try {
        const userId = req.user._id;
        const data = await getLevelUpDataSafe(userId);
        if (!data.recommendations) {
            return res.status(400).json({ success: false, message: 'No accounts linked' });
        }
        return res.status(200).json({ success: true, data: data.recommendations });
    } catch (error) {
        console.error('Error in getRecommendations:', error);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = { getUpsolveQueue, getPerformanceStats, getRecommendations };

