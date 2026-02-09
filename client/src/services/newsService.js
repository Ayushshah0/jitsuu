import axios from 'axios';

// Use environment variable or fallback to Vite proxy
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const newsService = {
  // Get all news with pagination and optional search query
  getAllNews: (pageSize = 40, page = 1, query = '') => {
    return api.get('/all-news', { params: { pageSize, page, q: query } });
  },

  // Get top headlines by category
  getTopHeadlines: (category = 'business', pageSize = 40, page = 1) => {
    return api.get('/top-headlines', { params: { category, pageSize, page } });
  },

  // Get news by country
  getNewsByCountry: (countryCode, pageSize = 40, page = 1) => {
    return api.get(`/country/${countryCode}`, { params: { pageSize, page } });
  },
};

export default api;
