const settingsService = require('../Services/settingsService');
const User = require('../Model/User');

const getVerificationCode= async(req , res)=>{
    try{
        const userId= req.user._id;
        const code= await settingsService.generateCode(userId);
        return res.status(200).json({success:true , code:code});
    }catch(error){
        return res.status(500).json({success:false , message:"could not generate code"});
    }
};

const verifyCodeforcesAccount = async(req, res)=>{
    try{
        const userId= req.user._id;
        const {handle}= req.body;
        if(!handle){
            return res.status(400).json({success:false , message:"handle required"});
        }
        const result = await settingsService.verifyAndLinkCodeforces(userId , handle);
        return res.status(200).json({success:true , message:result.message});
    }catch(error){
        return res.status(error.status || 500).json({success:false , message:error.message});
    }
}

const unlinkCodeforcesAccount = async(req, res)=>{
    try{
        const userId = req.user._id;
        const result = await settingsService.unlinkCodeforces(userId);
        return res.status(200).json({success:true, message:result.message});
    }catch(error){
        return res.status(error.status || 500).json({success:false, message:error.message});
    }
}

// ── LeetCode handlers ──
const verifyLeetcodeAccount = async (req, res) => {
    try {
        const userId = req.user._id;
        const { handle } = req.body;
        if (!handle) {
            return res.status(400).json({ success: false, message: "LeetCode handle required" });
        }
        const result = await settingsService.verifyAndLinkLeetcode(userId, handle);
        return res.status(200).json({ success: true, message: result.message });
    } catch (error) {
        return res.status(error.status || 500).json({ success: false, message: error.message });
    }
};

const unlinkLeetcodeAccount = async (req, res) => {
    try {
        const userId = req.user._id;
        const result = await settingsService.unlinkLeetcode(userId);
        return res.status(200).json({ success: true, message: result.message });
    } catch (error) {
        return res.status(error.status || 500).json({ success: false, message: error.message });
    }
};

const verifyCodeChefAccount = async (req, res) => {
    try {
        const userId = req.user._id;
        const { handle } = req.body;
        if (!handle) {
            return res.status(400).json({ success: false, message: "CodeChef handle required" });
        }
        const result = await settingsService.verifyAndLinkCodechef(userId, handle);
        return res.status(200).json({ success: true, message: result.message });
    } catch (error) {
        return res.status(error.status || 500).json({ success: false, message: error.message });
    }
};

const unlinkCodeChefAccount = async (req, res) => {
    try {
        const userId = req.user._id;
        const result = await settingsService.unlinkCodechef(userId);
        return res.status(200).json({ success: true, message: result.message });
    } catch (error) {
        return res.status(error.status || 500).json({ success: false, message: error.message });
    }
};

const getProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const profile = await settingsService.getProfile(userId);
        return res.status(200).json({ success: true, data: profile });
    } catch (error) {
        return res.status(error.status || 500).json({ success: false, message: error.message });
    }
};

const updateProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const { name, gender, age, profilePic, country, state, city, college, public: isPublic } = req.body;
        const updatedUser = await settingsService.updateUserProfile(userId, {
            name, gender, age, profilePic, country, state, city, college, public: isPublic
        });
        return res.status(200).json({ success: true, message: 'Profile updated', user: updatedUser });
    } catch (error) {
        return res.status(error.status || 500).json({ success: false, message: error.message || 'Failed to update profile' });
    }
};

