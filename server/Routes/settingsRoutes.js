const express =require('express');
const router= express.Router();
const {verifyToken} =require('../Middlewares/auth');
const {
    getVerificationCode,
    getGfgVerificationCode,
    verifyCodeforcesAccount,
    unlinkCodeforcesAccount,
    verifyLeetcodeAccount,
    unlinkLeetcodeAccount,
    verifyCodeChefAccount,
    unlinkCodeChefAccount,
    verifyGfgAccount,
    unlinkGfgAccount,
    getProfile,
    updateProfile,
    saveLcSession,
    getLcSessionStatus,
    removeLcSession,
    getCollegeSuggestions,
    updatePreferences,
} = require('../Controllers/settingsController');

router.get('/colleges', getCollegeSuggestions);

router.use(verifyToken);

router.get('/generate-cf-code', getVerificationCode);
router.get('/generate-gfg-code', getGfgVerificationCode);

router.post('/verify-cf', verifyCodeforcesAccount);
router.delete('/unlink-cf', unlinkCodeforcesAccount);

router.post('/verify-lc', verifyLeetcodeAccount);
router.delete('/unlink-lc', unlinkLeetcodeAccount);

router.post('/verify-cc', verifyCodeChefAccount);
router.delete('/unlink-cc', unlinkCodeChefAccount);

router.post('/verify-gfg', verifyGfgAccount);
router.delete('/unlink-gfg', unlinkGfgAccount);

router.get('/profile', getProfile);
router.patch('/profile', updateProfile);

router.get('/lc-session/status', getLcSessionStatus);
router.put('/lc-session', saveLcSession);
router.delete('/lc-session', removeLcSession);

router.patch('/preferences', updatePreferences);

module.exports = router;