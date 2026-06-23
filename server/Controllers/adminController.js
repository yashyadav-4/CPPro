const User = require('../Model/User');
const DailyStat = require('../Model/DailyStat');
const { clearStatsCache } = require('../Routes/publicStats');
const { forceSyncContests } = require('../Workers/contestSyncWorker');
const { forceRefreshLeaderboard } = require('../Workers/leaderboardSyncWorker');
const Platform = require('../Model/Platform');
const Submission = require('../Model/Submissions');
const Post = require('../Model/Post');
const Comment = require('../Model/Comment');
const LeetCodeData = require('../Model/LeetCodeData');
const Notification = require('../Model/Notification');
const DailyProblem = require('../Model/DailyProblem');
const DailyTopic = require('../Model/DailyTopic');
const CFProblem = require('../Model/CFProblem');
const LCProblem = require('../Model/LCProblem');
const CCProblem = require('../Model/CCProblem');
const GlobalSyncState = require('../Model/GlobalSyncState');
const { getTodayIST } = require('../Utils/dateUtils');
const ErrorLog = require('../Model/ErrorLog');
const DailyActiveUser = require('../Model/DailyActiveUser');
const axios = require('axios');

// ── In-memory catalog sync state ─────────────────────────────────────────────
// Tracks the status of each platform's problem catalog sync.
// Resets on server restart — admin just re-triggers if needed.
const catalogSyncState = {
    cf:      { status: 'idle', startedAt: null, finishedAt: null, total: 0, inserted: 0, updated: 0, error: null },
    lc:      { status: 'idle', startedAt: null, finishedAt: null, total: 0, inserted: 0, updated: 0, error: null },
    cc:      { status: 'idle', startedAt: null, finishedAt: null, total: 0, inserted: 0, cloudflareHits: 0, error: null },
    lc_tags: { status: 'idle', startedAt: null, finishedAt: null, contests: 0, tagged: 0, skipped: 0, error: null },
};

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
            dauOverTime,
            topCountries,
            topColleges,
            cfRatingBuckets,
            lcSolvedBuckets,
            recentUsers,
            ccLinkedUsers,
            ccRatingBuckets,
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

            // ── Daily Stats (New Users, Syncs, DAU) ─────────────────────────
            DailyStat.find({ date: { $gte: startOfRange.toISOString().slice(0, 10) } }).sort({ date: 1 }).lean(),

            // Dummy for syncedOverTime slot
            Promise.resolve(null),

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

            // Dummy for dauOverTime slot
            Promise.resolve(null),

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

            // ── CC linked count ───────────────────────────────────────────────
            User.countDocuments({ 'linkedAccounts.codechef': { $nin: [null, ''] } }),

            // ── CC rating distribution ────────────────────────────────────────
            Platform.aggregate([
                { $match: { platform: 'codechef', currentRating: { $gt: 0 } } },
                {
                    $bucket: {
                        groupBy: '$currentRating',
                        boundaries: [0, 1000, 1200, 1400, 1600, 1800, 2000, 2200, 2500],
                        default: 'Other',
                        output: { count: { $sum: 1 } }
                    }
                }
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
                cfLinkedUsers,
                lcLinkedUsers,
                ccLinkedUsers,
                bothLinked,
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
                newUsers:          buildTimeSeries(newUsersOverTime.map(s => ({ _id: s.date, count: s.newSignups })), startOfRange, days),
                synced:            buildTimeSeries(newUsersOverTime.map(s => ({ _id: s.date, count: s.syncs })), startOfRange, days),
                acSubmissions:     buildTimeSeries(submissionsOverTime, startOfRange, days),
                dailyActiveUsers:  buildTimeSeries(newUsersOverTime.map(s => ({ _id: s.date, count: s.activeUsers })), startOfRange, days),
            },
            distributions: {
                cfRating: cfRatingFormatted,
                lcSolved: lcSolvedFormatted,
                ccRating: ccRatingBuckets.map(b => {
                    const ccLabels = { 0: '0–999', 1000: '1★', 1200: '2★', 1400: '3★', 1600: '4★', 1800: '5★', 2000: '6★', 2200: '7★' };
                    return { label: ccLabels[b._id] || String(b._id), count: b.count };
                }),
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
                ccLinked: !!(u.linkedAccounts?.codechef),
            })),
            serverMeta: {
                uptime: `${Math.floor(process.uptime() / 60)} min`,
                dbStatus: 'connected',
                generatedAt: new Date(),
            }
        });

    } catch (err) {
        console.error('Admin stats error:', err);
        ErrorLog.create({ source: 'Admin:getAdminStats', level: 'error', message: err.message || String(err) }).catch(() => {});
        res.status(500).json({ success: false, message: 'Failed to fetch admin stats' });
    }
}

