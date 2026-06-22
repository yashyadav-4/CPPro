const mongoose = require('mongoose');

const dailyStatSchema = new mongoose.Schema({
    date: { type: String, required: true, unique: true }, // 'YYYY-MM-DD'
    newSignups: { type: Number, default: 0 },
    activeUsers: { type: Number, default: 0 },
    syncs: { type: Number, default: 0 }
});

module.exports = mongoose.model('DailyStat', dailyStatSchema);
