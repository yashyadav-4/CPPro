const { cfAxios } = require('../Utils/nexusProxy');
const { bouncer } = require('../Utils/bouncer');
const crypto=require('crypto');
const User= require('../Model/User');

const generateCode=async(userId)=>{
    const uniqueCode= `cppro-${crypto.randomBytes(3).toString('hex')}`;
    
    await User.findByIdAndUpdate(userId ,{
        $set:{verificationCode: uniqueCode}
    });
    return uniqueCode;
} 

const verifyAndLinkCodeforces = async(userId ,handle)=>{
    const cleanHandle= handle.trim();
    const user = await User.findById(userId);

    if(!user.verificationCode){
        const err= new Error("No verification code found. please generate one first");
        err.status=400;
        throw err;
    }
    let cfProfile;
    try{
        const response = await bouncer.schedule(() =>
            cfAxios.get(`https://codeforces.com/api/user.info?handles=${cleanHandle}`)
        );
        cfProfile = response.data.result[0];
    }catch(error){
        const err= new Error("Invalid codeforces handle");
        err.status=400;
        throw err;
    }

    const firstName= cfProfile.firstName || "";
    // const lastName= cfProfile.lastName || ""; //will use only firstname for verification for cf
    const code= user.verificationCode;

    if(!firstName.includes(code)){
        const err= new Error("cf handle verification failed");
        err.status=400;
        throw err; 
    }
    await User.findByIdAndUpdate(
        userId,
        {
            $set:{"linkedAccounts.codeforces":cleanHandle},
            $unset:{verificationCode :""}
        },
        {new:true}
    );

    //trigger immediate sync in background so dashboard has data right away
    const syncService = require('./syncService');
    syncService.syncCodeforcesProfile(userId, cleanHandle, 'high')
        .then(() => console.log(`[VERIFY] initial sync complete for ${cleanHandle}`))
        .catch(err => console.error(`[VERIFY] initial sync failed for ${cleanHandle}:`, err.message));

    return {message: `linking codeforces account successful: ${cleanHandle}`};
};
const unlinkCodeforces = async(userId)=>{
    const user = await User.findById(userId);
    if(!user?.linkedAccounts?.codeforces){
        const err = new Error("No Codeforces account is linked");
        err.status = 400;
        throw err;
    }
    await User.findByIdAndUpdate(userId, {
        $set:{"linkedAccounts.codeforces":""},
        $unset:{verificationCode:""}
    });
    //remove all codeforces data: platform stats + submission history
    const Platform = require('../Model/Platform');
    const Submission = require('../Model/Submissions');
    await Platform.deleteMany({userId, platform:'codeforces'});
    await Submission.deleteMany({userId, platform:'codeforces'});
    return {message:"Codeforces account unlinked successfully"};
};

module.exports={generateCode , verifyAndLinkCodeforces, unlinkCodeforces};
