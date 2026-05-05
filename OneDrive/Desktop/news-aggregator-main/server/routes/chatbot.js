const express = require("express");
const { sendSuccess, sendError } = require("../utils/response");
const { fetchTopHeadlines } = require("../services/newsService");
const {
  handleDialogflowWebhook,
  handleSummarizeNews,
  handleExplainNews,
  handleRecommendNews,
  handleSetPreferences,
} = require("../services/chatbotService");

const router = express.Router();

router.post("/webhook", async (req, res) => {
  try {
    const response = await handleDialogflowWebhook(req);
    return res.json(response);
  } catch (error) {
    return res.status(500).json({
      fulfillmentText: "The chatbot is temporarily unavailable.",
      error: error.message,
    });
  }
});

router.post("/summarize", async (req, res) => {
  try {
    const result = await handleSummarizeNews(req.body || {});
    return sendSuccess(res, 200, "Summary generated successfully.", result);
  } catch (error) {
    return sendError(res, 500, "Failed to summarize news", error.message);
  }
});

router.post("/explain", async (req, res) => {
  try {
    const result = await handleExplainNews(req.body || {}, req.body?.sessionId);
    return sendSuccess(res, 200, "Explanation generated successfully.", result);
  } catch (error) {
    return sendError(res, 500, "Failed to explain news", error.message);
  }
});

router.post("/recommend", async (req, res) => {
  try {
    const result = await handleRecommendNews(req.body || {}, req.body?.userProfile || {});
    return sendSuccess(res, 200, "Recommendations generated successfully.", result);
  } catch (error) {
    return sendError(res, 500, "Failed to build recommendations", error.message);
  }
});

router.post("/preferences", async (req, res) => {
  try {
    const result = await handleSetPreferences(req.body || {});
    return sendSuccess(res, 200, "Preferences updated successfully.", result);
  } catch (error) {
    return sendError(res, 500, "Failed to update preferences", error.message);
  }
});

router.get("/top-headlines", async (req, res) => {
  try {
    const result = await fetchTopHeadlines({
      topic: req.query.topic,
      category: req.query.category,
      location: req.query.location,
      pageSize: Number(req.query.pageSize || 5),
    });

    if (!result.success) {
      return sendError(res, 502, "Failed to fetch top headlines", result.error);
    }

    return sendSuccess(res, 200, "Top headlines loaded successfully.", result);
  } catch (error) {
    return sendError(res, 500, "Failed to fetch top headlines", error.message);
  }
});

module.exports = router;