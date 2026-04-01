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
         //cfRating + (cfSolved × 2) + floor(lcRating) + (lcSolved × 2)
            $addFields:{
                cfRating:{ $ifNull:["$codeforcesDoc.currentRating", 0] },
                cfSolved:{ $ifNull:["$codeforcesDoc.totalSolved", 0] },
                cpScore:{
                    $add:[
                        { $ifNull:["$codeforcesDoc.currentRating", 0] },
                        { $multiply:[{ $ifNull:["$codeforcesDoc.totalSolved", 0]}, 2] },
                        { $floor:{ $ifNull:["$lcLatestRating", 0] } },
                        { $multiply:[{ $ifNull:["$lcTotalSolved", 0]}, 2] }
                    ]
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