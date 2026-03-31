const express =require('express');
const router= express.Router();
const {verifyToken} =require('../Middlewares/auth');
const {getVerificationCode,verifyCodeforcesAccount,unlinkCodeforcesAccount} =require('../Controllers/settingsController');

router.use(verifyToken);
router.get('/generate-cf-code',getVerificationCode);
router.post('/verify-cf',verifyCodeforcesAccount);
router.delete('/unlink-cf',unlinkCodeforcesAccount);

module.exports = router;