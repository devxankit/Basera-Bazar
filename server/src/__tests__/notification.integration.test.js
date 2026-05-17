'use strict';

const request = require('supertest');
const { connectTestDB, clearCollections, disconnectTestDB } = require('./setup/testHelpers');

let app;
let partnerToken;
let partnerId;
let otherPartnerToken;
let otherPartnerId;

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
    name: 'Notif Partner',
    phone: '9500000001',
    password: 'Partner@12345',
    partner_type: 'property_agent',
    roles: ['property_agent'],
    onboarding_status: 'approved',
    is_active: true,
    location: { type: 'Point', coordinates: [85.0, 25.0] }
  });
  partnerId = partner._id.toString();

  const otherPartner = await Partner.create({
    name: 'Other Partner',
    phone: '9500000002',
    password: 'Other@12345',
    partner_type: 'mandi_seller',
    roles: ['mandi_seller'],
    onboarding_status: 'approved',
    is_active: true,
    location: { type: 'Point', coordinates: [85.1, 25.1] }
  });
  otherPartnerId = otherPartner._id.toString();

  const [r1, r2] = await Promise.all([
    request(app).post('/api/auth/login').send({ identifier: '9500000001', password: 'Partner@12345', role: 'partner' }),
    request(app).post('/api/auth/login').send({ identifier: '9500000002', password: 'Other@12345', role: 'partner' })
  ]);

  partnerToken = r1.body.token;
  otherPartnerToken = r2.body.token;
});

// ---------------------------------------------------------------------------
// GET /api/notifications/
// ---------------------------------------------------------------------------
describe('GET /api/notifications/', () => {
  test('returns 200 with empty list for new partner', async () => {
    const res = await request(app)
      .get('/api/notifications/')
      .set('Authorization', `Bearer ${partnerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(0);
  });

  test('returns own notifications only', async () => {
    const { Notification } = require('../models/System');

    // Create notification for partner
    await Notification.create({
      recipient_type: 'partner',
      recipient_id: partnerId,
      title: 'Hello Partner',
      body: 'This is for you'
    });

    // Create notification for other partner
    await Notification.create({
      recipient_type: 'partner',
      recipient_id: otherPartnerId,
      title: 'Hello Other',
      body: 'This is for someone else'
    });

    const res = await request(app)
      .get('/api/notifications/')
      .set('Authorization', `Bearer ${partnerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe('Hello Partner');
  });

  test('returns 401 without auth', async () => {
    const res = await request(app).get('/api/notifications/');
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/notifications/:id
// ---------------------------------------------------------------------------
describe('DELETE /api/notifications/:id', () => {
  test('owner can delete their notification', async () => {
    const { Notification } = require('../models/System');

    const notif = await Notification.create({
      recipient_type: 'partner',
      recipient_id: partnerId,
      title: 'To Delete',
      body: 'Delete me'
    });

    const res = await request(app)
      .delete(`/api/notifications/${notif._id}`)
      .set('Authorization', `Bearer ${partnerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const gone = await Notification.findById(notif._id);
    expect(gone).toBeNull();
  });

  test('returns 403 when non-owner tries to delete', async () => {
    const { Notification } = require('../models/System');

    const notif = await Notification.create({
      recipient_type: 'partner',
      recipient_id: partnerId,
      title: 'Private',
      body: 'Only for owner'
    });

    const res = await request(app)
      .delete(`/api/notifications/${notif._id}`)
      .set('Authorization', `Bearer ${otherPartnerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('returns 404 for non-existent notification', async () => {
    const mongoose = require('mongoose');
    const fakeId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .delete(`/api/notifications/${fakeId}`)
      .set('Authorization', `Bearer ${partnerToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('returns 401 without auth', async () => {
    const mongoose = require('mongoose');
    const fakeId = new mongoose.Types.ObjectId().toString();

    const res = await request(app).delete(`/api/notifications/${fakeId}`);
    expect(res.status).toBe(401);
  });
});
