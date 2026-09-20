const mongoose = require('mongoose');

const gfgDataSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    gfgHandle: {
        type: String,
        required: true,
        trim: true,
    },
    name:           { type: String, default: '' },
    profilePicture: { type: String, default: '' },
    codingScore:    { type: Number, default: 0 },
    monthlyScore:   { type: Number, default: 0 },
    totalSolved:    { type: Number, default: 0 },
    instituteRank:  { type: Number, default: 0 },
    institution:    { type: String, default: '' },
    solvedByDifficulty: {
        school: { type: Number, default: 0 },
        basic:  { type: Number, default: 0 },
        easy:   { type: Number, default: 0 },
        medium: { type: Number, default: 0 },
        hard:   { type: Number, default: 0 },
    },
    heatmap: [{
        date:  { type: String }, // 'YYYY-MM-DD'
        count: { type: Number, default: 0 },
    }],
    activeDays:      { type: Number, default: 0 },
    currentStreak:   { type: Number, default: 0 },
    bestStreak:      { type: Number, default: 0 },
    solvedThisMonth: { type: Number, default: 0 },
    problems: [{
        id:          { type: String },
        title:       { type: String },
        slug:        { type: String },
        lang:        { type: String },
        difficulty:  { type: String },
        submittedAt: { type: String },
    }],
    recentSubmissions: [{
        id:          { type: String },
        title:       { type: String },
        slug:        { type: String },
        lang:        { type: String },
        difficulty:  { type: String },
        submittedAt: { type: String },
    }],
    languageDistribution: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
    lastSyncedAt: { type: Date, default: null },
    lastError:    { type: String, default: null },
    lastErrorAt:  { type: Date, default: null },
}, { timestamps: true });

const GFGData = mongoose.model('GFGData', gfgDataSchema);

module.exports = GFGData;
