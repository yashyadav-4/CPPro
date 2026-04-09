const {Yaxios} =require('../Utils/nexusProxy');
const {bouncer}= require('../Utils/bouncer');
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
            Yaxios.get(`https://codeforces.com/api/user.info?handles=${cleanHandle}`)
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
    const syncService = require('./cfSyncService');
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

//Leetcode one
const LC_API = process.env.LEETCODE_API;

const verifyAndLinkLeetcode = async (userId, handle) => {
    const cleanHandle = handle.trim();
    const user = await User.findById(userId);

    if (!user.verificationCode) {
        const err = new Error("No verification code found. Please generate one first");
        err.status = 400;
        throw err;
    }

    let lcProfile;
    try {
        const response = await bouncer.schedule(() =>
            Yaxios.get(`${LC_API}/${cleanHandle}`)
        );
        lcProfile = response.data;
    } catch (error) {
        const err = new Error("Invalid LeetCode handle or LeetCode API unavailable");
        err.status = 400;
        throw err;
    }

    if (!lcProfile || !lcProfile.matchedUser) { //fallback if anything else in endpoint
        if (!lcProfile || !lcProfile.username) {
            const err = new Error("LeetCode user not found");
            err.status = 400;
            throw err;
        }
    }


    const realName = lcProfile.matchedUser?.profile?.realName
        || lcProfile.profile?.realName
        || lcProfile.realName
        || lcProfile.name
        || '';
    const code = user.verificationCode;

    if (!realName.includes(code)) {
        const err = new Error("LeetCode handle verification failed. Make sure the verification code is in your LeetCode 'Real Name' field.");
        err.status = 400;
        throw err;
    }

    await User.findByIdAndUpdate(
        userId,
        {
            $set:{ "linkedAccounts.leetcode": cleanHandle},
            $unset: {verificationCode: ""}
        },
        {new: true}
    );

    const lcSyncService = require('./lcSyncService');
    lcSyncService.syncLeetcodeProfile(userId, cleanHandle)
        .then(() => console.log(`[VERIFY-LC] initial sync complete for ${cleanHandle}`))
        .catch(err => console.error(`[VERIFY-LC] initial sync failed for ${cleanHandle}:`, err.message));

    return {message: `linking LeetCode account successful: ${cleanHandle}`};
};

const unlinkLeetcode= async(userId) =>{
    const user= await User.findById(userId);
    if (!user?.linkedAccounts?.leetcode) {
        const err = new Error("No LeetCode account is linked");
        err.status = 400;
        throw err;
    }
    await User.findByIdAndUpdate(userId, {
        $set: { "linkedAccounts.leetcode": "",lastLcUpdate: null },
        $unset: {verificationCode: ""}
    });
    const LeetCodeData = require('../Model/LeetCodeData');
    await LeetCodeData.deleteMany({userId});
    return {message: "LeetCode account unlinked successfully"};
};

const getProfile = async(userId) => {
    const user = await User.findById(userId).select(
        'name username email profilePic gender age location college linkedAccounts preferences'
    ).lean();
    if(!user){
        const err = new Error('User not found');
        err.status = 404;
        throw err;
    }
    return user;
};

const updateUserProfile = async(userId, fields) =>{
    const updateSet = {};
    // identity
    if(fields.name !== undefined && fields.name.trim()) updateSet['name'] = fields.name.trim();
    if(fields.gender !== undefined && ['Male','Female'].includes(fields.gender)) updateSet['gender'] = fields.gender;
    if(fields.age !== undefined) {
        const a = Number(fields.age);
        if(a >= 1 && a <= 100) updateSet['age'] = a;
    }
    if(fields.profilePic !== undefined) updateSet['profilePic'] = fields.profilePic.trim();
    // location
    if(fields.country !== undefined) updateSet["location.country"] = fields.country.trim();
    if(fields.state !== undefined) updateSet["location.state"] = fields.state.trim();
    if(fields.city !== undefined) updateSet["location.city"] = fields.city.trim();
    if(fields.college !== undefined) updateSet["college"] = fields.college.trim();
    // preferences
    if(fields.public !== undefined) updateSet["preferences.public"] = Boolean(fields.public);

    if(Object.keys(updateSet).length === 0){
        const err = new Error("No valid fields provided");
        err.status = 400;
        throw err;
    }

    const updated = await User.findByIdAndUpdate(
        userId,
        { $set: updateSet },
        { new: true, runValidators: true }
    ).select('-password');

    return updated;
};

module.exports ={
    generateCode,
    verifyAndLinkCodeforces,
    unlinkCodeforces,
    verifyAndLinkLeetcode,
    unlinkLeetcode,
    getProfile,
    updateUserProfile,
};
