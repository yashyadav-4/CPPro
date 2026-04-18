// Routes/contestRoutes.js
// Read-only route — serves contests directly from MongoDB.
// The contestSyncWorker populates and refreshes the DB every 6 hours.
const express = require('express');
const Contest = require('../Model/Contest');
const router  = express.Router();

const WINDOW_BACK_MS    = 180 * 24 * 3600 * 1000; // 180 days back (6 months)
const WINDOW_FORWARD_MS = 30 * 24 * 3600 * 1000; // 30 days forward

router.get('/', async (req, res) => {
    try {
        const now  = new Date();
        const from = new Date(now.getTime() - WINDOW_BACK_MS);
        const to   = new Date(now.getTime() + WINDOW_FORWARD_MS);

        const contests = await Contest
            .find({ startTime: { $gte: from, $lte: to } })
            .sort({ startTime: 1 })
            .select('-__v -createdAt -updatedAt')
            .lean();

        return res.json(contests);
    } catch (err) {
        console.error('[contestRoutes] DB read failed:', err.message);
        return res.status(500).json({ error: 'Failed to load contests', message: err.message });
    }
});

module.exports = router;
