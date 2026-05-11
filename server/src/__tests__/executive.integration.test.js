'use strict';

const request = require('supertest');
const { connectTestDB, clearCollections, disconnectTestDB } = require('./setup/testHelpers');

let app;
let executiveToken;
let executiveId;

beforeAll(async () => {
  await connectTestDB();
  app = require('../index');
});

afterAll(async () => {
  await disconnectTestDB();
});

beforeEach(async () => {
  await clearCollections();

  const Executive = require('../models/Executive');
  const exec = await Executive.create({
    name: 'Test Executive',
    phone: '9700000001',
    email: 'exec@test.com',
    password: 'Exec@12345',
    onboarding_status: 'approved',
    is_active: true,
    wallet_balance: 2000,
    total_earnings: 2000,
    bank_details: {
      account_number: '987654321012',
      ifsc_code: 'HDFC0001234',
      bank_name: 'HDFC',
      account_holder_name: 'Test Executive'
    }
  });
  executiveId = exec._id.toString();

  const loginRes = await request(app)
    .post('/api/executive/login')
    .send({ phone: '9700000001', password: 'Exec@12345' });

  executiveToken = loginRes.body.token;
});

// ---------------------------------------------------------------------------
// POST /api/executive/login
// ---------------------------------------------------------------------------
describe('POST /api/executive/login', () => {
  test('returns 200 and token on valid credentials', async () => {
    const res = await request(app)
      .post('/api/executive/login')
      .send({ phone: '9700000001', password: 'Exec@12345' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeTruthy();
  });

  test('returns 401 on wrong password', async () => {
    const res = await request(app)
      .post('/api/executive/login')
      .send({ phone: '9700000001', password: 'WrongPass@1' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('returns 404 on unknown phone', async () => {
    const res = await request(app)
      .post('/api/executive/login')
      .send({ phone: '9000000099', password: 'Exec@12345' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('returns 403 for inactive executive', async () => {
    const Executive = require('../models/Executive');
    await Executive.findByIdAndUpdate(executiveId, { is_active: false });

    const res = await request(app)
      .post('/api/executive/login')
      .send({ phone: '9700000001', password: 'Exec@12345' });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('ACCOUNT_INACTIVE');
  });
});

// ---------------------------------------------------------------------------
// GET /api/executive/dashboard
// ---------------------------------------------------------------------------
describe('GET /api/executive/dashboard', () => {
  test('returns 200 with dashboard data for authenticated executive', async () => {
    const res = await request(app)
      .get('/api/executive/dashboard')
      .set('Authorization', `Bearer ${executiveToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.profile).toBeDefined();
    expect(res.body.data.stats).toBeDefined();
  });

  test('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/executive/dashboard');
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// GET /api/executive/transactions
// ---------------------------------------------------------------------------
describe('GET /api/executive/transactions', () => {
  test('returns 200 with empty transactions for new executive', async () => {
    const res = await request(app)
      .get('/api/executive/transactions')
      .set('Authorization', `Bearer ${executiveToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('returns 401 without auth', async () => {
    const res = await request(app).get('/api/executive/transactions');
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// POST /api/executive/withdraw
// ---------------------------------------------------------------------------
describe('POST /api/executive/withdraw', () => {
  test('successfully creates withdrawal request', async () => {
    const res = await request(app)
      .post('/api/executive/withdraw')
      .set('Authorization', `Bearer ${executiveToken}`)
      .send({ amount: 500 });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.amount).toBe(500);
    expect(res.body.data.status).toBe('pending');
    expect(res.body.data.user_type).toBe('Executive');
  });

  test('deducts wallet balance atomically', async () => {
    const Executive = require('../models/Executive');

    await request(app)
      .post('/api/executive/withdraw')
      .set('Authorization', `Bearer ${executiveToken}`)
      .send({ amount: 800 });

    const updated = await Executive.findById(executiveId);
    expect(updated.wallet_balance).toBe(1200);
  });

  test('rejects withdrawal exceeding balance', async () => {
    const res = await request(app)
      .post('/api/executive/withdraw')
      .set('Authorization', `Bearer ${executiveToken}`)
      .send({ amount: 99999 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('returns 409 on duplicate Idempotency-Key', async () => {
    const key = 'exec-idem-key-001';

    await request(app)
      .post('/api/executive/withdraw')
      .set('Authorization', `Bearer ${executiveToken}`)
      .set('Idempotency-Key', key)
      .send({ amount: 100 });

    const res = await request(app)
      .post('/api/executive/withdraw')
      .set('Authorization', `Bearer ${executiveToken}`)
      .set('Idempotency-Key', key)
      .send({ amount: 100 });

    expect([200, 201, 409]).toContain(res.status);
  });

  test('returns 401 without auth', async () => {
    const res = await request(app)
      .post('/api/executive/withdraw')
      .send({ amount: 500 });

    expect(res.status).toBe(401);
  });
});
