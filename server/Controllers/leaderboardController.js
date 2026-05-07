const leaderboardService = require('../Services/leaderboardService');
const leaderboardRepo = require('../Repositories/leaderboardRepository');
const User = require('../Model/User');

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
        const isAdmin = req.user?.role === 'admin';

        const result = await leaderboardService.getLeaderboard({
            scope,
            scopeValue,
            category,
            currentUserId,
            isAdmin,
        });

        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error("some error in leaderboard controller: ", error);
        return res.status(500).json({ success: false, message: "failed to fetch leaderboard" });
    }
};

/**
 * Returns the logged-in user's global rank across all 4 leaderboard categories
 * in one call. Uses the EXACT same pipeline (buildCorePipeline via getUserRank)
 * as the main leaderboard so serverCpScore always matches what the leaderboard shows.
 */
const getMyRank = async (req, res) => {
    try {
        const userId = req.user?._id?.toString();
        if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated' });

        const CATEGORIES = ['cpscore', 'totalQuestions', 'leetcodeRating', 'codeforcesRating'];

        // All 4 rank lookups + 4 leaderboard list fetches (for total user counts) in parallel
        const rankPromises = CATEGORIES.map(cat =>
            leaderboardRepo.getUserRank(userId, 'global', null, cat)
        );
        const countPromises = CATEGORIES.map(cat =>
            leaderboardService.getLeaderboard({ scope: 'global', scopeValue: null, category: cat, currentUserId: null })
        );

        const [rankResults, countResults] = await Promise.all([
            Promise.allSettled(rankPromises),
            Promise.allSettled(countPromises),
        ]);

        const ranks = {};
        let serverCpScore = null;

        CATEGORIES.forEach((cat, i) => {
            const r = rankResults[i];
            if (r.status === 'fulfilled' && r.value) {
                ranks[cat] = r.value.rank;
                // getUserRank spreads the user doc which includes cpScore from buildCorePipeline
                if (cat === 'cpscore') {
                    serverCpScore = r.value.cpScore ?? null;
                }
            } else {
                ranks[cat] = null;
            }
        });

        // totals from the leaderboard list — service caps at 100 via getLeaderboardData.
        // getLeaderboard returns { leaderboard: [], currentUser } not a raw array.
        const totals = {};
        CATEGORIES.forEach((cat, i) => {
            const r = countResults[i];
            if (r.status === 'fulfilled' && r.value?.leaderboard) {
                const listLen = r.value.leaderboard.length;
                // If list is at the cap (100), actual total >= rank; use rank as floor.
                totals[cat] = (listLen >= 100 && ranks[cat])
                    ? Math.max(listLen, ranks[cat])
                    : listLen;
            } else {
                totals[cat] = null;
            }
        });

        return res.status(200).json({
            success: true,
            data: {
                serverCpScore,           // authoritative — same formula as leaderboard
                cpScoreRank: ranks.cpscore,
                cpScoreTotal: totals.cpscore,
                totalQRank: ranks.totalQuestions,
                totalQTotal: totals.totalQuestions,
                lcRatingRank: ranks.leetcodeRating,
                lcRatingTotal: totals.leetcodeRating,
                cfRatingRank: ranks.codeforcesRating,
                cfRatingTotal: totals.codeforcesRating,
            }
        });
    } catch (error) {
        console.error('error in getMyRank:', error);
        return res.status(500).json({ success: false, message: 'failed to fetch rank' });
    }
};

module.exports = {
    getGlobalLeaderboard,
    getMyRank,
};
