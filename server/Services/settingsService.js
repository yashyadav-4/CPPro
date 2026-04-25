const axios = require('axios');
const { Yaxios } = require('../Utils/nexusProxy');
const { bouncer } = require('../Utils/bouncer');
const crypto = require('crypto');
const User = require('../Model/User');
const Notification = require('../Model/Notification');
const { encrypt, decrypt, isEnabled } = require('../Utils/encryption');

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
            $set:{"linkedAccounts.codeforces":cleanHandle, lastCfUpdate: null},
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
        $set:{"linkedAccounts.codeforces":"", lastCfUpdate: null},
        $unset:{verificationCode:""}
    });
    //remove all codeforces data: platform stats + submission history
    const Platform = require('../Model/Platform');
    const Submission = require('../Model/Submissions');
    await Platform.deleteMany({userId, platform:'codeforces'});
    await Submission.deleteMany({userId, platform:'codeforces'});
    return {message:"Codeforces account unlinked successfully"};
};

// ── CodeChef verification ────────────────────────────────────────────────────
// Route through CC server's /verify/:handle endpoint — it proxies through
// residential proxies so Cloudflare doesn't block datacenter IPs.
const CC_SYNC_API_SETTINGS    = (process.env.CC_SYNC_API || '').replace(/\/$/, '');
const CC_SYNC_SECRET_SETTINGS = process.env.CC_SYNC_SECRET || '';

const fetchCcRealName = async (ccHandle) => {
    if (!CC_SYNC_API_SETTINGS || !CC_SYNC_SECRET_SETTINGS) {
        throw new Error('CC_SYNC_API / CC_SYNC_SECRET not configured');
    }
    const res = await axios.get(`${CC_SYNC_API_SETTINGS}/verify/${encodeURIComponent(ccHandle)}`, {
        headers: { Authorization: `Bearer ${CC_SYNC_SECRET_SETTINGS}` },
        timeout: 20_000,
    });
    if (!res.data || res.data.name === undefined) throw new Error('CodeChef user not found');
    return res.data.name || '';
};

const verifyAndLinkCodechef = async (userId, handle) => {
    const cleanHandle = handle.trim();
    const user = await User.findById(userId);

    if (!user.verificationCode) {
        const err = new Error("No verification code found. Please generate one first");
        err.status = 400;
        throw err;
    }

    let realName;
    try {
        realName = await fetchCcRealName(cleanHandle);
    } catch (error) {
        const msg = error.message.includes('not found') ? 'CodeChef handle not found' : 'CodeChef API unavailable — try again';
        const err = new Error(msg);
        err.status = 400;
        throw err;
    }

    const code = user.verificationCode;
    if (!realName.includes(code)) {
        const err = new Error("CodeChef handle verification failed. Make sure the verification code is in your CodeChef 'Name' field.");
        err.status = 400;
        throw err;
    }

    await User.findByIdAndUpdate(
        userId,
        {
            $set: { "linkedAccounts.codechef": cleanHandle, lastCcUpdate: null },
            $unset: { verificationCode: "" }
        },
        { new: true }
    );

    const ccSyncService = require('./ccSyncService');
    ccSyncService.syncCodeChefProfile(userId, cleanHandle)
        .then(() => console.log(`[VERIFY-CC] initial sync complete for ${cleanHandle}`))
        .catch(err => console.error(`[VERIFY-CC] initial sync failed for ${cleanHandle}:`, err.message));

    return { message: `linking CodeChef account successful: ${cleanHandle}` };
};

const unlinkCodechef = async (userId) => {
    const user = await User.findById(userId);
    if (!user?.linkedAccounts?.codechef) {
        const err = new Error("No CodeChef account is linked");
        err.status = 400;
        throw err;
    }
    await User.findByIdAndUpdate(userId, {
        $set: { "linkedAccounts.codechef": "", lastCcUpdate: null },
        $unset: { verificationCode: "" }
    });
    const Platform = require('../Model/Platform');
    const Submission = require('../Model/Submissions');
    await Platform.deleteMany({ userId, platform: 'codechef' });
    await Submission.deleteMany({ userId, platform: 'codechef' });
    return { message: "CodeChef account unlinked successfully" };
};

