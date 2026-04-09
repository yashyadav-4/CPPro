const leaderboardService = require('../Services/leaderboardService');

const VALID_SCOPES = ['global', 'country', 'college'];
const VALID_CATEGORIES = ['cpscore', 'totalQuestions', 'leetcodeRating', 'codeforcesRating'];

const getGlobalLeaderboard = async (req, res) => {
    try {
        const scope = VALID_SCOPES.includes(req.query.scope) ? req.query.scope : 'global';
        const category = VALID_CATEGORIES.includes(req.query.category) ? req.query.category : 'cpscore';

        let scopeValue = null;

        // Country and College scopes require authentication
        if (scope !== 'global') {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: "Login required for country/college leaderboards"
                });
            }

            if (scope === 'country') {
                scopeValue = req.user.location?.country;
                if (!scopeValue) {
                    return res.status(400).json({
                        success: false,
                        message: "Set your country in profile settings first"
                    });
                }
            }

            if (scope === 'college') {
                scopeValue = req.user.college;
                if (!scopeValue) {
                    return res.status(400).json({
                        success: false,
                        message: "Set your college in profile settings first"
                    });
                }
            }
        }

        const currentUserId = req.user?._id?.toString() || null;

        const result = await leaderboardService.getLeaderboard({
            scope,
            scopeValue,
            category,
            currentUserId,
        });

        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error("some error in leaderboard controller: ", error);
        return res.status(500).json({ success: false, message: "failed to fetch leaderboard" });
    }
};

module.exports = {
    getGlobalLeaderboard,
};