const mongoose = require('mongoose');

const trackSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artist',
      required: true,
      index: true,
    },
    album: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Album',
      index: true,
    },
    featuringArtists: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Artist' }],
    genres: [{ type: String, trim: true, lowercase: true, index: true }],
    durationSec: {
      type: Number,
      required: true,
      min: 1,
    },
    trackNumber: {
      type: Number,
      min: 1,
    },
    coverUrl: String,
    audioUrl: {
      type: String,
      required: true,
    },
    storageProvider: {
      type: String,
      enum: ['url', 'local', 's3', 'gcs', 'cloudinary'],
      default: 'url',
    },
    storageKey: String,
    mimeType: {
      type: String,
      default: 'audio/mpeg',
    },
    bitrateKbps: Number,
    explicit: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
    playCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    likeCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

trackSchema.index({ title: 'text', genres: 'text' });
trackSchema.index({ artist: 1, createdAt: -1 });
trackSchema.index({ album: 1, trackNumber: 1 });
trackSchema.index({ isPublished: 1, playCount: -1 });

module.exports = mongoose.model('Track', trackSchema);
