import React, { useState, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import { getUserFromToken } from './jwtHelper';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    const saved = localStorage.getItem('token');
    if (!saved) return null;
    const validUser = getUserFromToken(saved);
    if (!validUser) {
      localStorage.removeItem('token');
      return null;
    }
    return saved;
  });

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('token');
    return saved ? getUserFromToken(saved) : null;
  });

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback((newToken) => {
    const parsedUser = getUserFromToken(newToken);
    if (parsedUser) {
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(parsedUser);
    }
  }, []);

  const value = {
    token,
    user,
    isAuthenticated: !!user,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
