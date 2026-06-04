// Model/CFProblem.js
// Stores the full Codeforces problem catalog synced by admin.
// Synced via POST /api/admin/sync/cf-problems — updated weekly.
const mongoose = require('mongoose');

const cfProblemSchema = new mongoose.Schema(
    {
        // "1234A" — contestId + index. This is the stable unique key.
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
            type: String, // "A", "B", "C1", etc.
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
        // CF rating (800–3500). Only rated problems are stored.
        difficulty: {
            type: Number,
            required: true,
            index: true,
        },
        // CF topic tags e.g. ["dp", "greedy", "graphs"]
        tags: {
            type: [String],
            default: [],
            index: true,
        },
        // Number of users who have solved this problem
        solvedCount: {
            type: Number,
            default: 0,
        },
        // Timestamp of the last catalog sync that touched this document
        lastSyncedAt: {
            type: Date,
            required: true,
        },
    },
    { timestamps: false }
);

// Compound index for difficulty-band + tag queries (used by daily problem recommender)
cfProblemSchema.index({ difficulty: 1, tags: 1 });
cfProblemSchema.index({ difficulty: 1, solvedCount: -1 });

const CFProblem = mongoose.model('CFProblem', cfProblemSchema);
module.exports = CFProblem;
