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

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/executive/dashboard');
      if (res.data.success) setData(res.data.data);
    } catch (e) {
      console.error('Executive dashboard fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  return (
    <ExecutiveContext.Provider value={{ data, loading, refetch: fetchDashboard }}>
      {children}
    </ExecutiveContext.Provider>
  );
};
