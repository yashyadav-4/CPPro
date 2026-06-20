const express = require('express');
const router = express.Router();
const { verifyToken } = require('../Middlewares/auth');
const { getUpsolveQueue, getPerformanceStats, getRecommendations } = require('../Controllers/levelUpController');

router.get('/upsolve', verifyToken, getUpsolveQueue);
router.get('/performance-stats', verifyToken, getPerformanceStats);
router.get('/recommendations', verifyToken, getRecommendations);

module.exports = router;
