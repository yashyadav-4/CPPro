const mongoose = require('mongoose');
const Submission = require('../Model/Submissions');
const Platform = require('../Model/Platform');
const User = require('../Model/User');

function getISTDate(dateInput) {
    if (!dateInput) return null;
    const istString = new Date(dateInput).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    const d = new Date(istString);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayIST() {
    return getISTDate(new Date());
}

// ── 1. CF stat fields from Submission collection ─────────────────────────────
const getCfStats = async (userId) => {
    const uid = new mongoose.Types.ObjectId(userId);

    // All CF submissions
    const all = await Submission.find({ userId: uid, platform: 'codeforces' })
        .select('problemId verdict submittedAt')
        .lean();

    const total = all.length;

    // Unique AC problems
    const acSet = new Set();
    let acCount = 0;
    all.forEach(s => {
        if (s.verdict === 'AC') acSet.add(s.problemId);
        if (s.verdict === 'AC') acCount++;
    });
    const cfSolved = acSet.size;
    const cfAcceptanceRate = total > 0 ? Math.round((acCount / total) * 100) : 0;

    // Active days (all CF submissions)
    const daySet = new Set();
    all.forEach(s => {
        const d = new Date(s.submittedAt).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        daySet.add(d);
    });
    const cfActiveDays = daySet.size;

    // this month / activeDays this month
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStr = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

    let cfSolvedThisMonth = 0;
    let cfSolvedLastMonth = 0;
    const thisMonthDaySet = new Set();
    const acThisMonth = new Set();
    const acLastMonth = new Set();

    // We iterate the submissions and add to valid days, using exactly YYYY-MM-DD.
    all.forEach(s => {
        const dateStr = getISTDate(s.submittedAt);
        const ym = dateStr.slice(0, 7);
        if (ym === monthStr) {
            thisMonthDaySet.add(dateStr);
            if (s.verdict === 'OK') acThisMonth.add(s.problemId);
        }
        if (ym === lastMonthStr && s.verdict === 'OK') acLastMonth.add(s.problemId);
    });
    cfSolvedThisMonth = acThisMonth.size;
    cfSolvedLastMonth = acLastMonth.size;
    const cfActiveDaysThisMonth = thisMonthDaySet.size;

    // Total submissions
    const cfTotalSubmissions = total;

    return {
        cfSolved,
        cfAcceptanceRate,
        cfActiveDays,
        cfActiveDaysThisMonth,
        cfSolvedThisMonth,
        cfSolvedLastMonth,
        cfTotalSubmissions,
        cfDaySet: daySet, // passed for streak computation
    };
};

// ── 2. CF streak from submission days set ────────────────────────────────────
const computeCfStreak = (cfDaySet) => {
    const sorted = [...cfDaySet].sort();
    if (sorted.length === 0) return { currentStreak: 0, bestStreak: 0 };

    let best = 1, cur = 1;
    for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1]);
        const next = new Date(sorted[i]);
        const diff = Math.round((next - prev) / 86400000);
        if (diff === 1) { cur++; best = Math.max(best, cur); }
        else if (diff > 1) cur = 1;
    }

    // Check if streak is still alive (did user submit today or yesterday?)
    const today = todayIST();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getISTDate(yesterday);
    const lastDay = sorted[sorted.length - 1];
    const activeCurrent = (lastDay === today || lastDay === yesterdayStr) ? cur : 0;

    return { currentStreak: activeCurrent, bestStreak: best };
};

// ── 3. CF difficulty — per exact rating (every rating with ≥1 solve) ──────────
const getCfDiffBands = async (userId) => {
    const uid = new mongoose.Types.ObjectId(userId);

    // Unique solved problems grouped by their exact difficulty rating
    const solved = await Submission.aggregate([
        { $match: { userId: uid, platform: 'codeforces', verdict: 'AC' } },
        { $group: { _id: '$problemId', difficulty: { $first: '$difficulty' } } },
        { $group: { _id: '$difficulty', count: { $sum: 1 } } },
        { $match: { _id: { $ne: '0', $ne: null, $ne: '' } } }, // exclude unrated
        { $sort: { _id: 1 } },
    ]);

    return solved
        .map(s => ({ rating: parseInt(s._id, 10) || 0, count: s.count }))
        .filter(s => s.rating > 0)
        .sort((a, b) => a.rating - b.rating);
};

