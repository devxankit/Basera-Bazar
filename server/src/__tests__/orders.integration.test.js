'use strict';

const request = require('supertest');
const { connectTestDB, clearCollections, disconnectTestDB } = require('./setup/testHelpers');

let app;
let buyerToken;
let sellerToken;

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

  // Buyer partner (property_agent)
  await Partner.create({
    name: 'Buyer Partner',
    phone: '9600000001',
    password: 'Buyer@12345',
    partner_type: 'property_agent',
    roles: ['property_agent'],
    onboarding_status: 'approved',
    is_active: true,
    location: { type: 'Point', coordinates: [85.0, 25.0] }
  });
  // Seller partner (mandi_seller)
  await Partner.create({
    name: 'Seller Partner',
    phone: '9600000002',
    password: 'Seller@12345',
    partner_type: 'mandi_seller',
    roles: ['mandi_seller'],
    onboarding_status: 'approved',
    is_active: true,
    location: { type: 'Point', coordinates: [85.1, 25.1] }
  });

  const [buyerLogin, sellerLogin] = await Promise.all([
    request(app)
      .post('/api/auth/login')
      .send({ identifier: '9600000001', password: 'Buyer@12345', role: 'partner' }),
    request(app)
      .post('/api/auth/login')
      .send({ identifier: '9600000002', password: 'Seller@12345', role: 'partner' })
  ]);

  buyerToken = buyerLogin.body.token;
  sellerToken = sellerLogin.body.token;
});

// ---------------------------------------------------------------------------
// GET /api/orders/my-orders
// ---------------------------------------------------------------------------
describe('GET /api/orders/my-orders', () => {
  test('returns 200 with empty list for new buyer', async () => {
    const res = await request(app)
      .get('/api/orders/my-orders')
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(0);
  });

  test('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/orders/my-orders');
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// GET /api/orders/seller-orders
// ---------------------------------------------------------------------------
describe('GET /api/orders/seller-orders', () => {
  test('returns 200 with empty list for new seller', async () => {
    const res = await request(app)
      .get('/api/orders/seller-orders')
      .set('Authorization', `Bearer ${sellerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(0);
  });

  test('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/orders/seller-orders');
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// GET /api/orders/:id
// ---------------------------------------------------------------------------
describe('GET /api/orders/:id', () => {
  test('returns 404 for non-existent order', async () => {
    const mongoose = require('mongoose');
    const fakeId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .get(`/api/orders/${fakeId}`)
      .set('Authorization', `Bearer ${buyerToken}`);

    expect([404, 403]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  test('returns 401 without auth', async () => {
    const mongoose = require('mongoose');
    const fakeId = new mongoose.Types.ObjectId().toString();

    const res = await request(app).get(`/api/orders/${fakeId}`);
    expect(res.status).toBe(401);
  });
});
