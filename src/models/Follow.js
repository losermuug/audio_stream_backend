const mongoose = require('mongoose');

const followSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artist',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

followSchema.index({ user: 1, artist: 1 }, { unique: true });

module.exports = mongoose.model('Follow', followSchema);
