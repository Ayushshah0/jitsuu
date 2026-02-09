const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const axios = require('axios');
const cors = require('cors');


const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.json({
        message: "News API Server is running",
        endpoints: {
            allNews: "/all-news",
            topHeadlines: "/top-headlines",
            countryNews: "/country/:iso"
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

            console.error('NewsAPI Error:', error.response?.data || error.message);

            const isRateLimited = status === 429 || newsApiCode === 'rateLimited';
            if (isRateLimited && cached) {
                return res.status(200).json({
                    success: true,
                    message: "Rate limited by NewsAPI. Serving cached results.",
                    data: cached,
                    meta: { cached: true }
                });
            }

            const httpStatus = isRateLimited ? 429 : 500;
            res.status(httpStatus).json({
                success: false,
                message: isRateLimited
                    ? "NewsAPI rate limit reached. Please try later or use a new API key."
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

// port
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
