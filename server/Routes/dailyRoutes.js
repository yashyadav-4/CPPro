const express = require('express');
const router  = express.Router();
const { verifyToken } = require('../Middlewares/auth');
const { getToday, getStreak, getHistory } = require('../Controllers/dailyController');

router.use(verifyToken);

router.get('/',        getToday);
router.get('/streak',  getStreak);
router.get('/history', getHistory);

module.exports = router;
