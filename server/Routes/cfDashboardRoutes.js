const express= require('express');
const router= express.Router();

const { optionalAuth }= require('../Middlewares/auth');
const { checkPublicProfile } = require('../Middlewares/privacyCheck');
const {getProfileSummary , getHeatmap , getRatingAnalysis , getTopicBreakdown , getDifficultyBreakdown, getAggregateDashboard, getNextTarget}= require('../Controllers/cfDashboardController');

const guard = [optionalAuth, checkPublicProfile];

router.get('/aggregate/:userId', ...guard, getAggregateDashboard);
router.get('/target/:userId', ...guard, getNextTarget);
router.get('/profile/:userId', ...guard, getProfileSummary);
router.get('/heatmap/:userId', ...guard, getHeatmap);
router.get('/rating/:userId', ...guard, getRatingAnalysis);
router.get('/topics/:userId', ...guard, getTopicBreakdown);
router.get('/difficulty/:userId', ...guard, getDifficultyBreakdown);


module.exports=router;
