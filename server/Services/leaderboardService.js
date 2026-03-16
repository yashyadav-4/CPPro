const leaderboardRepo= require('../Repositories/leaderboardRepository');

const getLeaderboard= async()=>{
    const rawLeaderboard= await leaderboardRepo.getGlobalLeaderboardData();

    //giving ranks to users(top 100 only)
    const rankedLeaderboard= rawLeaderboard.map((user , index)=>({
        rank:index+1,
        ...user
    }));
    return rankedLeaderboard;
};

module.exports={
    getLeaderboard,
};