const express =require('express');
const router= express.Router();

const { optionalAuth } =require('../Middlewares/auth');
const { checkPublicProfile } = require('../Middlewares/privacyCheck');
const{
    getLcProfile,
    getLcSkillStats,
    getLcCalendar,
    getLcContestHistory,
    getLcRecentSubmissions,
    getLcAggregateDashboard,
}= require('../Controllers/lcDashboardController');

const guard = [optionalAuth, checkPublicProfile];

router.get('/aggregate/:userId', ...guard, getLcAggregateDashboard);
router.get('/profile/:userId', ...guard, getLcProfile);
router.get('/skills/:userId', ...guard, getLcSkillStats);
router.get('/calendar/:userId', ...guard, getLcCalendar);
router.get('/contests/:userId', ...guard, getLcContestHistory);
router.get('/submissions/:userId', ...guard, getLcRecentSubmissions);

module.exports= router;
