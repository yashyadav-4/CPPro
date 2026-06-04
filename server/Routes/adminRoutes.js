const express = require('express');
const router = express.Router();
const { verifyAdmin } = require('../Middlewares/adminAuth');
const { getAdminStats, refreshContests, refreshLeaderboard, refreshStats, sendNotification, refreshDailyProblems, refreshMyDailyProblems, refreshDailyTopics, refreshMyDailyTopic, getErrorLogs, clearErrorLogs, getActiveUsers, syncCFProblems, syncLCProblems, syncCCProblems, getCatalogSyncStatus } = require('../Controllers/adminController');

// GET /api/admin/stats?days=7|30
router.get('/stats', verifyAdmin, getAdminStats);

// POST /api/admin/refresh/contests — force re-sync contest data from APIs
router.post('/refresh/contests', verifyAdmin, refreshContests);

// POST /api/admin/refresh/leaderboard — force recompute global leaderboard cache
router.post('/refresh/leaderboard', verifyAdmin, refreshLeaderboard);

// POST /api/admin/refresh/stats — clear home-page stats cache
router.post('/refresh/stats', verifyAdmin, refreshStats);

// POST /api/admin/refresh/daily — delete today's daily problems for all users (forces regeneration)
router.post('/refresh/daily', verifyAdmin, refreshDailyProblems);

// POST /api/admin/refresh/daily-me — delete today's daily problem only for the logged-in admin (safe for testing)
router.post('/refresh/daily-me', verifyAdmin, refreshMyDailyProblems);

// POST /api/admin/refresh/topics — delete today's daily topics for all users
router.post('/refresh/topics', verifyAdmin, refreshDailyTopics);

// POST /api/admin/refresh/daily-topic-me — delete today's daily topic only for the logged-in admin (safe for testing)
router.post('/refresh/daily-topic-me', verifyAdmin, refreshMyDailyTopic);

// POST /api/admin/notify — send in-platform notification to all users or a specific user
router.post('/notify', verifyAdmin, sendNotification);

// Error logs — admin terminal
router.get('/errors', verifyAdmin, getErrorLogs);
router.delete('/errors', verifyAdmin, clearErrorLogs);

// Active users
router.get('/active-users', verifyAdmin, getActiveUsers);

// Problem catalog sync — background + polling pattern (returns immediately, poll /sync/catalog-status)
router.post('/sync/cf-problems',  verifyAdmin, syncCFProblems);
router.post('/sync/lc-problems',  verifyAdmin, syncLCProblems);
router.post('/sync/cc-problems',  verifyAdmin, syncCCProblems);
router.get('/sync/catalog-status', verifyAdmin, getCatalogSyncStatus);

module.exports = router;
