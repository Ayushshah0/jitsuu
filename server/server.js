const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const preferenceRoutes = require('./routes/preferences');
const bookmarkRoutes = require('./routes/bookmarks');
const notificationRoutes = require('./routes/notifications');
const {
    getConfiguredApiKeys,
    getNewsRequestCacheKey,
    isRateLimitError,
    requestNewsApi,
} = require('./services/newsApiClient');
const { summarizeArticle } = require('./services/newsSummary');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/preferences', preferenceRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/auth', authRoutes);
app.use('/preferences', preferenceRoutes);
app.use('/bookmarks', bookmarkRoutes);
app.use('/notifications', notificationRoutes);

// Root route
app.get("/", (req, res) => {
    res.json({
        message: "News API Server is running",
        endpoints: {
            auth: {
                register: "POST /api/auth/register",
                login: "POST /api/auth/login",
                me: "GET /api/auth/me"
            },
            preferences: {
                getAvailable: "GET /api/preferences/available",
                get: "GET /api/preferences",
                update: "PUT /api/preferences",
                updateTheme: "PATCH /api/preferences/theme",
                updateNotifications: "PATCH /api/preferences/notifications",
                updateKeywords: "PATCH /api/preferences/keywords",
                reset: "DELETE /api/preferences"
            },
            bookmarks: {
                get: "GET /api/bookmarks",
                add: "POST /api/bookmarks",
                remove: "DELETE /api/bookmarks"
            },
            notifications: {
                get: "GET /api/notifications",
                check: "POST /api/notifications/check",
                trackSearch: "POST /api/notifications/track-search",
                markRead: "PATCH /api/notifications/:id/read",
                markAllRead: "PATCH /api/notifications/read-all"
            },
            news: {
                allNews: "GET /all-news",
                topHeadlines: "GET /top-headlines",
                countryNews: "GET /country/:iso",
                summarize: "POST /api/summarize"
            }
        }
    });
});

const configuredApiKeys = getConfiguredApiKeys();

// Small in-memory cache to reduce API calls during development
// Keyed by a key-independent request fingerprint
const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS || 10 * 60 * 1000); // 10 minutes
const responseCache = new Map();
const summaryCache = new Map();

function getCached(url) {
    const entry = responseCache.get(url);
    if (!entry) return null;
    if (Date.now() - entry.ts > CACHE_TTL_MS) {
        responseCache.delete(url);
        return null;
    }
    return entry.data;
}

function setCached(url, data) {
    responseCache.set(url, { ts: Date.now(), data });
}

function getSummaryCacheKey(article = {}) {
    return article.url || `${article.title || ''}::${article.publishedAt || ''}`;
}

function getCachedSummary(article) {
    const entry = summaryCache.get(getSummaryCacheKey(article));

    if (!entry) return null;
    if (Date.now() - entry.ts > CACHE_TTL_MS) {
        summaryCache.delete(getSummaryCacheKey(article));
        return null;
    }

    return entry.data;
}

function setCachedSummary(article, data) {
    summaryCache.set(getSummaryCacheKey(article), { ts: Date.now(), data });
}

function summarizeHandler(req, res) {
    const article = req.body?.article || {};
    const hasContent = [article.title, article.description, article.content].some(
        (value) => typeof value === 'string' && value.trim()
    );

    if (!hasContent) {
        return res.status(400).json({
            success: false,
            message: 'Article title, description, or content is required for summarization.'
        });
    }

    const cachedSummary = getCachedSummary(article);

    if (cachedSummary) {
        return res.status(200).json({
            success: true,
            message: 'Summary loaded from cache.',
            data: cachedSummary
        });
    }

    const summary = summarizeArticle(article);
    setCachedSummary(article, summary);

    return res.status(200).json({
        success: true,
        message: 'Summary generated successfully.',
        data: summary
    });
}

app.post('/summarize', summarizeHandler);
app.post('/api/summarize', summarizeHandler);

if (configuredApiKeys.length === 0) {
    console.warn('No NewsAPI keys were found. Configure API_KEY, API_KEY_2, API_KEY_3, or API_KEYS in server/.env.');
} else {
    console.log(`Loaded ${configuredApiKeys.length} NewsAPI key(s) for automatic rotation.`);
}

async function fetchNews(endpoint, params, res) {
    const cacheKey = getNewsRequestCacheKey(endpoint, params);
    const cached = getCached(cacheKey);

    try {
        const response = await requestNewsApi(endpoint, params);
        setCached(cacheKey, response.data);

        if (response.data.totalResults > 0) {
            return res.status(200).json({
                success: true,
                message: "Successfully fetched the data",
                data: response.data,
                meta: response.rotation.rotated
                    ? { rotatedKey: true, totalKeys: response.rotation.totalKeys }
                    : undefined
            });
        }

        return res.status(404).json({
            success: false,
            data: []
        });
    } catch (error) {
        const status = error.response?.status;
        const newsApiCode = error.response?.data?.code;
        const errorMessage = error.response?.data?.message || error.message;
        const rateLimited = isRateLimitError(error);

        console.error('NewsAPI Error:', { status, code: newsApiCode, message: errorMessage });

        if (rateLimited && cached) {
            return res.status(200).json({
                success: true,
                message: "Rate limited by NewsAPI. Serving cached results (may be outdated).",
                data: cached,
                meta: {
                    cached: true,
                    timestamp: `API Rate Limit - ${new Date().toISOString()}`,
                    rotatedKeysExhausted: true,
                }
            });
        }

        return res.status(rateLimited ? 429 : (status || 500)).json({
            success: false,
            message: rateLimited
                ? "All configured NewsAPI keys are rate limited or exhausted."
                : "Failed to fetch data from the API",
            error: errorMessage,
            meta: {
                newsApiStatus: status,
                newsApiCode,
                availableKeys: configuredApiKeys.length,
            }
        });
    }
}

