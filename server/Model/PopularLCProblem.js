// Model/PopularLCProblem.js
// Lean reference collection for curated DSA/CP sheet problems on LeetCode.
// Stores ONLY the problemId (titleSlug) and which popular sheets include it.
// At query time, JOIN with the `lcproblems` collection via problemId to get
// full metadata (title, difficulty, tags, url, acRate).
//
// Supported sheets (sheets[] values):
//   "NeetCode 150" | "Blind 75" | "Striver A2Z" | "Striver SDE" | "Babbar 450"
//
// Populated by: node seedPopularSheets.js (one-time / on-demand)

const mongoose = require('mongoose');

const popularLCProblemSchema = new mongoose.Schema(
    {
        // LeetCode titleSlug — e.g. "two-sum", "longest-substring-without-repeating-characters"
        // Matches LCProblem.problemId exactly for clean JOIN queries.
        problemId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        // Array of curated sheet names this problem belongs to.
        // A problem appearing in multiple sheets will have all of them here.
        // e.g. ["NeetCode 150", "Blind 75", "Striver A2Z"]
        sheets: {
            type: [String],
            required: true,
            validate: {
                validator: (arr) => arr.length > 0,
                message: 'sheets must contain at least one entry',
            },
        },
        // Timestamp of the seeding run that last wrote this document.
        seededAt: {
            type: Date,
            required: true,
        },
    },
    { timestamps: false }
);

// Index for "find all problems in sheet X" queries used by the recommender.
popularLCProblemSchema.index({ sheets: 1 });

const PopularLCProblem = mongoose.model('PopularLCProblem', popularLCProblemSchema);
module.exports = PopularLCProblem;
