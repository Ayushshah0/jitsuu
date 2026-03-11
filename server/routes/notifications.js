const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const Preference = require('../models/Preference');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

const API_KEY = process.env.API_KEY;
const MAX_RECENT_SEARCHES = 12;
const MAX_TRACKED_KEYWORDS = 20;
const COUNTRY_NAMES = {
  us: 'United States',
  gb: 'United Kingdom',
  ca: 'Canada',
  au: 'Australia',
  in: 'India',
  de: 'Germany',
  fr: 'France',
  jp: 'Japan',
  np: 'Nepal'
};

function ensureDatabaseReady(res) {
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  res.status(503).json({
    success: false,
    message: 'Database connection unavailable. Notifications cannot be loaded right now.'
  });
  return false;
}

function normalizeKeyword(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function uniqueKeywords(values) {
  const seen = new Set();
  const result = [];

  values.forEach((value) => {
    const normalized = normalizeKeyword(value);
    if (!normalized || seen.has(normalized)) {
      return;
    }

    seen.add(normalized);
    result.push(normalized);
  });

  return result;
}

async function getOrCreatePreference(userId) {
  let preference = await Preference.findOne({ userId });
  if (!preference) {
    preference = await Preference.create({ userId });
  }
  return preference;
}

async function buildSmartNotifications(userId) {
  const preference = await getOrCreatePreference(userId);
  const notificationSettings = preference.notifications || {};
  const notificationsEnabled =
    notificationSettings.inApp?.enabled || notificationSettings.browser?.enabled;

  if (!notificationsEnabled) {
    const existingNotifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(25);

    return {
      preference,
      newNotifications: [],
      notifications: existingNotifications
    };
  }

  const keywords = uniqueKeywords([
    ...(preference.keywords || []),
    ...(preference.trackedKeywords || []),
    ...(preference.recentSearches || []).map((entry) => entry.term),
    ...(preference.categories || []),
    COUNTRY_NAMES[preference.country] || preference.country
  ]).slice(0, 6);

  if (!keywords.length || !API_KEY) {
    const existingNotifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(25);

    return {
      preference,
      newNotifications: [],
      notifications: existingNotifications
    };
  }

  const sinceDate = preference.lastNotificationCheck || new Date(Date.now() - 6 * 60 * 60 * 1000);
  const query = keywords.map((keyword) => `"${keyword}"`).join(' OR ');
  const response = await axios.get('https://newsapi.org/v2/everything', {
    params: {
      q: query,
      language: preference.language || 'en',
      sortBy: 'publishedAt',
      pageSize: 12,
      from: sinceDate.toISOString(),
      apiKey: API_KEY
    }
  });

  const articles = response.data?.articles || [];
  const newNotifications = [];

  for (const article of articles) {
    if (!article.url) {
      continue;
    }

    const publishedAt = article.publishedAt ? new Date(article.publishedAt) : null;
    if (publishedAt && publishedAt <= sinceDate) {
      continue;
    }

    const haystack = `${article.title || ''} ${article.description || ''}`.toLowerCase();
    const matchedKeywords = keywords.filter((keyword) => haystack.includes(keyword));

    try {
      const created = await Notification.create({
        userId,
        title: article.title || 'New article available',
        summary: article.description || '',
        articleUrl: article.url,
        imageUrl: article.urlToImage || '',
        sourceName: article.source?.name || 'Unknown Source',
        publishedAt,
        matchedKeywords
      });
      newNotifications.push(created);
    } catch (error) {
      if (error.code !== 11000) {
        throw error;
      }
    }
  }

  preference.lastNotificationCheck = new Date();
  await preference.save();

  const notifications = await Notification.find({ userId })
    .sort({ createdAt: -1 })
    .limit(25);

  return {
    preference,
    newNotifications,
    notifications
  };
}

router.get('/', authMiddleware, async (req, res) => {
  try {
    if (!ensureDatabaseReady(res)) {
      return;
    }

    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(25);

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
});

router.post('/track-search', authMiddleware, async (req, res) => {
  try {
    if (!ensureDatabaseReady(res)) {
      return;
    }

    const normalizedTerm = normalizeKeyword(req.body.term);
    if (!normalizedTerm) {
      return res.status(400).json({
        success: false,
        message: 'Search term is required'
      });
    }

    const preference = await getOrCreatePreference(req.user.id);
    const recentSearches = (preference.recentSearches || []).filter(
      (entry) => normalizeKeyword(entry.term) !== normalizedTerm
    );

    recentSearches.unshift({ term: normalizedTerm, searchedAt: new Date() });
    preference.recentSearches = recentSearches.slice(0, MAX_RECENT_SEARCHES);
    preference.trackedKeywords = uniqueKeywords([
      normalizedTerm,
      ...(preference.trackedKeywords || [])
    ]).slice(0, MAX_TRACKED_KEYWORDS);

    await preference.save();

    res.json({
      success: true,
      data: {
        trackedKeywords: preference.trackedKeywords,
        recentSearches: preference.recentSearches
      }
    });
  } catch (error) {
    console.error('Track search error:', error);
    res.status(500).json({
      success: false,
      message: 'Error tracking search keyword',
      error: error.message
    });
  }
});

router.post('/check', authMiddleware, async (req, res) => {
  try {
    if (!ensureDatabaseReady(res)) {
      return;
    }

    const result = await buildSmartNotifications(req.user.id);

    res.json({
      success: true,
      data: {
        newNotifications: result.newNotifications,
        notifications: result.notifications,
        settings: result.preference.notifications,
        trackedKeywords: result.preference.trackedKeywords || []
      }
    });
  } catch (error) {
    console.error('Check notifications error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Error checking smart notifications',
      error: error.message
    });
  }
});

router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    if (!ensureDatabaseReady(res)) {
      return;
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating notification',
      error: error.message
    });
  }
});

router.patch('/read-all', authMiddleware, async (req, res) => {
  try {
    if (!ensureDatabaseReady(res)) {
      return;
    }

    await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { isRead: true }
    );

    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(25);

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating notifications',
      error: error.message
    });
  }
});

module.exports = router;