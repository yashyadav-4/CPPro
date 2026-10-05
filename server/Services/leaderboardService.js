const leaderboardRepo = require('../Repositories/leaderboardRepository');
const { getCache } = require('../Utils/redisClient');

const getLeaderboard = async ({ scope, scopeValue, category, currentUserId, isAdmin = false }) => {
    let rawLeaderboard;

    if (scope === 'global') {
        const cachedEntries = await getCache(`leaderboard:global:${category}`);
        if (cachedEntries?.length) {
            rawLeaderboard = cachedEntries;
            if (isAdmin) rawLeaderboard = null;
        }
    }

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
