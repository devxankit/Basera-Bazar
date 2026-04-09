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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // -----------------------------------------------------
  // SESSION RESTORATION
  // -----------------------------------------------------
  // When the app first loads, we check if there's a token.
  // if yes, we fetch the real profile from the backend.
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('baserabazar_token');
      if (token) {
        try {
          const response = await api.get('/auth/me');
          setUser(response.data.data);
        } catch (error) {
          console.error("Session restoration failed:", error);
          localStorage.removeItem('baserabazar_token');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('baserabazar_token', token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('baserabazar_token');
  };

  const updateUser = (updates) => {
    setUser(prev => ({ ...prev, ...updates }));
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
