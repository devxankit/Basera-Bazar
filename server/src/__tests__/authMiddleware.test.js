'use strict';

// Mock heavy side-effect modules before any require
jest.mock('../config/redis', () => ({
  status: 'end',
  on: jest.fn(),
  get: jest.fn(),
  setex: jest.fn(),
  del: jest.fn()
}));

jest.mock('../models/Admin', () => ({
  AdminUser: { findById: jest.fn() }
}));
jest.mock('../models/User', () => ({
  User: { findById: jest.fn() }
}));
jest.mock('../models/Partner', () => ({
  Partner: { findById: jest.fn() }
}));
jest.mock('../models/Executive', () => ({
  findById: jest.fn()
}));

const jwt = require('jsonwebtoken');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');
const { User } = require('../models/User');

const JWT_SECRET = 'test-secret';
process.env.JWT_SECRET = JWT_SECRET;

// Helper: build a minimal Express-like req/res pair
const buildReqRes = (overrides = {}) => {
  const req = {
    headers: {},
    user: null,
    ...overrides
  };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  };
  const next = jest.fn();
  return { req, res, next };
};

// ---------------------------------------------------------------------------
// protect middleware
// ---------------------------------------------------------------------------
describe('protect middleware', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rejects request with no Authorization header', async () => {
    const { req, res, next } = buildReqRes();
    await protect(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects request with malformed token', async () => {
    const { req, res, next } = buildReqRes({
      headers: { authorization: 'Bearer not-a-real-jwt' }
    });
    await protect(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects when user no longer exists in DB', async () => {
    const token = jwt.sign({ id: 'abc123', role: 'user' }, JWT_SECRET);
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(null)
    });

    const { req, res, next } = buildReqRes({
      headers: { authorization: `Bearer ${token}` }
    });
    await protect(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('rejects suspended user', async () => {
    const token = jwt.sign({ id: 'abc123', role: 'user' }, JWT_SECRET);
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: 'abc123',
        role: 'user',
        onboarding_status: 'suspended',
        is_active: true,
        toObject: jest.fn().mockReturnValue({ _id: 'abc123' })
      })
    });

    const { req, res, next } = buildReqRes({
      headers: { authorization: `Bearer ${token}` }
    });
    await protect(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringMatching(/suspended/i) })
    );
  });

  test('rejects when token version is stale', async () => {
    const token = jwt.sign({ id: 'abc123', role: 'user', version: 1 }, JWT_SECRET);
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: 'abc123',
        role: 'user',
        is_active: true,
        token_version: 5,
        toObject: jest.fn().mockReturnValue({ _id: 'abc123' })
      })
    });

    const { req, res, next } = buildReqRes({
      headers: { authorization: `Bearer ${token}` }
    });
    await protect(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringMatching(/session expired/i) })
    );
  });

  test('calls next() for a valid active user', async () => {
    const token = jwt.sign({ id: 'abc123', role: 'user', version: 2 }, JWT_SECRET);
    const fakeUser = {
      _id: 'abc123',
      id: 'abc123',
      role: 'user',
      is_active: true,
      token_version: 2,
      toObject: jest.fn().mockReturnValue({ _id: 'abc123', role: 'user' })
    };
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(fakeUser)
    });

    const { req, res, next } = buildReqRes({
      headers: { authorization: `Bearer ${token}` }
    });
    await protect(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// authorizeRoles middleware
// ---------------------------------------------------------------------------
describe('authorizeRoles middleware', () => {
  test('calls next() when user role is in allowed list', () => {
    const { req, res, next } = buildReqRes();
    req.user = { role: 'super_admin' };
    authorizeRoles('super_admin', 'admin')(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('returns 403 when user role is not in allowed list', () => {
    const { req, res, next } = buildReqRes();
    req.user = { role: 'user' };
    authorizeRoles('super_admin')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
