const express= require('express');
const router= express.Router();

const {verifyToken}= require('../Middlewares/auth');
const {getProfileSummary , getHeatmap , getRatingAnalysis , getTopicBreakdown , getDifficultyBreakdown, getAggregateDashboard, getNextTarget}= require('../Controllers/cfDashboardController');

router.use(verifyToken);

router.get('/aggregate/:userId', getAggregateDashboard);
router.get('/target/:userId', getNextTarget);
router.get('/profile/:userId', getProfileSummary);
router.get('/heatmap/:userId' , getHeatmap);
router.get('/rating/:userId', getRatingAnalysis);
router.get('/topics/:userId' , getTopicBreakdown);
router.get('/difficulty/:userId',getDifficultyBreakdown);


module.exports=router;
