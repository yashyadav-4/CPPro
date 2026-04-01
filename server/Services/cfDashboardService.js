
const dashboardRepo= require('../Repositories/cfDashboardRepository');

const generateLast365Days=()=>{
    const dates=[];
    const today= new Date();
    for(let i=364; i>=0; i--){
        const d= new Date(today);
        d.setDate(today.getDate()-i);
       //for spliting absolute time to the day
       const localDate= d.toLocaleDateString('en-CA' , {timeZone:"Asia/Kolkata"}); //to correct timzone error for users
       dates.push(localDate);
    }
    return dates;
}

const getHeatmap = async(userId)=>{
    const rawData= await dashboardRepo.getHeatmapData(userId);

    const submissionMap={};
    rawData.forEach(item=>{
        submissionMap[item.date]=item.count;
    })

    //now generating all 365days and filling in blanks so heatmap doesnt look good
    const allDays= generateLast365Days();
    const completeHeatmap= allDays.map(dateStr=>({
        date:dateStr,
        count: submissionMap[dateStr] || 0
    }));
    
    return completeHeatmap;
};

const getRatingAnalysis = async(userId , platform)=>{
    const dbData = await dashboardRepo.getRatingHistory(userId , platform);

    if(!dbData || !dbData.ratedHistory || dbData.ratedHistory.length===0){
        return {currentRating:0 , maxRating:0, history:[] , prediction :null};
    }
    
    const history= dbData.ratedHistory;


//--------------will change this later right now its Ai generated and doesnt work good at all---------------

    const recentHistory = history.slice(-15);
    let prediction = null;

    if (recentHistory.length >= 3) {
        const n = recentHistory.length;
        let sumLnX = 0, sumY = 0, sumY_LnX = 0, sumLnX2 = 0;

        recentHistory.forEach((contest, index) => {
            const x = index + 1;
            const y = contest.rating;
            const lnX = Math.log(x);

            sumLnX += lnX;
            sumY += y;
            sumY_LnX += y * lnX;
            sumLnX2 += lnX * lnX;
        });

        const denominator = (n * sumLnX2) - (sumLnX * sumLnX);
        
        if (denominator !== 0) {
            const a = ((n * sumY_LnX) - (sumY * sumLnX)) / denominator;
            const b = (sumY - a * sumLnX) / n;

            const futureX = n + 12;
            const predictedRating = Math.round(a * Math.log(futureX) + b);

            const lastRating = recentHistory[n - 1].rating;
            prediction = Math.max(predictedRating, lastRating - 50);
        }
    }

    return {
        platformUsername: dbData.platformUsername,
        currentRating: dbData.currentRating,
        maxRating: dbData.maxRating,
        contribution: dbData.contribution,
        history: history,
        prediction6Months: prediction
    };
};


const getProfileSummary = async(userId)=>{
    return await dashboardRepo.getProfileSummary(userId);
};

const getTopicBreakdown = async (userId)=>{
    return await dashboardRepo.getTopicBreakdown(userId);
};

const getDifficultyBreakdown = async (userId) =>{
    return await dashboardRepo.getDifficultyBreakdown(userId);
};

module.exports={
    getHeatmap,
    getRatingAnalysis,
    getProfileSummary,
    getTopicBreakdown,
    getDifficultyBreakdown,
};
