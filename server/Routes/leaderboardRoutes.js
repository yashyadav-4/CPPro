const express= require('express');
const router= express.Router();

const {getGlobalLeaderboard}= require('../Controllers/leaderboardController');

router.get('/' , getGlobalLeaderboard);
module.exports= router;