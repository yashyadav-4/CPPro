//stores lc problem metadata used for daily problem generation and other features
const mongoose = require('mongoose');

const lcProblemSchema = new mongoose.Schema(
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
            type: String,
            enum: ['Easy', 'Medium', 'Hard'],
            required: true,
            index: true,
        },
        tags: {
            type: [String],
            default: [],
            index: true,
        },
        acRate: {
            type: Number,
            default: 0,
        },
        isPaidOnly: {
            type: Boolean,
            default: false,
        },
        lastSyncedAt: {
            type: Date,
            required: true,
        },
    },
    { timestamps: false }
);

lcProblemSchema.index({ difficulty: 1, tags: 1 });
lcProblemSchema.index({ difficulty: 1, acRate: -1 });

const LCProblem = mongoose.model('LCProblem', lcProblemSchema);
module.exports = LCProblem;
