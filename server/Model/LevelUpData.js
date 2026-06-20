const mongoose = require('mongoose');

const levelUpDataSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    upsolveQueue: {
        type: Array,
        default: []
    },
    performanceStats: {
        type: Object,
        default: {}
    },
    recommendations: {
        type: Object,
        default: null
    },
    lastRecalculatedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

levelUpDataSchema.index({ userId: 1 });

const LevelUpData = mongoose.model('LevelUpData', levelUpDataSchema);

module.exports = LevelUpData;