async function refreshContests(req, res) {
    try {
        const count = await forceSyncContests();
        res.json({ success: true, message: `Contest sync complete — ${count} contests updated.` });
    } catch (err) {
        console.error('Admin refreshContests error:', err);
        ErrorLog.create({ source: 'Admin:refreshContests', level: 'error', message: err.message || String(err) }).catch(() => {});
        res.status(500).json({ success: false, message: 'Contest sync failed: ' + err.message });
    }
}

async function refreshLeaderboard(req, res) {
    try {
        await forceRefreshLeaderboard();
        res.json({ success: true, message: 'Leaderboard cache recomputed — all 4 global categories updated.' });
    } catch (err) {
        console.error('Admin refreshLeaderboard error:', err);
        ErrorLog.create({ source: 'Admin:refreshLeaderboard', level: 'error', message: err.message || String(err) }).catch(() => {});
        res.status(500).json({ success: false, message: 'Leaderboard recompute failed: ' + err.message });
    }
}

async function refreshStats(req, res) {
    try {
        clearStatsCache();
        res.json({ success: true, message: 'Home stats cache cleared — next visit will re-fetch from DB.' });
    } catch (err) {
        console.error('Admin refreshStats error:', err);
        ErrorLog.create({ source: 'Admin:refreshStats', level: 'error', message: err.message || String(err) }).catch(() => {});
        res.status(500).json({ success: false, message: 'Failed to clear stats cache.' });
    }
}

/**
 * POST /api/admin/notify
 * Send an in-platform notification to all users or a specific user.
 * Body: { title, message, type?, actionUrl?, targetType: 'all'|'user', targetUserId? }
 * targetType='user' requires targetUserId (MongoDB _id) or targetUsername/targetEmail.
 */
async function sendNotification(req, res) {
    try {
        const {
            title,
            message,
            type = 'general',
            actionUrl = null,
            targetType,
            targetUserId,
            targetUsername,
            targetEmail,
        } = req.body;

        if (!title?.trim() || !message?.trim()) {
            return res.status(400).json({ success: false, message: 'Title and message are required.' });
        }

        const VALID_TYPES = ['lc_session_expired', 'lc_session_saved', 'sync_failed', 'rating_milestone', 'streak_milestone', 'daily_problem', 'general'];
        if (!VALID_TYPES.includes(type)) {
            return res.status(400).json({ success: false, message: 'Invalid notification type.' });
        }

        if (targetType === 'all') {
            const users = await User.find({}, '_id').lean();
            if (!users.length) {
                return res.json({ success: true, message: 'No users found.', sent: 0 });
            }
            const docs = users.map(u => ({
                userId: u._id,
                type,
                title: title.trim(),
                message: message.trim(),
                actionUrl: actionUrl?.trim() || null,
            }));
            await Notification.insertMany(docs, { ordered: false });
            return res.json({ success: true, message: `Notification sent to ${users.length} users.`, sent: users.length });
        }

        if (targetType === 'user') {
            let user = null;
            if (targetUserId) {
                user = await User.findById(targetUserId).select('_id name username').lean();
            } else if (targetUsername) {
                user = await User.findOne({ username: targetUsername.trim() }).select('_id name username').lean();
            } else if (targetEmail) {
                user = await User.findOne({ email: targetEmail.trim().toLowerCase() }).select('_id name username').lean();
            }
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found.' });
            }
            await Notification.create({
                userId: user._id,
                type,
                title: title.trim(),
                message: message.trim(),
                actionUrl: actionUrl?.trim() || null,
            });
            return res.json({ success: true, message: `Notification sent to @${user.username}.`, sent: 1 });
        }

        return res.status(400).json({ success: false, message: 'targetType must be "all" or "user".' });

    } catch (err) {
        console.error('Admin sendNotification error:', err);
        ErrorLog.create({ source: 'Admin:sendNotification', level: 'error', message: err.message || String(err) }).catch(() => {});
        res.status(500).json({ success: false, message: 'Failed to send notification.' });
    }
}

/**
 * POST /api/admin/refresh/daily
 * Deletes all DailyProblem docs for today (IST). Each user gets fresh problems
 * generated lazily on their next GET /api/daily request.
 */
