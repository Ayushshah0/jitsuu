const axios = require("axios");
const { NewsCache } = require("./newsCache");

const cache = new NewsCache();
const API_KEYS = [
  process.env.API_KEY,
  process.env.API_KEY_2,
  process.env.API_KEY_3,
  process.env.API_KEY_4,
].filter(Boolean);

function buildCacheKey(prefix, params = {}) {
  return `${prefix}:${Object.keys(params)
    .sort()
    .map((key) => `${key}=${String(params[key] ?? "").toLowerCase()}`)
    .join("|")}`;
}

async function requestWithKeyRotation(urlTemplate) {
  let anyRetriableFailure = false;
  let lastError = null;

  for (let i = 0; i < API_KEYS.length; i++) {
    const url = urlTemplate.replace("__API_KEY__", API_KEYS[i]);
    try {
      const response = await axios.get(url, { timeout: 1500 });
      return {
        success: true,
        source: `API_KEY_${i + 1}`,
        data: response.data,
      };
    } catch (error) {
      const apiErrorCode = error.response?.data?.code;
      lastError = error.response?.data || error.message;

      if (["rateLimited", "apiKeyInvalid", "apiKeyDisabled"].includes(apiErrorCode)) {
        anyRetriableFailure = true;
        continue;
      }

      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  if (anyRetriableFailure) {
    return {
      success: false,
      error: lastError || "All NewsAPI keys failed",
    };
  }

  return {
    success: false,
    error: "No NewsAPI keys are configured on the server",
  };
}

async function fetchTopHeadlines({ topic, category = "general", location = "us", pageSize = 5 } = {}) {
  const normalizedTopic = (topic || "").trim();
  const cacheKey = buildCacheKey("headlines", {
    topic: normalizedTopic,
    category,
    location,
    pageSize,
  });

  const cached = cache.get(cacheKey);
  if (cached) {
    return { ...cached, cached: true };
  }

  const query = normalizedTopic || category || "world";
  const urlTemplate = normalizedTopic
    ? `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=${pageSize}&apiKey=__API_KEY__`
    : `https://newsapi.org/v2/top-headlines?country=${location}&category=${category}&language=en&pageSize=${pageSize}&apiKey=__API_KEY__`;

  const result = await requestWithKeyRotation(urlTemplate);

  if (!result.success) {
    return result;
  }

  const payload = {
    success: true,
    cached: false,
    source: result.source,
    data: result.data,
  };

  cache.set(cacheKey, payload);
  return payload;
}

function extractArticleSummary(article = {}) {
  const title = article.title || article.headline || "Untitled article";
  const description = article.description || article.summary || "";
  const sourceName = article.source?.name || article.sourceName || "Unknown source";
  const publishedAt = article.publishedAt || article.timestamp || null;
  const url = article.url || article.link || null;

  return {
    title,
    description,
    sourceName,
    publishedAt,
    url,
  };
}

module.exports = {
  fetchTopHeadlines,
  extractArticleSummary,
  requestWithKeyRotation,
};