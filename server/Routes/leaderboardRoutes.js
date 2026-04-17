const express = require('express');
const router = express.Router();

const { optionalAuth, verifyToken } = require('../Middlewares/auth');
const { getGlobalLeaderboard, getMyRank } = require('../Controllers/leaderboardController');

router.get('/', optionalAuth, getGlobalLeaderboard);
router.get('/my-rank', verifyToken, getMyRank);

module.exports = router;