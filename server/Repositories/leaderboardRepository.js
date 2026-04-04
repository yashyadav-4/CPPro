const User= require('../Model/User');

const getGlobalLeaderboardData = async()=>{
    return await User.aggregate([
        {//marking user with their platforms data
            $lookup:{
                from:'platforms',
                localField:'_id',
                foreignField:'userId',
                as:'platformStats'
            }
        },
        {// pull in LeetCode data from the leetcodedatas collection
            $lookup:{
                from:'leetcodedatas',
                localField:'_id',
                foreignField:'userId',
                as:'lcStats'
            }
        },
        {//for specifically selecting only codeforces solved problems
            $addFields:{
                codeforcesDoc:{
                    $arrayElemAt:[
                        {
                            $filter:{
                                input:"$platformStats",
                                as:'p',
                                cond: {$eq :["$$p.platform" , "codeforces"]}
                            }
                        },
                        0
                    ]
                },
                lcDoc:{
                    $arrayElemAt:["$lcStats", 0]
                }
            }
        },
        {// extract LeetCode contest rating (latest attended contest's rating)
            $addFields:{
                lcLatestRating:{
                    $let:{
                        vars:{
                            attended:{
                                $filter:{
                                    input:{ $ifNull:["$lcDoc.contestHistory", []] },
                                    as:"c",
                                    cond:{ $eq:["$$c.attended", true] }
                                }
                            }
                        },
                        in:{
                            $ifNull:[
                                { $arrayElemAt:[
                                    { $map:{
                                        input:{ $slice:["$$attended", -1] },
                                        as:"last",
                                        in:"$$last.rating"
                                    }},
                                    0
                                ]},
                                0
                            ]
                        }
                    }
                },
                lcTotalSolved:{ $ifNull:["$lcDoc.profile.totalSolved", 0] }
            }
        },
        {
         // CPPro Score formula:
         /*
            (CF Rating × 1.5)
          + (LC Rating × 1.2)
          + (CF Hard × 15) + (CF Medium × 8) + (CF Easy × 2)
          + (LC Hard × 20) + (LC Medium × 8) + (LC Easy × 2)
          + (Total Contests × 10)
          + Bonus for consistency: (CF Max - CF Current) * 0.5
          + Streak Bonus: min(streak * 2, 200)
         */
            $addFields:{
                cfRating:{ $ifNull:["$codeforcesDoc.currentRating", 0] },
                cfSolved:{ $ifNull:["$codeforcesDoc.totalSolved", 0] },
                lcRating:{ $ifNull:["$lcLatestRating", 0] },
                cfStreak:{ $ifNull:["$codeforcesDoc.currentStreak", 0] },
                lcStreak:{ $ifNull:["$lcDoc.calendar.streak", 0] },
                cfContests:{ $ifNull:["$codeforcesDoc.contestsParticipated", 0] },
                lcContests:{ $ifNull:["$lcDoc.contestCount", 0] },
                cfMaxRating:{ $ifNull:["$codeforcesDoc.maxRating", 0] }
            }
        },
        {
            $addFields:{
                cpScore:{
                    $floor: {
                        $add:[
                            { $multiply:["$cfRating", 1.5] },
                            { $multiply:["$lcRating", 1.2] },
                            { $multiply:[{ $ifNull:["$codeforcesDoc.hardSolved", 0] }, 15] },
                            { $multiply:[{ $ifNull:["$codeforcesDoc.mediumSolved", 0] }, 8] },
                            { $multiply:[{ $ifNull:["$codeforcesDoc.easySolved", 0] }, 2] },
                            { $multiply:[{ $ifNull:["$lcDoc.profile.hardSolved", 0] }, 20] },
                            { $multiply:[{ $ifNull:["$lcDoc.profile.mediumSolved", 0] }, 8] },
                            { $multiply:[{ $ifNull:["$lcDoc.profile.easySolved", 0] }, 2] },
                            { $multiply:[{ $add:["$cfContests", "$lcContests"]}, 10] },
                            { $max:[0, { $multiply:[{ $subtract:["$cfMaxRating", "$cfRating"]}, 0.5] }] },
                            { $min:[
                                { $multiply:[{ $max:["$cfStreak", "$lcStreak"]}, 2] },
                                200
                            ]}
                        ]
                    }
                }
            }
        },
        // only rank users with score more than 0
        { $match:{cpScore:{$gt:0}}},
        // descending order highest first
        {$sort:{cpScore:-1}},
        //limiting upto top 100 users
        {$limit:100},
        {//cleaning output for frontend to show
            $project:{
                _id:1,
                username:1,
                name:1,
                profilePic:1,
                cpScore:1,
                cfRating:1,
                cfSolved:1,
                lcRating:{ $floor:{ $ifNull:["$lcLatestRating", 0] } },
                lcSolved:"$lcTotalSolved",
                currentRating:"$cfRating",
                totalSolved:{
                    $add:[
                        { $ifNull:["$cfSolved", 0] },
                        { $ifNull:["$lcTotalSolved", 0] }
                    ]
                }
            }
        }
    ]);
}


module.exports={
    getGlobalLeaderboardData,
};