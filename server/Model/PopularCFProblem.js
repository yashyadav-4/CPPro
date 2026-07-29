// Model/PopularCFProblem.js
//model for cp31 questions for popular cf problems

const mongoose = require('mongoose');

const popularCFProblemSchema = new mongoose.Schema(
    {
        problemId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        sheets: { //to which sheet it belongs to right now all belongs to cp31 only
            type: [String],
            required: true,
            validate: {
                validator: (arr) => arr.length > 0,
                message: 'sheets must contain at least one entry',
            },
        },
        ratingTier: {
            type: String,
            index: true,
        },
        seededAt: {
            type: Date,
            required: true,
        },
    },
    { timestamps: false }
);

popularCFProblemSchema.index({ sheets: 1 });
popularCFProblemSchema.index({ sheets: 1, ratingTier: 1 });

const PopularCFProblem = mongoose.model('PopularCFProblem', popularCFProblemSchema);
module.exports = PopularCFProblem;
