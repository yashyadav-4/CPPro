// $gt:greater than
// $lte:less than or equal to;
// $lt:less than
// &ne:not equal to

const mongoose = require('mongoose');
const Submission= require('../Model/Submissions');
const Platform= require('../Model/Platform');

const getHeatmapData = async (userId)=>{
    const oneYearAgo= new Date();
    oneYearAgo.setDate(oneYearAgo.getDate()- 365);

    return await Submission.aggregate([
        //looking for users submision from last one year only
        {
            $match:{
                userId: new mongoose.Types.ObjectId(userId),
                submittedAt:{$gte: oneYearAgo} //gte= greater than or equal to
            }
        },
        //for counting submissions at particular  day , listen this "%Y-%m-%d" thing is used because time also have miliseconds so to truncate everything after data day in data from submittedAt var
        {
            $group:{
                _id:{$dateToString:{format:"%Y-%m-%d" , date:"$submittedAt" , timezone :"Asia/Kolkata"}},
                count:{$sum:1} //counts submission
            }
        },
        //telling aggregate function to exclude _id(bcz by default it does) and naming $_id as date
        {
            $project:{
                _id:0,
                date: "$_id",
                count:1
            }
        },
        {$sort:{date:1}}
    ]);
};

const getTopicBreakdown = async(userId)=>{
    return await Submission.aggregate([
        {
            $match:{
                userId: new mongoose.Types.ObjectId(userId),
                verdict:'AC'
            }
        },
        {
            $group:{
                _id:"$problemId",
                tags:{$first:"$tags"} //it takes tags from first document from all submissions you made for particular problemId
            }
        },
        {$unwind:"$tags"},//deconstructing tags array
        {
            $group:{
                _id:"$tags",
                count:{$sum:1}
            }
        },
        {$sort :{count:-1}}
    ]);
}

const getDifficultyBreakdown = async (userId)=>{
    return await Submission.aggregate([
        {
            $match:{
                userId:new mongoose.Types.ObjectId(userId),
                verdict:'AC'
            }
        },
        {
            $group:{
                _id:"$problemId",
                difficulty:{$first:"$difficulty"}
            }
        },
        {
            $group:{
                _id:"$difficulty",
                count:{$sum:1}
            }
        },
        {$sort:{_id:1}}
    ]);
};


const getRatingHistory=async(userId , platform)=>{
    const platformData= await Platform.findOne({
        userId:userId,
        platform:platform
    }).select('ratedHistory currentRating maxRating platformUsername');

    return platformData;
}

const getProfileSummary = async(userId)=>{
    const uniqueSolved= await Submission.distinct('problemId' , {
        userId:userId,
        verdict:'AC'
    });

    const activeDaysAggregation=await Submission.aggregate([
        {
            $match:{
                userId: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group:{
                _id:{
                    $dateToString:{format:"%Y-%m-%d" , date:"$submittedAt" , timezone:"Asia/Kolkata"}
                }
            }
        },
        {
            $count:"totalActiveDays"
        }
    ]);
    const activeDays= activeDaysAggregation.length>0? activeDaysAggregation[0].totalActiveDays : 0;

    return{
        totalQuestionsSolved: uniqueSolved.length,
        totalActiveDays: activeDays
    };
};

module.exports={
    getHeatmapData,
    getTopicBreakdown,
    getDifficultyBreakdown,
    getRatingHistory,
    getProfileSummary
}