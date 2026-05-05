import axios from "axios";

function resolveBaseUrl() {
  if (typeof process !== "undefined" && process?.env?.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }

  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  return "http://localhost:5000";
}

export const chatbotApi = axios.create({
  baseURL: resolveBaseUrl().replace(/\/$/, ""),
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

export function setChatAuthToken(token) {
  // Optional: attach Authorization header when authenticated chat APIs require it.
  if (token) {
    chatbotApi.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete chatbotApi.defaults.headers.common.Authorization;
}

export async function postChatMessage(message, sessionId) {
  const response = await chatbotApi.post("/chatbot", {
    message,
    session_id: sessionId,
  });

  return response.data;
}