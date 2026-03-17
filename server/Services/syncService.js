const axios = require('axios');
const syncRepo= require('../Repositories/syncRepository');
const Platform = require('../Model/Platform');
const Submission= require('../Model/Submissions');
const {acquireLock , releaseLock}= require('../Utils/cfApiQueue');

const delay = (ms)=> new Promise(resolve=> setTimeout(resolve , ms));

const syncCodeforcesProfile= async(userId , handle , priority='medium')=>{
    try{
        console.log('syncservice proccessing for user: ' ,{handle});

        await acquireLock(priority);
        const statusRes= await axios.get(`https://codeforces.com/api/user.status?handle=${handle}`);
        const submissions= statusRes.data.result;

        await syncRepo.processAndSaveSubmissions(userId , submissions);;

        await delay(2100);

        const ratingRes= await axios.get(`https://codeforces.com/api/user.rating?handle=${handle}`);

        const ratingHistory= ratingRes.data.result.map(r=>({
            rating:r.newRating,
            date:new Date(r.ratingUpdateTimeSeconds *1000),
            contestName :r.contestName
        }));

        await delay(2100);

        const infoRes=await axios.get(`https://codeforces.com/api/user.info?handles=${handle}`);
        const userInfo =infoRes.data.result[0];

        releaseLock();

        const uniqueSolvedCount= await Submission.distinct('problemId' , {
            userId:userId,
            verdict: 'AC',
            platform :'codeforces'
        });

        await Platform.findOneAndUpdate(
            { userId: userId,platform:'codeforces'},
            {
                $set:{
                    platformUsername : handle,
                    currentRating:userInfo.rating || 0,
                    maxRating :userInfo.maxRating || 0,
                    currentRank : userInfo.rank || 'unrated',
                    maxRank : userInfo.maxRank || 'unrated',
                    contribution: userInfo.contribution || 0,
                    ratedHistory:ratingHistory,
                    totalSolved :uniqueSolvedCount.length,
                    lastSyncedAt: new Date() 
                }
            },
            {upsert:true,new: true} // if we first time syncing than create doc
        );

        console.log('syncservice succesfully synced user : ' , handle);
        return{
            success:true,
            message:"sync done"
        };
    }catch(error){
        releaseLock();
        console.error(`error syncing for ${handle}:`,error.message);
        if (error.response &&error.response.status ===400) {
            throw new Error("invalid codeforces handle");
        }
        throw new Error("codeforces API is currently unavailable");
    }
}

module.exports={
    syncCodeforcesProfile,
}