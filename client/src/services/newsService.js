import axios from 'axios';

// Use environment variable or fallback to Vite proxy
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const AUTH_BASE_URL = `${API_BASE_URL}/auth`;

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
  getNewsByCountry: (countryCode, category = 'general', pageSize = 40, page = 1, query = '') => {
    return api.get(`/country/${countryCode}`, { params: { category, pageSize, page, q: query } });
  },

  summarizeArticle: (article) => {
    return api.post('/summarize', { article });
  },

  // Get user preferences
  getPreferences: () => {
    return api.get('/preferences');
  },

  // Update user preferences
  updatePreferences: (preferences) => {
    return api.put('/preferences', preferences);
  },

  // Bookmarks
  getBookmarks: () => {
    return api.get('/bookmarks');
  },

  addBookmark: (article) => {
    return api.post('/bookmarks', article);
  },

  removeBookmark: (url) => {
    return api.delete('/bookmarks', { data: { url } });
  },

  // Smart notifications
  getNotifications: () => {
    return api.get('/notifications');
  },

  checkNotifications: () => {
    return api.post('/notifications/check');
  },

  trackSearchKeyword: (term) => {
    return api.post('/notifications/track-search', { term });
  },

  markNotificationRead: (notificationId) => {
    return api.patch(`/notifications/${notificationId}/read`);
  },

  markAllNotificationsRead: () => {
    return api.patch('/notifications/read-all');
  },
};

export { API_BASE_URL, AUTH_BASE_URL };
export default api;
