const mongoose = require('mongoose');

const preferenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  categories: {
    type: [String],
    default: ['general', 'technology', 'business'],
    enum: ['general', 'business', 'entertainment', 'health', 'science', 'sports', 'technology']
  },
  country: {
    type: String,
    default: 'us',
    maxlength: 2,
    lowercase: true
  },
  language: {
    type: String,
    default: 'en',
    enum: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ar', 'zh']
  },
  theme: {
    type: String,
    default: 'light',
    enum: ['light', 'dark', 'auto']
  },
  notifications: {
    email: {
      enabled: {
        type: Boolean,
        default: false
      },
      frequency: {
        type: String,
        default: 'daily',
        enum: ['realtime', 'hourly', 'daily', 'weekly']
      }
    },
    push: {
      enabled: {
        type: Boolean,
        default: false
      },
      breaking: {
        type: Boolean,
        default: false
      }
    },
    browser: {
      enabled: {
        type: Boolean,
        default: false
      }
    }
  },
  keywords: {
    type: [String],
    default: []
  },
  lastEmailSent: {
    type: Date,
    default: null
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Preference', preferenceSchema);
