//storing all cc problems for daily problem recommendation and other features

const mongoose = require('mongoose');

const ccProblemSchema = new mongoose.Schema(
    {
        problemId: {
            type: String,
            required: true,
            unique: true,
            index: true,
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
            default: 0,
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

ccProblemSchema.index({ difficulty: 1, tags: 1 });
ccProblemSchema.index({ difficulty: 1, solvedCount: -1 });

const CCProblem = mongoose.model('CCProblem', ccProblemSchema);
module.exports = CCProblem;
