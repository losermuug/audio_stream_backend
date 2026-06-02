const mongoose = require('mongoose');

const albumSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ['album', 'single', 'ep', 'compilation'],
      default: 'album',
    },
    coverUrl: String,
    releaseDate: Date,
    genres: [{ type: String, trim: true, lowercase: true }],
    trackCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

albumSchema.index({ title: 'text', genres: 'text' });
albumSchema.index({ artist: 1, releaseDate: -1 });

module.exports = mongoose.model('Album', albumSchema);
