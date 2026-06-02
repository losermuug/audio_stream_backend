const mongoose = require('mongoose');

const playlistTrackSchema = new mongoose.Schema(
  {
    track: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Track',
      required: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
    position: {
      type: Number,
      min: 0,
    },
  },
  { _id: false }
);

const playlistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    coverUrl: String,
    visibility: {
      type: String,
      enum: ['private', 'public', 'unlisted'],
      default: 'private',
      index: true,
    },
    tracks: [playlistTrackSchema],
    likeCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

playlistSchema.index({ name: 'text', description: 'text' });
playlistSchema.index({ owner: 1, updatedAt: -1 });

module.exports = mongoose.model('Playlist', playlistSchema);
