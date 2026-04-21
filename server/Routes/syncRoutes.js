const express = require('express');
const router = express.Router();
const { verifyToken } = require('../Middlewares/auth');
const {
    handleManualRefresh,
    handleLcManualRefresh,
    handleLcHealthCheck,
    handleCfHealthCheck,
} = require('../Controllers/syncController');

router.use(verifyToken);

router.post('/refresh', handleManualRefresh);
router.post('/refresh-lc', handleLcManualRefresh);

router.get('/lc-health', handleLcHealthCheck);
router.get('/cf-health', handleCfHealthCheck);

module.exports = router;