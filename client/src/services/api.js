import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_BASE_URL });

// Attach JWT to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('baserabazar_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// M-1: Auto-logout on 401 so expired sessions don't leave users stuck
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('baserabazar_token');
      localStorage.removeItem('baserabazar_user');
      localStorage.removeItem('baserabazar_partner_role');
      const isAdmin = window.location.pathname.startsWith('/admin');
      window.location.href = isAdmin ? '/admin/login' : '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
