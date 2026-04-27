const Platform = require('../Model/Platform');
const Submission = require('../Model/Submissions');
const mongoose = require('mongoose');

function getISTDate(dateInput) {
    // Add IST offset (+5:30) directly to UTC ms — avoids the toLocaleString→re-parse
    // double-conversion bug where the locale string is parsed as local server time.
    const utcMs = new Date(dateInput).getTime();
    const istMs = utcMs + 5.5 * 60 * 60 * 1000;
    const d = new Date(istMs);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function getCcRankLabel(rating) {
    if (!rating || rating === 0) return 'Unrated';
    if (rating < 1400) return '1 Star';
    if (rating < 1600) return '2 Star';
    if (rating < 1800) return '3 Star';
    if (rating < 2000) return '4 Star';
    if (rating < 2200) return '5 Star';
    if (rating < 2500) return '6 Star';
    return '7 Star';
}

async function getCcAggregateDashboard(req, res) {
    try {
        const { userId } = req.params;
        const userObjectId = new mongoose.Types.ObjectId(userId);

        const [ccPlatform, rawCcSubmissions] = await Promise.all([
            Platform.findOne({ userId, platform: 'codechef' }).lean(),
            Submission.find({ userId: userObjectId, platform: 'codechef' })
                .select('submittedAt verdict problemId problemTitle language contestId')
                .lean(),
        ]);

        // Discard submissions with invalid / future / epoch dates — bad scrape artifacts.
        const nowMs = Date.now();
        const ccSubmissions = (() => {
            const valid = rawCcSubmissions.filter(s => {
                if (!s.submittedAt) return false;
                const t = new Date(s.submittedAt).getTime();
                return !isNaN(t) && t > 0 && t <= nowMs + 172_800_000;
            });
            // Dedup by {problemId, hour-bucket, verdict} — catches duplicate DB records where
            // the same submission was stored with submittedAt values up to 1 hour apart.
            // Relative-time strings ("5 hours ago") are now rounded to the hour at parse time,
            // so same-hour syncs hit the unique index. This layer catches cross-hour-boundary
            // stragglers without needing a delete-all before each sync.
            const seen = new Map();
            for (const s of valid) {
                const hour = Math.floor(new Date(s.submittedAt).getTime() / 3600000);
                const key = `${s.problemId}\x00${hour}\x00${s.verdict || ''}`;
                if (!seen.has(key)) seen.set(key, s);
            }
            return [...seen.values()];
        })();

        if (!ccPlatform) {
            return res.status(200).json({ success: true, data: null });
        }

        const currentRating = ccPlatform.currentRating || 0;
        const maxRating = ccPlatform.maxRating || 0;
        const now = new Date();
        // Use IST "today" for all date string comparisons — submissions are IST-stamped
        // and monthStr must match. Using UTC month would diverge by ~5.5h at boundaries.
        const todayIST = getISTDate(now);

        // ── Heatmap from cumulative submissions (5-year cap) ─────────────────
        const fiveYearsAgoStr = (() => {
            const d = new Date(); d.setFullYear(d.getFullYear() - 5);
            return getISTDate(d);
        })();
        const heatmapMap = {};
        ccSubmissions.forEach(s => {
            if (!s.submittedAt || new Date(s.submittedAt).getFullYear() < 2010) return;
            const dateStr = getISTDate(new Date(s.submittedAt));
            if (dateStr < fiveYearsAgoStr) return;
            heatmapMap[dateStr] = (heatmapMap[dateStr] || 0) + 1;
        });
        const ccHeatmap = Object.entries(heatmapMap)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // ── Streak from submission dates ──────────────────────────────────────
        const daySet = new Set(Object.keys(heatmapMap));
        const sorted = [...daySet].sort();
        let bestStreak = sorted.length ? 1 : 0;
        let cur = 1;
        for (let i = 1; i < sorted.length; i++) {
            const diff = Math.round((new Date(sorted[i]) - new Date(sorted[i - 1])) / 86400000);
            if (diff === 1) { cur++; bestStreak = Math.max(bestStreak, cur); }
            else if (diff > 1) cur = 1;
        }
        const today = todayIST;
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
        const yStr = getISTDate(yesterday);
        const last = sorted[sorted.length - 1];
        const currentStreak = sorted.length && (last === today || last === yStr) ? cur : 0;

        // ── Last 7 days ───────────────────────────────────────────────────────
        const ccLast7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            const dateStr = getISTDate(d);
            ccLast7Days.push({ date: dateStr, solved: daySet.has(dateStr) });
        }

        // ── AC submissions for solved counts ──────────────────────────────────
        const acSubmissions = ccSubmissions.filter(s => s.verdict === 'AC');
        const acProblemIds = new Set(acSubmissions.map(s => s.problemId));

        // Derive month strings from IST "today" so they match getISTDate() output on submissions
        const monthStr = todayIST.slice(0, 7);
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthStr = getISTDate(lastMonthDate).slice(0, 7);

        const acThisMonthIds = new Set(acSubmissions.filter(s => getISTDate(new Date(s.submittedAt)).startsWith(monthStr)).map(s => s.problemId));
        const acLastMonthIds = new Set(acSubmissions.filter(s => getISTDate(new Date(s.submittedAt)).startsWith(lastMonthStr)).map(s => s.problemId));
        const ccSolvedThisMonth = acThisMonthIds.size;
        const ccSolvedLastMonth = acLastMonthIds.size;

        // Active days this month / last month
        let activeDaysThisMonth = 0;
        let activeDaysLastMonth = 0;
        Object.keys(heatmapMap).forEach(d => {
            const ym = d.slice(0, 7);
            if (ym === monthStr) activeDaysThisMonth++;
            else if (ym === lastMonthStr) activeDaysLastMonth++;
        });

        // Acceptance rate
        const ccAcceptanceRate = ccSubmissions.length > 0
            ? Math.round((acSubmissions.length / ccSubmissions.length) * 100)
            : null;

        // ── Language distribution (top 8, all submissions) ────────────────────
        const langMap = {};
        ccSubmissions.forEach(s => {
            if (!s.language) return;
            const lang = s.language.trim();
            if (lang) langMap[lang] = (langMap[lang] || 0) + 1;
        });
        const languageDistribution = Object.entries(langMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([lang, count]) => ({ lang, count }));

        // ── Verdict breakdown ─────────────────────────────────────────────────
        const verdictBreakdown = { AC: 0, WA: 0, TLE: 0, MLE: 0, RE: 0, CE: 0, PA: 0, OTHER: 0 };
        ccSubmissions.forEach(s => {
            const v = s.verdict || 'OTHER';
            verdictBreakdown[v] = (verdictBreakdown[v] || 0) + 1;
        });

        // ── Contest history ───────────────────────────────────────────────────
        const ratedHistory = (ccPlatform.ratedHistory || [])
            .map(h => ({
                contestName: h.contestName || '',
                date: h.date ? new Date(h.date).toISOString().split('T')[0] : '',
                rating: h.rating || 0,
                rank: h.rank || null,
                contestCode: h.contestCode || '',
            }))
            .filter(h => h.date)
            .sort((a, b) => a.date.localeCompare(b.date));

        // Build contestCode → Set<problemId> map for AC submissions so we can count
        // how many unique problems the user solved in each contest.
        const contestAcMap = {};
        ccSubmissions.forEach(s => {
            if (s.verdict === 'AC' && s.contestId) {
                if (!contestAcMap[s.contestId]) contestAcMap[s.contestId] = new Set();
                contestAcMap[s.contestId].add(s.problemId);
            }
        });

        const recentCcContests = [...ratedHistory]
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 15)
            .map((c, i, arr) => {
                const prevRating = i < arr.length - 1 ? arr[i + 1].rating : c.rating;
                const solvedSet = c.contestCode ? contestAcMap[c.contestCode] : undefined;
                return {
                    platform: 'codechef',
                    name: c.contestName,
                    rank: c.rank,
                    ratingChange: c.rating - prevRating,
                    rating: c.rating,
                    date: c.date,
                    url: 'https://www.codechef.com/',
                    solved: solvedSet && solvedSet.size > 0 ? solvedSet.size : undefined,
                };
            });

        // ── Recent AC submissions (last 15, one per problem) ─────────────────
        // Dedup by problemId — the same problem can appear twice in the DB when
        // relative-time strings ("3h ago") were parsed across two sync runs at
        // slightly different wall-clock times, producing different submittedAt
        // values that bypass the unique index. Show only the most recent AC per problem.
        const seenProblems = new Set();
        const recentCcAcSubmissions = [...acSubmissions]
            .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
            .filter(s => {
                if (seenProblems.has(s.problemId)) return false;
                seenProblems.add(s.problemId);
                return true;
            })
            .slice(0, 15)
            .map(s => ({
                title: s.problemTitle || s.problemId || 'Unknown',
                problemId: s.problemId,
                url: s.problemId ? `https://www.codechef.com/problems/${s.problemId}` : null,
                submittedAt: s.submittedAt,
                verdict: 'AC',
            }));

        return res.status(200).json({
            success: true,
            data: {
                ccHandle: ccPlatform.platformUsername,
                currentRating,
                maxRating,
                currentRank: ccPlatform.currentRank || getCcRankLabel(currentRating),
                maxRank: ccPlatform.maxRank || getCcRankLabel(maxRating),
                totalSolved: ccPlatform.totalSolved || 0,
                contestsParticipated: ccPlatform.contestsParticipated || 0,
                globalRank: ccPlatform.globalRank || 0,
                countryRank: ccPlatform.countryRank || 0,
                currentStreak,
                bestStreak,
                activeDaysThisMonth,
                activeDaysLastMonth,
                ccSolvedThisMonth,
                ccSolvedLastMonth,
                ccHeatmap,
                ccLast7Days,
                ratingHistory: ratedHistory,
                recentCcContests,
                totalSubmissions: ccSubmissions.length,
                ccAcSubmissions: acSubmissions.length,
                uniqueSolved: acProblemIds.size,
                ccAcceptanceRate,
                languageDistribution,
                verdictBreakdown,
                recentCcAcSubmissions,
                lastSyncedAt: ccPlatform.lastSyncedAt || null,
            },
        });
    } catch (error) {
        console.error('error in getCcAggregateDashboard:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

async function getCcProfile(req, res) {
    try {
        const { userId } = req.params;
        const ccPlatform = await Platform.findOne({ userId, platform: 'codechef' })
            .select('platformUsername currentRating maxRating currentRank maxRank totalSolved contestsParticipated globalRank countryRank lastSyncedAt')
            .lean();
        if (!ccPlatform) return res.status(200).json({ success: true, data: null });
        return res.status(200).json({ success: true, data: ccPlatform });
    } catch (error) {
        console.error('error in getCcProfile:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

async function getCcRatingHistory(req, res) {
    try {
        const { userId } = req.params;
        const ccPlatform = await Platform.findOne({ userId, platform: 'codechef' })
            .select('ratedHistory currentRating maxRating')
            .lean();
        if (!ccPlatform) return res.status(200).json({ success: true, data: null });
        const history = (ccPlatform.ratedHistory || [])
            .map(h => ({
                contestName: h.contestName || '',
                date: h.date ? new Date(h.date).toISOString().split('T')[0] : '',
                rating: h.rating || 0,
                rank: h.rank || null,
            }))
            .filter(h => h.date)
            .sort((a, b) => a.date.localeCompare(b.date));
        return res.status(200).json({
            success: true,
            data: { currentRating: ccPlatform.currentRating || 0, maxRating: ccPlatform.maxRating || 0, history },
        });
    } catch (error) {
        console.error('error in getCcRatingHistory:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

module.exports = { getCcAggregateDashboard, getCcProfile, getCcRatingHistory };
