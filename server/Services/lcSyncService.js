const { Yaxios } = require('../Utils/nexusProxy');
const lcSyncRepo = require('../Repositories/lcSyncRepository');
const User = require('../Model/User');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const ADMIN_COOLDOWN = 10 * 1000; // 10 seconds for admins
const LC_API = process.env.LEETCODE_API;

/**
 * Returns the appropriate cooldown duration based on user role.
 */
function getCooldown(role) {
    return role === 'admin' ? ADMIN_COOLDOWN : FIFTEEN_MINUTES;
}

// ═══════════════════════════════════════════════════════════════════════
// Role-based freshness gate — 15 min for users, 10s for admins
// ═══════════════════════════════════════════════════════════════════════
const getLeetcodeData = async (userId, handle, role = 'user') => {
    const user = await User.findById(userId).lean();
    const cooldown = getCooldown(role);
    const timeSinceUpdate = user.lastLcUpdate
        ? (Date.now() - new Date(user.lastLcUpdate).getTime())
        : Infinity;

    if (timeSinceUpdate < cooldown) {
        const remainingMs = cooldown - timeSinceUpdate;
        const remainingSeconds = Math.ceil(remainingMs / 1000);
        console.log(`[LEAN-NEXUS-LC] >> ${handle} | Fresh | Served | ${remainingSeconds}s remaining`);
        return { freshness: 'fresh', remainingSeconds };
    }

    console.log(`[LEAN-NEXUS-LC] >> ${handle} | Stale | Updating`);

    // IMMEDIATELY stamp lastLcUpdate to prevent duplicate dispatches
    await User.findByIdAndUpdate(userId, { $set: { lastLcUpdate: new Date() } });

    // fire-and-forget background sync through the bouncer
    syncLeetcodeProfile(userId, handle)
        .then(() => console.log(`[LEAN-NEXUS-LC] >> ${handle} | Background update complete`))
        .catch(async (err) => {
            console.error(`[LEAN-NEXUS-LC] >> ${handle} | Background update failed:`, err.message);
            // rollback the timestamp so the user can retry
            await User.findByIdAndUpdate(userId, { $set: { lastLcUpdate: user.lastLcUpdate || null } });
        });

    return { freshness: 'updating' };
};

// ═══════════════════════════════════════════════════════════════════════
// Full sync — 6 sequential calls to Alfa API 
// ═══════════════════════════════════════════════════════════════════════
const syncLeetcodeProfile = async (userId, handle) => {
    try {
        console.log(`[LEAN-NEXUS-LC] syncing profile for: ${handle}`);

        // 1. Profile stats
        const profileRes = await Yaxios.get(`${LC_API}/${handle}/profile`, { timeout: 10000 });
        const profileData = profileRes.data;
        await delay(500);

        // 2. Skill stats
        const skillRes = await Yaxios.get(`${LC_API}/${handle}/skill`, { timeout: 10000 });
        const skillData = skillRes.data;
        await delay(500);

        // 3. Solved breakdown
        const solvedRes = await Yaxios.get(`${LC_API}/${handle}/solved`, { timeout: 10000 });
        const solvedData = solvedRes.data;
        await delay(500);

        // 4. Calendar / heatmap
        const calendarRes = await Yaxios.get(`${LC_API}/${handle}/calendar`, { timeout: 10000 });
        const calendarData = calendarRes.data;
        await delay(500);

        // 5. Contest history
        const contestRes = await Yaxios.get(`${LC_API}/${handle}/contest/history`, { timeout: 10000 });
        const contestData = contestRes.data;
        await delay(500);

        // 6. Recent submissions (limit=20)
        const submissionRes = await Yaxios.get(`${LC_API}/${handle}/submission?limit=20`, { timeout: 10000 });
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
