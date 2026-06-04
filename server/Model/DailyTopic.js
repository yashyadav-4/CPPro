const mongoose = require('mongoose');

const dailyTopicSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    date: {
        type: String,       // "YYYY-MM-DD" IST — same pattern as DailyProblem
        required: true,
    },
    topic: {
        type: String,
        required: true,
    },
    language: { type: String, default: 'cpp' },
    content: {
        article:            { type: String, default: '' },
        dry_run:            { type: String, default: '' },
        code_template:      { type: String, default: '' },
        visualization_data: { type: String, default: '' },
        term_glossary:      { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    generatedAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

dailyTopicSchema.index({ userId: 1, date: 1 }, { unique: true });
dailyTopicSchema.index({ date: 1 });

module.exports = mongoose.model('DailyTopic', dailyTopicSchema);
