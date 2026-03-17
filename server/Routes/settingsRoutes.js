const express =require('express');
const router= express.Router();
const {verifyToken} =require('../Middlewares/auth');
const {getVerificationCode,verifyCodeforcesAccount} =require('../Controllers/settingsController');

router.use(verifyToken);
router.get('/generate-cf-code',getVerificationCode);
router.post('/verify-cf',verifyCodeforcesAccount);

module.exports = router;