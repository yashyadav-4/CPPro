const express =require('express');
const router= express.Router();
const {verifyToken} =require('../Middlewares/auth');
const {
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
} = require('../Controllers/settingsController');

router.use(verifyToken);

//shared verification code generator
router.get('/generate-cf-code', getVerificationCode);

//codeforces
router.post('/verify-cf', verifyCodeforcesAccount);
router.delete('/unlink-cf', unlinkCodeforcesAccount);

//leetcode
router.post('/verify-lc', verifyLeetcodeAccount);
router.delete('/unlink-lc', unlinkLeetcodeAccount);

//codechef
router.post('/verify-cc', verifyCodeChefAccount);
router.delete('/unlink-cc', unlinkCodeChefAccount);

//profile settings
router.get('/profile', getProfile);
router.patch('/profile', updateProfile);

// LC session
router.get('/lc-session/status', getLcSessionStatus);
router.put('/lc-session', saveLcSession);
router.delete('/lc-session', removeLcSession);

module.exports = router;