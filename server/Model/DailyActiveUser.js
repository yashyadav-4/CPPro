//for daily active users graph in admin board
const mongoose = require('mongoose');

const dailyActiveUserSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    date: {
        type: String, 
        required: true,
    },
}, { timestamps: false });

dailyActiveUserSchema.index({ userId: 1, date: 1 }, { unique: true });
dailyActiveUserSchema.index({ date: 1 });

const DailyActiveUser = mongoose.model('DailyActiveUser', dailyActiveUserSchema);
module.exports = DailyActiveUser;