async function refreshDailyProblems(req, res) {
    try {
        const today = getTodayIST();
        const result = await DailyProblem.deleteMany({ date: today });
        res.json({
            success: true,
            message: `Deleted ${result.deletedCount} daily problem record${result.deletedCount !== 1 ? 's' : ''} for ${today}. Users will get fresh problems on next visit.`,
        });
    } catch (err) {
        console.error('Admin refreshDailyProblems error:', err);
        ErrorLog.create({ source: 'Admin:refreshDailyProblems', level: 'error', message: err.message || String(err) }).catch(() => {});
        res.status(500).json({ success: false, message: 'Failed to reset daily problems: ' + err.message });
    }
}

/**
 * POST /api/admin/refresh/daily-me
 * Deletes today's DailyProblem doc ONLY for the currently logged-in admin.
 * Leaves all other users' problems untouched — use this for isolated feature testing.
 */
async function refreshMyDailyProblems(req, res) {
    try {
        const today  = getTodayIST();
        const userId = req.user._id;
        const result = await DailyProblem.deleteOne({ userId, date: today });
        res.json({
            success: true,
            message: result.deletedCount
                ? `Your daily problems for ${today} have been reset. Refresh /daily to get new ones.`
                : `No daily problems found for you on ${today} — nothing to reset.`,
        });
    } catch (err) {
        console.error('Admin refreshMyDailyProblems error:', err);
        ErrorLog.create({ source: 'Admin:refreshMyDailyProblems', level: 'error', message: err.message || String(err) }).catch(() => {});
        res.status(500).json({ success: false, message: 'Failed to reset your daily problems: ' + err.message });
    }
}

async function getErrorLogs(req, res) {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 50, 200);
        const logs = await ErrorLog.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
        return res.json({ success: true, data: logs });
    } catch (err) {
        console.error('Admin getErrorLogs error:', err);
        ErrorLog.create({ source: 'Admin:getErrorLogs', level: 'error', message: err.message || String(err) }).catch(() => {});
        return res.status(500).json({ success: false, message: 'Failed to fetch error logs' });
    }
}

async function clearErrorLogs(req, res) {
    try {
        const result = await ErrorLog.deleteMany({});
        return res.json({ success: true, message: `Cleared ${result.deletedCount} error logs.` });
    } catch (err) {
        console.error('Admin clearErrorLogs error:', err);
        ErrorLog.create({ source: 'Admin:clearErrorLogs', level: 'error', message: err.message || String(err) }).catch(() => {});
        return res.status(500).json({ success: false, message: 'Failed to clear error logs' });
    }
}

/**
 * POST /api/admin/refresh/topics
 * Deletes all DailyTopic docs for today (IST). Users get fresh topics on next visit.
 */
async function refreshDailyTopics(req, res) {
    try {
        const today = getTodayIST();
        const result = await DailyTopic.deleteMany({ date: today });
        res.json({
            success: true,
            message: `Deleted ${result.deletedCount} daily topic${result.deletedCount !== 1 ? 's' : ''} for ${today}. Users will get fresh topics on next visit.`,
        });
    } catch (err) {
        console.error('Admin refreshDailyTopics error:', err);
        ErrorLog.create({ source: 'Admin:refreshDailyTopics', level: 'error', message: err.message || String(err) }).catch(() => {});
        res.status(500).json({ success: false, message: 'Failed to reset daily topics: ' + err.message });
    }
}

/**
 * POST /api/admin/refresh/daily-topic-me
 * Deletes today's DailyTopic doc ONLY for the currently logged-in admin.
 * Leaves all other users' topics untouched — use this to test the topic engine
 * without disrupting the rest of the user base.
 */
async function refreshMyDailyTopic(req, res) {
    try {
        const today  = getTodayIST();
        const userId = req.user._id;
        const result = await DailyTopic.deleteOne({ userId, date: today });
        res.json({
            success: true,
            message: result.deletedCount
                ? `Your daily topic for ${today} has been reset. Switch to the Topic tab to generate a new one.`
                : `No daily topic found for you on ${today} — nothing to reset.`,
        });
    } catch (err) {
        console.error('Admin refreshMyDailyTopic error:', err);
        ErrorLog.create({ source: 'Admin:refreshMyDailyTopic', level: 'error', message: err.message || String(err) }).catch(() => {});
        res.status(500).json({ success: false, message: 'Failed to reset your daily topic: ' + err.message });
    }
}

