const leaderboardRepo = require('../Repositories/leaderboardRepository');
const LeaderboardCache = require('../Model/LeaderboardCache');

const getLeaderboard = async ({ scope, scopeValue, category, currentUserId, isAdmin = false }) => {
    let rawLeaderboard;

    if (scope === 'global') {
        // Serve from precomputed cache — falls back to live if cache is empty
        const cached = await LeaderboardCache.findOne({ cacheKey: `global:${category}` }).lean();
        if (cached?.entries?.length) {
            rawLeaderboard = cached.entries;
            // If admin, the cached entries won't have real names for anonymous users.
            // Fall through to live query so admin sees full data.
            if (isAdmin) rawLeaderboard = null;
        }
    }

    // Country/college scopes (scoped per user) and cache-miss fallback always run live
    if (!rawLeaderboard) {
        rawLeaderboard = await leaderboardRepo.getLeaderboardData(scope, scopeValue, category, isAdmin);
    }

    const leaderboard = rawLeaderboard.map((user, index) => ({ rank: index + 1, ...user }));

    let currentUser = null;
    if (currentUserId) {
        currentUser = await leaderboardRepo.getUserRank(currentUserId, scope, scopeValue, category);
    }

    return { leaderboard, currentUser };
};

module.exports = { getLeaderboard };
