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
    codingScore:   { type: Number, default: 0 },
    monthlyScore:  { type: Number, default: 0 },
    totalSolved:   { type: Number, default: 0 },
    instituteRank: { type: Number, default: 0 },
    institution:   { type: String, default: '' },
    solvedByDifficulty: {
        school: { type: Number, default: 0 },
        basic:  { type: Number, default: 0 },
        easy:   { type: Number, default: 0 },
        medium: { type: Number, default: 0 },
        hard:   { type: Number, default: 0 },
    },
    lastSyncedAt: { type: Date, default: null },
}, { timestamps: true });

const GFGData = mongoose.model('GFGData', gfgDataSchema);

module.exports = GFGData;
