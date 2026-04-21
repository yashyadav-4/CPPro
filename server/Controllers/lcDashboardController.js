const LeetCodeData = require('../Model/LeetCodeData');
const Platform = require('../Model/Platform');
const Submission = require('../Model/Submissions');
const mongoose = require('mongoose');

// Helper to strictly format dates as YYYY-MM-DD in IST
function getISTDate(dateInput) {
    // Convert input date into a string formatted in IST using en-US to guarantee parsability
    const istString = new Date(dateInput).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    const d = new Date(istString);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ── Helper: parse LC submissionCalendar to {date, count}[] ──────────────────
function parseLcCalendar(submissionCalendar) {
    try {
        const obj = JSON.parse(submissionCalendar || '{}');
        return Object.entries(obj).map(([ts, count]) => {
            const dateStr = getISTDate(Number(ts) * 1000);
            return {
                date: dateStr,
                count: Number(count),
            };
        });
    } catch { return []; }
}

// ── Helper: compute streak from a set of date strings ───────────────────────
function computeStreakFromSet(daySet) {
    const sorted = [...daySet].sort();
    if (sorted.length === 0) return { currentStreak: 0, bestStreak: 0 };
    let best = 1, cur = 1;
    for (let i = 1; i < sorted.length; i++) {
        const diff = Math.round((new Date(sorted[i]) - new Date(sorted[i - 1])) / 86400000);
        if (diff === 1) { cur++; best = Math.max(best, cur); }
        else if (diff > 1) cur = 1;
    }
    const today = getISTDate(new Date());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = getISTDate(yesterday);
    const last = sorted[sorted.length - 1];
    return { currentStreak: (last === today || last === yStr) ? cur : 0, bestStreak: best };
}

async function getLcProfile(req, res) {
    try {
        const { userId } = req.params;
        const lcData = await LeetCodeData.findOne({ userId }).select('lcUsername profile').lean();
        if (!lcData) {
            return res.status(200).json({ success: true, data: null, message: 'no leetcode data found' });
        }
        res.status(200).json({ success: true, data: lcData });
    } catch (error) {
        console.error('error in getLcProfile:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

async function getLcSkillStats(req, res) {
    try {
        const { userId } = req.params;
        const lcData = await LeetCodeData.findOne({ userId }).select('skillStats').lean();
        if (!lcData) {
            return res.status(200).json({ success: true, data: null });
        }
        res.status(200).json({ success: true, data: lcData.skillStats });
    } catch (error) {
        console.error('error in getLcSkillStats:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

async function getLcCalendar(req, res) {
    try {
        const { userId } = req.params;
        const lcData = await LeetCodeData.findOne({ userId }).select('calendar').lean();
        if (!lcData) {
            return res.status(200).json({ success: true, data: null });
        }
        res.status(200).json({ success: true, data: lcData.calendar });
    } catch (error) {
        console.error('error in getLcCalendar:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

async function getLcContestHistory(req, res) {
    try {
        const { userId } = req.params;
        const lcData = await LeetCodeData.findOne({ userId })
            .select('contestCount contestHistory').lean();
        if (!lcData) {
            return res.status(200).json({ success: true, data: null });
        }
        res.status(200).json({
            success: true,
            data: {
                count: lcData.contestCount,
                contestHistory: lcData.contestHistory,
            }
        });
    } catch (error) {
        console.error('error in getLcContestHistory:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

async function getLcRecentSubmissions(req, res) {
    try {
        const { userId } = req.params;
        const lcData = await LeetCodeData.findOne({ userId })
            .select('recentSubmissions').lean();
        if (!lcData) {
            return res.status(200).json({ success: true, data: null });
        }
        res.status(200).json({ success: true, data: lcData.recentSubmissions });
    } catch (error) {
        console.error('error in getLcRecentSubmissions:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

// ── New consolidated LC aggregate endpoint ───────────────────────────────────
async function getLcAggregateDashboard(req, res) {
    try {
        const { userId } = req.params;

        // Fetch LC data and CF Platform data in parallel
        const [lcData, cfPlatform, cfSubmissions] = await Promise.all([
            LeetCodeData.findOne({ userId }).lean(),
            Platform.findOne({ userId, platform: 'codeforces' })
                .select('currentRating maxRating currentRank platformUsername ratedHistory')
                .lean(),
            Submission.find({ userId: new mongoose.Types.ObjectId(userId), platform: 'codeforces' })
                .select('submittedAt')
                .lean(),
        ]);

        if (!lcData) {
            return res.status(200).json({ success: true, data: null });
        }

        const profile = lcData.profile || {};
        const calendar = lcData.calendar || {};
        const contestHistory = lcData.contestHistory || [];
        const skillStats = lcData.skillStats || {};

        // ── LC calendar entries ──────────────────────────────────────────────
        const lcCalendarParsed = parseLcCalendar(calendar.submissionCalendar);
        // Build lcDaySet from calendar. Individual recentSubmissions timestamps are merged
        // later when needed so the 12am–5:30am IST window is covered correctly.
        const lcDaySet = new Set(lcCalendarParsed.filter(d => d.count > 0).map(d => d.date));

        // ── LC this month / last month ───────────────────────────────────────
        const now = new Date();
        const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthStr = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

        let lcActiveDaysThisMonth = 0;
        lcCalendarParsed.forEach(d => {
            const ym = d.date.slice(0, 7);
            if (ym === monthStr && d.count > 0) lcActiveDaysThisMonth++;
        });

        // Use recentSubmissions to count unique problems NEWLY AC'd this month / last month.
        // recentSubmissions is ordered newest-first; we track per-titleSlug first AC occurrence
        // and only count it if that first AC falls within the target month.
        const recentSubs = lcData.recentSubmissions || [];
        // Sort ascending by timestamp so we can find the first AC for each problem
        const recentSorted = [...recentSubs]
            .filter(s => s.timestamp)
            .sort((a, b) => Number(a.timestamp) - Number(b.timestamp));

        const firstAcMonthMap = {}; // titleSlug -> YYYY-MM of its first AC
        recentSorted.forEach(s => {
            if (s.statusDisplay === 'Accepted' && !firstAcMonthMap[s.titleSlug]) {
                firstAcMonthMap[s.titleSlug] = getISTDate(Number(s.timestamp) * 1000).slice(0, 7);
            }
        });

        const lcSolvedThisMonth = Object.values(firstAcMonthMap).filter(ym => ym === monthStr).length;
        const lcSolvedLastMonth = Object.values(firstAcMonthMap).filter(ym => ym === lastMonthStr).length;

        // ── LC acceptance rate ───────────────────────────────────────────────
        const acSubmissions = (profile.acSubmissionNum || []).find(s => s.difficulty === 'All');
        const totalSubmissionsNum = (profile.totalSubmissionNum || []).find(s => s.difficulty === 'All');
        const lcAcceptanceRate = (totalSubmissionsNum?.submissions > 0)
            ? Math.round((acSubmissions?.submissions || 0) / totalSubmissionsNum.submissions * 100)
            : 0;

        // ── Unified streak: merge CF days + LC days ──────────────────────────
        // Also merge per-submission IST dates from recentSubmissions so solves in the
        // 12am–5:30am IST window (which land in the previous UTC calendar bucket) don't
        // create artificial streak gaps.
        const lcRecentAcDays = new Set(
            (lcData.recentSubmissions || [])
                .filter(s => s.statusDisplay === 'Accepted' && s.timestamp)
                .map(s => getISTDate(Number(s.timestamp) * 1000))
        );
        const lcDaySetFull = new Set([...lcDaySet, ...lcRecentAcDays]);

        const cfDaySet = new Set(
            cfSubmissions.map(s => new Date(s.submittedAt).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }))
        );
        const unifiedDaySet = new Set([...cfDaySet, ...lcDaySetFull]);
        const unifiedStreak = computeStreakFromSet(unifiedDaySet);
        const cfOnlyStreak = computeStreakFromSet(cfDaySet);
        const lcOnlyStreak = computeStreakFromSet(lcDaySetFull);
        const bestStreakPlatform = cfOnlyStreak.bestStreak >= lcOnlyStreak.bestStreak ? 'codeforces' : 'leetcode';

        // ── LC rating history ────────────────────────────────────────────────
        const attendedContests = contestHistory.filter(c => c.attended);
        const lcRatingHistory = attendedContests
            .map(c => ({
                date: c.contestStartTime ? new Date(c.contestStartTime * 1000).toISOString().split('T')[0] : '',
                rating: Math.round(c.rating || 0),
                contestName: c.contestTitle || '',
                rank: c.ranking || null,
            }))
            .filter(c => c.date)
            .sort((a, b) => a.date.localeCompare(b.date));

        const lcCurrentRating = lcRatingHistory.length ? lcRatingHistory[lcRatingHistory.length - 1].rating : 0;
        const lcMaxRating = lcRatingHistory.reduce((m, h) => Math.max(m, h.rating), 0);
        const getLcRank = (r) => {
            if (!r || r === 0) return 'Unrated';
            if (r < 1500) return 'Beginner';
            if (r < 1700) return 'Intermediate';
            if (r < 2050) return 'Knight';
            return 'Guardian';
        };

        // ── Recent LC contests ───────────────────────────────────────────────
        const recentLcContests = attendedContests
            .sort((a, b) => (b.contestStartTime || 0) - (a.contestStartTime || 0))
            .slice(0, 15)
            .map((c, i, arr) => {
                const prevRating = i < arr.length - 1 ? arr[i + 1].rating : c.rating;
                const name = c.contestTitle || 'LC Contest';
                const slug = name.toLowerCase().replace(/\s+/g, '-');
                return {
                    platform: 'leetcode',
                    name,
                    rank: c.ranking || null,
                    ratingChange: Math.round((c.rating || 0) - (prevRating || 0)),
                    rating: Math.round(c.rating || 0),
                    solved: c.problemsSolved,
                    total: c.totalProblems,
                    date: c.contestStartTime ? new Date(c.contestStartTime * 1000).toISOString().split('T')[0] : '',
                    url: `https://leetcode.com/contest/${slug}`
                };
            });

        // ── LC topics from skillStats ────────────────────────────────────────
        const lcTopics = [
            ...(skillStats.fundamental || []),
            ...(skillStats.intermediate || []),
            ...(skillStats.advanced || []),
        ].map(t => ({ name: t.tagName, count: t.problemsSolved }))
            .sort((a, b) => b.count - a.count);

        // ── Last 7 days (LC side) ────────────────────────────────────────────
        // lcDaySetFull already merges calendar + per-submission IST dates so solves in
        // the 12am–5:30am IST window are correctly attributed to the actual IST date.
        const lcLast7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = getISTDate(d);
            lcLast7Days.push({ date: dateStr, solved: lcDaySetFull.has(dateStr) });
        }

        // ── LC Upsolve Queue (from recentSubmissions) ───────────────────────
        // acSlugs = 100 most recent AC slugs from the public endpoint, stored separately
        // so problems solved outside the session window are still excluded.
        const acSlugSet = new Set(lcData.acSlugs || []);
        const recentSubmissions = lcData.recentSubmissions || [];
        const lcProblemMap = {};
        recentSubmissions.forEach(s => {
            if (!lcProblemMap[s.titleSlug]) {
                lcProblemMap[s.titleSlug] = {
                    problemId: s.titleSlug,
                    title: s.title,
                    rating: 0,
                    attempts: 0,
                    hasAC: false,
                    verdicts: []
                };
            }
            lcProblemMap[s.titleSlug].attempts++;
            
            const statusMap = {
                "Wrong Answer": "WA",
                "Time Limit Exceeded": "TLE",
                "Memory Limit Exceeded": "MLE",
                "Runtime Error": "RE",
                "Compile Error": "CE",
                "Accepted": "AC"
            };
            const st = statusMap[s.statusDisplay] || 'OTHER';
            lcProblemMap[s.titleSlug].verdicts.push(st);
            if (st === 'AC' || s.statusDisplay === 'Accepted') {
                lcProblemMap[s.titleSlug].hasAC = true;
            }
        });

        const lcUpsolveQueue = Object.values(lcProblemMap)
            .filter(p => !p.hasAC && !acSlugSet.has(p.problemId) && p.attempts > 0)
            .map(p => ({
                platform: 'leetcode',
                problemId: p.problemId,
                title: p.title,
                contestName: 'Practice',
                rating: 0,
                attempts: p.attempts,
                failReason: p.verdicts[0] || 'WA',
            }));

        // ── Achievements (combined CF + LC) ──────────────────────────────────
        const cfRating = cfPlatform?.currentRating || 0;
        const cfMaxRating = cfPlatform?.maxRating || 0;
        const cfSolvedPlat = 0; // will be summed in frontend — we only need thresholds here

        const lcSolved = profile.totalSolved || 0;
        const lcEasy = profile.easySolved || 0;
        const lcMedium = profile.mediumSolved || 0;
        const lcHard = profile.hardSolved || 0;

        // We'll fetch CF solved count from submissions
        const cfAcCount = await Submission.distinct('problemId', {
            userId: new mongoose.Types.ObjectId(userId),
            platform: 'codeforces',
            verdict: 'AC',
        });
        const cfSolved = cfAcCount.length;
        const totalSolvedCombined = cfSolved + lcSolved;

        const streak = unifiedStreak.currentStreak;
        const bestStreak = unifiedStreak.bestStreak;

        const achievements = [
            // Streak achievements
            { icon: '🔥', label: '7-Day Streak', platform: 'combined', earned: bestStreak >= 7, progress: Math.min(bestStreak / 7, 1) },
            { icon: '🔥', label: '30-Day Streak', platform: 'combined', earned: bestStreak >= 30, progress: Math.min(bestStreak / 30, 1) },
            { icon: '🔥', label: '100-Day Streak', platform: 'combined', earned: bestStreak >= 100, progress: Math.min(bestStreak / 100, 1) },
            { icon: '🔥', label: '200-Day Streak', platform: 'combined', earned: bestStreak >= 200, progress: Math.min(bestStreak / 200, 1) },
            // Problems solved milestones
            { icon: '💡', label: '50 Problems', platform: 'combined', earned: totalSolvedCombined >= 50, progress: Math.min(totalSolvedCombined / 50, 1) },
            { icon: '💡', label: '100 Problems', platform: 'combined', earned: totalSolvedCombined >= 100, progress: Math.min(totalSolvedCombined / 100, 1) },
            { icon: '💡', label: '200 Problems', platform: 'combined', earned: totalSolvedCombined >= 200, progress: Math.min(totalSolvedCombined / 200, 1) },
            { icon: '🏆', label: '500 Problems', platform: 'combined', earned: totalSolvedCombined >= 500, progress: Math.min(totalSolvedCombined / 500, 1) },
            // CF rating milestones
            { icon: '⭐', label: 'CF 1200+', platform: 'codeforces', earned: cfMaxRating >= 1200, progress: Math.min(cfMaxRating / 1200, 1) },
            { icon: '⭐', label: 'CF 1400+', platform: 'codeforces', earned: cfMaxRating >= 1400, progress: Math.min(cfMaxRating / 1400, 1) },
            { icon: '⭐', label: 'CF 1600+', platform: 'codeforces', earned: cfMaxRating >= 1600, progress: Math.min(cfMaxRating / 1600, 1) },
            // LC rating milestones
            { icon: '🟡', label: 'LC 1600+', platform: 'leetcode', earned: lcMaxRating >= 1600, progress: Math.min(lcMaxRating / 1600, 1) },
            { icon: '🟡', label: 'LC 1800+', platform: 'leetcode', earned: lcMaxRating >= 1800, progress: Math.min(lcMaxRating / 1800, 1) },
            { icon: '🟡', label: 'LC 2000+', platform: 'leetcode', earned: lcMaxRating >= 2000, progress: Math.min(lcMaxRating / 2000, 1) },
            // Hard problems
            { icon: '🧠', label: '10 Hard Problems', platform: 'leetcode', earned: lcHard >= 10, progress: Math.min(lcHard / 10, 1) },
            { icon: '🧠', label: '50 Hard Problems', platform: 'leetcode', earned: lcHard >= 50, progress: Math.min(lcHard / 50, 1) },
            { icon: '🧠', label: '100 Hard Problems', platform: 'leetcode', earned: lcHard >= 100, progress: Math.min(lcHard / 100, 1) },
        ];

        res.status(200).json({
            success: true,
            data: {
                // Profile
                lcHandle: lcData.lcUsername,
                lcRating: lcCurrentRating,
                lcMaxRating,
                lcRank: getLcRank(lcCurrentRating),
                // Solved breakdown
                lcSolved,
                lcEasy,
                lcMedium,
                lcHard,
                // Stats
                lcActiveDays: calendar.totalActiveDays || 0,
                lcActiveDaysThisMonth,
                lcSolvedThisMonth,
                lcSolvedLastMonth,
                lcAcceptanceRate,
                lcStreak: calendar.streak || 0,
                // Unified streak (merged CF + LC days)
                currentStreak: unifiedStreak.currentStreak,
                bestStreak: unifiedStreak.bestStreak,
                bestStreakPlatform,
                // Data arrays
                lcCalendarParsed,
                lcLast7Days,
                lcRatingHistory,
                recentLcContests,
                lcTopics,
                achievements,
                upsolveQueue: lcUpsolveQueue,
                // Raw CF data for combined stats in frontend
                cfSolved,
                // LC submission counts from LeetCode's own API
                lcTotalSubmissions: totalSubmissionsNum?.submissions || 0,  // ALL submissions (every attempt)
                lcAcSubmissions: acSubmissions?.submissions || 0,            // AC submissions only
                lastSyncedAt: lcData.lastSyncedAt || null,
                // Recent AC submissions (title, titleSlug, timestamp)
                recentSubmissions: lcData.recentSubmissions || [],
                // Tiered skill stats for LC Skill Breakdown component
                lcSkillFundamental: (skillStats.fundamental || [])
                    .map(t => ({ name: t.tagName, count: t.problemsSolved }))
                    .sort((a, b) => b.count - a.count).slice(0, 10),
                lcSkillIntermediate: (skillStats.intermediate || [])
                    .map(t => ({ name: t.tagName, count: t.problemsSolved }))
                    .sort((a, b) => b.count - a.count).slice(0, 10),
                lcSkillAdvanced: (skillStats.advanced || [])
                    .map(t => ({ name: t.tagName, count: t.problemsSolved }))
                    .sort((a, b) => b.count - a.count).slice(0, 10),
            }
        });
    } catch (error) {
        console.error('error in getLcAggregateDashboard:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

module.exports = {
    getLcProfile,
    getLcSkillStats,
    getLcCalendar,
    getLcContestHistory,
    getLcRecentSubmissions,
    getLcAggregateDashboard,
};
