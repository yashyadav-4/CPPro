// Model/CCProblem.js
// Stores the full CodeChef problem catalog synced by admin.
// Synced via POST /api/admin/sync/cc-problems — updated weekly.
const mongoose = require('mongoose');

const ccProblemSchema = new mongoose.Schema(
    {
        // Problem code e.g. "MAXPAIRS". This is the stable unique key.
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
        // CC difficulty_rating (numeric, 0–10000+).
        // 0 means unrated / not available.
        difficulty: {
            type: Number,
            default: 0,
            index: true,
        },
        // Topic tags (lowercase strings) e.g. ["dp", "greedy", "binary-search"]
        tags: {
            type: [String],
            default: [],
            index: true,
        },
        // Number of users who have fully solved this problem
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

// Compound indexes for difficulty-band + tag queries (daily problem recommender)
ccProblemSchema.index({ difficulty: 1, tags: 1 });
ccProblemSchema.index({ difficulty: 1, solvedCount: -1 });

const CCProblem = mongoose.model('CCProblem', ccProblemSchema);
module.exports = CCProblem;
