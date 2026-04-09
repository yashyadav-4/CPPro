const express = require('express');
const router = express.Router();

const { optionalAuth } = require('../Middlewares/auth');
const { getGlobalLeaderboard } = require('../Controllers/leaderboardController');

router.get('/', optionalAuth, getGlobalLeaderboard);

module.exports = router;