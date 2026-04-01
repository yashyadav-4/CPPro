const { Yaxios } = require('../Utils/nexusProxy');
const { bouncer } = require('../Utils/bouncer');
const lcSyncRepo = require('../Repositories/lcSyncRepository');
const User = require('../Model/User');

const TEN_MINUTES = 10 * 60 * 1000;
const LC_API = process.env.LEETCODE_API;

// ═══════════════════════════════════════════════════════════════════════
// 10-minute freshness gate — mirrors getCodeforcesData() in cfSyncService
// ═══════════════════════════════════════════════════════════════════════
const getLeetcodeData = async (userId, handle) => {
    const user = await User.findById(userId).lean();
    const timeSinceUpdate = user.lastLcUpdate
        ? (Date.now() - new Date(user.lastLcUpdate).getTime())
        : Infinity;

    if (timeSinceUpdate < TEN_MINUTES) {
        const remainingMs = TEN_MINUTES - timeSinceUpdate;
        const remainingSeconds = Math.ceil(remainingMs / 1000);
        console.log(`[LEAN-NEXUS-LC] >> ${handle} | Fresh | Served | ${remainingSeconds}s remaining`);
        return { freshness: 'fresh', remainingSeconds };
    }

    console.log(`[LEAN-NEXUS-LC] >> ${handle} | Stale | Updating`);
    // fire-and-forget background sync through the bouncer
    syncLeetcodeProfile(userId, handle)
        .then(() => console.log(`[LEAN-NEXUS-LC] >> ${handle} | Background update complete`))
        .catch(err => console.error(`[LEAN-NEXUS-LC] >> ${handle} | Background update failed:`, err.message));

    return { freshness: 'updating' };
};

// ═══════════════════════════════════════════════════════════════════════
// Full sync — 6 bouncer-scheduled calls to Alfa API via Yaxios proxy
// ═══════════════════════════════════════════════════════════════════════
const syncLeetcodeProfile = async (userId, handle) => {
    try {
        console.log(`[LEAN-NEXUS-LC] syncing profile for: ${handle}`);

        // 1. Profile stats
        const profileRes = await bouncer.schedule(() =>
            Yaxios.get(`${LC_API}/${handle}/profile`)
        );
        const profileData = profileRes.data;

        // 2. Skill stats
        const skillRes = await bouncer.schedule(() =>
            Yaxios.get(`${LC_API}/${handle}/skill`)
        );
        const skillData = skillRes.data;

        // 3. Solved breakdown
        const solvedRes = await bouncer.schedule(() =>
            Yaxios.get(`${LC_API}/${handle}/solved`)
        );
        const solvedData = solvedRes.data;

        // 4. Calendar / heatmap
        const calendarRes = await bouncer.schedule(() =>
            Yaxios.get(`${LC_API}/${handle}/calendar`)
        );
        const calendarData = calendarRes.data;

        // 5. Contest history
        const contestRes = await bouncer.schedule(() =>
            Yaxios.get(`${LC_API}/${handle}/contest/history`)
        );
        const contestData = contestRes.data;

        // 6. Recent submissions (limit=20)
        const submissionRes = await bouncer.schedule(() =>
            Yaxios.get(`${LC_API}/${handle}/submission?limit=20`)
        );
        const submissionData = submissionRes.data;

        // ── Transform & merge into our schema shape ──
        const parsedData = {
            profile: {
                totalSolved: profileData.totalSolved || solvedData.solvedProblem || 0,
                easySolved: profileData.easySolved || solvedData.easySolved || 0,
                mediumSolved: profileData.mediumSolved || solvedData.mediumSolved || 0,
                hardSolved: profileData.hardSolved || solvedData.hardSolved || 0,
                totalQuestions: profileData.totalQuestions || 0,
                totalEasy: profileData.totalEasy || 0,
                totalMedium: profileData.totalMedium || 0,
                totalHard: profileData.totalHard || 0,
                ranking: profileData.ranking || 0,
                contributionPoint: profileData.contributionPoint || 0,
                reputation: profileData.reputation || 0,
                acSubmissionNum: solvedData.acSubmissionNum || [],
                totalSubmissionNum: solvedData.totalSubmissionNum || [],
            },
            skillStats: {
                fundamental: skillData.fundamental || [],
                intermediate: skillData.intermediate || [],
                advanced: skillData.advanced || [],
            },
            calendar: {
                activeYears: calendarData.activeYears || [],
                streak: calendarData.streak || 0,
                totalActiveDays: calendarData.totalActiveDays || 0,
                submissionCalendar: calendarData.submissionCalendar || '{}',
            },
            contestCount: contestData.count || 0,
            contestHistory: (contestData.contestHistory || []).map(c => ({
                attended: c.attended,
                rating: c.rating,
                ranking: c.ranking,
                trendDirection: c.trendDirection,
                problemsSolved: c.problemsSolved,
                totalProblems: c.totalProblems,
                finishTimeInSeconds: c.finishTimeInSeconds,
                contestTitle: c.contest?.title || '',
                contestStartTime: c.contest?.startTime || 0,
            })),
            recentSubmissions: (submissionData.submission || []).map(s => ({
                title: s.title,
                titleSlug: s.titleSlug,
                timestamp: s.timestamp,
                statusDisplay: s.statusDisplay,
                lang: s.lang,
            })),
        };

        // 7. Upsert into LeetCodeData collection
        await lcSyncRepo.upsertLeetCodeData(userId, handle, parsedData);

        // 8. Stamp lastLcUpdate on User
        await User.findByIdAndUpdate(userId, { $set: { lastLcUpdate: new Date() } });

        console.log(`[LEAN-NEXUS-LC] >> ${handle} | Sync complete`);
        return { success: true, message: 'leetcode sync done' };
    } catch (error) {
        console.error(`[LEAN-NEXUS-LC] >> ${handle} | Sync error:`, error.message);
        if (error.response && error.response.data && error.response.data.errors) {
            const lcError = error.response.data.errors[0];
            if (lcError && lcError.message.includes('does not exist')) {
                throw new Error('invalid leetcode handle');
            }
        }
        throw new Error('leetcode API is currently unavailable');
    }
};

module.exports = {
    getLeetcodeData,
    syncLeetcodeProfile,
};
