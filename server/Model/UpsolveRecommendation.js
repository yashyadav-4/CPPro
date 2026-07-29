const mongoose = require('mongoose');

const problemSlotSchema = new mongoose.Schema({
    platform:        { type: String, enum: ['codeforces', 'leetcode', 'codechef'], required: true },
    problemId:       { type: String, required: true },
    title:           { type: String, required: true },
    url:             { type: String, required: true },
    difficulty:      { type: mongoose.Schema.Types.Mixed }, 
    tags:            [{ type: String }],
    solvedCount:     { type: Number, default: 0 },
    weakTag:         { type: String, default: null },  
    isSolved:        { type: Boolean, default: false },
    solvedAt:        { type: Date, default: null },
    fromPopularSheet:{ type: Boolean, default: false },
    sheets:          [{ type: String }],
}, { _id: false });

const upsolveRecommendationSchema = new mongoose.Schema({
    userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    workout:     { type: [problemSlotSchema], default: [] },
    challenge:   { type: [problemSlotSchema], default: [] },
    bonus:       { type: [problemSlotSchema], default: [] },
    generatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('UpsolveRecommendation', upsolveRecommendationSchema);
