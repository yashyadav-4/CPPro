const mongoose = require('mongoose');

const learningProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    progress: {
      type: Map,
      of: {
        type: Number,
        enum: [0, 1, 2, 3],
      },
      default: {},
    },
    totalMastered:    { type: Number, default: 0 },
    totalImplemented: { type: Number, default: 0 },
    totalTheory:      { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LearningProgress', learningProgressSchema);
