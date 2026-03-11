import React, { createContext, useState, useEffect } from 'react';
import api from '../services/newsService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      api.get('/auth/me')
        .then(response => {
          setUser(response.data.data || null);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const setAuthenticatedSession = async (nextToken) => {
    localStorage.setItem('token', nextToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${nextToken}`;
    setToken(nextToken);

    const response = await api.get('/auth/me');
    setUser(response.data.data || null);
    return response.data.data || null;
  };

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const payload = response.data.data || {};
    localStorage.setItem('token', payload.token);
    setToken(payload.token);
    setUser(payload.user || null);
    api.defaults.headers.common['Authorization'] = `Bearer ${payload.token}`;
  };

  const register = async (name, email, password) => {
    await api.post('/auth/register', { name, email, password });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading, setAuthenticatedSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