// ── 4. CF heatmap (all platforms in Submission, lifetime) ───────────────
const getCfHeatmap = async (userId) => {
    const uid = new mongoose.Types.ObjectId(userId);

    return await Submission.aggregate([
        { $match: { userId: uid, platform: 'codeforces' } },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$submittedAt', timezone: 'Asia/Kolkata' } },
                count: { $sum: 1 },
            },
        },
        { $project: { _id: 0, date: '$_id', count: 1 } },
        { $sort: { date: 1 } },
    ]);
};

// ── 5. CF topics (solved only) ────────────────────────────────────────────────
const getCfTopics = async (userId) => {
    const uid = new mongoose.Types.ObjectId(userId);

    return await Submission.aggregate([
        { $match: { userId: uid, platform: 'codeforces', verdict: 'AC' } },
        { $group: { _id: '$problemId', tags: { $first: '$tags' } } },
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { _id: 0, name: '$_id', count: 1 } },
    ]);
};

// ── 6. Recent CF contests (from Platform.ratedHistory) ───────────────────────
const getRecentCfContests = async (userId) => {
    const platform = await Platform.findOne({ userId, platform: 'codeforces' })
        .select('ratedHistory platformUsername userId')
        .lean();

    if (!platform || !platform.ratedHistory || platform.ratedHistory.length === 0) return [];

    const history = [...platform.ratedHistory].sort((a, b) => new Date(b.date) - new Date(a.date));

    // Fetch submissions to map contestId by date proximity and count solved problems
    const subs = await Submission.find({ userId: platform.userId, platform: 'codeforces' })
        .select('contestId submittedAt verdict problemId').lean();

    return history.slice(0, 15).map((h, i) => {
        const prevRating = i < history.length - 1 ? history[i + 1].rating : h.rating;
        
        // Find nearest submission within 48 hours to reliably fetch the exact CF contestId
        let cid = null;
        let minDiff = Infinity;
        subs.forEach(s => {
            if (s.contestId) {
                const diff = Math.abs(new Date(s.submittedAt) - new Date(h.date));
                if (diff < 48 * 60 * 60 * 1000 && diff < minDiff) {
                    minDiff = diff;
                    cid = s.contestId;
                }
            }
        });

        let solved = 0;
        if (cid) {
            solved = new Set(
                subs.filter(s => String(s.contestId) === String(cid) && s.verdict === 'AC')
                    .map(s => s.problemId)
            ).size;
        }

        return {
            platform: 'codeforces',
            name: h.contestName || 'CF Contest',
            rank: h.rank || null,
            ratingChange: h.rating - prevRating,
            rating: h.rating,
            solved,
            date: new Date(h.date).toISOString().split('T')[0],
            url: cid ? `https://codeforces.com/contest/${cid}` : `https://codeforces.com/contests`,
        };
    });
};

// ── 7. Upsolve Queue ──────────────────────────────────────────────────────────
// Part A: Problems attempted but never ACed
// Part B: Problems from latest contest NOT attempted at all
const getUpsolveQueue = async (userId) => {
    const uid = new mongoose.Types.ObjectId(userId);

    // All CF submissions grouped by problemId
    const subs = await Submission.find({ userId: uid, platform: 'codeforces' })
        .select('problemId problemTitle verdict difficulty tags contestId submittedAt attemptCount')
        .lean();

    const problemMap = {};
    subs.forEach(s => {
        if (!problemMap[s.problemId]) {
            problemMap[s.problemId] = {
                problemId: s.problemId,
                title: s.problemTitle,
                rating: parseInt(s.difficulty, 10) || 0,
                contestId: s.contestId,
                tags: s.tags || [],
                verdicts: [],
                hasAC: false,
                attempts: 0,
            };
        }
        problemMap[s.problemId].verdicts.push(s.verdict);
        problemMap[s.problemId].attempts++;
        if (s.verdict === 'AC') problemMap[s.problemId].hasAC = true;
    });

    // Part A: attempted but never solved (WA/TLE/etc and no AC)
    const notSolved = Object.values(problemMap)
        .filter(p => !p.hasAC && p.attempts > 0)
        .map(p => ({
            platform: 'codeforces',
            problemId: p.problemId,
            title: p.title,
            contestName: p.contestId ? `Contest ${p.contestId}` : 'Practice',
            rating: p.rating,
            attempts: p.attempts,
            failReason: p.verdicts[p.verdicts.length - 1] || 'WA', // last verdict
        }));

    // Part B: Find the most recent contest and get problems not attempted
    // We identify "contest problems" = those with a contestId
    // Find the most recent contest
    const contestIds = [...new Set(subs.map(s => s.contestId).filter(Boolean))];
    let lastContestProblems = [];

    if (contestIds.length > 0) {
        // Find most recent contestId by latest submission date
        const contestLatestDate = {};
        subs.forEach(s => {
            if (!s.contestId) return;
            const d = new Date(s.submittedAt).getTime();
            if (!contestLatestDate[s.contestId] || d > contestLatestDate[s.contestId]) {
                contestLatestDate[s.contestId] = d;
            }
        });
        const sorted = Object.entries(contestLatestDate).sort((a, b) => b[1] - a[1]);
        const latestContestId = sorted[0][0];

        // All problems from that contest in our DB (attempted)
        const attemptedInContest = new Set(
            subs.filter(s => s.contestId === latestContestId).map(s => s.problemId)
        );

        // We don't have "all problems in a contest" without CF API, so
        // we just note how many problems from that contest were unattempted.
        // Instead: show solved problems from that contest as "review" and
        // actually surface NOT-ATTEMPTED from second-most-recent contest
        // (since for latest we may not have full problem list).
        // PRACTICAL APPROACH: skip "not attempted" since we have no problem list.
        // We'll rely purely on Part A (attempted but not AC).
        lastContestProblems = []; // can be populated in future with CF API
    }

    // Merge and deduplicate, sort least rating to most rating, cap at 10
    const combined = [...notSolved, ...lastContestProblems]
        .sort((a, b) => (a.rating || 0) - (b.rating || 0))
        .slice(0, 10);

    return combined;
};

