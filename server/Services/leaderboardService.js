const leaderboardRepo = require('../Repositories/leaderboardRepository');
const LeaderboardCache = require('../Model/LeaderboardCache');

const getLeaderboard = async ({ scope, scopeValue, category, currentUserId }) => {
    let rawLeaderboard;

    if (scope === 'global') {
        // Serve from precomputed cache — falls back to live if cache is empty
        const cached = await LeaderboardCache.findOne({ cacheKey: `global:${category}` }).lean();
        if (cached?.entries?.length) {
            rawLeaderboard = cached.entries;
        }
    }

    // Country/college scopes (scoped per user) and cache-miss fallback always run live
    if (!rawLeaderboard) {
        rawLeaderboard = await leaderboardRepo.getLeaderboardData(scope, scopeValue, category);
    }

    const leaderboard = rawLeaderboard.map((user, index) => ({ rank: index + 1, ...user }));

    let currentUser = null;
    if (currentUserId) {
        currentUser = await leaderboardRepo.getUserRank(currentUserId, scope, scopeValue, category);
    }

    return { leaderboard, currentUser };
};

module.exports = { getLeaderboard };
