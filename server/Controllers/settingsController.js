const settingsService = require('../Services/settingsService');

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
        return res.json({ success: true, ...result });
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
};