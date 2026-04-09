const leaderboardRepo = require('../Repositories/leaderboardRepository');

const getLeaderboard = async ({ scope, scopeValue, category, currentUserId }) => {
    // Fetch top 100
    const rawLeaderboard = await leaderboardRepo.getLeaderboardData(scope, scopeValue, category);

    // Assign display ranks
    const leaderboard = rawLeaderboard.map((user, index) => ({
        rank: index + 1,
        ...user
    }));

    // Fetch current user's rank if authenticated
    let currentUser = null;
    if (currentUserId) {
        currentUser = await leaderboardRepo.getUserRank(currentUserId, scope, scopeValue, category);
    }

    return { leaderboard, currentUser };
};

module.exports = {
    getLeaderboard,
};