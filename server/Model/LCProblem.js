// Model/LCProblem.js
// Stores the full LeetCode algorithm problem catalog synced by admin.
// Only stores categorySlug="algorithms" problems — Database/SQL/Shell/Concurrency excluded.
// Synced via POST /api/admin/sync/lc-problems — updated weekly.
const mongoose = require('mongoose');

const lcProblemSchema = new mongoose.Schema(
    {
        // titleSlug e.g. "two-sum". This is the stable unique key used by LC URLs.
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
        // "Easy" | "Medium" | "Hard"
        difficulty: {
            type: String,
            enum: ['Easy', 'Medium', 'Hard'],
            required: true,
            index: true,
        },
        // Topic tag slugs e.g. ["array", "hash-table", "dynamic-programming"]
        tags: {
            type: [String],
            default: [],
            index: true,
        },
        // Acceptance rate as a percentage (0–100), stored as a float.
        // Useful for gauging real-world difficulty beyond Easy/Medium/Hard labels.
        acRate: {
            type: Number,
            default: 0,
        },
        // Paid-only problems are filtered out at sync time — this field is always false.
        // Kept for transparency / future use.
        isPaidOnly: {
            type: Boolean,
            default: false,
        },
        // Timestamp of the last catalog sync that touched this document
        lastSyncedAt: {
            type: Date,
            required: true,
        },
    },
    { timestamps: false }
);

// Compound indexes for difficulty + tag queries (daily problem recommender)
lcProblemSchema.index({ difficulty: 1, tags: 1 });
lcProblemSchema.index({ difficulty: 1, acRate: -1 });

const LCProblem = mongoose.model('LCProblem', lcProblemSchema);
module.exports = LCProblem;
