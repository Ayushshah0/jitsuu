const axios = require('axios');

const NEWS_API_BASE_URL = 'https://newsapi.org/v2';

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function getConfiguredApiKeys() {
  const commaSeparatedKeys = String(process.env.API_KEYS || '')
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean);

  return unique([
    ...commaSeparatedKeys,
    process.env.API_KEY,
    process.env.API_KEY_2,
    process.env.API_KEY_3,
  ]);
}

const configuredApiKeys = getConfiguredApiKeys();
let activeApiKeyIndex = 0;

function buildSearchParams(params = {}) {
  const searchParams = new URLSearchParams();

  Object.keys(params)
    .sort()
    .forEach((key) => {
      const value = params[key];
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });

  return searchParams;
}

function getNewsRequestCacheKey(endpoint, params = {}) {
  const searchParams = buildSearchParams(params).toString();
  return `${endpoint}?${searchParams}`;
}

function buildNewsApiUrl(endpoint, params, apiKey) {
  const searchParams = buildSearchParams({ ...params, apiKey });
  return `${NEWS_API_BASE_URL}/${endpoint}?${searchParams.toString()}`;
}

function isRateLimitError(error) {
  const status = error.response?.status;
  const code = error.response?.data?.code;
  const message = String(error.response?.data?.message || error.message || '').toLowerCase();

  return (
    status === 429 ||
    code === 'rateLimited' ||
    code === 'apiKeyExhausted' ||
    message.includes('too many requests') ||
    message.includes('rate limit') ||
    message.includes('quota')
  );
}

function maskKey(apiKey) {
  if (!apiKey) return 'missing-key';
  if (apiKey.length <= 8) return '****';
  return `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`;
}

async function requestNewsApi(endpoint, params = {}) {
  if (configuredApiKeys.length === 0) {
    const error = new Error('No NewsAPI keys are configured.');
    error.response = {
      status: 500,
      data: {
        code: 'missingApiKey',
        message: 'No NewsAPI keys are configured. Set API_KEY, API_KEY_2, API_KEY_3, or API_KEYS in the server environment.',
      },
    };
    throw error;
  }

  let lastRateLimitError = null;

  for (let attempt = 0; attempt < configuredApiKeys.length; attempt += 1) {
    const keyIndex = (activeApiKeyIndex + attempt) % configuredApiKeys.length;
    const apiKey = configuredApiKeys[keyIndex];
    const url = buildNewsApiUrl(endpoint, params, apiKey);

    try {
      const response = await axios.get(url);
      activeApiKeyIndex = keyIndex;

      return {
        data: response.data,
        rotation: {
          rotated: attempt > 0,
          keyIndex,
          totalKeys: configuredApiKeys.length,
        },
      };
    } catch (error) {
      if (isRateLimitError(error)) {
        lastRateLimitError = {
          status: error.response?.status || 429,
          code: error.response?.data?.code || 'rateLimited',
          message: error.response?.data?.message || 'Configured NewsAPI key reached its limit.',
        };

        console.warn(`NewsAPI key ${maskKey(apiKey)} hit a limit. Rotating to the next configured key.`);
        activeApiKeyIndex = (keyIndex + 1) % configuredApiKeys.length;
        continue;
      }

      throw error;
    }
  }

  const error = new Error('All configured NewsAPI keys are rate limited or exhausted.');
  error.response = {
    status: 429,
    data: {
      code: 'rateLimited',
      message: 'All configured NewsAPI keys are rate limited or exhausted.',
    },
  };
  error.rotationMeta = {
    totalKeys: configuredApiKeys.length,
    lastRateLimitError,
  };
  throw error;
}

module.exports = {
  getConfiguredApiKeys,
  getNewsRequestCacheKey,
  isRateLimitError,
  requestNewsApi,
};