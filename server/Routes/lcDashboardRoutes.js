const express =require('express');
const router= express.Router();

const {verifyToken} =require('../Middlewares/auth');
const{
    getLcProfile,
    getLcSkillStats,
    getLcCalendar,
    getLcContestHistory,
    getLcRecentSubmissions,
}= require('../Controllers/lcDashboardController');

router.use(verifyToken);

router.get('/profile/:userId',getLcProfile);
router.get('/skills/:userId', getLcSkillStats);
router.get('/calendar/:userId',getLcCalendar);
router.get('/contests/:userId', getLcContestHistory);
router.get('/submissions/:userId',getLcRecentSubmissions);

module.exports= router;