const saveLcSession = async (req, res) => {
    try {
        const userId = req.user._id;
        const { session } = req.body;
        if (!session || typeof session !== 'string' || session.trim().length < 50) {
            return res.status(400).json({ success: false, message: 'Invalid session token — paste the full LEETCODE_SESSION cookie value' });
        }
        const result = await settingsService.saveLcSession(userId, session);

        // If this is a first-time or re-auth session, fire a background deep sync immediately.
        // Don't await — respond to the user right away and let the sync happen in the background.
        if (result.needsDeepSync) {
            // Stamp lastLcUpdate NOW to prevent a concurrent dashboard refresh from
            // also firing a sync in the small window before the IIFE starts its job.
            await User.findByIdAndUpdate(userId, { $set: { lastLcUpdate: new Date() } });

            (async () => {
                try {
                    const freshUser = await User.findById(userId).select('linkedAccounts').lean();
                    const handle = freshUser?.linkedAccounts?.leetcode;
                    if (!handle) return;

                    const { syncLeetcodeProfile } = require('../Services/lcSyncService');
                    const { getDecryptedLcSession } = require('../Services/settingsService');

                    // 'first' = 3000 subs (never had a session before, full history import)
                    // 'hard'  = 600 subs  (re-auth after expiry, just catch up on recent)
                    const syncDepth = result.isFirstTimeSession ? 'first' : 'hard';
                    const sessionToken = await getDecryptedLcSession(userId, { allowExpired: false });
                    if (!sessionToken) return; // safety: encryption not available

                    console.log(`[SESSION-SYNC] Firing background ${syncDepth} sync for ${handle}`);
                    await syncLeetcodeProfile(userId, handle, sessionToken, { syncDepth });

                    // Clear the pending flag — sync succeeded with valid session
                    await User.findByIdAndUpdate(userId, { $set: { lcSessionPendingSync: false } });

                    // Q2: regenerate today's daily problems so previously-solved problems
                    // are excluded now that the Submissions collection has full history.
                    if (syncDepth === 'first') {
                        try {
                            const DailyProblem = require('../Model/DailyProblem');
                            const { getTodayIST } = require('../Utils/dateUtils');
                            await DailyProblem.deleteOne({ userId, date: getTodayIST() });
                            console.log(`[SESSION-SYNC] Deleted today's DailyProblem for ${handle} — will regenerate with full history`);
                        } catch (dailyErr) {
                            console.warn('[SESSION-SYNC] Daily problem reset failed:', dailyErr.message);
                        }
                    }

                    console.log(`[SESSION-SYNC] Background ${syncDepth} sync complete for ${handle}`);
                } catch (err) {
                    // Don't clear lcSessionPendingSync on failure — the flag ensures the
                    // next manual sync or dashboard refresh will retry the deep sync.
                    console.error(`[SESSION-SYNC] Background deep sync failed:`, err.message);
                }
            })();
        }

        return res.json({ success: true, status: result.status });
    } catch (err) {
        return res.status(err.status || 500).json({ success: false, message: err.message });
    }
};

const getLcSessionStatus = async (req, res) => {
    try {
        const userId = req.user._id;
        const result = await settingsService.getLcSessionStatus(userId);
        return res.json({ success: true, ...result });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

const removeLcSession = async (req, res) => {
    try {
        const userId = req.user._id;
        const result = await settingsService.removeLcSession(userId);
        return res.json({ success: true, ...result });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

const getCollegeSuggestions = async (req, res) => {
    try {
        const q = (req.query.q || '').trim();
        if (q.length < 2) {
            return res.json({ success: true, data: [] });
        }
        const results = await User.aggregate([
            { $match: { college: { $regex: q, $options: 'i', $ne: '' } } },
            { $group: { _id: '$college' } },
            { $sort: { _id: 1 } },
            { $limit: 20 },
            { $project: { _id: 0, name: '$_id' } },
        ]);
        return res.json({ success: true, data: results.map(r => r.name) });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to fetch suggestions' });
    }
};

async function updatePreferences(req, res) {
    try {
        const userId = req.user._id;
        const { preferredLanguage } = req.body;
        const validLangs = ['cpp', 'java', 'python', 'javascript'];
        if (preferredLanguage && !validLangs.includes(preferredLanguage)) {
            return res.status(400).json({ success: false, message: 'Invalid language' });
        }
        await User.findByIdAndUpdate(userId, {
            $set: { 'preferences.preferredLanguage': preferredLanguage || 'cpp' },
        });
        return res.json({ success: true, message: 'Preferences updated' });
    } catch (err) {
        console.error('[Settings] updatePreferences error:', err.message);
        return res.status(500).json({ success: false, message: 'Failed to update preferences' });
    }
}

module.exports = {
    getVerificationCode,
    verifyCodeforcesAccount,
    unlinkCodeforcesAccount,
    verifyLeetcodeAccount,
    unlinkLeetcodeAccount,
    verifyCodeChefAccount,
    unlinkCodeChefAccount,
    getProfile,
    updateProfile,
    saveLcSession,
    getLcSessionStatus,
    removeLcSession,
    getCollegeSuggestions,
    updatePreferences,
};