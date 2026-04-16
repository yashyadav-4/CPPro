const express = require('express');
const router = express.Router();
const { verifyToken } = require('../Middlewares/auth');
const {
    handleManualRefresh,
    handleLcManualRefresh,
    handleLcHealthCheck,
} = require('../Controllers/syncController');

router.use(verifyToken);

router.post('/refresh', handleManualRefresh);
router.post('/refresh-lc', handleLcManualRefresh);

// GET /api/sync/lc-health
// Pings the NexusLC server's /health endpoint and returns the result.
// Use this after deployment to verify NexusLC is reachable from CPPro.
router.get('/lc-health', handleLcHealthCheck);

module.exports = router;