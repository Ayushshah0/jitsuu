const express = require('express');
const Preference = require('../models/Preference');
const { verifyToken } = require('./auth');

const router = express.Router();

// Middleware to verify token (import from auth)
const authMiddleware = verifyToken;

// Get user preferences
router.get('/', authMiddleware, async (req, res) => {
  try {
    let preference = await Preference.findOne({ userId: req.user.id });
    
    // If preference doesn't exist, create default one
    if (!preference) {
      preference = new Preference({
        userId: req.user.id,
        categories: ['general', 'technology', 'business'],
        country: 'us',
        language: 'en',
        theme: 'light'
      });
      await preference.save();
    }
    
    res.status(200).json({
      success: true,
      data: preference
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching preferences',
      error: error.message
    });
  }
});

// Update user preferences
router.put('/', authMiddleware, async (req, res) => {
  try {
    const { categories, country, language, theme, notifications, keywords } = req.body;
    
    let preference = await Preference.findOne({ userId: req.user.id });
    
    if (!preference) {
      preference = new Preference({
        userId: req.user.id,
        ...req.body
      });
    } else {
      if (categories) preference.categories = categories;
      if (country) preference.country = country;
      if (language) preference.language = language;
      if (theme) preference.theme = theme;
      if (notifications) preference.notifications = { ...preference.notifications, ...notifications };
      if (keywords) preference.keywords = keywords;
    }
    
    await preference.save();
    
    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      data: preference
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating preferences',
      error: error.message
    });
  }
});

// Update theme
router.patch('/theme', authMiddleware, async (req, res) => {
  try {
    const { theme } = req.body;
    
    if (!['light', 'dark', 'auto'].includes(theme)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid theme. Choose from: light, dark, auto'
      });
    }
    
    let preference = await Preference.findOne({ userId: req.user.id });
    
    if (!preference) {
      preference = new Preference({
        userId: req.user.id,
        theme
      });
    } else {
      preference.theme = theme;
    }
    
    await preference.save();
    
    res.status(200).json({
      success: true,
      message: 'Theme updated',
      data: { theme: preference.theme }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating theme',
      error: error.message
    });
  }
});

// Update notification preferences
router.patch('/notifications', authMiddleware, async (req, res) => {
  try {
    const { email, push, browser } = req.body;
    
    let preference = await Preference.findOne({ userId: req.user.id });
    
    if (!preference) {
      preference = new Preference({
        userId: req.user.id,
        notifications: { email, push, browser }
      });
    } else {
      if (email) preference.notifications.email = { ...preference.notifications.email, ...email };
      if (push) preference.notifications.push = { ...preference.notifications.push, ...push };
      if (browser) preference.notifications.browser = { ...preference.notifications.browser, ...browser };
    }
    
    await preference.save();
    
    res.status(200).json({
      success: true,
      message: 'Notification preferences updated',
      data: preference.notifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating notifications',
      error: error.message
    });
  }
});

module.exports = router;
