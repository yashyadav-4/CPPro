const User = require('../Model/User');
const { clearStatsCache } = require('../Routes/publicStats');
const { forceSyncContests } = require('../Workers/contestSyncWorker');
const Platform = require('../Model/Platform');
const Submission = require('../Model/Submissions');
const Post = require('../Model/Post');
const Comment = require('../Model/Comment');
const LeetCodeData = require('../Model/LeetCodeData');

/**
 * GET /api/admin/stats?days=7|30
 * Returns comprehensive platform analytics for the admin dashboard.
 */
async function getAdminStats(req, res) {
    try {
        const days = Math.min(Math.max(parseInt(req.query.days) || 7, 1), 90);
        const now = new Date();

        // ── Date boundaries ──────────────────────────────────────────────────
        const startOfRange = new Date(now);
        startOfRange.setDate(startOfRange.getDate() - (days - 1));
        startOfRange.setHours(0, 0, 0, 0);

        const startOf30 = new Date(now);
        startOf30.setDate(startOf30.getDate() - 29);
        startOf30.setHours(0, 0, 0, 0);

        const startOf7 = new Date(now);
        startOf7.setDate(startOf7.getDate() - 6);
        startOf7.setHours(0, 0, 0, 0);

        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);

        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);

        const startOfThisWeek = new Date(startOf7);
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Retention: users who logged in within last 30 days (active users)
        const retentionWindow = new Date(startOf30);

        // ── All aggregations in parallel ─────────────────────────────────────
        const [
            totalUsers,
            verifiedUsers,
            cfLinkedUsers,
            lcLinkedUsers,
            bothLinkedResult,
            newUsersToday,
            newUsersYesterday,
            newUsersThisWeek,
            newUsersThisMonth,
            totalSubmissions,
            acSubmissions,
            uniqueActiveSubmitters7d,
            syncedTodayCf,
            syncedTodayLc,
            retainedUsers,
            totalPosts,
            totalComments,
            postsThisWeek,
            newUsersOverTime,
            syncedOverTime,
            submissionsOverTime,
            topCountries,
            topColleges,
            cfRatingBuckets,
            lcSolvedBuckets,
            recentUsers,
            languageDist,
        ] = await Promise.all([

            // ── User counts ─────────────────────────────────────────────────
            User.countDocuments(),
            User.countDocuments({ isVerified: true }),
            User.countDocuments({ 'linkedAccounts.codeforces': { $nin: [null, ''] } }),
            User.countDocuments({ 'linkedAccounts.leetcode': { $nin: [null, ''] } }),

            // ── Both platforms linked ────────────────────────────────────────
            Platform.aggregate([
                { $group: { _id: '$userId', platforms: { $addToSet: '$platform' } } },
                { $match: { platforms: { $all: ['codeforces', 'leetcode'] } } },
                { $count: 'count' }
            ]),

            User.countDocuments({ createdAt: { $gte: startOfToday } }),
            User.countDocuments({ createdAt: { $gte: startOfYesterday, $lt: startOfToday } }),
            User.countDocuments({ createdAt: { $gte: startOfThisWeek } }),
            User.countDocuments({ createdAt: { $gte: startOfThisMonth } }),

            // ── Submissions ─────────────────────────────────────────────────
            Submission.countDocuments(),
            Submission.countDocuments({ verdict: 'AC' }),

            // ── Unique submitters in last 7 days ─────────────────────────────
            Submission.distinct('userId', { submittedAt: { $gte: startOf7 } })
                .then(ids => ids.length),

            // ── Synced today ─────────────────────────────────────────────────
            Platform.countDocuments({ platform: 'codeforces', lastSyncedAt: { $gte: startOfToday } }),
            LeetCodeData.countDocuments({ lastSyncedAt: { $gte: startOfToday } }),

            // ── Retention: users logged in within last 30 days ───────────────
            User.countDocuments({ lastLogin: { $gte: retentionWindow } }),

            // ── Community ───────────────────────────────────────────────────
            Post.countDocuments(),
            Comment.countDocuments(),
            Post.countDocuments({ createdAt: { $gte: startOfThisWeek } }),

            // ── New users per day (for graph) ────────────────────────────────
            User.aggregate([
                { $match: { createdAt: { $gte: startOfRange } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),

            // ── Synced per day (CF only — LC doesn't write to Platform) ──────
            Platform.aggregate([
                { $match: { lastSyncedAt: { $gte: startOfRange } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$lastSyncedAt' } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),

            // ── AC submissions per day ────────────────────────────────────────
            Submission.aggregate([
                { $match: { submittedAt: { $gte: startOfRange }, verdict: 'AC' } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$submittedAt' } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),

            // ── Top countries ────────────────────────────────────────────────
            User.aggregate([
                { $match: { 'location.country': { $nin: [null, ''] } } },
                { $group: { _id: '$location.country', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 8 }
            ]),

            // ── Top colleges ─────────────────────────────────────────────────
            User.aggregate([
                { $match: { college: { $nin: [null, ''] } } },
                { $group: { _id: '$college', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 8 }
            ]),

            // ── CF rating distribution ────────────────────────────────────────
            Platform.aggregate([
                { $match: { platform: 'codeforces', currentRating: { $gt: 0 } } },
                {
                    $bucket: {
                        groupBy: '$currentRating',
                        boundaries: [0, 800, 1200, 1400, 1600, 1900, 2100, 2400, 3500],
                        default: 'Other',
                        output: { count: { $sum: 1 } }
                    }
                }
            ]),

            // ── LC solved distribution ────────────────────────────────────────
            LeetCodeData.aggregate([
                {
                    $bucket: {
                        groupBy: '$profile.totalSolved',
                        boundaries: [0, 50, 150, 300, 500, 800, 1200, 2000],
                        default: '2000+',
                        output: { count: { $sum: 1 } }
                    }
                }
            ]),

            // ── Recent 10 signups ─────────────────────────────────────────────
            User.find()
                .sort({ createdAt: -1 })
                .limit(10)
                .select('name username email role isVerified createdAt linkedAccounts lastLogin'),

            // ── Language distribution ─────────────────────────────────────────
            Submission.aggregate([
                { $match: { language: { $nin: [null, ''] } } },
                { $group: { _id: '$language', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]),
        ]);

        // ── Build complete date range array (fill missing days with 0) ────────
        const buildTimeSeries = (rawData, rangeStart, numDays) => {
            const map = {};
            rawData.forEach(d => { map[d._id] = d.count; });
            const series = [];
            for (let i = 0; i < numDays; i++) {
                const d = new Date(rangeStart);
                d.setDate(d.getDate() + i);
                const label = d.toISOString().split('T')[0];
                series.push({ date: label, count: map[label] || 0 });
            }
            return series;
        };

        const cfRatingLabels = {
            0: 'Newbie', 800: 'Pupil', 1200: 'Specialist', 1400: 'Expert',
            1600: 'Cand. Master', 1900: 'Master', 2100: 'Int. Master', 2400: 'Grandmaster'
        };
        const cfRatingFormatted = cfRatingBuckets.map(b => ({
            label: cfRatingLabels[b._id] || String(b._id),
            count: b.count
        }));

        const lcLabels = {
            0: '0–49', 50: '50–149', 150: '150–299', 300: '300–499',
            500: '500–799', 800: '800–1199', 1200: '1200–1999', '2000+': '2000+'
        };
        const lcSolvedFormatted = lcSolvedBuckets.map(b => ({
            label: lcLabels[b._id] || `${b._id}+`,
            count: b.count
        }));

        const overallAccRate = totalSubmissions > 0
            ? ((acSubmissions / totalSubmissions) * 100).toFixed(1)
            : '0.0';

        const bothLinked = bothLinkedResult[0]?.count || 0;
        const retentionRate = totalUsers > 0
            ? ((retainedUsers / totalUsers) * 100).toFixed(1)
            : '0.0';

        res.json({
            success: true,
            days,
            overview: {
                totalUsers,
                verifiedUsers,
                unverifiedUsers: totalUsers - verifiedUsers,
                cfLinkedUsers,
                lcLinkedUsers,
                bothLinked,
                syncedToday: syncedTodayCf + syncedTodayLc,
                syncedTodayCf,
                syncedTodayLc,
                totalSubmissions,
                acSubmissions,
                overallAccRate: `${overallAccRate}%`,
                activeUsersLast7Days: uniqueActiveSubmitters7d,
                retainedUsers,
                retentionRate: `${retentionRate}%`,
                totalPosts,
                totalComments,
                postsThisWeek,
            },
            growth: {
                newUsersToday,
                newUsersYesterday,
                newUsersThisWeek,
                newUsersThisMonth,
            },
            timeSeries: {
                newUsers: buildTimeSeries(newUsersOverTime, startOfRange, days),
                synced: buildTimeSeries(syncedOverTime, startOfRange, days),
                acSubmissions: buildTimeSeries(submissionsOverTime, startOfRange, days),
            },
            distributions: {
                cfRating: cfRatingFormatted,
                lcSolved: lcSolvedFormatted,
                languages: languageDist.map(l => ({ label: l._id || 'Unknown', count: l.count })),
                topCountries: topCountries.map(c => ({ label: c._id, count: c.count })),
                topColleges: topColleges.map(c => ({ label: c._id, count: c.count })),
            },
            recentUsers: recentUsers.map(u => ({
                _id: u._id,
                name: u.name,
                username: u.username,
                email: u.email,
                role: u.role,
                isVerified: u.isVerified,
                joinedAt: u.createdAt,
                lastLogin: u.lastLogin || null,
                cfLinked: !!(u.linkedAccounts?.codeforces),
                lcLinked: !!(u.linkedAccounts?.leetcode),
            })),
            serverMeta: {
                uptime: `${Math.floor(process.uptime() / 60)} min`,
                dbStatus: 'connected',
                generatedAt: new Date(),
            }
        });

    } catch (err) {
        console.error('Admin stats error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch admin stats' });
    }
}

async function refreshContests(req, res) {
    try {
        const count = await forceSyncContests();
        res.json({ success: true, message: `Contest sync complete — ${count} contests updated.` });
    } catch (err) {
        console.error('Admin refreshContests error:', err);
        res.status(500).json({ success: false, message: 'Contest sync failed: ' + err.message });
    }
}

async function refreshStats(req, res) {
    try {
        clearStatsCache();
        res.json({ success: true, message: 'Home stats cache cleared — next visit will re-fetch from DB.' });
    } catch (err) {
        console.error('Admin refreshStats error:', err);
        res.status(500).json({ success: false, message: 'Failed to clear stats cache.' });
    }
}

module.exports = { getAdminStats, refreshContests, refreshStats };
