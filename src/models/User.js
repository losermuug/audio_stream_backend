const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      select: false,
    },
    avatarUrl: String,
    role: {
      type: String,
      enum: ['listener', 'artist', 'admin'],
      default: 'listener',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

userSchema.index({ displayName: 'text', email: 'text' });

module.exports = mongoose.model('User', userSchema);
