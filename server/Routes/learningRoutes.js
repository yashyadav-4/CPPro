const express = require('express');
const { verifyToken } = require('../Middlewares/auth');
const {
  getProgress,
  updateProgress,
  getHistory,
  bulkUpdateProgress
} = require('../Controllers/learningController');

const router = express.Router();

router.use(verifyToken);

router.get('/', getProgress);
router.patch('/', updateProgress);
router.get('/history', getHistory);
router.post('/bulk', bulkUpdateProgress);

module.exports = router;
