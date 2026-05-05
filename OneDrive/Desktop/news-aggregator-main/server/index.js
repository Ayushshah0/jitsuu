require("dotenv").config();
const dns = require("dns");
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const preferencesRouter = require("./routes/preferences");
const authRouter = require("./routes/auth");
const summarizeRouter = require("./routes/summarize");
const chatbotRouter = require("./routes/chatbot");
const { connectDatabase } = require("./config/db");
const app = express();

try {
  // Use stable public resolvers so SRV lookups do not depend on local IPv6 router DNS.
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (error) {
  console.warn("Unable to set custom DNS servers:", error.message);
}

// CORS configuration
app.use(cors({
  origin: '*', // Be cautious with this in production
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/preferences", preferencesRouter);
app.use("/auth", authRouter);
app.use("/summarize", summarizeRouter);
app.use("/api/summarize", summarizeRouter);
app.use("/chatbot", chatbotRouter);
app.use("/api/chatbot", chatbotRouter);

connectDatabase()
  .then(() => {
    console.log("Database connected");
  })
  .catch((error) => {
    console.error("Database connection failed:", error.message);
  });

// Helper function for API requests with API key rotation
const API_KEYS = [
  process.env.API_KEY,
  process.env.API_KEY_2,
  process.env.API_KEY_3,
  process.env.API_KEY_4
].filter(Boolean);

async function makeApiRequest(urlTemplate) {
  let anyRetriableFailure = false;
  let lastError = null;
  for (let i = 0; i < API_KEYS.length; i++) {
    const url = urlTemplate.replace('__API_KEY__', API_KEYS[i]);
    try {
      const response = await axios.get(url);
      return {
        status: 200,
        success: true,
        message: `Successfully fetched the data (API_KEY_${i+1})`,
        data: response.data,
      };
    } catch (error) {
      const apiErrorCode = error.response?.data?.code;
      lastError = error.response?.data || error.message;

      // Retry with next key for common key/account-level failures.
      if (["rateLimited", "apiKeyInvalid", "apiKeyDisabled"].includes(apiErrorCode)) {
        anyRetriableFailure = true;
        console.warn(`API key ${i+1} failed with code '${apiErrorCode}', trying next key...`);
        continue;
      }

      // For other errors, return immediately
      console.error("API request error:", error.response ? error.response.data : error);
      return {
        status: 500,
        success: false,
        message: "Failed to fetch data from the API",
        error: error.response ? error.response.data : error.message,
      };
    }
  }

  if (anyRetriableFailure) {
    console.error("[ALERT] All configured NewsAPI keys failed (invalid/disabled/rate-limited).");
    return {
      status: 502,
      success: false,
      message: "All configured NewsAPI keys failed. Update your server .env keys.",
      error: lastError || "All keys failed"
    };
  }

  return {
    status: 500,
    success: false,
    message: "No NewsAPI keys are configured on the server.",
    error: "Missing API_KEY variables in .env"
  };
}

app.get("/all-news", async (req, res) => {
  let pageSize = parseInt(req.query.pageSize) || 80;
  let page = parseInt(req.query.page) || 1;
  let q = req.query.q || 'world'; // Default search query if none provided

  let urlTemplate = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&page=${page}&pageSize=${pageSize}&apiKey=__API_KEY__`;
  const result = await makeApiRequest(urlTemplate);
  res.status(result.status).json(result);
});

app.get("/top-headlines", async (req, res) => {
  let pageSize = parseInt(req.query.pageSize) || 80;
  let page = parseInt(req.query.page) || 1;
  let category = req.query.category || "general";

  let urlTemplate = `https://newsapi.org/v2/top-headlines?category=${category}&language=en&page=${page}&pageSize=${pageSize}&apiKey=__API_KEY__`;
  const result = await makeApiRequest(urlTemplate);
  res.status(result.status).json(result);
});

app.get("/news/top-headlines", async (req, res) => {
  let pageSize = parseInt(req.query.pageSize) || 80;
  let page = parseInt(req.query.page) || 1;
  let category = req.query.category || "general";

  let urlTemplate = `https://newsapi.org/v2/top-headlines?category=${category}&language=en&page=${page}&pageSize=${pageSize}&apiKey=__API_KEY__`;
  const result = await makeApiRequest(urlTemplate);
  res.status(result.status).json(result);
});

app.get("/country/:iso", async (req, res) => {
  let pageSize = parseInt(req.query.pageSize) || 80;
  let page = parseInt(req.query.page) || 1;
  const country = req.params.iso;
  const category = req.query.category;

  let urlTemplate = `https://newsapi.org/v2/top-headlines?country=${country}&apiKey=__API_KEY__&page=${page}&pageSize=${pageSize}`;
  if (category) {
    urlTemplate += `&category=${category}`;
  }
  const result = await makeApiRequest(urlTemplate);

  // Some countries frequently return zero with top-headlines country filter.
  // Fallback to everything query using country name + category for broader coverage.
  const totalResults = result?.data?.totalResults || 0;
  if (result.success && totalResults > 0) {
    res.status(result.status).json(result);
    return;
  }

  const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
  const countryName = regionNames.of(country.toUpperCase()) || country;
  const query = category ? `${countryName} ${category}` : countryName;
  const fallbackTemplate = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&page=${page}&pageSize=${pageSize}&apiKey=__API_KEY__`;
  const fallbackResult = await makeApiRequest(fallbackTemplate);
  res.status(fallbackResult.status).json(fallbackResult);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
  console.log(`Server is running at port ${PORT}`);
});