// ── 8. Skill gaps ─────────────────────────────────────────────────────────────
const getSkillGaps = async (userId) => {
    const uid = new mongoose.Types.ObjectId(userId);

    // Group by tag: count AC and non-AC per unique problem
    const tagStats = await Submission.aggregate([
        { $match: { userId: uid, platform: 'codeforces' } },
        // One doc per (problem, tag, verdict type)
        { $group: { _id: '$problemId', tags: { $first: '$tags' }, hasAC: { $max: { $cond: [{ $eq: ['$verdict', 'AC'] }, 1, 0] } }, total: { $sum: 1 } } },
        { $unwind: '$tags' },
        {
            $group: {
                _id: '$tags',
                solved: { $sum: '$hasAC' },
                attempted: { $sum: 1 },
            },
        },
        { $match: { attempted: { $gte: 3 } } }, // minimum sample
        { $sort: { attempted: -1 } },
    ]);

    return tagStats.map(t => {
        // Raw accuracy rate
        const accuracy = t.attempted > 0 ? (t.solved / t.attempted) : 0;
        const status = accuracy < 0.4 ? 'weak' : accuracy <= 0.65 ? 'fair' : 'strong';
        return { 
            topic: t._id, 
            accuracy: Math.round(accuracy * 100), 
            status, 
            attempted: t.attempted, 
            solved: t.solved 
        };
    }).sort((a, b) => b.solved - a.solved); // Sort by highest volume (solved count)

};

// ── 9. CF Rating history ──────────────────────────────────────────────────────
const getCfRatingHistory = async (userId) => {
    const platform = await Platform.findOne({ userId, platform: 'codeforces' })
        .select('ratedHistory currentRating maxRating currentRank platformUsername')
        .lean();

    if (!platform) return { cfHandle: null, cfRating: 0, cfMaxRating: 0, cfRank: 'Unrated', cfRatingHistory: [] };

    const history = (platform.ratedHistory || [])
        .map(h => ({
            date: new Date(h.date).toISOString().split('T')[0],
            rating: h.rating,
            contestName: h.contestName || '',
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

    return {
        cfHandle: platform.platformUsername,
        cfRating: platform.currentRating || 0,
        cfMaxRating: platform.maxRating || 0,
        cfRank: platform.currentRank || 'Unrated',
        cfRatingHistory: history,
    };
};

// ── 10. Last 7 days (CF) ─────────────────────────────────────────────────────
const getCfLast7Days = async (userId) => {
    const uid = new mongoose.Types.ObjectId(userId);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const subs = await Submission.find({
        userId: uid,
        platform: 'codeforces',
        submittedAt: { $gte: sevenDaysAgo },
    }).select('submittedAt').lean();

    const daySet = new Set(
        subs.map(s => getISTDate(s.submittedAt))
    );

    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = getISTDate(d);
        days.push({ date: dateStr, solved: daySet.has(dateStr) });
    }
    return days;
};

module.exports = {
    getCfStats,
    computeCfStreak,
    getCfDiffBands,
    getCfHeatmap,
    getCfTopics,
    getRecentCfContests,
    getUpsolveQueue,
    getSkillGaps,
    getCfRatingHistory,
    getCfLast7Days,
};
