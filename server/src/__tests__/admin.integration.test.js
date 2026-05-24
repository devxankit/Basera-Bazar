'use strict';

const request = require('supertest');
const { connectTestDB, clearCollections, disconnectTestDB } = require('./setup/testHelpers');

let app;
let adminToken;
let adminId;

beforeAll(async () => {
  await connectTestDB();
  app = require('../index');
});

afterAll(async () => {
  await disconnectTestDB();
});

beforeEach(async () => {
  await clearCollections();

  const { AdminUser } = require('../models/Admin');

  // 1. Seed a Super Admin
  const admin = await AdminUser.create({
    name: 'Main Super Admin',
    phone: '9900000010',
    email: 'admin@baserabazar.com',
    password: 'AdminPassword@123',
    role: 'super_admin',
    is_active: true
  });
  adminId = admin._id.toString();

  // 2. Log in Admin to get token
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ identifier: '9900000010', password: 'AdminPassword@123', role: 'super_admin' });

  adminToken = loginRes.body.token;
});

describe('Admin Modules Integration Tests', () => {
  // ---------------------------------------------------------------------------
  // Admin Profile & Dashboard
  // ---------------------------------------------------------------------------
  test('Gets dashboard stats and profiles', async () => {
    const statsRes = await request(app)
      .get('/api/admin/dashboard/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(statsRes.status).toBe(200);
    expect(statsRes.body.success).toBe(true);

    const profileRes = await request(app)
      .get('/api/admin/profile/me')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(profileRes.status).toBe(200);
    expect(profileRes.body.data.name).toBe('Main Super Admin');
  });

  // ---------------------------------------------------------------------------
  // User Management
  // ---------------------------------------------------------------------------
  test('Admin performs CRUD on customers/users', async () => {
    // 1. Create User
    const createRes = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'John Customer',
        phone: '9900000011',
        password: 'UserPass@123',
        email: 'john@customer.com',
        role: 'Customer'
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    const userId = createRes.body.data._id;

    // 2. Get Users list
    const listRes = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listRes.status).toBe(200);

    // 3. Update User
    const updateRes = await request(app)
      .put(`/api/admin/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'John Customer Updated' });
    expect(updateRes.status).toBe(200);

    // 4. Delete User
    const deleteRes = await request(app)
      .delete(`/api/admin/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(deleteRes.status).toBe(200);
  });

  // ---------------------------------------------------------------------------
  // Listing Management (Approval, Detail, etc.)
  // ---------------------------------------------------------------------------
  test('Admin manages partner listings & categories', async () => {
    // 1. Create System Category
    const createCatRes = await request(app)
      .post('/api/admin/system/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Plumbing Service',
        slug: 'plumbing-service',
        type: 'service'
      });

    expect(createCatRes.status).toBe(201);
    const categoryId = createCatRes.body.data._id;

    // 2. Update System Category
    const updateCatRes = await request(app)
      .put(`/api/admin/system/categories/${categoryId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Plumbing Services' });
    expect(updateCatRes.status).toBe(200);

    // 3. Delete System Category
    const deleteCatRes = await request(app)
      .delete(`/api/admin/system/categories/${categoryId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(deleteCatRes.status).toBe(200);
  });

  // ---------------------------------------------------------------------------
  // Staff Management (Team Leaders & Office Staff)
  // ---------------------------------------------------------------------------
  test('Admin manages team leaders and office staff onboarding', async () => {
    // 1. Onboard Team Leader
    const createTlRes = await request(app)
      .post('/api/admin/staff/team-leaders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Staff TL Name',
        phone: '9900000012',
        email: 'tl@basera.com',
        state: 'Bihar',
        district: 'Patna',
        zone: 'East',
        fixed_salary: 30000,
        commission_rate: 10,
        password: 'TLPassword@123',
        address: { address_line: 'Fraser Road', city: 'Patna', state: 'Bihar', pincode: '800001' }
      });

    expect(createTlRes.status).toBe(201);
    expect(createTlRes.body.success).toBe(true);
    const tlId = createTlRes.body.data._id;

    // 2. Onboard Office Staff linked to TL
    const createOsRes = await request(app)
      .post('/api/admin/staff/office-staff')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Office Staff Name',
        phone: '9900000013',
        email: 'os@basera.com',
        team_leader_id: tlId,
        fixed_salary: 15000,
        calling_specialization: 'lead_generation',
        password: 'OSPassword@123',
        address: { address_line: 'Fraser Road', city: 'Patna', state: 'Bihar', pincode: '800001' }
      });

    expect(createOsRes.status).toBe(201);
    expect(createOsRes.body.success).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // Marketplace Admin Controls
  // ---------------------------------------------------------------------------
  test('Admin performs marketplace and KYC controls', async () => {
    // 1. Seed a partner for KYC
    const { Partner } = require('../models/Partner');
    const partner = await Partner.create({
      name: 'Seller Partner',
      phone: '9900000014',
      password: 'Partner@12345',
      partner_type: 'mandi_seller',
      roles: ['mandi_seller'],
      is_active: true,
      location: { type: 'Point', coordinates: [85.0, 25.0] }
    });

    const kycRes = await request(app)
      .patch(`/api/admin/marketplace/kyc/${partner._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ kyc_status: 'verified' });

    expect(kycRes.status).toBe(200);
    expect(kycRes.body.success).toBe(true);

    // 2. Get marketplace orders
    const ordersRes = await request(app)
      .get('/api/admin/marketplace/orders')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(ordersRes.status).toBe(200);
  });
});
