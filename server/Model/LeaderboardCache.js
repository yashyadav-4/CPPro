const mongoose = require('mongoose');

const leaderboardCacheSchema = new mongoose.Schema({
    cacheKey:    { type: String, required: true, unique: true, index: true },
    entries:     { type: Array, default: [] },
    computedAt:  { type: Date, required: true },
});

module.exports = mongoose.model('LeaderboardCache', leaderboardCacheSchema);
