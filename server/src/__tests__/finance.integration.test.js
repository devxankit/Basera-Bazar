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
    name: 'Finance Test Partner',
    phone: '9800000001',
    password: 'Partner@12345',
    partner_type: 'property_agent',
    roles: ['property_agent'],
    onboarding_status: 'approved',
    is_active: true,
    location: { type: 'Point', coordinates: [85.0, 25.0] }
  });
  partnerId = partner._id.toString();

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ identifier: '9800000001', password: 'Partner@12345', role: 'partner' });

  partnerToken = loginRes.body.token;
});

// ---------------------------------------------------------------------------
// POST /api/finance/subscription/initiate
// ---------------------------------------------------------------------------
describe('POST /api/finance/subscription/initiate', () => {
  test('returns 404 for non-existent plan', async () => {
    const mongoose = require('mongoose');
    const fakePlanId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .post('/api/finance/subscription/initiate')
      .set('Authorization', `Bearer ${partnerToken}`)
      .send({ plan_id: fakePlanId });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('returns 401 without auth', async () => {
    const res = await request(app)
      .post('/api/finance/subscription/initiate')
      .send({ plan_id: 'any' });

    expect(res.status).toBe(401);
  });

  test('happy path — creates RazorpayOrder record and returns mock order_id', async () => {
    const { SubscriptionPlan, RazorpayOrder } = require('../models/Finance');

    const plan = await SubscriptionPlan.create({
      name: 'Basic Plan',
      description: 'Test plan',
      applicable_to: ['property_agent'],
      duration_days: 30,
      price: 999,
      is_active: true
    });

    const res = await request(app)
      .post('/api/finance/subscription/initiate')
      .set('Authorization', `Bearer ${partnerToken}`)
      .send({ plan_id: plan._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.order_id).toMatch(/^order_mock_/);

    const rzOrder = await RazorpayOrder.findOne({ razorpay_order_id: res.body.order_id });
    expect(rzOrder).not.toBeNull();
    expect(rzOrder.status).toBe('created');
    expect(rzOrder.entity_id.toString()).toBe(partnerId);
  });
});

// ---------------------------------------------------------------------------
// POST /api/finance/subscription/verify
// ---------------------------------------------------------------------------
describe('POST /api/finance/subscription/verify', () => {
  let planId;
  let mockOrderId;

  beforeEach(async () => {
    const { SubscriptionPlan } = require('../models/Finance');

    const plan = await SubscriptionPlan.create({
      name: 'Test Plan',
      description: 'For testing',
      applicable_to: ['property_agent'],
      duration_days: 30,
      price: 499,
      is_active: true
    });
    planId = plan._id.toString();

    // Initiate so there's a RazorpayOrder record to verify against
    const initRes = await request(app)
      .post('/api/finance/subscription/initiate')
      .set('Authorization', `Bearer ${partnerToken}`)
      .send({ plan_id: planId });

    mockOrderId = initRes.body.order_id;
  });

  test('mock verify — activates subscription', async () => {
    const { Subscription } = require('../models/Finance');

    const res = await request(app)
      .post('/api/finance/subscription/verify')
      .set('Authorization', `Bearer ${partnerToken}`)
      .send({
        razorpay_order_id: mockOrderId,
        razorpay_payment_id: `pay_mock_${Date.now()}`,
        razorpay_signature: 'mock_sig',
        plan_id: planId
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const sub = await Subscription.findOne({ partner_id: partnerId });
    expect(sub).not.toBeNull();
    expect(sub.status).toBe('active');
  });

  test('returns 404 for unknown order_id', async () => {
    const res = await request(app)
      .post('/api/finance/subscription/verify')
      .set('Authorization', `Bearer ${partnerToken}`)
      .send({
        razorpay_order_id: 'order_mock_doesnotexist',
        razorpay_payment_id: 'pay_x',
        razorpay_signature: 'sig',
        plan_id: planId
      });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('non-mock order without valid signature returns 400', async () => {
    // Manually insert a RazorpayOrder with a non-mock ID to trigger signature check
    const { RazorpayOrder } = require('../models/Finance');
    await RazorpayOrder.create({
      razorpay_order_id: 'order_real_test123',
      entity_type: 'partner',
      entity_id: partnerId,
      purpose: `subscription_${planId}`,
      amount: 499,
      status: 'created'
    });

    const res = await request(app)
      .post('/api/finance/subscription/verify')
      .set('Authorization', `Bearer ${partnerToken}`)
      .send({
        razorpay_order_id: 'order_real_test123',
        razorpay_payment_id: 'pay_fake',
        razorpay_signature: 'wrong_signature',
        plan_id: planId
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/signature/i);
  });

  test('returns 401 without auth', async () => {
    const res = await request(app)
      .post('/api/finance/subscription/verify')
      .send({ razorpay_order_id: mockOrderId, razorpay_payment_id: 'p', razorpay_signature: 's', plan_id: planId });

    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// GET /api/finance/transactions
// ---------------------------------------------------------------------------
describe('GET /api/finance/transactions', () => {
  test('returns 200 with empty list for new partner', async () => {
    const res = await request(app)
      .get('/api/finance/transactions')
      .set('Authorization', `Bearer ${partnerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('returns 401 without auth', async () => {
    const res = await request(app).get('/api/finance/transactions');
    expect(res.status).toBe(401);
  });
});
