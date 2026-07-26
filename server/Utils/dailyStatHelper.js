const DailyStat = require('../Model/DailyStat');
const DailyActiveUser = require('../Model/DailyActiveUser');

function getTodayStr(dateObj = new Date()) {
    // Convert to IST and format as YYYY-MM-DD
    const date = new Date(dateObj);
    date.setHours(date.getHours() + 5);
    date.setMinutes(date.getMinutes() + 30);
    return date.toISOString().slice(0, 10);
}

async function incrementDailyStat(field, amount = 1){
    try{
        const today = getTodayStr();
        const update = { $inc: { [field]: amount } };
        await DailyStat.findOneAndUpdate({ date: today }, update, { upsert: true, new: true });
    }catch(err){
        console.error(`Error incrementing ${field} in DailyStat:`, err.message);
    }
}

async function recordDAU(userId) {
    if (!userId) return;
    try {
        const today = getTodayStr();
        const result = await DailyActiveUser.updateOne(
            { userId, date: today },
            { $setOnInsert: { userId, date: today } },
            { upsert: true }
        );
        if (result.upsertedCount > 0) {
            await incrementDailyStat('activeUsers');
        }
    } catch (err) {
        // Ignore duplicate key errors gracefully
    }
}

module.exports = {
    getTodayStr,
    incrementDailyStat,
    recordDAU
};
