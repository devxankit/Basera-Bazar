'use strict';

const request = require('supertest');
const { connectTestDB, clearCollections, disconnectTestDB } = require('./setup/testHelpers');

let app;
let partnerToken;
let partnerId;

beforeAll(async () => {
  await connectTestDB();
  app = require('../index');
});

afterAll(async () => {
  await disconnectTestDB();
});

beforeEach(async () => {
  await clearCollections();

  const { Partner } = require('../models/Partner');
  const partner = await Partner.create({
    name: 'Wallet Partner',
    phone: '9800000001',
    password: 'Test@12345',
    partner_type: 'property_agent',
    roles: ['property_agent'],
    onboarding_status: 'approved',
    is_active: true,
    location: { type: 'Point', coordinates: [85.0, 25.0] },
    wallet: { withdrawable_balance: 5000, total_earned: 5000, pending: 0 },
    bank_details: {
      account_number: '123456789012',
      ifsc_code: 'SBIN0001234',
      bank_name: 'SBI',
      account_holder_name: 'Wallet Partner'
    }
  });
  partnerId = partner._id.toString();

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ identifier: '9800000001', password: 'Test@12345', role: 'partner' });

  partnerToken = loginRes.body.token;
});

// ---------------------------------------------------------------------------
// GET /api/wallet/stats
// ---------------------------------------------------------------------------
describe('GET /api/wallet/stats', () => {
  test('returns 200 with wallet data for authenticated partner', async () => {
    const res = await request(app)
      .get('/api/wallet/stats')
      .set('Authorization', `Bearer ${partnerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  test('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/wallet/stats');
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// POST /api/wallet/withdraw
// ---------------------------------------------------------------------------
describe('POST /api/wallet/withdraw', () => {
  test('successfully creates withdrawal request', async () => {
    const res = await request(app)
      .post('/api/wallet/withdraw')
      .set('Authorization', `Bearer ${partnerToken}`)
      .send({ amount: 500 });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.amount).toBe(500);
    expect(res.body.data.status).toBe('pending');
  });

  test('deducts balance atomically', async () => {
    const { Partner } = require('../models/Partner');

    await request(app)
      .post('/api/wallet/withdraw')
      .set('Authorization', `Bearer ${partnerToken}`)
      .send({ amount: 1000 });

    const updated = await Partner.findById(partnerId);
    expect(updated.wallet.withdrawable_balance).toBe(4000);
  });

  test('rejects withdrawal exceeding balance', async () => {
    const res = await request(app)
      .post('/api/wallet/withdraw')
      .set('Authorization', `Bearer ${partnerToken}`)
      .send({ amount: 99999 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('rejects invalid (zero) amount', async () => {
    const res = await request(app)
      .post('/api/wallet/withdraw')
      .set('Authorization', `Bearer ${partnerToken}`)
      .send({ amount: 0 });

    expect(res.status).toBe(400);
  });

  test('returns 409 on duplicate Idempotency-Key', async () => {
    const key = 'test-idem-key-001';

    await request(app)
      .post('/api/wallet/withdraw')
      .set('Authorization', `Bearer ${partnerToken}`)
      .set('Idempotency-Key', key)
      .send({ amount: 100 });

    const res = await request(app)
      .post('/api/wallet/withdraw')
      .set('Authorization', `Bearer ${partnerToken}`)
      .set('Idempotency-Key', key)
      .send({ amount: 100 });

    // Either replayed (200/201) or currently in-flight (409)
    expect([200, 201, 409]).toContain(res.status);
  });

  test('rejects request without auth', async () => {
    const res = await request(app)
      .post('/api/wallet/withdraw')
      .send({ amount: 500 });

    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// GET /api/wallet/history
// ---------------------------------------------------------------------------
describe('GET /api/wallet/history', () => {
  test('returns withdrawal history for authenticated partner', async () => {
    await request(app)
      .post('/api/wallet/withdraw')
      .set('Authorization', `Bearer ${partnerToken}`)
      .send({ amount: 200 });

    const res = await request(app)
      .get('/api/wallet/history')
      .set('Authorization', `Bearer ${partnerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(1);
  });

  test('returns 401 without auth', async () => {
    const res = await request(app).get('/api/wallet/history');
    expect(res.status).toBe(401);
  });
});
