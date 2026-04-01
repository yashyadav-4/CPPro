const mongoose = require('mongoose');

const leetCodeDataSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    lcUsername: {
        type: String,
        required: true,
        trim: true,
    },
    profile: {
        totalSolved: { type: Number, default: 0 },
        easySolved: { type: Number, default: 0 },
        mediumSolved: { type: Number, default: 0 },
        hardSolved: { type: Number, default: 0 },
        totalQuestions: { type: Number, default: 0 },
        totalEasy: { type: Number, default: 0 },
        totalMedium: { type: Number, default: 0 },
        totalHard: { type: Number, default: 0 },
        ranking: { type: Number, default: 0 },
        contributionPoint: { type: Number, default: 0 },
        reputation: { type: Number, default: 0 },
        acSubmissionNum: [{
            difficulty: { type: String },
            count: { type: Number },
            submissions: { type: Number },
        }],
        totalSubmissionNum: [{
            difficulty: { type: String },
            count: { type: Number },
            submissions: { type: Number },
        }],
    },
    skillStats: {
        fundamental: [{
            tagName: { type: String },
            tagSlug: { type: String },
            problemsSolved: { type: Number },
        }],
        intermediate: [{
            tagName: { type: String },
            tagSlug: { type: String },
            problemsSolved: { type: Number },
        }],
        advanced: [{
            tagName: { type: String },
            tagSlug: { type: String },
            problemsSolved: { type: Number },
        }],
    },
    calendar: {
        activeYears: [{ type: Number }],
        streak: { type: Number, default: 0 },
        totalActiveDays: { type: Number, default: 0 },
        submissionCalendar: { type: String, default: '{}' },
    },
    contestCount: { type: Number, default: 0 },
    contestHistory: [{
        attended: { type: Boolean },
        rating: { type: Number },
        ranking: { type: Number },
        trendDirection: { type: String },
        problemsSolved: { type: Number },
        totalProblems: { type: Number },
        finishTimeInSeconds: { type: Number },
        contestTitle: { type: String },
        contestStartTime: { type: Number },
    }],
    recentSubmissions: [{
        title: { type: String },
        titleSlug: { type: String },
        timestamp: { type: String },
        statusDisplay: { type: String },
        lang: { type: String },
    }],
    lastSyncedAt: {
        type: Date,
        default: null,
    },
}, { timestamps: true });


const LeetCodeData = mongoose.model('LeetCodeData', leetCodeDataSchema);

module.exports = LeetCodeData;
