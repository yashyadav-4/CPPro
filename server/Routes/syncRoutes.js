const express = require('express');
const router = express.Router();
const { verifyToken } = require('../Middlewares/auth');
const {
    handleManualRefresh,
    handleLcManualRefresh,
    handleLcHealthCheck,
    handleCfHealthCheck,
    handleCcManualRefresh,
    handleCcHealthCheck,
} = require('../Controllers/syncController');

router.use(verifyToken);

router.post('/refresh', handleManualRefresh);
router.post('/refresh-lc', handleLcManualRefresh);
router.post('/refresh-cc', handleCcManualRefresh);

router.get('/lc-health', handleLcHealthCheck);
router.get('/cf-health', handleCfHealthCheck);
router.get('/cc-health', handleCcHealthCheck);

module.exports = router;