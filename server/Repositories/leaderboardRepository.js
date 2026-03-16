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
                }
            }
        },
        {//calculaing cppro score
            $addFields:{
                cpScore:{
                    $add:[
                        { $ifNull:["$codeforcesDoc.currentRating" , 0]},
                        { $multiply:[{ $ifNull:["$codeforcesDoc.totalSolved" , 0]} , 2]}
                    ]
                }
            }
        },
        // only rank user with score more than 0
        { $match:{cpScore:{$gt:0}}},
        // descending order highest first
        {$sort:{cpScore:-1}},
        //limiting upto to top 100 users
        {$limit:100},
        {//cleaning output for frontend to show
            $project:{
                _id:1,
                username:1,
                name:1,
                profilePic:1,
                cpScore:1,
                currentRating:"$codeforcesDoc.currentRating",
                totalSolved:"$codeforcesDoc.totalSolved"
            }
        }
    ]);
}


module.exports={
    getGlobalLeaderboardData,
};