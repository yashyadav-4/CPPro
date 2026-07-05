const DailyProblem = require('../Model/DailyProblem');
const User         = require('../Model/User');
const ErrorLog     = require('../Model/ErrorLog');
const { generateDailyProblems } = require('../Services/dailyProblemService');
const { getTodayIST, getNDaysAgoIST } = require('../Utils/dateUtils');

// ── Streak helper ─────────────────────────────────────────────────────────────
// The DB stores the streak current value only when a solve happens.
// It is NEVER auto-decremented. So we must recompute the effective current
// streak at read time: if lastSolved is more than 1 day ago, the streak
// has broken and should display as 0.
function effectiveCurrentStreak(dailyStreak) {
    if (!dailyStreak?.lastSolved) return 0;
    const last      = new Date(dailyStreak.lastSolved);
    const today     = getTodayIST();
    const yesterday = getNDaysAgoIST(1);
    // getISTDate — pull just the YYYY-MM-DD string in IST
    const pad   = n => String(n).padStart(2, '0');
    const toIST = d => {
        const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
        return `${ist.getUTCFullYear()}-${pad(ist.getUTCMonth() + 1)}-${pad(ist.getUTCDate())}`;
    };
    const lastStr = toIST(last);
    if (lastStr === today || lastStr === yesterday) return dailyStreak.current || 0;
    return 0; // streak broken
}

async function getToday(req, res) {
    try {
        const userId = req.user._id;
        const today  = getTodayIST();

        let daily = await DailyProblem.findOne({ userId, date: today }).lean();

        if (!daily) {
            const result = await generateDailyProblems(userId);
            if (result?.status === 'no_account_linked') {
                return res.status(200).json({ success: true, status: 'no_account_linked' });
            }
            daily = result?.toObject ? result.toObject() : result;
        }

        const user = await User.findById(userId, 'dailyStreak linkedAccounts lcSession preferences').lean();
        const ds   = user?.dailyStreak;

        // Warn the frontend when LC is linked but no working session is set.
        // This powers the "why am I seeing solved problems?" banner.
        const lcLinked      = !!user?.linkedAccounts?.leetcode;
        const sessionStatus = user?.lcSession?.status || 'not_set';
        const sessionWarning = lcLinked && sessionStatus !== 'active';

        return res.status(200).json({
            success: true,
            data: {
                date:       daily.date,
                workout:    daily.workout,
                challenger: daily.challenger,
                bonus:      daily.bonus || null,
                streak: {
                    current: effectiveCurrentStreak(ds),
                    longest: ds?.longest || 0,
                },
                dailyMode: user?.preferences?.dailyMode || 'rating',
            },
            sessionWarning,
            sessionStatus,
        });
    } catch (err) {
        console.error('[DAILY] getToday error:', err.message);
        ErrorLog.create({ source: 'Daily:getToday', level: 'error', message: err.message || String(err) }).catch(() => {});
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function getStreak(req, res) {
    try {
        const userId   = req.user._id;
        const user     = await User.findById(userId, 'dailyStreak').lean();
        const today    = getTodayIST();
        const todayDoc = await DailyProblem.findOne({ userId, date: today }, 'workout.isSolved challenger.isSolved bonus').lean();

        const workoutSolved    = todayDoc?.workout?.isSolved    || false;
        const challengerSolved = todayDoc?.challenger?.isSolved || false;
        const bonusSolved      = todayDoc?.bonus?.isSolved      || false;
        const todaySolved      = (workoutSolved ? 1 : 0) + (challengerSolved ? 1 : 0) + (bonusSolved ? 1 : 0);
        const todayTotal       = todayDoc?.bonus ? 3 : 2;
        const ds               = user?.dailyStreak;

        return res.status(200).json({
            success: true,
            data: {
                current:     effectiveCurrentStreak(ds),
                longest:     ds?.longest || 0,
                lastSolved:  ds?.lastSolved || null,
                todaySolved,
                todayTotal,
            },
        });
    } catch (err) {
        console.error('[DAILY] getStreak error:', err.message);
        ErrorLog.create({ source: 'Daily:getStreak', level: 'error', message: err.message || String(err) }).catch(() => {});
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function getHistory(req, res) {
    try {
        const userId = req.user._id;
        const page   = Math.max(1, parseInt(req.query.page) || 1);
        const limit  = 10;
        const skip   = (page - 1) * limit;

        const [docs, total] = await Promise.all([
            DailyProblem.find({ userId })
                .sort({ date: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            DailyProblem.countDocuments({ userId }),
        ]);

        return res.status(200).json({
            success: true,
            data: docs,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    } catch (err) {
        console.error('[DAILY] getHistory error:', err.message);
        ErrorLog.create({ source: 'Daily:getHistory', level: 'error', message: err.message || String(err) }).catch(() => {});
        return res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = { getToday, getStreak, getHistory };