/**
 * GET /api/admin/active-users
 * Returns:
 *   - data: users active in last 15 min (isOnlineNow: true), or fallback recently active
 *   - todayUsers: all users whose lastLogin is >= IST midnight today
 *
 * lastLogin is now updated on every authenticated request (throttled to 1/min),
 * so it accurately reflects when a user was last active — not just when they logged in.
 */
async function getActiveUsers(req, res) {
    try {
        const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);

        // Rolling 24-hour window for "Online Today"
        const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // ── Currently online: lastLogin within last 15 min ───────────────────
        let liveUsers = await User.find({ lastLogin: { $gte: fifteenMinAgo } })
            .sort({ lastLogin: -1 })
            .limit(25)
            .select('name username email lastLogin linkedAccounts role')
            .lean();

        const isLive = liveUsers.length > 0;

        // ── Fallback: most recently active users if nobody online right now ──
        let fallbackUsers = [];
        if (!isLive) {
            fallbackUsers = await User.find({ lastLogin: { $ne: null } })
                .sort({ lastLogin: -1 })
                .limit(15)
                .select('name username email lastLogin linkedAccounts role')
                .lean();
        }

        const displayUsers = isLive ? liveUsers : fallbackUsers;

        // ── Online in last 24h ────────────────────────────────────────────────
        const todayUsers = await User.find({ lastLogin: { $gte: last24h } })
            .sort({ lastLogin: -1 })
            .limit(200)
            .select('name username email lastLogin linkedAccounts role')
            .lean();

        const mapUser = (u, forceOnline = false) => ({
            _id:         u._id,
            name:        u.name,
            username:    u.username,
            email:       u.email,
            role:        u.role,
            lastLogin:   u.lastLogin,
            // Server decides isOnlineNow — avoids client-side race conditions
            isOnlineNow: forceOnline || !!(u.lastLogin && u.lastLogin >= fifteenMinAgo),
            cfLinked: !!(u.linkedAccounts?.codeforces),
            lcLinked: !!(u.linkedAccounts?.leetcode),
            ccLinked: !!(u.linkedAccounts?.codechef),
        });

        return res.json({
            success: true,
            isLive,
            count: displayUsers.length,
            data:       displayUsers.map(u => mapUser(u, isLive)),
            todayUsers: todayUsers.map(u => mapUser(u, false)),
        });

    } catch (err) {
        console.error('Admin getActiveUsers error:', err);
        ErrorLog.create({ source: 'Admin:getActiveUsers', level: 'error', message: err.message || String(err) }).catch(() => {});
        return res.status(500).json({ success: false, message: 'Failed to fetch active users' });
    }
}


// ── Problem Catalog Sync ──────────────────────────────────────────────────────

/**
 * Helper: bulk-upsert an array of problems into a Mongoose model.
 * Returns { inserted, updated } counts derived from bulkWrite result.
 * Dedup key: `problemId` (unique index on all 3 models).
 */
async function bulkUpsertProblems(Model, problems) {
    if (!problems.length) return { inserted: 0, updated: 0 };
    const now = new Date();
    const ops = problems.map(p => ({
        updateOne: {
            filter: { problemId: p.problemId },
            update: { $set: { ...p, lastSyncedAt: now } },
            upsert: true,
        },
    }));
    // Process in batches of 500 to avoid hitting MongoDB driver limits
    const BATCH = 500;
    let inserted = 0;
    let updated  = 0;
    for (let i = 0; i < ops.length; i += BATCH) {
        const result = await Model.bulkWrite(ops.slice(i, i + BATCH), { ordered: false });
        inserted += result.upsertedCount  || 0;
        updated  += result.modifiedCount  || 0;
    }
    return { inserted, updated };
}

/**
 * POST /api/admin/sync/cf-problems
 * Kicks off a background sync of the full Codeforces problem catalog.
 * Returns immediately with { status: 'started' }.
 * Poll GET /api/admin/sync/catalog-status for progress.
 */
