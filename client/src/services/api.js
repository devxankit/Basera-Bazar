import axios from 'axios';

// -----------------------------------------------------
// API CONFIGURATION
// -----------------------------------------------------
// We use the URL from our .env file.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
console.log('📡 API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
});

// -----------------------------------------------------
// AUTH INTERCEPTOR
// -----------------------------------------------------
// This automatically grabs the token from localStorage (if it exists)
// and adds it to the headers of EVERY single request we make.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('baserabazar_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// -----------------------------------------------------
// RESPONSE INTERCEPTOR
// -----------------------------------------------------
// This is used for global error handling. 
// For example: if a token expires (401), we can redirect the user to login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Responsibility of auto-logout is now moved to AuthContext 
      // to avoid race conditions and protect persistence keys.
      console.warn('Unauthorized access detected (401)');
    }
    return Promise.reject(error);
  }
);

export default api;
