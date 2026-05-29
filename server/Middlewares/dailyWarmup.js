const DailyProblem = require('../Model/DailyProblem');
const DailyTopic   = require('../Model/DailyTopic');
const Notification = require('../Model/Notification');
const ErrorLog     = require('../Model/ErrorLog');
const User         = require('../Model/User');
const { generateDailyProblems }      = require('../Services/dailyProblemService');
const { generateOrFetchDailyTopic }  = require('../Services/dailyTopicService');
const { getTodayIST }                = require('../Utils/dateUtils');

// In-memory set to avoid firing multiple background jobs for same user
// on the same server process within the same day.
const warmupDone = new Map(); // userId -> dateStr

// Clear the map at midnight IST (5:30 UTC offset → ~18:30 UTC)
setInterval(() => {
    const today = getTodayIST();
    for (const [uid, d] of warmupDone) {
        if (d !== today) warmupDone.delete(uid);
    }
}, 60 * 60 * 1000); // cleanup every hour

/**
 * Middleware: on the user's first authenticated request of the day,
 * fire-and-forget background generation of daily problems + topic.
 * When both complete, send a combined notification.
 *
 * This is NON-BLOCKING — the middleware calls next() immediately.
 */
function dailyWarmup(req, res, next) {
    // Only run for authenticated users
    if (!req.user || !req.user._id) return next();

    const userId = req.user._id.toString();
    const today  = getTodayIST();

    // Already warmed up today for this user?
    if (warmupDone.get(userId) === today) return next();

    // Mark immediately so subsequent requests don't re-trigger
    warmupDone.set(userId, today);

    // Fire-and-forget — don't await, don't block the response
    runWarmup(userId, today).catch(() => {});

    next();
}

async function runWarmup(userId, today) {
    // Quick check: if both already exist, skip entirely
    const [existingProblems, existingTopic] = await Promise.all([
        DailyProblem.exists({ userId, date: today }),
        DailyTopic.exists({ userId, date: today }),
    ]);

    if (existingProblems && existingTopic) return; // nothing to do

    const results = { problems: null, topic: null };
    const tasks = [];

    if (!existingProblems) {
        tasks.push(
            generateDailyProblems(userId)
                .then(r => { results.problems = r; })
                .catch(err => {
                    console.error('[Warmup] daily problems failed:', err.message);
                    ErrorLog.create({ source: 'Warmup:problems', level: 'error', message: err.message }).catch(() => {});
                })
        );
    }

    if (!existingTopic) {
        const userDoc = await User.findById(userId, 'preferences').lean();
        const language = userDoc?.preferences?.preferredLanguage || 'cpp';
        tasks.push(
            generateOrFetchDailyTopic(userId, language)
                .then(r => { results.topic = r; })
                .catch(err => {
                    console.error('[Warmup] daily topic failed:', err.message);
                    ErrorLog.create({ source: 'Warmup:topic', level: 'error', message: err.message }).catch(() => {});
                })
        );
    }

    await Promise.allSettled(tasks);

    // Build combined notification
    const parts = [];
    if (!existingProblems && results.problems && results.problems.status !== 'no_account_linked') {
        parts.push('problems');
    }
    if (!existingTopic && results.topic) {
        const topicName = results.topic.topic || 'your weak area';
        parts.push(`topic (${topicName})`);
    }

    if (parts.length > 0) {
        const msg = parts.length === 2
            ? `Your daily ${parts[0]} and ${parts[1]} are ready!`
            : `Your daily ${parts[0]} ${parts.length === 1 && parts[0] === 'problems' ? 'are' : 'is'} ready!`;

        Notification.create({
            userId,
            type: 'daily_ready',
            title: '⚡ Daily Challenge Ready!',
            message: msg,
            actionUrl: '/daily',
        }).catch(() => {});
    }
}

module.exports = { dailyWarmup };
