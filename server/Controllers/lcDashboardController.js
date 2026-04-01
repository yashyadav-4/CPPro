const LeetCodeData = require('../Model/LeetCodeData');

async function getLcProfile(req, res) {
    try {
        const { userId } = req.params;
        const lcData = await LeetCodeData.findOne({ userId }).select('lcUsername profile').lean();
        if (!lcData) {
            return res.status(200).json({ success: true, data: null, message: 'no leetcode data found' });
        }
        res.status(200).json({ success: true, data: lcData });
    } catch (error) {
        console.error('error in getLcProfile:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

async function getLcSkillStats(req, res) {
    try {
        const { userId } = req.params;
        const lcData = await LeetCodeData.findOne({ userId }).select('skillStats').lean();
        if (!lcData) {
            return res.status(200).json({ success: true, data: null });
        }
        res.status(200).json({ success: true, data: lcData.skillStats });
    } catch (error) {
        console.error('error in getLcSkillStats:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

async function getLcCalendar(req, res) {
    try {
        const { userId } = req.params;
        const lcData = await LeetCodeData.findOne({ userId }).select('calendar').lean();
        if (!lcData) {
            return res.status(200).json({ success: true, data: null });
        }
        res.status(200).json({ success: true, data: lcData.calendar });
    } catch (error) {
        console.error('error in getLcCalendar:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

async function getLcContestHistory(req, res) {
    try {
        const { userId } = req.params;
        const lcData = await LeetCodeData.findOne({ userId })
            .select('contestCount contestHistory').lean();
        if (!lcData) {
            return res.status(200).json({ success: true, data: null });
        }
        res.status(200).json({
            success: true,
            data: {
                count: lcData.contestCount,
                contestHistory: lcData.contestHistory,
            }
        });
    } catch (error) {
        console.error('error in getLcContestHistory:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

async function getLcRecentSubmissions(req, res) {
    try {
        const { userId } = req.params;
        const lcData = await LeetCodeData.findOne({ userId })
            .select('recentSubmissions').lean();
        if (!lcData) {
            return res.status(200).json({ success: true, data: null });
        }
        res.status(200).json({ success: true, data: lcData.recentSubmissions });
    } catch (error) {
        console.error('error in getLcRecentSubmissions:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

module.exports = {
    getLcProfile,
    getLcSkillStats,
    getLcCalendar,
    getLcContestHistory,
    getLcRecentSubmissions,
};
