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
    handleCfHardSync,
    handleLcHardSync,
    handleCcHardSync,
} = require('../Controllers/syncController');

router.use(verifyToken);

// Regular (incremental) sync — 15 min cooldown
router.post('/refresh', handleManualRefresh);
router.post('/refresh-lc', handleLcManualRefresh);
router.post('/refresh-cc', handleCcManualRefresh);

// Hard (deep) sync — 30 day cooldown + regular cooldown must be expired
router.post('/refresh-cf-hard', handleCfHardSync);
router.post('/refresh-lc-hard', handleLcHardSync);
router.post('/refresh-cc-hard', handleCcHardSync);

router.get('/lc-health', handleLcHealthCheck);
router.get('/cf-health', handleCfHealthCheck);
router.get('/cc-health', handleCcHealthCheck);

module.exports = router;