// Model/PopularCFProblem.js
// Lean reference collection for curated CP sheet problems on Codeforces.
// Stores ONLY the problemId and which popular sheets include it.
// At query time, JOIN with the `cfproblems` collection via problemId to get
// full metadata (title, difficulty/rating, tags, url, solvedCount).
//
// Supported sheets (sheets[] values):
//   "CP-31 Sheet"
//
// Populated by: node seedPopularSheets.js (one-time / on-demand)

const mongoose = require('mongoose');

const popularCFProblemSchema = new mongoose.Schema(
    {
        // Codeforces problem ID — e.g. "1234A", "800B"
        // Matches CFProblem.problemId (contestId + index) exactly for clean JOINs.
        problemId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        // Array of curated sheet names this problem belongs to.
        // e.g. ["CP-31 Sheet"]
        sheets: {
            type: [String],
            required: true,
            validate: {
                validator: (arr) => arr.length > 0,
                message: 'sheets must contain at least one entry',
            },
        },
        // Rating tier from the CP-31 sheet organization (e.g. "800", "900", "1000", ..., "1600").
        // Useful for recommending problems progressively by rating band.
        ratingTier: {
            type: String,
            index: true,
        },
        // Timestamp of the seeding run that last wrote this document.
        seededAt: {
            type: Date,
            required: true,
        },
    },
    { timestamps: false }
);

// Compound index for sheet + rating-tier filtered queries
popularCFProblemSchema.index({ sheets: 1 });
popularCFProblemSchema.index({ sheets: 1, ratingTier: 1 });

const PopularCFProblem = mongoose.model('PopularCFProblem', popularCFProblemSchema);
module.exports = PopularCFProblem;