async function syncCFProblems(req, res) {
    if (catalogSyncState.cf.status === 'running') {
        return res.json({ success: true, status: 'already_running', message: 'CF problem sync is already in progress.' });
    }

    // Respond immediately — background work starts below
    res.json({ success: true, status: 'started', message: 'CF problem sync started in background. Poll /api/admin/sync/catalog-status for progress.' });

    // ── Background sync ───────────────────────────────────────────────────────
    catalogSyncState.cf = { status: 'running', startedAt: new Date(), finishedAt: null, total: 0, inserted: 0, updated: 0, error: null };

    setImmediate(async () => {
        try {
            console.log('[ADMIN] CF problem catalog sync started');

            const response = await axios.get('https://codeforces.com/api/problemset.problems?lang=en', { timeout: 20_000 });
            if (response.data?.status !== 'OK') throw new Error('CF API returned non-OK status');

            const { problems, problemStatistics } = response.data.result;

            // Build solvedCount lookup
            const statMap = new Map();
            for (const s of problemStatistics) {
                statMap.set(`${s.contestId}${s.index}`, s.solvedCount || 0);
            }

            // Shape + filter: only store rated problems
            const shaped = problems
                .filter(p => p.rating)
                .map(p => ({
                    problemId:   `${p.contestId}${p.index}`,
                    contestId:   p.contestId,
                    index:       p.index,
                    title:       p.name,
                    url:         `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`,
                    difficulty:  p.rating,
                    tags:        p.tags || [],
                    solvedCount: statMap.get(`${p.contestId}${p.index}`) || 0,
                }));

            const { inserted, updated } = await bulkUpsertProblems(CFProblem, shaped);

            // Persist last sync time to GlobalSyncState
            await GlobalSyncState.findOneAndUpdate(
                { syncKey: 'cf_problems' },
                { syncKey: 'cf_problems', lastSyncedAt: new Date() },
                { upsert: true, new: true }
            );

            catalogSyncState.cf = {
                status: 'done',
                startedAt: catalogSyncState.cf.startedAt,
                finishedAt: new Date(),
                total: shaped.length,
                inserted,
                updated,
                error: null,
            };
            console.log(`[ADMIN] CF catalog sync done — ${shaped.length} problems (${inserted} new, ${updated} updated)`);

        } catch (err) {
            const errMsg = err.response?.data?.error || err.response?.data?.message || err.message || err.code || String(err);
            console.error('[ADMIN] CF catalog sync failed:', errMsg);
            ErrorLog.create({ source: 'Admin:syncCFProblems', level: 'error', message: errMsg }).catch(() => {});
            catalogSyncState.cf = {
                ...catalogSyncState.cf,
                status: 'error',
                finishedAt: new Date(),
                error: errMsg,
            };
        }
    });
}

// LC GraphQL — used only by syncLCProblems.
// The problem list is a public endpoint: no proxy, no CSRF, no auth needed.
const LC_GQL_ENDPOINT = 'https://leetcode.com/graphql';
const LC_PAGE_SIZE = 100; // LC's documented max per request
const LC_PROBLEM_LIST_QUERY = `
query problemList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
  questionList(categorySlug: $categorySlug, limit: $limit, skip: $skip, filters: $filters) {
    total: totalNum
    questions: data {
      title titleSlug difficulty isPaidOnly acRate
      topicTags { name slug }
    }
  }
}
`;

async function fetchLCPage(skip) {
    const res = await axios.post(
        LC_GQL_ENDPOINT,
        { query: LC_PROBLEM_LIST_QUERY, variables: { categorySlug: 'algorithms', limit: LC_PAGE_SIZE, skip, filters: {} } },
        {
            timeout: 30_000,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
                Referer: 'https://leetcode.com',
                Origin:  'https://leetcode.com',
                Accept:  'application/json',
            },
        }
    );
    if (!res.data?.data?.questionList) throw new Error(`Unexpected LC response at skip=${skip}`);
    return res.data.data.questionList;
}

/**
 * POST /api/admin/sync/lc-problems
 * Paginates LC GraphQL directly from CPPro — no NexusLC needed.
 * Problem list is public data (no proxy, no CSRF, no auth required).
 * Returns immediately with { status: 'started' }.
 * Poll GET /api/admin/sync/catalog-status for progress.
 */
