const express = require('express');
const router = express.Router();
const User = require('../Model/User');
const Platform = require('../Model/Platform');

let statsCache = {
    data: null,
    expiresAt: 0
};

const CACHE_DURATION = 3600000;

router.get('/public/summary', async (req, res) => {
    try {
        const now = Date.now();

        if (statsCache.data && now < statsCache.expiresAt) {
            return res.json({
                success: true,
                source: 'cache',
                data: statsCache.data
            });
        }

        const [totalUsers, solvedAgg, syncTodayCounts] = await Promise.all([
            User.countDocuments(),
            Platform.aggregate([
                { $group: { _id: null, total: { $sum: "$totalSolved" } } }
            ]),
            Platform.countDocuments({
                lastSyncedAt: { 
                    $gte: new Date(new Date().setHours(0,0,0,0)) 
                }
            })
        ]);

        const totalSolved = solvedAgg.length > 0 ? solvedAgg[0].total : 0;
        

        const topUsers = await User.find({ profilePic: { $ne: "" } })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('profilePic');

        const calculatedData = {
            activeUsers: totalUsers,
            problemsTracked: totalSolved,
            syncedToday: syncTodayCounts,
            uptime: "99.9%",
            topAvatars: topUsers.map(u => u.profilePic)
        };

        statsCache = {
            data: calculatedData,
            expiresAt: now + CACHE_DURATION
        };

        res.json({
            success: true,
            source: 'db',
            data: calculatedData
        });
    } catch (err) {
        console.error('Stats Error:', err);
        res.status(500).json({ success: false, message: "Error fetching platform stats" });
    }
});

module.exports = router;
