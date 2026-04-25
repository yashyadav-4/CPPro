const express = require('express');
const router = express.Router();

const { verifyToken } = require('../Middlewares/auth');
const {
    getCcAggregateDashboard,
    getCcProfile,
    getCcRatingHistory,
} = require('../Controllers/ccDashboardController');

router.use(verifyToken);

router.get('/aggregate/:userId', getCcAggregateDashboard);
router.get('/profile/:userId', getCcProfile);
router.get('/rating/:userId', getCcRatingHistory);

module.exports = router;
