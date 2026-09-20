const GFGData = require('../Model/GFGData');
const User    = require('../Model/User');

// GET /api/gfg-dashboard/aggregate/:userId
// Returns GFG stats for a given user (respects public/private via middleware)
async function getGfgAggregateDashboard(req, res) {
    try {
        const { userId } = req.params;
        const gfgData = await GFGData.findOne({ userId }).lean();

        if (!gfgData) {
            return res.status(404).json({ success: false, message: 'No GFG data found for this user' });
        }

        return res.status(200).json({ success: true, data: gfgData });
    } catch (error) {
        console.error('[GFG-DASHBOARD] aggregate error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

module.exports = { getGfgAggregateDashboard };
