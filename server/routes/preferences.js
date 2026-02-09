const express = require('express');
const router = express.Router();
const Preference = require('../models/Preference');
const authMiddleware = require('../middleware/authMiddleware');
const { newsCategories, allKeywords } = require('../services/newsKeywords');

// @route   GET /preferences/available
// @desc    Get available news keywords and categories (public)
// @access  Public
router.get('/available', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        categories: newsCategories,
        allKeywords: allKeywords
      }
    });
  } catch (error) {
    console.error('Get available keywords error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching available keywords',
      error: error.message
    });
  }
});

// @route   GET /preferences
// @desc    Get user preferences
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    let preference = await Preference.findOne({ userId: req.user.id });
    
    // Create default preferences if none exist
    if (!preference) {
      preference = await Preference.create({ userId: req.user.id });
    }
    
    res.json({
      success: true,
      data: preference
    });

  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching preferences',
      error: error.message
    });
  }
});

// @route   PUT /preferences
// @desc    Update user preferences
// @access  Private
router.put('/', authMiddleware, async (req, res) => {
  try {
    const {
      categories,
      country,
      language,
      theme,
      notifications,
      keywords
    } = req.body;

    let preference = await Preference.findOne({ userId: req.user.id });

    if (!preference) {
      preference = new Preference({ userId: req.user.id });
    }

    // Update fields if provided
    if (categories !== undefined) preference.categories = categories;
    if (country !== undefined) preference.country = country;
    if (language !== undefined) preference.language = language;
    if (theme !== undefined) preference.theme = theme;
    if (keywords !== undefined) preference.keywords = keywords;
    
    if (notifications !== undefined) {
      preference.notifications = {
        email: {
          ...preference.notifications.email,
          ...notifications.email
        },
        push: {
          ...preference.notifications.push,
          ...notifications.push
        },
        browser: {
          ...preference.notifications.browser,
          ...notifications.browser
        }
      };
    }

    await preference.save();

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: preference
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating preferences',
      error: error.message
    });
  }
});

// @route   PATCH /preferences/theme
// @desc    Update theme preference only
// @access  Private
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
    
    res.json({
      success: true,
      message: 'Theme updated successfully',
      data: { theme: preference.theme }
    });
  } catch (error) {
    console.error('Update theme error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating theme',
      error: error.message
    });
  }
});

// @route   PATCH /preferences/notifications
// @desc    Update notification preferences
// @access  Private
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
    
    res.json({
      success: true,
      message: 'Notification preferences updated',
      data: preference.notifications
    });
  } catch (error) {
    console.error('Update notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating notifications',
      error: error.message
    });
  }
});

// @route   PATCH /preferences/keywords
// @desc    Update keywords preferences
// @access  Private
router.patch('/keywords', authMiddleware, async (req, res) => {
  try {
    const { keywords } = req.body;
    
    if (!Array.isArray(keywords)) {
      return res.status(400).json({
        success: false,
        message: 'Keywords must be an array'
      });
    }
    
    // Validate keywords
    const invalidKeywords = keywords.filter(k => !allKeywords.includes(k));
    if (invalidKeywords.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid keywords provided',
        invalidKeywords
      });
    }
    
    let preference = await Preference.findOne({ userId: req.user.id });
    
    if (!preference) {
      preference = new Preference({
        userId: req.user.id,
        keywords
      });
    } else {
      preference.keywords = keywords;
    }
    
    await preference.save();
    
    res.json({
      success: true,
      message: 'Keywords updated successfully',
      data: preference.keywords
    });
  } catch (error) {
    console.error('Update keywords error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating keywords',
      error: error.message
    });
  }
});

// @route   DELETE /preferences
// @desc    Reset preferences to default
// @access  Private
router.delete('/', authMiddleware, async (req, res) => {
  try {
    await Preference.findOneAndDelete({ userId: req.user.id });
    
    // Create new default preferences
    const preference = await Preference.create({ userId: req.user.id });

    res.json({
      success: true,
      message: 'Preferences reset to default',
      data: preference
    });

  } catch (error) {
    console.error('Reset preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting preferences',
      error: error.message
    });
  }
});

module.exports = router;
