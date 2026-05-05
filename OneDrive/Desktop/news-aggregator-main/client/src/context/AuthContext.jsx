import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch, setAuthorizationToken } from "../services/http";

const TOKEN_KEY = "auth_token";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [user, setUser] = useState(null);
  const [isHydrating, setIsHydrating] = useState(true);

  function persistToken(nextToken) {
    if (nextToken) {
      localStorage.setItem(TOKEN_KEY, nextToken);
      setAuthorizationToken(nextToken);
      setToken(nextToken);
    } else {
      localStorage.removeItem(TOKEN_KEY);
      setAuthorizationToken("");
      setToken("");
    }
  }

  async function hydrateUserFromToken(activeToken) {
    if (!activeToken) {
      setUser(null);
      setIsHydrating(false);
      return;
    }

    try {
      setAuthorizationToken(activeToken);
      const response = await apiFetch("/auth/me", { method: "GET" });
      setUser(response.data.user);
    } catch (error) {
      persistToken("");
      setUser(null);
    } finally {
      setIsHydrating(false);
    }
  }

  async function login(email, password) {
    const response = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    persistToken(response.data.token);
    setUser(response.data.user);
    return response;
  }

  async function register(name, email, password) {
    const response = await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    persistToken(response.data.token);
    setUser(response.data.user);
    return response;
  }

  async function setAuthenticatedSession(nextToken) {
    persistToken(nextToken);
    await hydrateUserFromToken(nextToken);
  }

  function logout() {
    persistToken("");
    setUser(null);
  }

  useEffect(() => {
    hydrateUserFromToken(token);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isHydrating,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      setAuthenticatedSession,
    }),
    [user, token, isHydrating]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
