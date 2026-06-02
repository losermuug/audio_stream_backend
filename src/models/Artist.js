const mongoose = require('mongoose');

const artistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    avatarUrl: String,
    coverUrl: String,
    genres: [{ type: String, trim: true, lowercase: true }],
    socials: {
      website: String,
      instagram: String,
      youtube: String,
      spotify: String,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    ownerUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    followerCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

artistSchema.index({ name: 'text', bio: 'text', genres: 'text' });

module.exports = mongoose.model('Artist', artistSchema);
