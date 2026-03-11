const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

function normalizeBookmark(payload = {}) {
  return {
    title: payload.title || 'Untitled article',
    description: payload.description || '',
    url: payload.url,
    urlToImage: payload.urlToImage || '',
    sourceName: payload.source?.name || payload.sourceName || 'Unknown Source',
    publishedAt: payload.publishedAt || null
  };
}

router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('bookmarks');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user.bookmarks || []
    });
  } catch (error) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookmarks',
      error: error.message
    });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'Article URL is required'
      });
    }

    const user = await User.findById(req.user.id).select('bookmarks');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const alreadySaved = user.bookmarks.some((bookmark) => bookmark.url === url);

    if (alreadySaved) {
      return res.json({
        success: true,
        message: 'Article already bookmarked',
        data: user.bookmarks
      });
    }

    user.bookmarks.unshift(normalizeBookmark(req.body));
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Bookmark added successfully',
      data: user.bookmarks
    });
  } catch (error) {
    console.error('Add bookmark error:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving bookmark',
      error: error.message
    });
  }
});

router.delete('/', authMiddleware, async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'Article URL is required'
      });
    }

    const user = await User.findById(req.user.id).select('bookmarks');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.bookmarks = user.bookmarks.filter((bookmark) => bookmark.url !== url);
    await user.save();

    res.json({
      success: true,
      message: 'Bookmark removed successfully',
      data: user.bookmarks
    });
  } catch (error) {
    console.error('Remove bookmark error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing bookmark',
      error: error.message
    });
  }
});

module.exports = router;
