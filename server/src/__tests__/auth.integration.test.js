'use strict';

const request = require('supertest');
const { connectTestDB, clearCollections, disconnectTestDB } = require('./setup/testHelpers');

// The app must be required AFTER env vars are set by globalSetup
let app;

beforeAll(async () => {
  await connectTestDB();
  // Require app after DB connection is established
  app = require('../index');
});

afterEach(async () => {
  await clearCollections();
});

afterAll(async () => {
  await disconnectTestDB();
});

// ---------------------------------------------------------------------------
// POST /api/auth/login — password login
// ---------------------------------------------------------------------------
describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    // Seed a partner directly via model
    const { Partner } = require('../models/Partner');
    await Partner.create({
      name: 'Test Partner',
      phone: '9876543210',
      email: 'partner@test.com',
      password: 'Secret@123',
      partner_type: 'property_agent',
      roles: ['property_agent'],
      onboarding_status: 'approved',
      is_active: true,
      location: { type: 'Point', coordinates: [85.0, 25.0] }
    });
  });

  test('returns 200 and token on valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ identifier: '9876543210', password: 'Secret@123', role: 'partner' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeTruthy();
  });

  test('returns 401 on wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ identifier: '9876543210', password: 'WrongPass@1', role: 'partner' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('returns 404 on unknown phone', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ identifier: '9000000000', password: 'Secret@123', role: 'partner' });

    expect([404, 401]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  test('returns 400 on missing identifier', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'Secret@123' });

    expect(res.status).toBe(400);
  });

  test('returns 400 on missing password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ identifier: '9876543210' });

    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// GET /api/auth/me — protected profile
// ---------------------------------------------------------------------------
describe('GET /api/auth/me', () => {
  let token;

  beforeEach(async () => {
    const { Partner } = require('../models/Partner');
    await Partner.create({
      name: 'Test Partner',
      phone: '9876543210',
      email: 'partner@test.com',
      password: 'Secret@123',
      partner_type: 'property_agent',
      roles: ['property_agent'],
      onboarding_status: 'approved',
      is_active: true,
      location: { type: 'Point', coordinates: [85.0, 25.0] }
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ identifier: '9876543210', password: 'Secret@123', role: 'partner' });

    token = loginRes.body.token;
  });

  test('returns 200 with user data when authenticated', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  test('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('returns 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalidtoken');

    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Account lockout — 5 failed attempts should lock the account
// ---------------------------------------------------------------------------
describe('Account lockout after 5 failed login attempts', () => {
  beforeEach(async () => {
    const { Partner } = require('../models/Partner');
    await Partner.create({
      name: 'Lock Test Partner',
      phone: '9111111111',
      password: 'Valid@Pass1',
      partner_type: 'property_agent',
      roles: ['property_agent'],
      onboarding_status: 'approved',
      is_active: true,
      location: { type: 'Point', coordinates: [85.0, 25.0] }
    });
  });

  test('locks account after 5 consecutive wrong passwords', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/auth/login')
        .send({ identifier: '9111111111', password: 'WrongPass@1', role: 'partner' });
    }

    const res = await request(app)
      .post('/api/auth/login')
      .send({ identifier: '9111111111', password: 'WrongPass@1', role: 'partner' });

    expect(res.status).toBe(429);
    expect(res.body.code).toBe('ACCOUNT_LOCKED');
  });
});

// ---------------------------------------------------------------------------
// POST /api/auth/deactivate-account — self soft-delete
// ---------------------------------------------------------------------------
describe('POST /api/auth/deactivate-account', () => {
  let token;

  beforeEach(async () => {
    const { Partner } = require('../models/Partner');
    await Partner.create({
      name: 'Deactivate Test Partner',
      phone: '9876543210',
      email: 'partner@test.com',
      password: 'Secret@123',
      partner_type: 'property_agent',
      roles: ['property_agent'],
      onboarding_status: 'approved',
      is_active: true,
      location: { type: 'Point', coordinates: [85.0, 25.0] }
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ identifier: '9876543210', password: 'Secret@123', role: 'partner' });
    token = loginRes.body.token;
  });

  test('requires authentication', async () => {
    const res = await request(app).post('/api/auth/deactivate-account');
    expect(res.status).toBe(401);
  });

  test('deactivates the account and blocks subsequent login', async () => {
    const deactivateRes = await request(app)
      .post('/api/auth/deactivate-account')
      .set('Authorization', `Bearer ${token}`);

    expect(deactivateRes.status).toBe(200);
    expect(deactivateRes.body.success).toBe(true);

    // Account should now be marked inactive in the DB
    const { Partner } = require('../models/Partner');
    const partner = await Partner.findOne({ phone: '9876543210' });
    expect(partner.is_active).toBe(false);

    // Re-login should be rejected with ACCOUNT_INACTIVE
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ identifier: '9876543210', password: 'Secret@123', role: 'partner' });

    expect(loginRes.status).toBe(403);
    expect(loginRes.body.code).toBe('ACCOUNT_INACTIVE');
  });
});
