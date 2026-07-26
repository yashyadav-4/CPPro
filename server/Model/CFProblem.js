//storing all cf problems for daily problem recommendation and other features

const mongoose = require('mongoose');
const cfProblemSchema = new mongoose.Schema(
    {
        problemId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        contestId: {
            type: Number,
            required: true,
        },
        index: {
            type: String, // "A","B","C1"....
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        url: {
            type: String,
            required: true,
        },
        difficulty: {
            type: Number,
            required: true,
            index: true,
        },
        tags: {
            type: [String],
            default: [],
            index: true,
        },
        solvedCount: {
            type: Number,
            default: 0,
        },
        lastSyncedAt: {
            type: Date,
            required: true,
        },
    },
    { timestamps: false }
);

cfProblemSchema.index({ difficulty: 1, tags: 1 });
cfProblemSchema.index({ difficulty: 1, solvedCount: -1 });

const CFProblem = mongoose.model('CFProblem', cfProblemSchema);
module.exports = CFProblem;
