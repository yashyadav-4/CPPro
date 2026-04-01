const LeetCodeData =require('../Model/LeetCodeData');

const upsertLeetCodeData= async(userId, lcUsername,parsedData)=>{
    return await LeetCodeData.findOneAndUpdate(
        {userId},
        {
            $set:{
                lcUsername,
                profile: parsedData.profile,
                skillStats: parsedData.skillStats,
                calendar: parsedData.calendar,
                contestCount: parsedData.contestCount,
                contestHistory: parsedData.contestHistory,
                recentSubmissions: parsedData.recentSubmissions,
                lastSyncedAt:new Date(),
            }
        },
        {upsert:true, new:true}
    );
};

module.exports={
    upsertLeetCodeData,
};