async function syncLCProblems(req, res) {
    if (catalogSyncState.lc.status === 'running') {
        return res.json({ success: true, status: 'already_running', message: 'LC problem sync is already in progress.' });
    }

    res.json({ success: true, status: 'started', message: 'LC problem sync started in background. Poll /api/admin/sync/catalog-status for progress.' });
    catalogSyncState.lc = { status: 'running', startedAt: new Date(), finishedAt: null, total: 0, inserted: 0, updated: 0, error: null };

    setImmediate(async () => {
        try {
            console.log('[ADMIN] LC catalog sync started (direct to leetcode.com/graphql)');

            // Page 1 — get total count
            const firstPage    = await fetchLCPage(0);
            const total        = firstPage.total ?? 0;
            const allQuestions = [...(firstPage.questions || [])];
            const pageCount    = Math.ceil(total / LC_PAGE_SIZE);
            console.log(`[ADMIN] LC total=${total}, fetching ${pageCount} pages`);

            // Remaining pages
            for (let page = 1; page < pageCount; page++) {
                try {
                    const pageData = await fetchLCPage(page * LC_PAGE_SIZE);
                    allQuestions.push(...(pageData.questions || []));
                    console.log(`[ADMIN] LC page ${page + 1}/${pageCount} — running total: ${allQuestions.length}`);
                } catch (pageErr) {
                    console.warn(`[ADMIN] LC page ${page + 1} failed: ${pageErr.message}`);
                }
            }

            // Shape + filter out paid-only
            const problems = allQuestions
                .filter(q => !q.isPaidOnly)
                .map(q => ({
                    problemId:  q.titleSlug,
                    title:      q.title,
                    url:        `https://leetcode.com/problems/${q.titleSlug}/`,
                    difficulty: q.difficulty,
                    tags:       (q.topicTags || []).map(t => t.slug),
                    acRate:     typeof q.acRate === 'number' ? parseFloat(q.acRate.toFixed(2)) : 0,
                    isPaidOnly: false,
                }));

            if (!problems.length) throw new Error('LC returned 0 free algorithm problems');

            const { inserted, updated } = await bulkUpsertProblems(LCProblem, problems);

            await GlobalSyncState.findOneAndUpdate(
                { syncKey: 'lc_problems' },
                { syncKey: 'lc_problems', lastSyncedAt: new Date() },
                { upsert: true, new: true }
            );

            catalogSyncState.lc = {
                status: 'done',
                startedAt: catalogSyncState.lc.startedAt,
                finishedAt: new Date(),
                total: problems.length,
                inserted,
                updated,
                error: null,
            };
            console.log(`[ADMIN] LC catalog sync done — ${problems.length} problems (${inserted} new, ${updated} updated)`);

        } catch (err) {
            const errMsg = err.response?.data?.errors?.[0]?.message || err.response?.data?.error || err.message || err.code || String(err);
            console.error('[ADMIN] LC catalog sync failed:', errMsg);
            ErrorLog.create({ source: 'Admin:syncLCProblems', level: 'error', message: errMsg }).catch(() => {});
            catalogSyncState.lc = { ...catalogSyncState.lc, status: 'error', finishedAt: new Date(), error: errMsg };
        }
    });
}

/**
 * POST /api/admin/sync/cc-problems
 * Kicks off a background sync of the full CodeChef problem catalog via CC API Server.
 * Returns immediately with { status: 'started' }.
 * Poll GET /api/admin/sync/catalog-status for progress.
 */
async function syncCCProblems(req, res) {
    if (catalogSyncState.cc.status === 'running') {
        return res.json({ success: true, status: 'already_running', message: 'CC problem sync is already in progress.' });
    }

    const CC_SYNC_API    = (process.env.CC_SYNC_API || '').replace(/\/$/, '');
    const CC_SYNC_SECRET = process.env.CC_SYNC_SECRET || '';
    if (!CC_SYNC_API) {
        return res.status(503).json({ success: false, message: 'CC_SYNC_API not configured in environment.' });
    }

    res.json({ success: true, status: 'started', message: 'CC problem sync started in background. Poll /api/admin/sync/catalog-status for progress.' });

    catalogSyncState.cc = { status: 'running', startedAt: new Date(), finishedAt: null, total: 0, inserted: 0, cloudflareHits: 0, error: null };

    setImmediate(async () => {
        try {
            console.log('[ADMIN] CC problem catalog sync started');

            // CC API server /all-problems paginates all CC problems without difficulty band splitting.
            // Proxy health check (~30s) + sequential pages with 200ms delay — allow 15 min.
            const response = await axios.get(`${CC_SYNC_API}/all-problems`, {
                headers: { Authorization: `Bearer ${CC_SYNC_SECRET}` },
                timeout: 900_000, // 15 min
            });

            const problems      = response.data?.problems      || [];
            const cloudflareHits = response.data?.cloudflareHits ?? 0;

            if (!problems.length) throw new Error('CC API Server returned 0 problems — check CC server logs');

            const { inserted, updated } = await bulkUpsertProblems(CCProblem, problems);

            await GlobalSyncState.findOneAndUpdate(
                { syncKey: 'cc_problems' },
                { syncKey: 'cc_problems', lastSyncedAt: new Date() },
                { upsert: true, new: true }
            );

            catalogSyncState.cc = {
                status: 'done',
                startedAt: catalogSyncState.cc.startedAt,
                finishedAt: new Date(),
                total: problems.length,
                inserted,
                cloudflareHits,
                error: null,
            };
            console.log(`[ADMIN] CC catalog sync done — ${problems.length} problems (${inserted} new, ${cloudflareHits} CF blocks)`);

        } catch (err) {
            const errMsg = err.response?.data?.error || err.response?.data?.message || err.message || err.code || String(err);
            console.error('[ADMIN] CC catalog sync failed:', errMsg);
            ErrorLog.create({ source: 'Admin:syncCCProblems', level: 'error', message: errMsg }).catch(() => {});
            catalogSyncState.cc = {
                ...catalogSyncState.cc,
                status: 'error',
                finishedAt: new Date(),
                error: errMsg,
            };
        }
    });
}

