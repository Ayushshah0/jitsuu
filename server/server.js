const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const preferenceRoutes = require('./routes/preferences');

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
            news: {
                allNews: "GET /all-news",
                topHeadlines: "GET /top-headlines",
                countryNews: "GET /country/:iso"
            }
        }
    });
});

const API_KEY = process.env.API_KEY;

// Small in-memory cache to reduce API calls during development
// Keyed by the fully-built NewsAPI URL
const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS || 10 * 60 * 1000); // 10 minutes
const responseCache = new Map();

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


function fetchNews(url, res) {
    const cached = getCached(url);

    axios.get(url)
        .then(response => {
            setCached(url, response.data);

            if (response.data.totalResults > 0) {
                res.status(200).json({
                    success: true,
                    message: "Successfully fetched the data",
                    data: response.data
                });
            }
            else {
                res.status(404).json({
                    success: false,
                    message: "No more results to show",
                    data: []
                });
            }
        })
        .catch(error => {
            const status = error.response?.status;
            const newsApiCode = error.response?.data?.code;
            const errorMessage = error.response?.data?.message || error.message;

            console.error('NewsAPI Error:', { status, code: newsApiCode, message: errorMessage });

            // Check if rate limited
            const isRateLimited = status === 429 || newsApiCode === 'rateLimited';
            
            // If rate limited and we have cached data, serve it
            if (isRateLimited && cached) {
                return res.status(200).json({
                    success: true,
                    message: "Rate limited by NewsAPI. Serving cached results (may be outdated).",
                    data: cached,
                    meta: { cached: true, timestamp: `API Rate Limit - ${new Date().toISOString()}` }
                });
            }

            // If no cache and rate limited, return 429
            const httpStatus = isRateLimited ? 429 : 500;
            res.status(httpStatus).json({
                success: false,
                message: isRateLimited
                    ? "NewsAPI rate limit reached. Please try again later or use a different API key."
                    : "Failed to fetch data from the API",
                error: errorMessage,
                meta: {
                    newsApiStatus: status,
                    newsApiCode
                }
            });
        });
}

//ALL NEWS
app.get("/all-news", (req, res) => {
    let pageSize = parseInt(req.query.pageSize) || 40;
    let page = parseInt(req.query.page) || 1;
    let query = req.query.q || 'news';
    let url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&pageSize=${pageSize}&page=${page}&apiKey=${API_KEY}`;
    fetchNews(url, res);
});

//Top HEADLINES
app.options("/top-headlines", cors());

app.get("/top-headlines", (req, res) => {
    let pageSize = parseInt(req.query.pageSize) || 40;
    let page = parseInt(req.query.page) || 1;
    let category = req.query.category || 'business';
    let url = `https://newsapi.org/v2/top-headlines?category=${category}&language=en&pageSize=${pageSize}&page=${page}&apiKey=${API_KEY}`;
    fetchNews(url, res);
});

//COUNTRY NEWS
app.options("/country/:iso", cors());

app.get("/country/:iso", (req, res) => {
    let pageSize = parseInt(req.query.pageSize) || 40;
    let page = parseInt(req.query.page) || 1;
    let country = (req.params.iso || '').toLowerCase();
    console.log(`Fetching news for country: ${country}`);
    let url = `https://newsapi.org/v2/top-headlines?country=${country}&pageSize=${pageSize}&page=${page}&apiKey=${API_KEY}`;
    fetchNews(url, res);
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📡 MongoDB connection initiated...`);
});
