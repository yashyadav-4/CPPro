const mongoose = require('mongoose');
const Submissions = require('../Model/Submissions');
const Platform = require('../Model/Platform');
const LeetCodeData = require('../Model/LeetCodeData');
const CFProblem = require('../Model/CFProblem');
const CCProblem = require('../Model/CCProblem');
const LCProblem = require('../Model/LCProblem');
const User = require('../Model/User');
const LevelUpData = require('../Model/LevelUpData');
const { getUpsolveRecommendations } = require('./upsolveRecommendationService');

/**
 * Converts an LC contest title to the tag slug stored in LCProblem.tags
 * by syncLCContestTags (which uses contest.titleSlug directly).
 * "Weekly Contest 400"    → "weekly-contest-400"
 * "Biweekly Contest 130"  → "biweekly-contest-130"
 *
 * NOTE: The old "leetcode-weekly-contest-N" format in topicTags was from
 * the raw LC problem catalog (topicTags). The syncLCContestTags endpoint
 * stores contest.titleSlug directly (no prefix), so we match that format.
 */
const lcContestTitleToTag = (title) => {
    if (!title || typeof title !== 'string') return null;
    // Lowercase + spaces to hyphens — matches LC's own titleSlug convention
    return title.trim().toLowerCase().replace(/\s+/g, '-');
};

