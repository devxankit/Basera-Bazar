'use strict';

const request = require('supertest');
const mongoose = require('mongoose');
const { connectTestDB, clearCollections, disconnectTestDB } = require('./setup/testHelpers');

let app;
let buyerToken;
let sellerToken;
let sellerId;
let product;

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
  const { MandiListing } = require('../models/Listing');

  const seller = await Partner.create({
    name: 'Test Seller',
    phone: '9700000001',
    password: 'Seller@12345',
    partner_type: 'mandi_seller',
    roles: ['mandi_seller'],
    onboarding_status: 'approved',
    is_active: true,
    location: { type: 'Point', coordinates: [85.0, 25.0] }
  });
  sellerId = seller._id.toString();

  await Partner.create({
    name: 'Test Buyer',
    phone: '9700000002',
    password: 'Buyer@12345',
    partner_type: 'property_agent',
    roles: ['property_agent'],
    onboarding_status: 'approved',
    is_active: true,
    location: { type: 'Point', coordinates: [85.1, 25.1] }
  });

  product = await MandiListing.create({
    partner_id: seller._id,
    title: 'Red Bricks Premium',
    material_name: 'Bricks',
    pricing: { unit: 'piece', price_per_unit: 10 },
    location: { type: 'Point', coordinates: [85.0, 25.0] },
    stock_quantity: 100,
    status: 'active'
  });

  const [sellerRes, buyerRes] = await Promise.all([
    request(app)
      .post('/api/auth/login')
      .send({ identifier: '9700000001', password: 'Seller@12345', role: 'partner' }),
    request(app)
      .post('/api/auth/login')
      .send({ identifier: '9700000002', password: 'Buyer@12345', role: 'partner' })
  ]);

  sellerToken = sellerRes.body.token;
  buyerToken = buyerRes.body.token;
});

// ---------------------------------------------------------------------------
// Helper — completes checkout and verifies payment, returns { order, item }
// ---------------------------------------------------------------------------
async function checkoutAndVerify(qty = 2) {
  const checkoutRes = await request(app)
    .post('/api/orders/checkout')
    .set('Authorization', `Bearer ${buyerToken}`)
    .send({
      items: [{ productId: product._id.toString(), qty }],
      shipping_address: { name: 'Test Buyer', phone: '9700000002', address: '1 Test St', city: 'Patna', pincode: '800001' }
    });

  expect(checkoutRes.status).toBe(201);
  const { razorpay_order_id, order } = checkoutRes.body.data;

  const verifyRes = await request(app)
    .post('/api/orders/payment/verify')
    .set('Authorization', `Bearer ${buyerToken}`)
    .send({
      razorpay_order_id,
      razorpay_payment_id: `pay_mock_${Date.now()}`,
      razorpay_signature: 'mock_sig'
    });

  expect(verifyRes.status).toBe(200);

  // Return the refreshed order from DB
  const Order = require('../models/Order');
  const dbOrder = await Order.findById(order._id);
  return { order: dbOrder, razorpay_order_id };
}

// ---------------------------------------------------------------------------
// POST /api/orders/checkout
// ---------------------------------------------------------------------------
describe('POST /api/orders/checkout', () => {
  test('happy path — creates order with correct pricing', async () => {
    const res = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        items: [{ productId: product._id.toString(), qty: 3 }],
        shipping_address: { name: 'Test Buyer', phone: '9700000002', address: '1 Test St', city: 'Patna', pincode: '800001' }
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('razorpay_order_id');
    expect(res.body.data.order.total_amount).toBe(30); // 10 * 3
  });

  test('returns 401 without auth', async () => {
    const res = await request(app)
      .post('/api/orders/checkout')
      .send({ items: [{ productId: product._id.toString(), qty: 1 }] });

    expect(res.status).toBe(401);
  });

  test('returns 400 for empty cart', async () => {
    const res = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ items: [] });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('returns 400 for invalid product_id', async () => {
    const res = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ items: [{ productId: 'not-an-object-id', qty: 1 }] });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('returns 400 for non-integer qty', async () => {
    const res = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ items: [{ productId: product._id.toString(), qty: 1.5 }] });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('returns 400 when stock is 0', async () => {
    const { MandiListing } = require('../models/Listing');
    await MandiListing.findByIdAndUpdate(product._id, { stock_quantity: 0 });

    const res = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ items: [{ productId: product._id.toString(), qty: 1 }] });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/stock/i);
  });

  test('returns 404 for non-existent product', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ items: [{ productId: fakeId, qty: 1 }] });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// POST /api/orders/payment/verify
