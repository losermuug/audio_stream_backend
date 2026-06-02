const mongoose = require('mongoose');

const playHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    track: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Track',
      required: true,
      index: true,
    },
    playedMs: {
      type: Number,
      default: 0,
      min: 0,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    source: {
      type: String,
      enum: ['album', 'playlist', 'search', 'radio', 'direct'],
      default: 'direct',
    },
    deviceId: String,
    ipAddress: String,
  },
  { timestamps: true }
);

playHistorySchema.index({ user: 1, createdAt: -1 });
playHistorySchema.index({ track: 1, createdAt: -1 });

module.exports = mongoose.model('PlayHistory', playHistorySchema);
