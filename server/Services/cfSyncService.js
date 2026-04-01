const {Yaxios}= require('../Utils/nexusProxy');
const {bouncer} =require('../Utils/bouncer');
const syncRepo = require('../Repositories/cfSyncRepository');
const Platform = require('../Model/Platform');
const Submission = require('../Model/Submissions');
const User = require('../Model/User');

const TEN_MINUTES = 10 * 60 * 1000;

//first checks for 10 min timer
const getCodeforcesData = async (userId, handle) => {
    const user =await User.findById(userId).lean();
    const timeSinceUpdate = user.lastCfUpdate? (Date.now() -new Date(user.lastCfUpdate).getTime()): Infinity;

    if (timeSinceUpdate <TEN_MINUTES) {
        const remainingMs =TEN_MINUTES -timeSinceUpdate;
        const remainingSeconds= Math.ceil(remainingMs/ 1000);
        console.log(`[LEAN-NEXUS] >> ${handle} | Fresh | Served | ${remainingSeconds}s remaining`);
        return { freshness:'fresh',remainingSeconds};
    }
    //stale -> when scheduling background update
    console.log(`[LEAN-NEXUS] >> ${handle} | Stale | Updating`);
    //background sync with bouncer  
    syncCodeforcesProfile(userId, handle)
        .then(()=> console.log(`[LEAN-NEXUS] >> ${handle} | Background update complete`))
        .catch(err =>console.error(`[LEAN-NEXUS] >> ${handle} | Background update failed:`,err.message));

    return {freshness:'updating'};
};

//all calls goes through global bouncer and proxies
const syncCodeforcesProfile =async(userId, handle)=>{
    try {
        console.log(`[LEAN-NEXUS] syncing profile for: ${handle}`);

        //1. fetch submissions via bouncer-scheduled proxy call
        const statusRes= await bouncer.schedule(()=>
            Yaxios.get(`https://codeforces.com/api/user.status?handle=${handle}`)
        );
        const submissions =statusRes.data.result;
        await syncRepo.processAndSaveSubmissions(userId, submissions);

        //2. fetching rating history
        const ratingRes =await bouncer.schedule(()=>
            Yaxios.get(`https://codeforces.com/api/user.rating?handle=${handle}`)
        );
        const ratingHistory= ratingRes.data.result.map(r =>({
            rating: r.newRating,
            date: new Date(r.ratingUpdateTimeSeconds * 1000),
            contestName:r.contestName
        }));

        //3. fetching user info
        const infoRes =await bouncer.schedule(() =>
            Yaxios.get(`https://codeforces.com/api/user.info?handles=${handle}`)
        );
        const userInfo=infoRes.data.result[0];

        // 4. Counting  unique solved
        const uniqueSolvedCount = await Submission.distinct('problemId', {
            userId: userId,
            verdict: 'AC',
            platform: 'codeforces'
        });

        // 5. Update Platform doc
        await Platform.findOneAndUpdate(
            { userId: userId, platform: 'codeforces' },
            {
                $set: {
                    platformUsername: handle,
                    currentRating: userInfo.rating || 0,
                    maxRating: userInfo.maxRating || 0,
                    currentRank: userInfo.rank || 'unrated',
                    maxRank: userInfo.maxRank || 'unrated',
                    contribution: userInfo.contribution || 0,
                    ratedHistory: ratingHistory,
                    totalSolved: uniqueSolvedCount.length,
                    lastSyncedAt: new Date()
                }
            },
            { upsert: true, new: true }
        );

        //6.stamp lastCfUpdate on User 
        await User.findByIdAndUpdate(userId,{$set:{lastCfUpdate:new Date()}});

        console.log(`[LEAN-NEXUS] >> ${handle} | Sync complete`);
        return {success: true, message:'sync done'};
    } catch (error) {
        console.error(`[LEAN-NEXUS] >> ${handle} | Sync error:`, error.message);
        if (error.response && error.response.status=== 400) {
            throw new Error('invalid codeforces handle');
        }
        throw new Error('codeforces API is currently unavailable');
    }
};

module.exports={
    syncCodeforcesProfile,
    getCodeforcesData,
};
