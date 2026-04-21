const express = require('express');
const router = express.Router();
const { verifyAdmin } = require('../Middlewares/adminAuth');
const { getAdminStats, refreshContests, refreshStats } = require('../Controllers/adminController');

// GET /api/admin/stats?days=7|30
router.get('/stats', verifyAdmin, getAdminStats);

// POST /api/admin/refresh/contests — force re-sync contest data from APIs
router.post('/refresh/contests', verifyAdmin, refreshContests);

// POST /api/admin/refresh/stats — clear home-page stats cache
router.post('/refresh/stats', verifyAdmin, refreshStats);

module.exports = router;
