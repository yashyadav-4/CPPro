// for leetcode popular problems , striver ,love babbar and etc

const mongoose = require('mongoose');

const popularLCProblemSchema = new mongoose.Schema(
    {
        problemId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        sheets: {
            type: [String],
            required: true,
            validate: {
                validator: (arr) => arr.length > 0,
                message: 'sheets must contain at least one entry',
            },
        },
        seededAt: {
            type: Date,
            required: true,
        },
    },
    { timestamps: false }
);
popularLCProblemSchema.index({ sheets: 1 });

const PopularLCProblem = mongoose.model('PopularLCProblem', popularLCProblemSchema);
module.exports = PopularLCProblem;
