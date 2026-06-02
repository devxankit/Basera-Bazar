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
    name: 'Test Partner',
    phone: '9900000001',
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
    .send({ identifier: '9900000001', password: 'Partner@12345', role: 'partner' });

  partnerToken = loginRes.body.token;
});

// ---------------------------------------------------------------------------
// GET /api/partners/profile
// ---------------------------------------------------------------------------
describe('GET /api/partners/profile', () => {
  test('returns partner profile for authenticated partner', async () => {
    const res = await request(app)
      .get('/api/partners/profile')
      .set('Authorization', `Bearer ${partnerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('name', 'Test Partner');
    expect(res.body.data).toHaveProperty('phone', '9900000001');
    expect(res.body.data).not.toHaveProperty('password');
  });

  test('returns 401 without auth', async () => {
    const res = await request(app).get('/api/partners/profile');
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// POST /api/partners/add-role
// ---------------------------------------------------------------------------
describe('POST /api/partners/add-role', () => {
  test('requires payment (402) for a new role when no free credit is available', async () => {
    const res = await request(app)
      .post('/api/partners/add-role')
      .set('Authorization', `Bearer ${partnerToken}`)
      .send({ new_role: 'service_provider' });

    // New model: a brand-new role upgrade needs the one-time fee (or a credit)
    expect(res.status).toBe(402);
    expect(res.body.requires_payment).toBe(true);
    expect(res.body).toHaveProperty('fee');
  });

  test('submits a free role request when a 1+1 role credit is applied', async () => {
    const { Partner } = require('../models/Partner');
    await Partner.findByIdAndUpdate(partnerId, { $set: { role_credits: 1 } });

    const res = await request(app)
      .post('/api/partners/add-role')
      .set('Authorization', `Bearer ${partnerToken}`)
      .send({ new_role: 'service_provider', use_role_credit: true });

    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);

    const updated = await Partner.findById(partnerId);
    expect(updated.role_credits).toBe(0);
    expect(updated.role_requests.some(r => r.role === 'service_provider' && r.status === 'pending' && r.is_free_upgrade)).toBe(true);
  });

  test('returns 400 for invalid role', async () => {
    const res = await request(app)
      .post('/api/partners/add-role')
      .set('Authorization', `Bearer ${partnerToken}`)
      .send({ new_role: 'InvalidRole' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('returns 400 when trying to add an already active role', async () => {
    const res = await request(app)
      .post('/api/partners/add-role')
      .set('Authorization', `Bearer ${partnerToken}`)
      .send({ new_role: 'property_agent' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already/i);
  });

  test('returns 401 without auth', async () => {
    const res = await request(app)
      .post('/api/partners/add-role')
      .send({ new_role: 'supplier' });

    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/partners/delete-role
// ---------------------------------------------------------------------------
describe('DELETE /api/partners/delete-role', () => {
  test('blocks deletion when partner has only one role', async () => {
    const res = await request(app)
      .delete('/api/partners/delete-role')
      .set('Authorization', `Bearer ${partnerToken}`)
      .send({ role: 'property_agent' });

    // Cannot remove the only role
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('successfully removes a role when partner has multiple roles (seeded directly)', async () => {
    // Directly update partner in DB to have two roles
    const { Partner } = require('../models/Partner');
    await Partner.findByIdAndUpdate(partnerId, { roles: ['property_agent', 'supplier'], active_role: 'property_agent' });

    const res = await request(app)
      .delete('/api/partners/delete-role')
      .set('Authorization', `Bearer ${partnerToken}`)
      .send({ role: 'supplier' });

    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
  });

  test('returns 400 for role not assigned to this partner', async () => {
    const res = await request(app)
      .delete('/api/partners/delete-role')
      .set('Authorization', `Bearer ${partnerToken}`)
      .send({ role: 'mandi_seller' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('returns 401 without auth', async () => {
    const res = await request(app)
      .delete('/api/partners/delete-role')
      .send({ role: 'property_agent' });

    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/partners/switch-role
// ---------------------------------------------------------------------------
describe('PUT /api/partners/switch-role', () => {
  test('returns 403 when switching to a role not assigned to partner', async () => {
    const res = await request(app)
      .put('/api/partners/switch-role')
      .set('Authorization', `Bearer ${partnerToken}`)
      .send({ role: 'mandi_seller' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('returns 400 for invalid role value (fails Zod validation)', async () => {
    const res = await request(app)
      .put('/api/partners/switch-role')
      .set('Authorization', `Bearer ${partnerToken}`)
      .send({ role: 'NotARole' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('returns 401 without auth', async () => {
    const res = await request(app)
      .put('/api/partners/switch-role')
      .send({ role: 'property_agent' });

    expect(res.status).toBe(401);
  });
});
