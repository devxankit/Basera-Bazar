'use strict';
// JWT secrets are set by globalSetup; ensure they exist for direct require
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';

const {
  ACCESS_COOKIE, REFRESH_COOKIE,
  signAccessToken, signRefreshToken,
  verifyRefreshToken, setAuthCookies, clearAuthCookies,
} = require('../../utils/cookieAuth');
const jwt = require('jsonwebtoken');

const makeRes = () => {
  const res = { cookies: {}, cleared: [] };
  res.cookie = jest.fn((name, val, opts) => { res.cookies[name] = { val, opts }; });
  res.clearCookie = jest.fn((name, opts) => { res.cleared.push({ name, opts }); });
  return res;
};

describe('constants', () => {
  test('ACCESS_COOKIE and REFRESH_COOKIE are string names', () => {
    expect(typeof ACCESS_COOKIE).toBe('string');
    expect(typeof REFRESH_COOKIE).toBe('string');
  });
});

describe('signAccessToken', () => {
  test('returns a valid JWT with id, role, email payload', () => {
    const token = signAccessToken('u1', 'admin', 'a@b.com');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.id).toBe('u1');
    expect(decoded.role).toBe('admin');
    expect(decoded.email).toBe('a@b.com');
  });

  test('includes version in payload', () => {
    const token = signAccessToken('u1', 'partner', 'x@y.com', 3);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.version).toBe(3);
  });
});

describe('signRefreshToken', () => {
  test('returns a valid JWT signed with refresh secret', () => {
    const token = signRefreshToken('u1', 'user');
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    expect(decoded.id).toBe('u1');
    expect(decoded.role).toBe('user');
  });

  test('throws when JWT_REFRESH_SECRET is missing', () => {
    const orig = process.env.JWT_REFRESH_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
    expect(() => signRefreshToken('u1', 'user')).toThrow('JWT_REFRESH_SECRET is required');
    process.env.JWT_REFRESH_SECRET = orig;
  });
});

describe('verifyRefreshToken', () => {
  test('returns payload for a valid refresh token', () => {
    const token = signRefreshToken('u1', 'partner');
    const payload = verifyRefreshToken(token);
    expect(payload.id).toBe('u1');
    expect(payload.role).toBe('partner');
  });

  test('returns null for a tampered token', () => {
    expect(verifyRefreshToken('bad.token.here')).toBeNull();
  });

  test('throws when JWT_REFRESH_SECRET is missing', () => {
    const orig = process.env.JWT_REFRESH_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
    expect(() => verifyRefreshToken('any')).toThrow('JWT_REFRESH_SECRET is required');
    process.env.JWT_REFRESH_SECRET = orig;
  });
});

describe('setAuthCookies', () => {
  test('sets both access and refresh cookies on res', () => {
    const res = makeRes();
    setAuthCookies(res, 'access_tok', 'refresh_tok');
    expect(res.cookie).toHaveBeenCalledTimes(2);
    expect(res.cookies[ACCESS_COOKIE].val).toBe('access_tok');
    expect(res.cookies[REFRESH_COOKIE].val).toBe('refresh_tok');
  });

  test('refresh cookie path is restricted to /api/auth', () => {
    const res = makeRes();
    setAuthCookies(res, 'a', 'r');
    expect(res.cookies[REFRESH_COOKIE].opts.path).toBe('/api/auth');
  });

  test('both cookies are httpOnly', () => {
    const res = makeRes();
    setAuthCookies(res, 'a', 'r');
    expect(res.cookies[ACCESS_COOKIE].opts.httpOnly).toBe(true);
    expect(res.cookies[REFRESH_COOKIE].opts.httpOnly).toBe(true);
  });
});

describe('clearAuthCookies', () => {
  test('clears both cookies', () => {
    const res = makeRes();
    clearAuthCookies(res);
    expect(res.clearCookie).toHaveBeenCalledTimes(2);
    const names = res.cleared.map(c => c.name);
    expect(names).toContain(ACCESS_COOKIE);
    expect(names).toContain(REFRESH_COOKIE);
  });
});
