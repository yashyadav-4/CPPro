const express= require('express');
const router= express.Router();

const {verifyToken}= require('../Middlewares/auth');
const {getProfileSummary , getHeatmap , getRatingAnalysis , getTopicBreakdown , getDifficultyBreakdown}= require('../Controllers/dashboardController');

router.use(verifyToken);

router.get('/profile/:userId' , getProfileSummary);
router.get('/heatmap/:userId' , getHeatmap);
router.get('/rating/:userId' , getRatingAnalysis);
router.get('/topics/:userId' , getTopicBreakdown);
router.get('/difficulty/:userId' , getDifficultyBreakdown);


module.exports=router;