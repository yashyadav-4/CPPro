const express = require('express');
const router  = express.Router();
const { verifyToken } = require('../Middlewares/auth');
const { getToday, getStreak, getHistory } = require('../Controllers/dailyController');
const { getDailyTopic } = require('../Controllers/dailyTopicController');

router.use(verifyToken);

router.get('/',        getToday);
router.get('/streak',  getStreak);
router.get('/history', getHistory);
router.get('/topic',   getDailyTopic);

module.exports = router;
