const express =require('express');
const router= express.Router();
const {verifyToken} =require('../Middlewares/auth');
const {
    getVerificationCode,
    verifyCodeforcesAccount,
    unlinkCodeforcesAccount,
    verifyLeetcodeAccount,
    unlinkLeetcodeAccount,
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

module.exports = router;