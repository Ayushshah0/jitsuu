const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    summary: {
      type: String,
      default: ''
    },
    articleUrl: {
      type: String,
      required: true,
      trim: true
    },
    imageUrl: {
      type: String,
      default: ''
    },
    sourceName: {
      type: String,
      default: 'Unknown Source'
    },
    publishedAt: {
      type: Date,
      default: null
    },
    matchedKeywords: {
      type: [String],
      default: []
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

notificationSchema.index({ userId: 1, articleUrl: 1 }, { unique: true });

module.exports = mongoose.model('Notification', notificationSchema);