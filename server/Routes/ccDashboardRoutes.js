const express = require('express');
const router = express.Router();

const { optionalAuth } = require('../Middlewares/auth');
const { checkPublicProfile } = require('../Middlewares/privacyCheck');
const {
    getCcAggregateDashboard,
    getCcProfile,
    getCcRatingHistory,
} = require('../Controllers/ccDashboardController');

const guard = [optionalAuth, checkPublicProfile];

router.get('/aggregate/:userId', ...guard, getCcAggregateDashboard);
router.get('/profile/:userId', ...guard, getCcProfile);
router.get('/rating/:userId', ...guard, getCcRatingHistory);

module.exports = router;
