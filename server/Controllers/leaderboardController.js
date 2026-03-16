const leaderboardService = require('../Services/leaderboardService');

const getGlobalLeaderboard= async(req , res)=>{
    try{
        const leaderboard= await leaderboardService.getLeaderboard();
        return res.status(200).json({success:true , data:leaderboard});
    }catch(error){
        console.error("some error in leaderboard controller: ", error);
        return res.status(500).json({success:false , message:"failed to fetch leaderboard"});
    }
}
module.exports={
    getGlobalLeaderboard,
};