const express = require('express');
const router  = express.Router();

const { optionalAuth }      = require('../Middlewares/auth');
const { checkPublicProfile } = require('../Middlewares/privacyCheck');
const { getGfgAggregateDashboard } = require('../Controllers/gfgDashboardController');

const guard = [optionalAuth, checkPublicProfile];

router.get('/aggregate/:userId', ...guard, getGfgAggregateDashboard);

module.exports = router;
