// Routes/contestRoutes.js
// Read-only route — serves contests directly from MongoDB.
// The contestSyncWorker populates and refreshes the DB every 6 hours.
const express = require('express');
const Contest = require('../Model/Contest');
const Platform = require('../Model/Platform');
const Submission = require('../Model/Submissions');
const LeetCodeData = require('../Model/LeetCodeData');
const { optionalAuth } = require('../Middlewares/auth');

const router  = express.Router();

const WINDOW_BACK_MS    = 180 * 24 * 3600 * 1000; // 180 days back (6 months)
const WINDOW_FORWARD_MS = 30 * 24 * 3600 * 1000; // 30 days forward

router.get('/', optionalAuth, async (req, res) => {
    try {
        const now  = new Date();
        const from = new Date(now.getTime() - WINDOW_BACK_MS);
        const to   = new Date(now.getTime() + WINDOW_FORWARD_MS);

        let contests = await Contest
            .find({ startTime: { $gte: from, $lte: to } })
            .sort({ startTime: 1 })
            .select('-__v -createdAt -updatedAt')
            .lean();

        // ── Personalized Analytics (In-Memory Aggregate) ────────────────────
        if (req.user) {
            const userId = req.user._id;

            // 1. O(1) query for Platform ratedHistory
            const platforms = await Platform.find({ userId }).select('platform ratedHistory').lean();
            const lcData = await LeetCodeData.findOne({ userId }).select('contestHistory').lean();
            
            // Map: platform -> contestName -> { rank, solvedCount }
            const attemptMap = { codeforces: {}, leetcode: {} };

            // Codeforces
            platforms.forEach(p => {
                const platKey = p.platform;
                if (!attemptMap[platKey]) attemptMap[platKey] = {};
                if (p.ratedHistory) {
                    p.ratedHistory.forEach(h => {
                        if (h.contestName) {
                            attemptMap[platKey][h.contestName.trim().toLowerCase()] = { rank: h.rank || null };
                        }
                    });
                }
            });

            // LeetCode
            if (lcData && lcData.contestHistory) {
                lcData.contestHistory.forEach(h => {
                    if (h.contestTitle) {
                        attemptMap.leetcode[h.contestTitle.trim().toLowerCase()] = {
                            rank: h.ranking || null,
                            solvedCount: h.problemsSolved || 0
                        };
                    }
                });
            }

            // 2. Fetch all AC submissions in window for Codeforces (LC gives solved natively)
            const submissions = await Submission.find({
                userId,
                platform: 'codeforces',
                verdict: 'AC',
                submittedAt: { $gte: from, $lte: to }
            }).select('platform submittedAt').lean();

            const subsByPlatform = { codeforces: [] };
            submissions.forEach(sub => {
                if (subsByPlatform[sub.platform]) {
                    subsByPlatform[sub.platform].push(sub.submittedAt.getTime());
                }
            });

            // 3. Map memory records to global contests strictly
            contests = contests.map(c => {
                const platMaps = attemptMap[c.platform] || {};
                const nameKey = (c.name || '').trim().toLowerCase();
                const attemptInfo = platMaps[nameKey] || {};

                const rank = attemptInfo.rank;
                let solvedCount = attemptInfo.solvedCount || 0; // Pre-filled for LC

                // Fallback to Codeforces manual Submission check
                if (c.platform === 'codeforces' && subsByPlatform.codeforces.length > 0) {
                    const cStart = c.startTime.getTime();
                    const cEnd = c.endTime.getTime();
                    solvedCount = subsByPlatform.codeforces.filter(t => t >= cStart && t <= cEnd).length;
                }

                if (rank > 0 || solvedCount > 0) {
                    c.attempted = { rank, solvedCount };
                }
                return c;
            });
        }

        return res.json(contests);
    } catch (err) {
        console.error('[contestRoutes] DB read failed:', err.message);
        return res.status(500).json({ error: 'Failed to load contests', message: err.message });
    }
});

module.exports = router;
