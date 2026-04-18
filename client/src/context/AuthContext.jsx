import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('baserabazar_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // -----------------------------------------------------
  // SESSION RESTORATION
  // -----------------------------------------------------
  // When the app first loads, we check if there's a token.
  // if yes, we fetch the real profile from the backend.
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('baserabazar_token');
      const savedUser = localStorage.getItem('baserabazar_user');
      
      // If we have both, we trust the cache for initial UI
      if (token && savedUser) {
        try {
          const response = await api.get('/auth/me');
          if (response.data.success) {
            const freshUser = response.data.data;
            setUser(freshUser);
            localStorage.setItem('baserabazar_user', JSON.stringify(freshUser));
          }
        } catch (error) {
          console.error("Session sync failed:", error.response?.status);
          // Only force logout if the token is explicitly INVALID/EXPIRED (401)
          if (error.response?.status === 401) {
            logout();
          }
        }
      } else if (!token) {
        // No token, ensure state is clean
        setUser(null);
      }
      
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('baserabazar_token', token);
    localStorage.setItem('baserabazar_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('baserabazar_token');
    localStorage.removeItem('baserabazar_user');
    localStorage.removeItem('baserabazar_partner_role');
  };

  const updateUser = (updates) => {
    setUser(prev => {
      const newUser = { ...prev, ...updates };
      localStorage.setItem('baserabazar_user', JSON.stringify(newUser));
      return newUser;
    });
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      updateUser, 
      isAuthenticated: !!user,
      loading 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