// LeetCode verification — proxy through NexusLC to avoid Cloudflare 403 on datacenter IPs.
// Falls back to direct call only when NexusLC is not configured (local dev).
const LC_SYNC_API    = (process.env.LC_SYNC_API || '').replace(/\/$/, '');
const LC_SYNC_SECRET = process.env.LC_SYNC_SECRET || '';

const fetchLcRealName = async (lcUsername) => {
    if (LC_SYNC_API && LC_SYNC_SECRET) {
        // Route through NexusLC proxy — safe from Cloudflare blocking.
        const res = await axios.get(`${LC_SYNC_API}/verify/${encodeURIComponent(lcUsername)}`, {
            headers: { Authorization: `Bearer ${LC_SYNC_SECRET}` },
            timeout: 15_000,
        });
        if (!res.data || res.data.realName === undefined) throw new Error('LeetCode user not found');
        return res.data.realName || '';
    }
    // Fallback: direct call (works locally, may 403 in production).
    const query = `query v($u:String!){matchedUser(username:$u){profile{realName}}}`;
    const res = await axios.post(
        'https://leetcode.com/graphql',
        { query, variables: { u: lcUsername } },
        { timeout: 10_000, headers: { 'Content-Type': 'application/json', 'Referer': 'https://leetcode.com' } }
    );
    const matched = res.data && res.data.data && res.data.data.matchedUser;
    if (!matched) throw new Error('LeetCode user not found');
    return (matched.profile && matched.profile.realName) || '';
};

const verifyAndLinkLeetcode = async (userId, handle) => {
    const cleanHandle = handle.trim();
    const user = await User.findById(userId);

    if (!user.verificationCode) {
        const err = new Error("No verification code found. Please generate one first");
        err.status = 400;
        throw err;
    }

    let realName;
    try {
        realName = await fetchLcRealName(cleanHandle);
    } catch (error) {
        const err = new Error("Invalid LeetCode handle or LeetCode API unavailable");
        err.status = 400;
        throw err;
    }


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
    if(fields.college !== undefined) {
        updateSet["college"] = fields.college.trim().replace(/\s+/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
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

// ── LC Session management ────────────────────────────────────────────────────

const saveLcSession = async (userId, rawToken) => {
    if (!isEnabled()) {
        const err = new Error('Session storage is not configured on this server');
        err.status = 503;
        throw err;
    }
    const { iv, encryptedToken, authTag } = encrypt(rawToken.trim());
    await User.findByIdAndUpdate(userId, {
        $set: {
            'lcSession.iv':             iv,
            'lcSession.encryptedToken': encryptedToken,
            'lcSession.authTag':        authTag,
            'lcSession.status':         'active',
            'lcSession.updatedAt':      new Date(),
            lastLcUpdate:               null,   // force re-sync with new session
        },
    });
    // Notify user that session was saved successfully
    await Notification.create({
        userId,
        type:    'lc_session_saved',
        title:   'LeetCode Session Connected',
        message: 'Your LeetCode session is active. Full submission history will be fetched on the next sync.',
        actionUrl: '/dashboard',
    });
    return { status: 'active' };
};

const getLcSessionStatus = async (userId) => {
    if (!isEnabled()) return { status: 'feature_disabled' };
    const user = await User.findById(userId).select('lcSession').lean();
    return { status: user?.lcSession?.status || 'not_set' };
};

const removeLcSession = async (userId) => {
    await User.findByIdAndUpdate(userId, {
        $set: {
            'lcSession.iv':             null,
            'lcSession.encryptedToken': null,
            'lcSession.authTag':        null,
            'lcSession.status':         'not_set',
            'lcSession.updatedAt':      new Date(),
        },
    });
    return { status: 'not_set' };
};

/** Internal use only — decrypts and returns the raw session token for sync dispatch. */
const getDecryptedLcSession = async (userId) => {
    if (!isEnabled()) return null;
    const user = await User.findById(userId).select('lcSession').lean();
    if (!user?.lcSession?.encryptedToken || user.lcSession.status !== 'active') return null;
    try {
        return decrypt(user.lcSession);
    } catch {
        return null;
    }
};

module.exports ={
    generateCode,
    verifyAndLinkCodeforces,
    unlinkCodeforces,
    verifyAndLinkLeetcode,
    unlinkLeetcode,
    verifyAndLinkCodechef,
    unlinkCodechef,
    getProfile,
    updateUserProfile,
    saveLcSession,
    getLcSessionStatus,
    removeLcSession,
    getDecryptedLcSession,
};
