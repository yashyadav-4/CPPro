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
        const lcDaySet = new Set(lcCalendarParsed.filter(d => d.count > 0).map(d => d.date));

        // ── LC this month / last month ───────────────────────────────────────
        const now = new Date();
        const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthStr = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

        let lcSolvedThisMonth = 0;
        let lcSolvedLastMonth = 0;
        let lcActiveDaysThisMonth = 0;
        lcCalendarParsed.forEach(d => {
            const ym = d.date.slice(0, 7);
            if (ym === monthStr) {
                lcSolvedThisMonth += d.count;
                if (d.count > 0) lcActiveDaysThisMonth++;
            }
            if (ym === lastMonthStr) lcSolvedLastMonth += d.count;
        });

        // ── LC acceptance rate ───────────────────────────────────────────────
        const acSubmissions = (profile.acSubmissionNum || []).find(s => s.difficulty === 'All');
        const totalSubmissionsNum = (profile.totalSubmissionNum || []).find(s => s.difficulty === 'All');
        const lcAcceptanceRate = (totalSubmissionsNum?.submissions > 0)
            ? Math.round((acSubmissions?.submissions || 0) / totalSubmissionsNum.submissions * 100)
            : 0;

        // ── Unified streak: merge CF days + LC days ──────────────────────────
        const cfDaySet = new Set(
            cfSubmissions.map(s => new Date(s.submittedAt).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }))
        );
        const unifiedDaySet = new Set([...cfDaySet, ...lcDaySet]);
        const unifiedStreak = computeStreakFromSet(unifiedDaySet);
        const cfOnlyStreak = computeStreakFromSet(cfDaySet);
        const lcOnlyStreak = computeStreakFromSet(lcDaySet);
        const bestStreakPlatform = cfOnlyStreak.bestStreak >= lcOnlyStreak.bestStreak ? 'codeforces' : 'leetcode';

        // ── LC rating history ────────────────────────────────────────────────
        const attendedContests = contestHistory.filter(c => c.attended);
        const lcRatingHistory = attendedContests
            .map(c => ({
                date: c.contestStartTime ? new Date(c.contestStartTime * 1000).toISOString().split('T')[0] : '',
                rating: Math.round(c.rating || 0),
                contestName: c.contestTitle || '',
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
        const lcLast7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = getISTDate(d);
            lcLast7Days.push({ date: dateStr, solved: lcDaySet.has(dateStr) });
        }

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
                // Raw CF data for combined stats in frontend
                cfSolved,
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
