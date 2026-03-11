const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const bookmarkSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  urlToImage: {
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
  savedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false // Don't return password by default
  },
  fcmToken: {
    type: String,
    default: null
  },
  isVerified: {
    type: Boolean,
    default: true // Set to true for now, can add email verification later
  },
  authProvider: {
    type: String,
    enum: ['local', 'google', 'facebook'],
    default: 'local'
  },
  providerId: {
    type: String,
    default: null
  },
  bookmarks: {
    type: [bookmarkSchema],
    default: []
  },
  resetOtp: {
    type: String,
    select: false
  },
  resetOtpExpires: {
    type: Date,
    select: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash if password is modified
  if (!this.isModified('password')) {
    return next();
  }
  
  // Hash password with cost of 12
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