// ── LC Contest Tags ──────────────────────────────────────────────────────────
const LC_CONTEST_GQL = `
query pastContests($pageNo: Int!, $numPerPage: Int!) {
  pastContests(pageNo: $pageNo, numPerPage: $numPerPage) {
    data {
      title
      titleSlug
      startTime
      questions { title titleSlug }
    }
  }
}
`;

/**
 * POST /api/admin/sync/lc-contest-tags
 * Fetches the last 100 LC contests (Weekly + Biweekly) and appends each
 * contest's titleSlug to the tags array of every matching LCProblem document.
 * Uses $addToSet so it is fully idempotent — safe to re-run.
 * Returns immediately; background work runs via setImmediate.
 * Poll GET /api/admin/sync/catalog-status for progress.
 */
async function syncLCContestTags(req, res) {
    if (catalogSyncState.lc_tags.status === 'running') {
        return res.json({ success: true, status: 'already_running', message: 'LC contest tag sync is already in progress.' });
    }

    res.json({ success: true, status: 'started', message: 'LC contest tag sync started in background. Poll /api/admin/sync/catalog-status for progress.' });
    catalogSyncState.lc_tags = { status: 'running', startedAt: new Date(), finishedAt: null, contests: 0, tagged: 0, skipped: 0, error: null };

    setImmediate(async () => {
        try {
            const LC_PAGE_SIZE = 10; // LC's actual enforced page size for pastContests
            const MAX_CONTESTS = 100;  // fetch last 100 contests per run
            const allContests  = [];
            let   pageNo       = 1;

            console.log('[ADMIN] LC contest tag sync started — fetching last 100 contests');

            // Paginate until a page returns fewer results than PAGE_SIZE (end of list)
            while (true) {
                const gqlRes = await axios.post(
                    'https://leetcode.com/graphql',
                    { query: LC_CONTEST_GQL, variables: { pageNo, numPerPage: LC_PAGE_SIZE } },
                    {
                        timeout: 30_000,
                        headers: {
                            'Content-Type': 'application/json',
                            'User-Agent':   'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
                            Referer:        'https://leetcode.com',
                            Origin:         'https://leetcode.com',
                            Accept:         'application/json',
                        },
                    }
                );

                const page = gqlRes.data?.data?.pastContests?.data || [];
                if (!page.length) break; // no more contests

                allContests.push(...page);
                console.log(`[ADMIN] LC contest tag sync — page ${pageNo}: ${page.length} contests (total so far: ${allContests.length})`);

                if (page.length < LC_PAGE_SIZE || allContests.length >= MAX_CONTESTS) break;
                pageNo++;
            }

            if (!allContests.length) throw new Error('LC returned 0 contests — unexpected response');

            console.log(`[ADMIN] LC contest tag sync — fetched ${allContests.length} contests total, tagging problems...`);

            let tagged  = 0;
            let skipped = 0;

            for (const contest of allContests) {
                const { titleSlug: contestSlug, questions = [] } = contest;
                if (!questions.length) { skipped++; continue; }

                // For each problem in this contest, append contestSlug to tags (no duplicate via $addToSet)
                const slugs = questions.map(q => q.titleSlug).filter(Boolean);
                if (!slugs.length) { skipped++; continue; }

                const result = await LCProblem.updateMany(
                    { problemId: { $in: slugs } },
                    { $addToSet: { tags: contestSlug } }
                );

                tagged  += result.modifiedCount || 0;
                skipped += slugs.length - (result.matchedCount || 0); // problems not yet in catalog

                console.log(`[ADMIN] LC contest tag sync — ${contestSlug}: ${result.modifiedCount} tagged`);
            }

            const finishedAt = new Date();
            catalogSyncState.lc_tags = {
                status:    'done',
                startedAt: catalogSyncState.lc_tags.startedAt,
                finishedAt,
                contests:  allContests.length,
                tagged,
                skipped,
                error:     null,
            };

            // Persist to DB so stats survive server restarts
            await GlobalSyncState.findOneAndUpdate(
                { syncKey: 'lc_contest_tags' },
                { syncKey: 'lc_contest_tags', lastSyncedAt: finishedAt, contests: allContests.length, tagged, skipped },
                { upsert: true, new: true, strict: false }
            );

            console.log(`[ADMIN] LC contest tag sync done — ${allContests.length} contests, ${tagged} problems tagged, ${skipped} skipped`);

        } catch (err) {
            const errMsg = err.response?.data?.errors?.[0]?.message || err.response?.data?.error || err.message || err.code || String(err);
            console.error('[ADMIN] LC contest tag sync failed:', errMsg);
            ErrorLog.create({ source: 'Admin:syncLCContestTags', level: 'error', message: errMsg }).catch(() => {});
            catalogSyncState.lc_tags = { ...catalogSyncState.lc_tags, status: 'error', finishedAt: new Date(), error: errMsg };
        }
    });
}

