const mongoose = require('mongoose');

/**
 * DailyActiveUser — one record per user per IST calendar day.
 * Written once per day per user from handleVerifyAuth (throttled in-memory).
 * Used to drive the "Daily Active Users" graph in the admin dashboard.
 */
const dailyActiveUserSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    date: {
        type: String,   // 'YYYY-MM-DD' in IST
        required: true,
    },
}, { timestamps: false });

// Unique compound index: one record per user per day
dailyActiveUserSchema.index({ userId: 1, date: 1 }, { unique: true });
// Index for fast group-by-date queries
dailyActiveUserSchema.index({ date: 1 });

const DailyActiveUser = mongoose.model('DailyActiveUser', dailyActiveUserSchema);
module.exports = DailyActiveUser;