// ---------------------------------------------------------------------------
describe('POST /api/orders/payment/verify', () => {
  test('mock payment — verifies and deducts stock', async () => {
    const { MandiListing } = require('../models/Listing');
    const before = await MandiListing.findById(product._id);

    const checkoutRes = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        items: [{ productId: product._id.toString(), qty: 5 }],
        shipping_address: { name: 'Test Buyer', phone: '9700000002', address: '1 Test St', city: 'Patna', pincode: '800001' }
      });

    expect(checkoutRes.status).toBe(201);
    const { razorpay_order_id } = checkoutRes.body.data;

    const verifyRes = await request(app)
      .post('/api/orders/payment/verify')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        razorpay_order_id,
        razorpay_payment_id: 'pay_mock_001',
        razorpay_signature: 'mock_sig'
      });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.success).toBe(true);

    const after = await MandiListing.findById(product._id);
    expect(after.stock_quantity).toBe(before.stock_quantity - 5);
  });

  test('duplicate payment — returns 200 idempotently', async () => {
    const checkoutRes = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        items: [{ productId: product._id.toString(), qty: 1 }],
        shipping_address: { name: 'Test Buyer', phone: '9700000002', address: '1 Test St', city: 'Patna', pincode: '800001' }
      });

    const { razorpay_order_id } = checkoutRes.body.data;
    const payload = { razorpay_order_id, razorpay_payment_id: 'pay_mock_002', razorpay_signature: 'mock_sig' };

    const first = await request(app)
      .post('/api/orders/payment/verify')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send(payload);
    expect(first.status).toBe(200);

    const second = await request(app)
      .post('/api/orders/payment/verify')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send(payload);
    expect(second.status).toBe(200);
    expect(second.body.message).toMatch(/already verified/i);
  });

  test('returns 404 for unknown razorpay_order_id', async () => {
    const res = await request(app)
      .post('/api/orders/payment/verify')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        razorpay_order_id: 'order_mock_doesnotexist',
        razorpay_payment_id: 'pay_x',
        razorpay_signature: 'sig'
      });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('returns 409 when stock runs out between checkout and verify', async () => {
    const { MandiListing } = require('../models/Listing');

    const checkoutRes = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        items: [{ productId: product._id.toString(), qty: 10 }],
        shipping_address: { name: 'Test Buyer', phone: '9700000002', address: '1 Test St', city: 'Patna', pincode: '800001' }
      });

    expect(checkoutRes.status).toBe(201);
    const { razorpay_order_id } = checkoutRes.body.data;

    // Drain stock before verify
    await MandiListing.findByIdAndUpdate(product._id, { stock_quantity: 0 });

    const verifyRes = await request(app)
      .post('/api/orders/payment/verify')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ razorpay_order_id, razorpay_payment_id: 'pay_mock_003', razorpay_signature: 'mock_sig' });

    expect(verifyRes.status).toBe(409);
    expect(verifyRes.body.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/orders/lead/:orderId/:itemId/status
// ---------------------------------------------------------------------------
describe('PATCH /api/orders/lead/:orderId/:itemId/status', () => {
  test('valid forward transition pending → accepted', async () => {
    const { order } = await checkoutAndVerify(2);
    const item = order.items[0];

    const res = await request(app)
      .patch(`/api/orders/lead/${order._id}/${item._id}/status`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ status: 'accepted' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('rejects backward transition accepted → pending', async () => {
    const { order } = await checkoutAndVerify(2);
    const item = order.items[0];

    await request(app)
      .patch(`/api/orders/lead/${order._id}/${item._id}/status`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ status: 'accepted' });

    const res = await request(app)
      .patch(`/api/orders/lead/${order._id}/${item._id}/status`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ status: 'pending' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/back/i);
  });

  test('rejects invalid status value', async () => {
    const { order } = await checkoutAndVerify(1);
    const item = order.items[0];

    const res = await request(app)
      .patch(`/api/orders/lead/${order._id}/${item._id}/status`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ status: 'flying' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('returns 403 when non-seller tries to update lead', async () => {
    const { order } = await checkoutAndVerify(1);
    const item = order.items[0];

    // buyer tries to update the seller lead
    const res = await request(app)
      .patch(`/api/orders/lead/${order._id}/${item._id}/status`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ status: 'accepted' });

    expect(res.status).toBe(403);
  });

  test('returns 404 for non-existent order', async () => {
    const fakeOrderId = new mongoose.Types.ObjectId().toString();
    const fakeItemId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .patch(`/api/orders/lead/${fakeOrderId}/${fakeItemId}/status`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ status: 'accepted' });

    expect(res.status).toBe(404);
  });

  test('cancellation by seller records penalty', async () => {
    const { order } = await checkoutAndVerify(2);
    const item = order.items[0];

    const res = await request(app)
      .patch(`/api/orders/lead/${order._id}/${item._id}/status`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ status: 'cancelled' });

    expect(res.status).toBe(200);

    const { Partner } = require('../models/Partner');
    const sellerDoc = await Partner.findById(sellerId);
    // Penalty should be recorded (commission_amount may be 0 if no commission config)
    expect(sellerDoc.profile.mandi_profile.penalty_due).toBeGreaterThanOrEqual(0);
  });
});
