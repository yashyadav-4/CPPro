// Model/GlobalSyncState.js
// Stores single-document states for global background workers (like API syncs)
const mongoose = require('mongoose');

const globalSyncStateSchema = new mongoose.Schema({
    syncKey: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    lastSyncedAt: {
        type: Date,
        required: true,
    }
});

const GlobalSyncState = mongoose.model('GlobalSyncState', globalSyncStateSchema);
module.exports = GlobalSyncState;
