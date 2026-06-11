'use strict';

// Mock the Cloudinary upload middleware to avoid network requests and Multer dependency in tests
jest.mock('../config/cloudinary', () => {
  return {
    upload: {
      single: (fieldName) => (req, res, next) => {
        // Mock a successful upload if 'image' field is present, otherwise simulate missing file
        if (req.headers['content-type']?.includes('multipart/form-data')) {
          req.file = {
            path: 'https://res.cloudinary.com/mock-image-url.png',
            originalname: 'test.png',
            mimetype: 'image/png'
          };
        }
        next();
      }
    }
  };
});

// Mock the firebaseAdmin service to avoid real network requests to Firebase
jest.mock('../services/firebaseAdmin', () => {
  return {
    sendPushNotification: jest.fn().mockResolvedValue({
      successCount: 1,
      failureCount: 0,
      responses: [{ success: true }]
    })
  };
});

const request = require('supertest');
const { connectTestDB, clearCollections, disconnectTestDB } = require('./setup/testHelpers');

let app;
let partnerToken;
let partnerId;
let adminToken;

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
  const { AdminUser } = require('../models/Admin');

  // 1. Create partner & admin
  const partner = await Partner.create({
    name: 'Basera Partner',
    phone: '9900000030',
    password: 'Partner@12345',
    partner_type: 'property_agent',
    roles: ['property_agent'],
    onboarding_status: 'approved',
    is_active: true,
    location: { type: 'Point', coordinates: [85.0, 25.0] }
  });
  partnerId = partner._id.toString();

  const admin = await AdminUser.create({
    name: 'Super Admin',
    phone: '9900000031',
    email: 'admin@basera.com',
    password: 'AdminPassword@123',
    role: 'super_admin',
    is_active: true
  });

  // 2. Authenticate
  const partnerLogin = await request(app)
    .post('/api/auth/login')
    .send({ identifier: '9900000030', password: 'Partner@12345', role: 'partner' });
  partnerToken = partnerLogin.body.token;

  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ identifier: '9900000031', password: 'AdminPassword@123', role: 'super_admin' });
  adminToken = adminLogin.body.token;
});

describe('Milestones, Push, and Upload Integration Tests', () => {
  // ---------------------------------------------------------------------------
  // Milestones Flow
  // ---------------------------------------------------------------------------
  test('Partner and Admin milestone interactions', async () => {
    // 1. Admin creates a milestone config
    const configRes = await request(app)
      .post('/api/milestones/admin/config')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        target_orders: 5,
        prize_name: 'Mega Cash Reward',
        prize_description: 'Complete 5 orders to claim your cash reward',
        is_active: true
      });

    expect(configRes.status).toBe(200);
    expect(configRes.body.success).toBe(true);

    const configId = configRes.body.data._id;

    // 2. Get current milestone progress (as Partner)
    const currentRes = await request(app)
      .get('/api/milestones/current')
      .set('Authorization', `Bearer ${partnerToken}`);

    expect(currentRes.status).toBe(200);
    expect(currentRes.body.success).toBe(true);

    // 3. Claim reward (fails/passes based on actual progress, but endpoint responds)
    const claimRes = await request(app)
      .post('/api/milestones/claim')
      .set('Authorization', `Bearer ${partnerToken}`)
      .send({ milestoneId: configId });

    expect([400, 200]).toContain(claimRes.status);

    // 4. Admin lists configs
    const listRes = await request(app)
      .get('/api/milestones/admin/configs')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listRes.status).toBe(200);

    // 5. Admin deletes config
    const deleteRes = await request(app)
      .delete(`/api/milestones/admin/config/${configId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(deleteRes.status).toBe(200);
  });

  // ---------------------------------------------------------------------------
  // Push Notifications Flow
  // ---------------------------------------------------------------------------
  test('Saves, tests, and removes FCM tokens', async () => {
    // 1. Save Token
    const saveRes = await request(app)
      .post('/api/push/save')
      .set('Authorization', `Bearer ${partnerToken}`)
      .send({
        token: 'fcm_mock_token_123456',
        device_type: 'web'
      });

    expect(saveRes.status).toBe(200);
    expect(saveRes.body.success).toBe(true);

    // 2. Test Notification
    const testRes = await request(app)
      .post('/api/push/test')
      .set('Authorization', `Bearer ${partnerToken}`)
      .send({
        title: 'Hello',
        body: 'World'
      });
    expect(testRes.status).toBe(200);

    // 3. Remove Token
    const removeRes = await request(app)
      .delete('/api/push/remove')
      .set('Authorization', `Bearer ${partnerToken}`)
      .send({
        token: 'fcm_mock_token_123456',
        device_type: 'web'
      });
    expect(removeRes.status).toBe(200);
  });

  // ---------------------------------------------------------------------------
  // Upload Route Flow
  // ---------------------------------------------------------------------------
  test('Upload image endpoint', async () => {
    // 1. Upload valid form-data (mocked to succeed)
    const uploadRes = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${partnerToken}`)
      .set('Content-Type', 'multipart/form-data')
      .attach('image', Buffer.from('mockContent'), 'test.png');

    expect(uploadRes.status).toBe(200);
    expect(uploadRes.body.success).toBe(true);
    expect(uploadRes.body.url).toBe('https://res.cloudinary.com/mock-image-url.png');

    // 2. Upload without content-type / file (should trigger fallback/missing check)
    const missingRes = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${partnerToken}`);
    expect(missingRes.status).toBe(400);
  });
});