const calculateUpsolveQueue = async (userId) => {
    try {
        const [cfPlatform, ccPlatform, lcData] = await Promise.all([
            Platform.findOne({ userId, platform: 'codeforces' }).lean(),
            Platform.findOne({ userId, platform: 'codechef' }).lean(),
            LeetCodeData.findOne({ userId }).lean(),
        ]);

        const cfRating = cfPlatform?.currentRating || 0;
        const ccRating = ccPlatform?.currentRating || 0;

        const targetPlatforms = ['codeforces', 'leetcode', 'codechef'];
        let upsolveList = [];

        // RULE 1: Failed Attempts
        const submissions = await Submissions.find({
            userId,
            platform: { $in: targetPlatforms },
            verdict: { $nin: ['AC', 'OK'] },
        }).sort({ submittedAt: -1 }).lean();

        const acSubmissions = await Submissions.find({
            userId,
            platform: { $in: targetPlatforms },
            verdict: { $in: ['AC', 'OK'] },
        }).lean();
        
        const acKeys = new Set(acSubmissions.map(s => `${s.platform}-${s.problemId}`));

        const failedMap = new Map();
        for (const sub of submissions) {
            const key = `${sub.platform}-${sub.problemId}`;
            if (acKeys.has(key)) continue;
            
            if (!failedMap.has(key)) {
                failedMap.set(key, {
                    platform: sub.platform,
                    problemId: sub.problemId,
                    title: sub.problemTitle || sub.problemId,
                    rating: sub.difficulty,
                    failReason: sub.verdict,
                    contestName: sub.contestId,
                    attempts: 1,
                    submittedAt: sub.submittedAt
                });
            } else {
                failedMap.get(key).attempts++;
            }
        }

        const ccProblemIdsToEnrich = [];
        const lcProblemIdsToEnrich = [];
        
        for (const prob of failedMap.values()) {
            if (prob.platform === 'codechef' && (!prob.rating || prob.rating === '0' || prob.rating === 0)) {
                ccProblemIdsToEnrich.push(prob.problemId);
            } else if (prob.platform === 'leetcode' && (!prob.rating || prob.rating === '0' || prob.rating === 0)) {
                lcProblemIdsToEnrich.push(prob.problemId);
            }
        }
        
        if (ccProblemIdsToEnrich.length > 0) {
            const ccProblems = await CCProblem.find({ problemId: { $in: ccProblemIdsToEnrich } }).lean();
            const ccDifficultyMap = new Map(ccProblems.map(p => [p.problemId, p.difficulty]));
            
            for (const prob of failedMap.values()) {
                if (prob.platform === 'codechef' && ccDifficultyMap.has(prob.problemId)) {
                    const diff = ccDifficultyMap.get(prob.problemId);
                    if (diff) prob.rating = diff;
                }
            }
        }
        
        if (lcProblemIdsToEnrich.length > 0) {
            const lcProblems = await LCProblem.find({ problemId: { $in: lcProblemIdsToEnrich } }).lean();
            const lcDifficultyMap = new Map(lcProblems.map(p => [p.problemId, p.difficulty]));
            
            for (const prob of failedMap.values()) {
                if (prob.platform === 'leetcode' && lcDifficultyMap.has(prob.problemId)) {
                    const diff = lcDifficultyMap.get(prob.problemId);
                    if (diff) prob.rating = diff;
                }
            }
        }

        for (const [key, prob] of failedMap.entries()) {
            if (prob.platform === 'codeforces') {
                const numericRating = Number(prob.rating);
                if (!isNaN(numericRating) && numericRating > cfRating + 300) {
                    continue;
                }
            } else if (prob.platform === 'codechef') {
                const numericRating = Number(prob.rating);
                if (!isNaN(numericRating) && numericRating > ccRating + 300) {
                    continue;
                }
            }
            upsolveList.push(prob);
        }

        // RULE 2: Unattempted CF Contest Problems (participated contests ONLY)
        if (cfPlatform?.ratedHistory?.length > 0) {
            const cfSubs = await Submissions.find({ userId, platform: 'codeforces' }).lean();
            
            const contestIdTimes = new Map();
            for (const sub of cfSubs) {
                if (!sub.contestId) continue;
                const cId = String(sub.contestId);
                const t = new Date(sub.submittedAt).getTime();
                const ex = contestIdTimes.get(cId);
                if (!ex || t < ex.earliest) {
                    contestIdTimes.set(cId, { earliest: t });
                }
            }
            
            const recentContests = [...cfPlatform.ratedHistory]
                .sort((a, b) => new Date(b.date) - new Date(a.date));
            
            const usedContestIds = new Set(
                recentContests.filter(c => c.contestCode).map(c => c.contestCode)
            );
            
            let unattemptedFound = 0;
            const TARGET_UNATTEMPTED = 8;
            
            for (const contest of recentContests) {
                if (unattemptedFound >= TARGET_UNATTEMPTED) break;
                
                let cId = contest.contestCode || '';
                
                if (!cId) {
                    const ratingTime = new Date(contest.date).getTime();
                    let bestMatch = null;
                    let bestDiff = Infinity;
                    
                    for (const [candidateId, times] of contestIdTimes) {
                        if (usedContestIds.has(candidateId)) continue;
                        if (times.earliest <= ratingTime) {
                            const diff = ratingTime - times.earliest;
                            if (diff < 14 * 86400000 && diff < bestDiff) {
                                bestDiff = diff;
                                bestMatch = candidateId;
                            }
                        }
                    }
                    
                    if (bestMatch) {
                        cId = bestMatch;
                        usedContestIds.add(cId);
                    }
                }
                
                if (!cId) continue;
                
                const attemptedInContest = new Set(
                    cfSubs.filter(s => String(s.contestId) === cId).map(s => s.problemId)
                );
                
                const contestProblems = await CFProblem.find({ contestId: Number(cId) }).sort({ index: 1 }).lean();
                if (contestProblems.length === 0) continue;
                
                for (const cp of contestProblems) {
                    if (!attemptedInContest.has(cp.problemId) && !acKeys.has(`codeforces-${cp.problemId}`)) {
                        if (cp.difficulty <= cfRating + 300) {
                            const isAlreadyIn = upsolveList.some(u => u.platform === 'codeforces' && u.problemId === cp.problemId);
                            if (!isAlreadyIn) {
                                upsolveList.push({
                                    platform: 'codeforces',
                                    problemId: cp.problemId,
                                    title: cp.title,
                                    rating: cp.difficulty,
                                    failReason: 'Unattempted',
                                    contestName: contest.contestName || `Contest ${cId}`,
                                    attempts: 0,
                                    submittedAt: contest.date || new Date().toISOString()
                                });
                                unattemptedFound++;
                            }
                        }
                        break;
                    }
                }
            }
        }

        // RULE 3: Unattempted LC Contest Problems (attended contests ONLY)
        //
        // Data sources for "has the user solved this problem?":
        //   - Primary:    acKeys (built from Submissions collection — all platform AC verdicts)
        //   - Supplement: lcAcSlugSet (from LeetCodeData.recentSubmissions — covers last 20/200 AC subs
        //                 for users whose Submissions haven't been populated yet, e.g. new accounts)
        //
        // Contest→problem mapping: LCProblem.tags contains the contest titleSlug
        // (e.g. "weekly-contest-400") added by POST /api/admin/sync/lc-contest-tags.
        // If this admin sync hasn't run for a contest, the query returns 0 results → skipped gracefully.
        if (lcData?.contestHistory?.length > 0) {

            // ── Build supplementary LC AC slug set from recentSubmissions ────────
            // acKeys (from Submissions collection) is the primary truth; this covers
            // new users or users with LC but no session (limited to 20 public AC subs).
            const lcAcSlugSet = new Set();
            if (Array.isArray(lcData.recentSubmissions)) {
                for (const sub of lcData.recentSubmissions) {
                    if (!sub?.titleSlug) continue;
                    // Public sync: statusDisplay is '' (all entries are from recentAcSubmissionList → AC)
                    // Authenticated sync: statusDisplay is 'Accepted' for AC, other strings for non-AC
                    if (sub.statusDisplay === '' || sub.statusDisplay === 'Accepted') {
                        lcAcSlugSet.add(sub.titleSlug);
                    }
                }
            }

            // ── Build attended contest list, newest first ─────────────────────────
            const attendedContests = lcData.contestHistory
                .filter(c => c?.attended === true && c?.contestTitle)
                .sort((a, b) => (b.contestStartTime || 0) - (a.contestStartTime || 0));

            if (attendedContests.length === 0) {
                console.log(`[Rule3-LC] userId=${userId} | no attended contests in history`);
            } else {
                // ── Derive contest tags and skip fully-solved contests early ──────
                // contestHistory.problemsSolved tells us how many the user solved in the contest.
                // If they solved all, there's nothing to upsolve — skip without a DB query.
                const contestsToCheck = attendedContests.filter(c => {
                    const allSolved = typeof c.problemsSolved === 'number'
                        && typeof c.totalProblems === 'number'
                        && c.totalProblems > 0
                        && c.problemsSolved >= c.totalProblems;
                    return !allSolved;
                });

                // Map contest title → tag slug (e.g. "Weekly Contest 400" → "weekly-contest-400")
                const tagToContest = new Map(); // tag → contest entry
                for (const c of contestsToCheck) {
                    const tag = lcContestTitleToTag(c.contestTitle);
                    if (tag && !tagToContest.has(tag)) {
                        tagToContest.set(tag, c);
                    }
                }

                const allTags = [...tagToContest.keys()];

                console.log(`[Rule3-LC] userId=${userId} | attended=${attendedContests.length} | toCheck=${contestsToCheck.length} | tags=${allTags.length}`);

                if (allTags.length > 0) {
                    // ── SINGLE batched query: fetch all contest problems at once ──
                    const allContestProblems = await LCProblem.find(
                        { tags: { $in: allTags } },
                        { problemId: 1, title: 1, difficulty: 1, tags: 1 }
                    ).lean();

                    // Group problems by contest tag
                    // A problem can appear in multiple contest tags; we key by each matching tag
                    const problemsByTag = new Map(); // tag → Problem[]
                    for (const prob of allContestProblems) {
                        for (const tag of (prob.tags || [])) {
                            if (tagToContest.has(tag)) {
                                if (!problemsByTag.has(tag)) problemsByTag.set(tag, []);
                                problemsByTag.get(tag).push(prob);
                            }
                        }
                    }

                    let lcUnattemptedFound = 0;
                    const LC_TARGET_UNATTEMPTED = 8;

                    // Process in newest-first order (contestsToCheck is already sorted)
                    for (const contest of contestsToCheck) {
                        if (lcUnattemptedFound >= LC_TARGET_UNATTEMPTED) break;

                        const tag = lcContestTitleToTag(contest.contestTitle);
                        if (!tag) continue;

                        const contestProblems = problemsByTag.get(tag);
                        if (!contestProblems || contestProblems.length === 0) continue;

                        // Find first unsolved problem.
                        // Natural catalog order (inserted by questionId asc) = A→B→C→D within a contest.
                        for (const cp of contestProblems) {
                            const isAcedInSubmissions = acKeys.has(`leetcode-${cp.problemId}`);
                            const isAcedInLcData = lcAcSlugSet.has(cp.problemId);

                            if (!isAcedInSubmissions && !isAcedInLcData) {
                                // Don't push the same problem twice (e.g. problem in two different contests)
                                const alreadyIn = upsolveList.some(
                                    u => u.platform === 'leetcode' && u.problemId === cp.problemId
                                );
                                if (!alreadyIn) {
                                    upsolveList.push({
                                        platform: 'leetcode',
                                        problemId: cp.problemId,
                                        title: cp.title,
                                        rating: cp.difficulty,
                                        failReason: 'Unattempted',
                                        contestName: contest.contestTitle,
                                        attempts: 0,
                                        submittedAt: contest.contestStartTime
                                            ? new Date(contest.contestStartTime * 1000).toISOString()
                                            : new Date().toISOString(),
                                    });
                                    lcUnattemptedFound++;
                                    console.log(`[Rule3-LC] ✓ "${cp.title}" from "${contest.contestTitle}"`);
                                }
                                break; // only first unsolved per contest
                            }
                        }
                    }

                    console.log(`[Rule3-LC] done — ${lcUnattemptedFound} LC contest items added`);
                }
            }
        }

        return upsolveList;
    } catch (err) {
        console.error('Error calculating upsolve queue:', err);
        return [];
    }
};

