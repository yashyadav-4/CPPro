const mongoose = require('mongoose');

const errorLogSchema = new mongoose.Schema({
    source:  { type: String, required: true },
    level:   { type: String, enum: ['error', 'warn', 'info'], default: 'error' },
    message: { type: String, required: true },
}, { timestamps: true });

errorLogSchema.index({ createdAt: -1 });
errorLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); 

module.exports = mongoose.model('ErrorLog', errorLogSchema);
