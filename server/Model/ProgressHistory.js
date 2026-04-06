const mongoose = require('mongoose');

const progressHistorySchema = new mongoose.Schema(
  {
    userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    topicId:        { type: String, required: true },
    previousStatus: { type: Number, enum: [0, 1, 2, 3] },
    newStatus:      { type: Number, enum: [0, 1, 2, 3], required: true },
  },
  { timestamps: true }
);

progressHistorySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('ProgressHistory', progressHistorySchema);
