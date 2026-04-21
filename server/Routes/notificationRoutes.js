const express = require('express');
const router = express.Router();
const { verifyToken } = require('../Middlewares/auth');
const { getNotifications, markRead, markAllRead, clearRead } = require('../Controllers/notificationController');

router.use(verifyToken);

router.get('/', getNotifications);
router.patch('/read-all', markAllRead);          // must be before /:id/read
router.patch('/:id/read', markRead);
router.delete('/clear-read', clearRead);

module.exports = router;
