// Model/Contest.js — shared contest collection (not per-user)
const mongoose = require('mongoose');

const contestSchema = new mongoose.Schema({
    // Stable unique key: platform + slugified name + startTime
    contestId: {
        type:     String,
        required: true,
        unique:   true,
        index:    true,
    },
    platform: {
        type:     String,
        enum:     ['codeforces', 'leetcode'],
        required: true,
        index:    true,
    },
    name: {
        type:     String,
        required: true,
        trim:     true,
    },
    startTime: {
        type:     Date,
        required: true,
        index:    true,
    },
    endTime: {
        type: Date,
        default: null,
    },
    duration: {
        type: Number,      // minutes
        default: null,
    },
    url: {
        type: String,
        default: null,
    },
    status: {
        type: String,      // 'BEFORE' | 'CODING' | 'FINISHED' etc.
        default: null,
    },
}, { timestamps: true });

// TTL index: automatically remove documents where endTime is more than 180 days (6 months) old.
contestSchema.index(
    { endTime: 1 },
    { expireAfterSeconds: 180 * 24 * 3600 }   // 180 days after endTime
);

const Contest = mongoose.model('Contest', contestSchema);
module.exports = Contest;
