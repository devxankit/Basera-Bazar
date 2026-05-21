import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

if (!import.meta.env.VITE_API_BASE_URL) {
  if (import.meta.env.DEV) console.warn('[api] VITE_API_BASE_URL is not set. Falling back to localhost.');
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15000, // 15 s — requests never hang indefinitely
});

// Attach localStorage token as Authorization header fallback.
// The HttpOnly cookie is sent automatically by the browser, but the header
// ensures API tools (Postman, curl) and any code path that doesn't benefit
// from automatic cookies still works.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('baserabazar_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Flag to prevent concurrent refresh races
let isRefreshing = false;
let refreshQueue = []; // [{resolve, reject}]

function processQueue(error, token = null) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  refreshQueue = [];
}

function redirectToLogin() {
  localStorage.removeItem('baserabazar_token');
  localStorage.removeItem('baserabazar_user');
  localStorage.removeItem('baserabazar_partner_role');
  const path = window.location.pathname;
  if (path.startsWith('/admin'))     window.location.href = '/admin/login';
  else if (path.startsWith('/partner'))   window.location.href = '/partner/login';
  else if (path.startsWith('/executive')) window.location.href = '/executive/login';
  else window.location.href = '/login';
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Not a 401, or marked as auth-check (startup /auth/me) — don't touch it
    if (error.response?.status !== 401 || originalRequest?._isAuthCheck) {
      return Promise.reject(error);
    }

    // Already retried once — refresh token itself is invalid, log out
    if (originalRequest._retried) {
      redirectToLogin();
      return Promise.reject(error);
    }

    // If a refresh is already in-flight, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      }).catch(() => Promise.reject(error));
    }

    originalRequest._retried = true;
    isRefreshing = true;

    try {
      // Phase 4 refresh — the bb_refresh HttpOnly cookie is sent automatically
      const { data } = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      );

      const newToken = data.token;
      if (newToken) {
        localStorage.setItem('baserabazar_token', newToken);
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
      }

      processQueue(null, newToken);
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      redirectToLogin();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
