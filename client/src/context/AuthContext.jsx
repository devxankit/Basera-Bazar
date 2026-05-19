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
          const hasSavedUser = !!localStorage.getItem('baserabazar_user');
          
          if (hasSavedUser) {
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
        }
        return Promise.reject(error);
      }
    );

    return () => api.interceptors.response.eject(interceptor);
  }, []);

  const handleStatusErrorConfirm = async () => {
    const path = window.location.pathname;
    const isPartnerRoute = path.startsWith('/partner');
    const isExecutiveRoute = path.startsWith('/executive');
    
    setAccountStatusError({ show: false, title: '', message: '' });
    await logout(true);
    
    if (isPartnerRoute) window.location.href = '/partner/login';
    else if (isExecutiveRoute) window.location.href = '/executive/login';
    else window.location.href = '/login';
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Always attempt /auth/me — even if localStorage is empty.
        // The browser automatically sends the bb_access HttpOnly cookie
        // (withCredentials: true on axios), so a session survives iOS clearing
        // localStorage when the app is removed from the task switcher.
        // _isAuthCheck prevents the 401 interceptor from redirecting here;
        // we handle the outcome ourselves.
        const response = await api.get('/auth/me', { _isAuthCheck: true });
        if (response.data.success) {
          const freshUser = response.data.data;
          setUser(freshUser);
          // Restore user to localStorage in case it was cleared (e.g. iOS purge)
          localStorage.setItem('baserabazar_user', JSON.stringify(freshUser));
        }
      } catch (error) {
        const status = error.response?.status;
        const message = error.response?.data?.message;
        const code = error.response?.data?.code;

        if (status === 401 || status === 403) {
          const isKnownAccountError =
            message === 'User no longer exists.' ||
            message === 'Account deleted' ||
            message === 'Your account has been deactivated.' ||
            code === 'ACCOUNT_INACTIVE';

          if (!isKnownAccountError) {
            // Both cookie and localStorage token are invalid/expired — clear state
            logout();
          }
          // Known account errors: the modal interceptor in this provider handles them
        }
        // Network errors (no error.response): keep whatever is in state / localStorage
        // so the app stays usable offline or during a slow server restart.
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('baserabazar_token', token);
    localStorage.setItem('baserabazar_user', JSON.stringify(userData));
  };

  const logout = async (callServer = false) => {
    setUser(null);
    localStorage.removeItem('baserabazar_token');
    localStorage.removeItem('baserabazar_user');
    localStorage.removeItem('baserabazar_partner_role');
    // Clear HttpOnly cookies server-side
    if (callServer) {
      try {
        await api.post('/auth/logout');
      } catch (err) {
        console.error('Logout API call failed:', err);
      }
    }
  };

  const updateUser = (updates) => {
    setUser(prev => {
      if (!prev) return prev; // guard: no user in state, nothing to update
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
        cancelText={null}
        type="warning"
      />
    </AuthContext.Provider>
  );
};
