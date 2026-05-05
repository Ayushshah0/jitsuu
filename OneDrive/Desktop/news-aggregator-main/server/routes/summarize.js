const express = require("express");
const { summarizeArticle, cleanText } = require("../services/summarizer");
const { SummaryCache } = require("../services/summaryCache");
const { sendSuccess, sendError } = require("../utils/response");

const router = express.Router();
const cache = new SummaryCache();

function buildCacheKey(article) {
  if (article.url && typeof article.url === "string" && article.url.trim()) {
    return `url:${article.url.trim().toLowerCase()}`;
  }

  const fallbackTitle = (article.title || "").trim().toLowerCase();
  const fallbackDate = (article.publishedAt || "").trim().toLowerCase();
  return `fallback:${fallbackTitle}:${fallbackDate}`;
}

router.post("/", (req, res) => {
  const article = req.body?.article || {};
  const cleanedTitle = cleanText(article.title || "");
  const cleanedDescription = cleanText(article.description || "");
  const cleanedContent = cleanText(article.content || "");

  if (!cleanedTitle && !cleanedDescription && !cleanedContent) {
    return sendError(res, 400, "Invalid summarize input", "title, description, or content is required");
  }

  try {
    const cacheKey = buildCacheKey(article);
    const cached = cache.get(cacheKey);

    if (cached) {
      return sendSuccess(res, 200, "Summary loaded from cache.", cached);
    }

    const summaryData = summarizeArticle(article);
    cache.set(cacheKey, summaryData);

    return sendSuccess(res, 200, "Summary generated successfully.", summaryData);
  } catch (error) {
    return sendError(res, 500, "Failed to summarize article", error.message);
  }
});

module.exports = router;
