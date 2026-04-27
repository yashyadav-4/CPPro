const mongoose = require('mongoose');

const problemSlotSchema = new mongoose.Schema({
    platform:   { type: String, enum: ['codeforces', 'leetcode', 'codechef'], required: true },
    problemId:  { type: String, required: true },
    title:      { type: String, required: true },
    url:        { type: String, required: true },
    difficulty: { type: mongoose.Schema.Types.Mixed }, // Number for CF/CC, String for LC
    tags:       [{ type: String }],
    solvedCount:{ type: Number, default: 0 },
    weakTag:    { type: String, default: null }, // challenger only: the weakness this targets
    isSolved:   { type: Boolean, default: false },
    solvedAt:   { type: Date, default: null },
}, { _id: false });

const dailyProblemSchema = new mongoose.Schema({
    userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date:        { type: String, required: true }, // "YYYY-MM-DD" IST
    workout:     { type: problemSlotSchema, default: null },
    challenger:  { type: problemSlotSchema, default: null },
    generatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

dailyProblemSchema.index({ userId: 1, date: 1 }, { unique: true });
dailyProblemSchema.index({ date: 1 });

module.exports = mongoose.model('DailyProblem', dailyProblemSchema);