//ALL NEWS
function allNewsHandler(req, res) {
    let pageSize = parseInt(req.query.pageSize) || 40;
    let page = parseInt(req.query.page) || 1;
    let query = req.query.q || 'news';
    fetchNews('everything', { q: query, pageSize, page }, res);
}
app.get("/all-news", allNewsHandler);
app.get("/api/all-news", allNewsHandler);

//Top HEADLINES
function topHeadlinesHandler(req, res) {
    let pageSize = parseInt(req.query.pageSize) || 40;
    let page = parseInt(req.query.page) || 1;
    let category = req.query.category || 'business';
    fetchNews('top-headlines', { category, language: 'en', pageSize, page }, res);
}
app.options("/top-headlines", cors());
app.options("/api/top-headlines", cors());
app.get("/top-headlines", topHeadlinesHandler);
app.get("/api/top-headlines", topHeadlinesHandler);

//COUNTRY NEWS
app.options("/country/:iso", cors());
app.options("/api/country/:iso", cors());

async function countryNewsHandler(req, res) {
    let pageSize = parseInt(req.query.pageSize) || 40;
    let page = parseInt(req.query.page) || 1;
    let country = (req.params.iso || '').toLowerCase();
    let category = (req.query.category || 'general').toLowerCase();

    const countryKeywords = {
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

    console.log(`Fetching news for country: ${country}, category: ${category}`);

    const primaryParams = { country, category, pageSize, page };
    const primaryCacheKey = getNewsRequestCacheKey('top-headlines', primaryParams);
    const cachedPrimary = getCached(primaryCacheKey);
    const keyword = countryKeywords[country] || country;
    const fallbackParams = {
        q: `${keyword} ${category}`,
        language: 'en',
        sortBy: 'publishedAt',
        pageSize,
        page,
    };
    const fallbackCacheKey = getNewsRequestCacheKey('everything', fallbackParams);

    if (cachedPrimary) {
        return res.status(200).json({
            success: true,
            message: "Successfully fetched the data",
            data: cachedPrimary
        });
    }

    try {
        const primaryResponse = await requestNewsApi('top-headlines', primaryParams);

        if (primaryResponse.data.totalResults > 0) {
            setCached(primaryCacheKey, primaryResponse.data);
            return res.status(200).json({
                success: true,
                message: "Successfully fetched the data",
                data: primaryResponse.data,
                meta: primaryResponse.rotation.rotated
                    ? { rotatedKey: true, totalKeys: primaryResponse.rotation.totalKeys }
                    : undefined
            });
        }

        const cachedFallback = getCached(fallbackCacheKey);

        if (cachedFallback) {
            return res.status(200).json({
                success: true,
                message: "Showing fallback results for this country",
                data: cachedFallback
            });
        }

        const fallbackResponse = await requestNewsApi('everything', fallbackParams);
        setCached(fallbackCacheKey, fallbackResponse.data);

        if (fallbackResponse.data.totalResults > 0) {
            return res.status(200).json({
                success: true,
                message: "Showing fallback results for this country",
                data: fallbackResponse.data,
                meta: fallbackResponse.rotation.rotated
                    ? { rotatedKey: true, totalKeys: fallbackResponse.rotation.totalKeys }
                    : undefined
            });
        }

        return res.status(404).json({
            success: false,
            message: "No results to show for this country right now",
            data: []
        });
    } catch (error) {
        const status = error.response?.status;
        const newsApiCode = error.response?.data?.code;
        const errorMessage = error.response?.data?.message || error.message;
        const rateLimited = isRateLimitError(error);
        const cachedFallback = getCached(fallbackCacheKey);

        console.error('NewsAPI Error:', { status, code: newsApiCode, message: errorMessage });

        if (rateLimited && cachedPrimary) {
            return res.status(200).json({
                success: true,
                message: "Rate limited by NewsAPI. Serving cached country results (may be outdated).",
                data: cachedPrimary,
                meta: { cached: true, timestamp: `API Rate Limit - ${new Date().toISOString()}` }
            });
        }

        if (rateLimited && cachedFallback) {
            return res.status(200).json({
                success: true,
                message: "Rate limited by NewsAPI. Serving cached fallback results (may be outdated).",
                data: cachedFallback,
                meta: { cached: true, timestamp: `API Rate Limit - ${new Date().toISOString()}` }
            });
        }

        return res.status(rateLimited ? 429 : (status || 500)).json({
            success: false,
            message: rateLimited
                ? "All configured NewsAPI keys are rate limited or exhausted."
                : "Failed to fetch country news",
            error: errorMessage,
            meta: {
                newsApiStatus: status,
                newsApiCode,
                availableKeys: configuredApiKeys.length,
            }
        });
    }
}
app.get("/country/:iso", countryNewsHandler);
app.get("/api/country/:iso", countryNewsHandler);

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📡 MongoDB connection initiated...`);
});
