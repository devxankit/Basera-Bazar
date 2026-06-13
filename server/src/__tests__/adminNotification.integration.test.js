'use strict';

// Mock the firebaseAdmin service to avoid real network requests to Firebase
jest.mock('../services/firebaseAdmin', () => {
  return {
    sendPushNotification: jest.fn().mockResolvedValue({
      successCount: 2,
      failureCount: 0,
      responses: [{ success: true }, { success: true }]
    })
  };
});

const request = require('supertest');
const { connectTestDB, clearCollections, disconnectTestDB } = require('./setup/testHelpers');

let app;
let adminToken;
let adminId;
let customerId;
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

  const { AdminUser } = require('../models/Admin');
  const { User } = require('../models/User');
  const { Partner } = require('../models/Partner');

  // 1. Create a Super Admin
  const admin = await AdminUser.create({
    name: 'Push Admin User',
    phone: '9988776655',
    email: 'pushadmin@basera.com',
    password: 'AdminPassword@123',
    role: 'super_admin',
    is_active: true
  });
  adminId = admin._id.toString();

  // 2. Log in Admin to get token
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ identifier: '9988776655', password: 'AdminPassword@123', role: 'super_admin' });
  adminToken = loginRes.body.token;

  // 3. Seed test Customer
  const customer = await User.create({
    name: 'Push Customer Bob',
    phone: '9888888880',
    role: 'Customer',
    is_active: true,
    fcmTokens: ['customer_token_1'],
    fcmTokenMobile: ['customer_token_2'],
    default_location: { type: 'Point', coordinates: [85.0, 25.0] }
  });
  customerId = customer._id.toString();

  // 4. Seed test Partner
  const partner = await Partner.create({
    name: 'Push Partner Alice',
    phone: '9888888881',
    password: 'Partner@12345',
    roles: ['property_agent'],
    partner_type: 'property_agent',
    onboarding_status: 'approved',
    is_active: true,
    fcmTokens: ['partner_token_1'],
    location: { type: 'Point', coordinates: [85.0, 25.0] }
  });
  partnerId = partner._id.toString();
});

describe('Admin Push Notification Integration Tests', () => {
  // ---------------------------------------------------------------------------
  // Recipients Search Endpoints
  // ---------------------------------------------------------------------------
  test('Admin searches push recipients by role and query', async () => {
    const res = await request(app)
      .get('/api/admin/push-notifications/search-recipients')
      .query({ role: 'Customer', q: 'Bob' })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe('Push Customer Bob');
    expect(res.body.data[0].hasTokens).toBe(true);
    expect(res.body.data[0].tokensCount).toBe(2);
  });

  test('Admin searches partner recipients', async () => {
    const res = await request(app)
      .get('/api/admin/push-notifications/search-recipients')
      .query({ role: 'Partner', q: 'Alice' })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe('Push Partner Alice');
    expect(res.body.data[0].hasTokens).toBe(true);
    expect(res.body.data[0].tokensCount).toBe(1);
  });

  // ---------------------------------------------------------------------------
  // Send / Broadcast Push Announcements
  // ---------------------------------------------------------------------------
  test('Admin triggers an immediate broadcast notification to all Customers', async () => {
    const res = await request(app)
      .post('/api/admin/push-notifications/send')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        targetType: 'role',
        targetRole: 'Customer',
        title: 'Immediate Alert',
        body: 'This is an immediate announcement!',
        redirectUrl: '/mandi'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('initiated successfully');
    expect(res.body.data.target_type).toBe('all_customers');
    expect(res.body.data.status).toBe('processing');

    // Wait a brief tick for background execution to complete
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Confirm that the status is updated to sent and sent counts are logged
    const AdminNotification = require('../models/AdminNotification');
    const updated = await AdminNotification.findById(res.body.data._id);
    expect(updated.status).toBe('sent');
    expect(updated.sent_count).toBe(2); // unique fcmTokens + fcmTokenMobile
  });

  test('Admin triggers an immediate push to a specific Partner user', async () => {
    const res = await request(app)
      .post('/api/admin/push-notifications/send')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        targetType: 'specific',
        specificUserId: partnerId,
        specificUserModel: 'Partner',
        title: 'Direct Alert for Alice',
        body: 'This is a direct push message.',
        redirectUrl: '/partner/leads'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.target_user_name).toBe('Push Partner Alice');

    // Wait for background creation
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Specific user notifications should also generate a MongoDB system notification
    const { Notification } = require('../models/System');
    const inAppRecord = await Notification.findOne({ recipient_id: partnerId });
    expect(inAppRecord).not.toBeNull();
    expect(inAppRecord.title).toBe('Direct Alert for Alice');
    expect(inAppRecord.body).toBe('This is a direct push message.');
  });

  test('Admin schedules a notification in the future', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1); // 1 day in the future

    const res = await request(app)
      .post('/api/admin/push-notifications/send')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        targetType: 'role',
        targetRole: 'Partner',
        title: 'Scheduled Alert',
        body: 'This will be sent tomorrow!',
        scheduledAt: futureDate.toISOString()
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('scheduled successfully');
    expect(res.body.data.status).toBe('scheduled');
    expect(new Date(res.body.data.scheduled_at).getTime()).toBe(futureDate.getTime());
  });

  // ---------------------------------------------------------------------------
  // History Logs
  // ---------------------------------------------------------------------------
  test('Admin queries history log of push notifications', async () => {
    // Seed an item in history
    const AdminNotification = require('../models/AdminNotification');
    await AdminNotification.create({
      sender_id: adminId,
      title: 'Historical Broadcast',
      body: 'Old campaign details',
      target_type: 'all_partners',
      status: 'sent',
      sent_count: 5,
      success_count: 5,
      failure_count: 0
    });

    const res = await request(app)
      .get('/api/admin/push-notifications/history')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe('Historical Broadcast');
    expect(res.body.data[0].sender_id.name).toBe('Push Admin User');
  });
});
