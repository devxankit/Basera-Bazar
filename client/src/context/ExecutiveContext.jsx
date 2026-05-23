import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const ExecutiveContext = createContext(null);

export const useExecutive = () => {
  const ctx = useContext(ExecutiveContext);
  if (!ctx) throw new Error('useExecutive must be used within ExecutiveProvider');
  return ctx;
};

export const ExecutiveProvider = ({ children }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accountDeleted, setAccountDeleted] = useState(false);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      // _isAuthCheck bypasses the global 401 interceptor so we can show a
      // proper "account deleted" modal instead of an abrupt hard redirect
      const res = await api.get('/executive/dashboard', { _isAuthCheck: true });
      if (res.data.success) setData(res.data.data);
    } catch (e) {
      if (e.response?.status === 401) {
        // Executive no longer exists in the DB — show deletion modal
        setAccountDeleted(true);
        localStorage.removeItem('baserabazar_token');
        localStorage.removeItem('baserabazar_user');
      }
      // other errors (network, 5xx) handled silently
    } finally {
      setLoading(false);
    }
  }, []);

  const [hideBottomNavOverride, setHideBottomNavOverride] = useState(false);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  return (
    <ExecutiveContext.Provider value={{
      data,
      loading,
      refetch: fetchDashboard,
      accountDeleted,
      hideBottomNavOverride,
      setHideBottomNavOverride
    }}>
      {children}
    </ExecutiveContext.Provider>
  );
};