const calculatePerformanceStats = async (userId) => {
    try {
        const userObjId = new mongoose.Types.ObjectId(userId);

        const now = new Date();
        const last30Start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const prev30Start = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        const last30StartSec = Math.floor(last30Start.getTime() / 1000);
        const prev30StartSec = Math.floor(prev30Start.getTime() / 1000);
        const nowSec = Math.floor(now.getTime() / 1000);

        const [agg, userData, platforms, lcData] = await Promise.all([
            Submissions.aggregate([
                { $match: { userId: userObjId, submittedAt: { $gte: prev30Start } } },
                {
                    $facet: {
                        current30: [
                            { $match: { submittedAt: { $gte: last30Start, $lte: now } } },
                            {
                                $group: {
                                    _id: null,
                                    totalSubs: { $sum: 1 },
                                    acCount: {
                                        $sum: { $cond: [{ $eq: ['$verdict', 'AC'] }, 1, 0] }
                                    },
                                    uniqueDays: {
                                        $addToSet: {
                                            $dateToString: { format: '%Y-%m-%d', date: '$submittedAt', timezone: '+05:30' }
                                        }
                                    }
                                }
                            }
                        ],
                        prev30: [
                            { $match: { submittedAt: { $gte: prev30Start, $lt: last30Start } } },
                            {
                                $group: {
                                    _id: null,
                                    totalSubs: { $sum: 1 },
                                    acCount: {
                                        $sum: { $cond: [{ $eq: ['$verdict', 'AC'] }, 1, 0] }
                                    },
                                    uniqueDays: {
                                        $addToSet: {
                                            $dateToString: { format: '%Y-%m-%d', date: '$submittedAt', timezone: '+05:30' }
                                        }
                                    }
                                }
                            }
                        ],
                        dailyActivity: [
                            { $match: { submittedAt: { $gte: last30Start, $lte: now }, verdict: 'AC' } },
                            {
                                $group: {
                                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$submittedAt', timezone: '+05:30' } },
                                    count: { $sum: 1 }
                                }
                            },
                            { $sort: { _id: 1 } }
                        ],
                        weeklyBreakdown: [
                            { $match: { submittedAt: { $gte: last30Start, $lte: now }, verdict: 'AC' } },
                            {
                                $group: {
                                    _id: { week: { $isoWeek: '$submittedAt' }, platform: '$platform' },
                                    count: { $sum: 1 }
                                }
                            }
                        ],
                        verdictDist: [
                            { $match: { submittedAt: { $gte: last30Start, $lte: now } } },
                            {
                                $group: {
                                    _id: '$verdict',
                                    count: { $sum: 1 }
                                }
                            }
                        ],
                        platformSplit: [
                            { $match: { submittedAt: { $gte: last30Start, $lte: now }, verdict: 'AC' } },
                            {
                                $group: {
                                    _id: '$platform',
                                    count: { $sum: 1 }
                                }
                            }
                        ],
                        difficultyDist: [
                            { $match: { submittedAt: { $gte: last30Start, $lte: now }, verdict: 'AC' } },
                            {
                                $group: {
                                    _id: '$difficulty',
                                    count: { $sum: 1 }
                                }
                            }
                        ],
                        languageDist: [
                            { $match: { submittedAt: { $gte: last30Start, $lte: now }, language: { $ne: '' } } },
                            {
                                $group: {
                                    _id: '$language',
                                    count: { $sum: 1 }
                                }
                            },
                            { $sort: { count: -1 } },
                            { $limit: 8 }
                        ],
                        topTags: [
                            { $match: { submittedAt: { $gte: last30Start, $lte: now }, verdict: 'AC' } },
                            { $unwind: '$tags' },
                            {
                                $group: {
                                    _id: '$tags',
                                    count: { $sum: 1 }
                                }
                            },
                            { $sort: { count: -1 } },
                            { $limit: 10 }
                        ],
                        tagAccuracy: [
                            { $match: { submittedAt: { $gte: last30Start, $lte: now } } },
                            { $unwind: '$tags' },
                            {
                                $group: {
                                    _id: '$tags',
                                    total: { $sum: 1 },
                                    ac: { $sum: { $cond: [{ $eq: ['$verdict', 'AC'] }, 1, 0] } }
                                }
                            },
                            { $match: { total: { $gte: 2 } } }
                        ],
                        dayOfWeekDist: [
                            { $match: { submittedAt: { $gte: last30Start, $lte: now }, verdict: 'AC' } },
                            {
                                $group: {
                                    _id: { $dayOfWeek: '$submittedAt' },
                                    count: { $sum: 1 }
                                }
                            }
                        ],
                        avgDiffCurrent: [
                            { $match: { submittedAt: { $gte: last30Start, $lte: now }, verdict: 'AC', difficulty: { $nin: ['0', '', null] } } },
                            { $addFields: { diffNum: { $convert: { input: '$difficulty', to: 'double', onError: null, onNull: null } } } },
                            { $match: { diffNum: { $gt: 0 } } },
                            { $group: { _id: null, avg: { $avg: '$diffNum' }, max: { $max: '$diffNum' } } }
                        ],
                        avgDiffPrev: [
                            { $match: { submittedAt: { $gte: prev30Start, $lt: last30Start }, verdict: 'AC', difficulty: { $nin: ['0', '', null] } } },
                            { $addFields: { diffNum: { $convert: { input: '$difficulty', to: 'double', onError: null, onNull: null } } } },
                            { $match: { diffNum: { $gt: 0 } } },
                            { $group: { _id: null, avg: { $avg: '$diffNum' } } }
                        ]
                    }
                }
            ]),
            User.findById(userId, 'linkedAccounts dailyStreak').lean(),
            Platform.find({ userId }).lean(),
            LeetCodeData.findOne({ userId }).lean()
        ]);

        let lcCurrent30 = 0;
        let lcPrev30 = 0;
        const lcDailyMap = {};
        const lcWeeklyMap = {};
        let lcCurrentActiveDays = new Set();
        let lcPrevActiveDays = new Set();

        if (lcData?.calendar?.submissionCalendar) {
            try {
                const calObj = typeof lcData.calendar.submissionCalendar === 'string'
                    ? JSON.parse(lcData.calendar.submissionCalendar)
                    : lcData.calendar.submissionCalendar;

                for (const [ts, count] of Object.entries(calObj)) {
                    const sec = Number(ts);
                    if (!sec || !count) continue;

                    if (sec >= last30StartSec && sec <= nowSec) {
                        lcCurrent30 += count;
                        const d = new Date((sec + 5.5 * 3600) * 1000);
                        const dateStr = d.toISOString().slice(0, 10);
                        lcDailyMap[dateStr] = (lcDailyMap[dateStr] || 0) + count;
                        lcCurrentActiveDays.add(dateStr);

                        const jsDate = new Date(sec * 1000);
                        const dayOfYear = Math.floor((jsDate - new Date(jsDate.getFullYear(), 0, 1)) / 86400000);
                        const weekNum = Math.ceil((dayOfYear + new Date(jsDate.getFullYear(), 0, 1).getDay() + 1) / 7);
                        lcWeeklyMap[weekNum] = (lcWeeklyMap[weekNum] || 0) + count;
                    } else if (sec >= prev30StartSec && sec < last30StartSec) {
                        lcPrev30 += count;
                        const d = new Date((sec + 5.5 * 3600) * 1000);
                        const dateStr = d.toISOString().slice(0, 10);
                        lcPrevActiveDays.add(dateStr);
                    }
                }
            } catch (e) {
                console.warn('[PerformanceStats] Failed to parse LC submissionCalendar:', e.message);
            }
        }

        const cfccCurrent = agg[0].current30[0] || { totalSubs: 0, acCount: 0, uniqueDays: [] };
        const cfccPrev = agg[0].prev30[0] || { totalSubs: 0, acCount: 0, uniqueDays: [] };

        const currentSolved = cfccCurrent.acCount + lcCurrent30;
        const prevSolved = cfccPrev.acCount + lcPrev30;
        const currentTotalSubs = cfccCurrent.totalSubs + lcCurrent30;
        const prevTotalSubs = cfccPrev.totalSubs + lcPrev30;

        const allCurrentActiveDays = new Set([...cfccCurrent.uniqueDays, ...lcCurrentActiveDays]);
        const allPrevActiveDays = new Set([...cfccPrev.uniqueDays, ...lcPrevActiveDays]);
        const currentActiveDays = allCurrentActiveDays.size;
        const prevActiveDays = allPrevActiveDays.size;

        const currentAccRate = currentTotalSubs > 0 ? Math.round((currentSolved / currentTotalSubs) * 100) : 0;
        const prevAccRate = prevTotalSubs > 0 ? Math.round((prevSolved / prevTotalSubs) * 100) : 0;
        const avgPerDay = currentActiveDays > 0 ? +(currentSolved / currentActiveDays).toFixed(1) : 0;

        const mergedDailyMap = {};
        for (const entry of agg[0].dailyActivity) {
            mergedDailyMap[entry._id] = (mergedDailyMap[entry._id] || 0) + entry.count;
        }
        for (const [date, count] of Object.entries(lcDailyMap)) {
            mergedDailyMap[date] = (mergedDailyMap[date] || 0) + count;
        }
        const dailyActivity = Object.entries(mergedDailyMap)
            .map(([_id, count]) => ({ _id, count }))
            .sort((a, b) => a._id.localeCompare(b._id));

        const platformSplit = [...agg[0].platformSplit];
        if (lcCurrent30 > 0) {
            const existing = platformSplit.find(p => p._id === 'leetcode');
            if (existing) {
                existing.count += lcCurrent30;
            } else {
                platformSplit.push({ _id: 'leetcode', count: lcCurrent30 });
            }
        }

        const weeklyBreakdown = [...agg[0].weeklyBreakdown];
        for (const [weekStr, count] of Object.entries(lcWeeklyMap)) {
            weeklyBreakdown.push({ _id: { week: Number(weekStr), platform: 'leetcode' }, count });
        }

        const weekNums = [...new Set(weeklyBreakdown.map(w => w._id.week))].sort((a, b) => a - b);
        const weeklyData = weekNums.slice(-4).map((weekNum, idx) => {
            const entries = weeklyBreakdown.filter(w => w._id.week === weekNum);
            const row = { week: `Week ${idx + 1}`, codeforces: 0, leetcode: 0, codechef: 0 };
            for (const entry of entries) {
                row[entry._id.platform] = (row[entry._id.platform] || 0) + entry.count;
            }
            return row;
        });

        const cfPlatform = platforms.find(p => p.platform === 'codeforces');
        const ccPlatform = platforms.find(p => p.platform === 'codechef');

        const cfRating = cfPlatform?.currentRating || 0;
        const ccRating = ccPlatform?.currentRating || 0;

        let lcRating = 0;
        if (lcData?.contestHistory?.length) {
            const attended = lcData.contestHistory.filter(c => c.attended);
            if (attended.length > 0) {
                lcRating = Math.round(attended[attended.length - 1].rating || 0);
            }
        }

        let cfPrevRating = cfRating;
        if (cfPlatform?.ratedHistory?.length) {
            const before = cfPlatform.ratedHistory.filter(h => new Date(h.date) < last30Start);
            if (before.length > 0) {
                cfPrevRating = before[before.length - 1].rating || cfRating;
            }
        }

        let ccPrevRating = ccRating;
        if (ccPlatform?.ratedHistory?.length) {
            const before = ccPlatform.ratedHistory.filter(h => new Date(h.date) < last30Start);
            if (before.length > 0) {
                ccPrevRating = before[before.length - 1].rating || ccRating;
            }
        }

        let lcPrevRating = lcRating;
        if (lcData?.contestHistory?.length) {
            const attendedBefore = lcData.contestHistory.filter(c => c.attended && c.contestStartTime < last30StartSec);
            if (attendedBefore.length > 0) {
                lcPrevRating = Math.round(attendedBefore[attendedBefore.length - 1].rating || 0);
            }
        }

        const todayIST = new Date(now.getTime() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
        let codingStreak = 0;
        for (let i = 0; i < 60; i++) {
            const d = new Date(now.getTime() - i * 86400000 + 5.5 * 3600 * 1000);
            const ds = d.toISOString().slice(0, 10);
            if (mergedDailyMap[ds] || allCurrentActiveDays.has(ds)) {
                codingStreak++;
            } else if (i === 0) {
                continue;
            } else {
                break;
            }
        }

        const activeDaysRatio = Math.min(currentActiveDays / 30, 1);
        const streakRatio = Math.min(codingStreak / 30, 1);
        const avgRatio = Math.min(avgPerDay / 8, 1);
        const consistencyScore = Math.round(activeDaysRatio * 40 + streakRatio * 35 + avgRatio * 25);

        const tagAccuracyRaw = agg[0].tagAccuracy || [];
        const weaknessTags = tagAccuracyRaw
            .map(t => ({ tag: t._id, total: t.total, ac: t.ac, rate: Math.round((t.ac / t.total) * 100) }))
            .sort((a, b) => a.rate - b.rate)
            .slice(0, 6);
        const strengthTags = tagAccuracyRaw
            .filter(t => t.ac >= 2)
            .map(t => ({ tag: t._id, total: t.total, ac: t.ac, rate: Math.round((t.ac / t.total) * 100) }))
            .sort((a, b) => b.rate - a.rate)
            .slice(0, 5);

        const avgDiffCurr = agg[0].avgDiffCurrent?.[0]?.avg ? Math.round(agg[0].avgDiffCurrent[0].avg) : 0;
        const maxDiffCurr = agg[0].avgDiffCurrent?.[0]?.max ? Math.round(agg[0].avgDiffCurrent[0].max) : 0;
        const avgDiffPrev = agg[0].avgDiffPrev?.[0]?.avg ? Math.round(agg[0].avgDiffPrev[0].avg) : 0;

        const DOW_NAMES = ['', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayOfWeek = (agg[0].dayOfWeekDist || [])
            .map(d => ({ day: DOW_NAMES[d._id] || d._id, count: d.count, dayNum: d._id }))
            .sort((a, b) => a.dayNum - b.dayNum);
        for (let i = 1; i <= 7; i++) {
            if (!dayOfWeek.find(d => d.dayNum === i)) {
                dayOfWeek.push({ day: DOW_NAMES[i], count: 0, dayNum: i });
            }
        }
        dayOfWeek.sort((a, b) => a.dayNum - b.dayNum);
        const reordered = [...dayOfWeek.slice(1), dayOfWeek[0]];

        const insights = [];
        if (prevSolved > 0 && currentSolved > prevSolved) {
            const pctUp = Math.round(((currentSolved - prevSolved) / prevSolved) * 100);
            insights.push({ type: 'positive', icon: 'trending-up', text: `You solved ${pctUp > 500 ? (currentSolved - prevSolved) + ' more' : pctUp + '% more'} problems than last month. Keep the momentum!` });
        } else if (currentSolved > 0 && prevSolved === 0) {
            insights.push({ type: 'positive', icon: 'rocket', text: `You solved ${currentSolved} problems this month — great start!` });
        } else if (prevSolved > 0 && currentSolved < prevSolved) {
            insights.push({ type: 'warning', icon: 'trending-down', text: `Activity dipped from ${prevSolved} to ${currentSolved} solved. Try setting a daily goal.` });
        }
        if (weaknessTags.length > 0 && weaknessTags[0].rate < 50) {
            insights.push({ type: 'info', icon: 'target', text: `Your weakest area is "${weaknessTags[0].tag}" (${weaknessTags[0].rate}% acceptance). Focus practice here for maximum growth.` });
        }
        if (currentActiveDays >= 25) {
            insights.push({ type: 'positive', icon: 'flame', text: `${currentActiveDays}/30 active days — exceptional consistency! You're building a strong habit.` });
        } else if (currentActiveDays >= 15) {
            insights.push({ type: 'info', icon: 'calendar', text: `${currentActiveDays}/30 active days. Try to code daily — even 1 problem on rest days helps retention.` });
        } else if (currentActiveDays > 0) {
            insights.push({ type: 'warning', icon: 'calendar', text: `Only ${currentActiveDays}/30 days active. Consistent practice beats intense bursts. Start with 1 easy problem daily.` });
        }
        if (avgDiffCurr > 0 && avgDiffPrev > 0 && avgDiffCurr > avgDiffPrev) {
            insights.push({ type: 'positive', icon: 'arrow-up', text: `Average problem difficulty increased from ${avgDiffPrev} to ${avgDiffCurr}. You're leveling up!` });
        } else if (avgDiffCurr > 0 && avgDiffPrev > 0 && avgDiffCurr < avgDiffPrev) {
            insights.push({ type: 'info', icon: 'info', text: `Average difficulty dropped from ${avgDiffPrev} to ${avgDiffCurr}. Mix in some harder problems to keep growing.` });
        }
        if (reordered.length > 0) {
            const bestDay = reordered.reduce((a, b) => a.count > b.count ? a : b);
            const worstDay = reordered.reduce((a, b) => a.count < b.count ? a : b);
            if (bestDay.count > 0 && worstDay.count === 0) {
                insights.push({ type: 'info', icon: 'lightbulb', text: `You're most productive on ${bestDay.day}s. Try practicing on ${worstDay.day}s too for balanced growth.` });
            }
        }
        if (maxDiffCurr > 0) {
            insights.push({ type: 'positive', icon: 'trophy', text: `Hardest problem solved this month: rated ${maxDiffCurr}. Push for ${maxDiffCurr + 100}+ next!` });
        }

        const recentContests = [];
        if (cfPlatform?.ratedHistory?.length) {
            const hist = cfPlatform.ratedHistory;
            const startIdx = Math.max(0, hist.length - 5);
            for (let i = hist.length - 1; i >= startIdx; i--) {
                const c = hist[i];
                const newR = c.rating || c.newRating || 0;
                const prevR = i > 0 ? (hist[i - 1].rating || hist[i - 1].newRating || 0) : newR;
                recentContests.push({
                    platform: 'codeforces',
                    name: c.contestName || 'CF Contest',
                    date: c.date,
                    rating: newR,
                    delta: newR - prevR,
                    rank: c.rank || null
                });
            }
        }
        if (ccPlatform?.ratedHistory?.length) {
            const hist = ccPlatform.ratedHistory;
            const startIdx = Math.max(0, hist.length - 5);
            for (let i = hist.length - 1; i >= startIdx; i--) {
                const c = hist[i];
                const newR = c.rating || c.newRating || 0;
                const prevR = i > 0 ? (hist[i - 1].rating || hist[i - 1].newRating || 0) : newR;
                recentContests.push({
                    platform: 'codechef',
                    name: c.contestName || 'CC Contest',
                    date: c.date,
                    rating: newR,
                    delta: newR - prevR,
                    rank: c.rank || null
                });
            }
        }
        if (lcData?.contestHistory?.length) {
            const attended = lcData.contestHistory.filter(c => c.attended);
            const startIdx = Math.max(0, attended.length - 5);
            for (let i = attended.length - 1; i >= startIdx; i--) {
                const c = attended[i];
                const newR = Math.round(c.rating || 0);
                const prevR = i > 0 ? Math.round(attended[i - 1].rating || 0) : newR;
                recentContests.push({
                    platform: 'leetcode',
                    name: c.contestTitle || 'LC Contest',
                    date: c.contestStartTime ? new Date(c.contestStartTime * 1000).toISOString() : null,
                    rating: newR,
                    delta: newR - prevR,
                    rank: c.ranking || null
                });
            }
        }
        recentContests.sort((a, b) => new Date(b.date) - new Date(a.date));
        const topContests = recentContests.slice(0, 8);

        const daysElapsed = Math.min(30, Math.ceil((now - last30Start) / 86400000));
        const dailyRate = daysElapsed > 0 ? currentSolved / daysElapsed : 0;
        const projectedMonthly = Math.round(dailyRate * 30);
        const projectedYearly = Math.round(dailyRate * 365);

        const MILESTONES = [800, 1000, 1200, 1400, 1600, 1800, 2000, 2200, 2400, 2600, 2800, 3000];
        const getMilestone = (current) => {
            if (!current || current <= 0) return null;
            const next = MILESTONES.find(m => m > current);
            if (!next) return null;
            const prevMilestone = MILESTONES[MILESTONES.indexOf(next) - 1] || 0;
            const progress = Math.round(((current - prevMilestone) / (next - prevMilestone)) * 100);
            return { current, next, remaining: next - current, progress: Math.min(progress, 100) };
        };
        const milestones = {};
        if (cfRating > 0) milestones.codeforces = getMilestone(cfRating);
        if (lcRating > 0) milestones.leetcode = getMilestone(lcRating);
        if (ccRating > 0) milestones.codechef = getMilestone(ccRating);

        return {
            overview: {
                solved: currentSolved,
                submissions: currentTotalSubs,
                accRate: currentAccRate,
                activeDays: currentActiveDays,
                streak: codingStreak,
                longestStreak: Math.max(userData?.dailyStreak?.longest || 0, codingStreak),
                avgPerDay,
                consistencyScore
            },
            comparison: {
                solved: { current: currentSolved, previous: prevSolved },
                submissions: { current: currentTotalSubs, previous: prevTotalSubs },
                accRate: { current: currentAccRate, previous: prevAccRate },
                activeDays: { current: currentActiveDays, previous: prevActiveDays }
            },
            dailyActivity,
            weeklyData,
            verdictDist: agg[0].verdictDist,
            platformSplit,
            difficultyDist: agg[0].difficultyDist,
            languageDist: agg[0].languageDist,
            topTags: agg[0].topTags,
            weaknessTags,
            strengthTags,
            difficultyProgression: { current: avgDiffCurr, previous: avgDiffPrev, hardest: maxDiffCurr },
            dayOfWeek: reordered,
            insights,
            recentContests: topContests,
            paceProjection: { dailyRate: +dailyRate.toFixed(1), projectedMonthly, projectedYearly },
            milestones,
            ratings: {
                codeforces: { current: cfRating, previous: cfPrevRating },
                leetcode: { current: lcRating, previous: lcPrevRating },
                codechef: { current: ccRating, previous: ccPrevRating }
            },
            linkedAccounts: userData?.linkedAccounts || {}
        };

    } catch (err) {
        console.error('Error calculating performance stats:', err);
        return {};
    }
};

const recalculateLevelUpData = async (userId) => {
    try {
        console.log(`[LevelUp-Recalc] Started for user ${userId}`);
        const [upsolveQueue, performanceStats, recommendations] = await Promise.all([
            calculateUpsolveQueue(userId),
            calculatePerformanceStats(userId),
            getUpsolveRecommendations(userId)
        ]);

        await LevelUpData.findOneAndUpdate(
            { userId },
            {
                $set: {
                    upsolveQueue,
                    performanceStats,
                    recommendations: recommendations?.status === 'no_account_linked' ? null : recommendations,
                    lastRecalculatedAt: new Date()
                }
            },
            { upsert: true, new: true }
        );
        console.log(`[LevelUp-Recalc] Completed successfully for user ${userId}`);
    } catch (err) {
        console.error(`[LevelUp-Recalc] Error for user ${userId}:`, err);
    }
};

module.exports = {
    recalculateLevelUpData
};
