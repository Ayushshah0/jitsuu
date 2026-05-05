const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

// Remove trailing slash so endpoint concatenation is stable.
const API_BASE_URL = rawBaseUrl.replace(/\/$/, "");

export default API_BASE_URL;
