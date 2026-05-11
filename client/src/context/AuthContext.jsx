import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import ConfirmationModal from '../components/common/ConfirmationModal';

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
  const [accountStatusError, setAccountStatusError] = useState({ show: false, title: '', message: '' });

  // Monitor global API errors for account deletion or deactivation
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          const message = error.response.data?.message;
          const code = error.response.data?.code;
          
          if (message === 'User no longer exists.' || message === 'Account deleted') {
            setAccountStatusError({
              show: true,
              title: 'Account Not Found',
              message: 'Your account no longer exists or has been removed. You will be redirected to the login page.'
            });
          } else if (error.response.status === 403 && (message === 'Your account has been deactivated.' || code === 'ACCOUNT_INACTIVE')) {
            setAccountStatusError({
              show: true,
              title: 'Account Deactivated',
              message: 'Your account has been deactivated by the administrator. Please contact support for more information.'
            });
          }
        }
        return Promise.reject(error);
      }
    );

    return () => api.interceptors.response.eject(interceptor);
  }, []);

  const handleStatusErrorConfirm = () => {
    const path = window.location.pathname;
    const isPartnerRoute = path.startsWith('/partner');
    const isExecutiveRoute = path.startsWith('/executive');
    
    setAccountStatusError({ show: false, title: '', message: '' });
    logout();
    
    if (isPartnerRoute) window.location.href = '/partner/login';
    else if (isExecutiveRoute) window.location.href = '/executive/login';
    else window.location.href = '/login';
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('baserabazar_token');
      const savedUser = localStorage.getItem('baserabazar_user');
      
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
          if (error.response?.status === 401 || error.response?.status === 403) {
             const message = error.response.data?.message;
             if (message === 'User no longer exists.' || message === 'Your account has been deactivated.') {
                // Interceptor will handle the modal
             } else {
                logout();
             }
          }
        }
      } else if (!token) {
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

  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        const freshUser = response.data.data;
        setUser(freshUser);
        localStorage.setItem('baserabazar_user', JSON.stringify(freshUser));
        return freshUser;
      }
    } catch (error) {
      console.error('refreshUser failed:', error);
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-slate-100 border-t-slate-800 animate-spin" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      updateUser,
      refreshUser,
      isAuthenticated: !!user,
      loading
    }}>
      {children}

      <ConfirmationModal
        isOpen={accountStatusError.show}
        onClose={handleStatusErrorConfirm}
        onConfirm={handleStatusErrorConfirm}
        title={accountStatusError.title}
        message={accountStatusError.message}
        confirmText="Okay"
        cancelText="Close"
        type="warning"
      />
    </AuthContext.Provider>
  );
};
