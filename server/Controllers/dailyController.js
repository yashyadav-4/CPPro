const DailyProblem = require('../Model/DailyProblem');
const User         = require('../Model/User');
const { generateDailyProblems } = require('../Services/dailyProblemService');
const { getTodayIST, getNDaysAgoIST } = require('../Utils/dateUtils');

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

        const user = await User.findById(userId, 'dailyStreak').lean();

        return res.status(200).json({
            success: true,
            data: {
                date:       daily.date,
                workout:    daily.workout,
                challenger: daily.challenger,
                bonus:      daily.bonus || null,
                streak:     user?.dailyStreak || { current: 0, longest: 0 },
            },
        });
    } catch (err) {
        console.error('[DAILY] getToday error:', err.message);
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function getStreak(req, res) {
    try {
        const userId = req.user._id;
        const user   = await User.findById(userId, 'dailyStreak').lean();
        const today  = getTodayIST();
        const todayDoc = await DailyProblem.findOne({ userId, date: today }, 'workout.isSolved challenger.isSolved bonus').lean();

        const workoutSolved    = todayDoc?.workout?.isSolved    || false;
        const challengerSolved = todayDoc?.challenger?.isSolved || false;
        const bonusSolved      = todayDoc?.bonus?.isSolved      || false;
        const todaySolved      = (workoutSolved ? 1 : 0) + (challengerSolved ? 1 : 0) + (bonusSolved ? 1 : 0);
        const todayTotal       = todayDoc?.bonus ? 3 : 2;

        return res.status(200).json({
            success: true,
            data: {
                ...user?.dailyStreak,
                todaySolved,
                todayTotal,
            },
        });
    } catch (err) {
        console.error('[DAILY] getStreak error:', err.message);
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
        return res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = { getToday, getStreak, getHistory };
