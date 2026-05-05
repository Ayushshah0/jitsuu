const axios = require("axios");

const NEWS_API_BASE_URL = "https://newsapi.org/v2";
const DEFAULT_TIMEOUT_MS = 10000;

const memoryCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

function getNewsApiKey() {
  return process.env.NEWS_API_KEY || process.env.API_KEY || process.env.API_KEY_2 || process.env.API_KEY_3 || process.env.API_KEY_4 || "";
}

function buildCacheKey(prefix, params = {}) {
  return `${prefix}:${Object.keys(params)
    .sort()
    .map((key) => `${key}=${String(params[key] ?? "").toLowerCase()}`)
    .join("|")}`;
}

function readCache(key) {
  const entry = memoryCache.get(key);
  if (!entry) {
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }

  return entry.value;
}

function writeCache(key, value) {
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

async function fetchNews(endpoint, params = {}) {
  const apiKey = getNewsApiKey();
  if (!apiKey) {
    throw new Error("Missing NEWS_API_KEY");
  }

  const response = await axios.get(`${NEWS_API_BASE_URL}/${endpoint}`, {
    timeout: DEFAULT_TIMEOUT_MS,
    params: {
      ...params,
      apiKey,
    },
  });

  return response.data;
}

async function fetchTopHeadlines({ pageSize = 5 } = {}) {
  const cacheKey = buildCacheKey("top-headlines", { pageSize });
  const cached = readCache(cacheKey);
  if (cached) {
    return cached;
  }

  const data = await fetchNews("top-headlines", {
    country: "us",
    pageSize,
  });

  writeCache(cacheKey, data);
  return data;
}

async function fetchTopicNews(topic, { pageSize = 5 } = {}) {
  const normalizedTopic = String(topic || "").trim();
  const cacheKey = buildCacheKey("topic-news", { topic: normalizedTopic, pageSize });

  const cached = readCache(cacheKey);
  if (cached) {
    return cached;
  }

  if (!normalizedTopic) {
    return { articles: [], totalResults: 0 };
  }

  const data = await fetchNews("everything", {
    q: normalizedTopic,
    pageSize,
    sortBy: "publishedAt",
    language: "en",
  });

  writeCache(cacheKey, data);
  return data;
}

function extractArticleSummary(article = {}) {
  return {
    title: article.title || "Untitled article",
    description: article.description || article.content || "",
    sourceName: article.source?.name || "Unknown source",
    publishedAt: article.publishedAt || null,
    url: article.url || null,
  };
}

// Optional hooks for a future Redis layer or Dialogflow webhook orchestration.
// The current implementation keeps things self-contained and fast for a single-node deployment.

module.exports = {
  fetchTopHeadlines,
  fetchTopicNews,
  extractArticleSummary,
};