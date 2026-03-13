const dashboardService= require('../Services/dashboardService');
async function getProfileSummary(req , res){
    try{
        const  {userId}= req.params;

        const summary = await dashboardService.getProfileSummary(userId);        

        res.status(200).json({success:true , data :summary});
    }catch(error){
        console.error('error in getProfileSummary: ', error);
        return res.status(500).json({success: false,message: error.message});
    }
}

async function getHeatmap(req , res){
    try{
        const  {userId}= req.params;

        const heatmapData= await dashboardService.getHeatmap(userId);

        res.status(200).json({success:true , data :heatmapData});
    }catch(error){
        console.error('error in getHeatmap: ', error);
        return res.status(500).json({success: false,message: error.message});
    }
}

async function getRatingAnalysis(req , res){
    try{
        const  {userId}= req.params;

        const ratingData=await dashboardService.getRatingAnalysis(userId,'codeforces');

        res.status(200).json({success:true , data :ratingData});
    }catch(error){
        console.error('error in getRatingAnalysis: ', error);
        return res.status(500).json({success: false,message: error.message});
    }
}

async function getTopicBreakdown(req , res){
    try{
        const  {userId}= req.params;

        const topics = await dashboardService.getTopicBreakdown(userId);

        res.status(200).json({success:true , data :topics});
    }catch(error){
        console.error('error in getTopicBreakdown: ', error);
        return res.status(500).json({success: false,message: error.message});
    }
}

async function getDifficultyBreakdown(req , res){
    try{
        const  {userId}= req.params;

        const difficulty = await dashboardService.getDifficultyBreakdown(userId);

        res.status(200).json({success:true , data :difficulty});
    }catch(error){
        console.error('error in getDifficultyBreakdown: ', error);
        return res.status(500).json({success: false,message: error.message});
    }
}


module.exports={
    getProfileSummary,
    getHeatmap,
    getRatingAnalysis,
    getTopicBreakdown,
    getDifficultyBreakdown,
}