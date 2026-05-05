import API_BASE_URL from "../config/api";

let authToken = "";

export function setAuthorizationToken(token) {
  authToken = token || "";
}

export async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(options.headers || {}),
    },
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  if (!response.ok) {
    throw {
      status: response.status,
      payload,
    };
  }

  return payload;
}
