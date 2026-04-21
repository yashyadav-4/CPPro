const express = require('express');
const router = express.Router();
const { verifyAdmin } = require('../Middlewares/adminAuth');
const { getAdminStats } = require('../Controllers/adminController');

// GET /api/admin/stats?days=7|30
router.get('/stats', verifyAdmin, getAdminStats);

module.exports = router;
