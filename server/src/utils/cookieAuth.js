/**
 * Cookie names and helpers for HttpOnly auth cookies.
 *
 * bb_access  — short-lived JWT (1 h).  Read by authMiddleware.
 * bb_refresh — long-lived JWT (30 d).  Read only by /auth/refresh.
 *
 * Both are HttpOnly so JS cannot read them, eliminating XSS token theft.
 * sameSite:'strict' prevents CSRF on same-domain requests.
 * secure is set to true in production only (requires HTTPS).
 */

const jwt = require('jsonwebtoken');

const IS_PROD = process.env.NODE_ENV === 'production';

const ACCESS_COOKIE  = 'bb_access';
const REFRESH_COOKIE = 'bb_refresh';

const ACCESS_TTL_SEC  = 60 * 60;          // 1 hour
const REFRESH_TTL_SEC = 30 * 24 * 60 * 60; // 30 days

const BASE_OPTS = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: IS_PROD ? 'strict' : 'lax', // 'lax' lets cookies work on localhost http
  path: '/',
};

/**
 * Generate a signed access JWT (1 h).
 */
function signAccessToken(id, role, email, version = 0) {
  return jwt.sign({ id, role, email, version }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TTL_SEC,
  });
}

/**
 * Generate a signed refresh JWT (30 d).
 * Uses a separate secret so a leaked access token cannot forge a refresh token.
 */
function signRefreshToken(id, role, version = 0) {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET is required but not set.');
  }
  return jwt.sign({ id, role, version }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TTL_SEC,
  });
}

/**
 * Verify a refresh token and return its payload, or null on failure.
 */
function verifyRefreshToken(token) {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET is required but not set.');
  }
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    return null;
  }
}

/**
 * Set both auth cookies on the response.
 */
function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie(ACCESS_COOKIE, accessToken, {
    ...BASE_OPTS,
    maxAge: ACCESS_TTL_SEC * 1000,
  });
  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...BASE_OPTS,
    maxAge: REFRESH_TTL_SEC * 1000,
    path: '/api/auth', // Refresh cookie is only sent to /api/auth routes
  });
}

/**
 * Clear both auth cookies (used on logout).
 */
function clearAuthCookies(res) {
  res.clearCookie(ACCESS_COOKIE, { ...BASE_OPTS });
  res.clearCookie(REFRESH_COOKIE, { ...BASE_OPTS, path: '/api/auth' });
}

module.exports = {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  setAuthCookies,
  clearAuthCookies,
};
