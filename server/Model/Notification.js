const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        enum: ['lc_session_expired', 'lc_session_saved', 'sync_failed', 'rating_milestone', 'streak_milestone', 'general'],
        required: true,
    },
    title:     { type: String, required: true },
    message:   { type: String, required: true },
    read:      { type: Boolean, default: false },
    actionUrl: { type: String, default: null },
}, { timestamps: true });

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