/**
 * GET /api/admin/sync/catalog-status
 * Returns the current in-memory sync state for all three platforms,
 * plus the last-synced timestamps from GlobalSyncState (persisted across restarts).
 */
async function getCatalogSyncStatus(req, res) {
    try {
        // Fetch persisted last-sync timestamps from DB
        const [cfState, lcState, ccState, lcTagsState] = await Promise.all([
            GlobalSyncState.findOne({ syncKey: 'cf_problems' }).lean(),
            GlobalSyncState.findOne({ syncKey: 'lc_problems' }).lean(),
            GlobalSyncState.findOne({ syncKey: 'cc_problems' }).lean(),
            GlobalSyncState.findOne({ syncKey: 'lc_contest_tags' }).lean(),
        ]);

        // Also fetch current document counts so admin can see catalog size
        const [cfCount, lcCount, ccCount] = await Promise.all([
            CFProblem.estimatedDocumentCount(),
            LCProblem.estimatedDocumentCount(),
            CCProblem.estimatedDocumentCount(),
        ]);

        return res.json({
            success: true,
            cf: {
                ...catalogSyncState.cf,
                lastSyncedAt: cfState?.lastSyncedAt || null,
                catalogCount: cfCount,
            },
            lc: {
                ...catalogSyncState.lc,
                lastSyncedAt: lcState?.lastSyncedAt || null,
                catalogCount: lcCount,
            },
            cc: {
                ...catalogSyncState.cc,
                lastSyncedAt: ccState?.lastSyncedAt || null,
                catalogCount: ccCount,
            },
            lc_tags: {
                // When in-memory is idle (e.g. after server restart), fall back to
                // DB-persisted stats so the UI shows the real last-run numbers.
                ...(catalogSyncState.lc_tags.status === 'idle' && lcTagsState ? {
                    status:    'idle',
                    contests:  lcTagsState.contests  ?? 0,
                    tagged:    lcTagsState.tagged    ?? 0,
                    skipped:   lcTagsState.skipped   ?? 0,
                } : catalogSyncState.lc_tags),
                lastSyncedAt: lcTagsState?.lastSyncedAt || null,
            },
        });
    } catch (err) {
        console.error('[ADMIN] getCatalogSyncStatus error:', err.message);
        ErrorLog.create({ source: 'Admin:getCatalogSyncStatus', level: 'error', message: err.message || String(err) }).catch(() => {});
        return res.status(500).json({ success: false, message: 'Failed to fetch catalog sync status.' });
    }
}

module.exports = { getAdminStats, refreshContests, refreshLeaderboard, refreshStats, sendNotification, refreshDailyProblems, refreshMyDailyProblems, refreshDailyTopics, refreshMyDailyTopic, getErrorLogs, clearErrorLogs, getActiveUsers, syncCFProblems, syncLCProblems, syncCCProblems, syncLCContestTags, getCatalogSyncStatus };
