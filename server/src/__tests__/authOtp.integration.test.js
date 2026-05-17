'use strict';

const request = require('supertest');
const bcrypt = require('bcryptjs');
const { connectTestDB, clearCollections, disconnectTestDB } = require('./setup/testHelpers');

let app;

beforeAll(async () => {
  await connectTestDB();
  app = require('../index');
});

afterEach(async () => {
  await clearCollections();
});

afterAll(async () => {
  await disconnectTestDB();
});

// ---------------------------------------------------------------------------
// Helper: seed a ready-to-use OTP record with a known plaintext
// ---------------------------------------------------------------------------
async function seedOtp(phone, plaintext = '123456', minutesUntilExpiry = 5) {
  const { Otp } = require('../models/User');
  const hash = await bcrypt.hash(plaintext, 4); // fast rounds for tests
  const expires_at = new Date(Date.now() + minutesUntilExpiry * 60 * 1000);
  await Otp.create({ phone, otp_hash: hash, expires_at });
}

// ---------------------------------------------------------------------------
// Helper: create an approved partner and return a login token + cookie
// ---------------------------------------------------------------------------
async function loginPartner(phone = '9876543210', password = 'Secret@123') {
  const { Partner } = require('../models/Partner');
  await Partner.create({
    name: 'Test Partner',
    phone,
    email: `${phone}@test.com`,
    password,
    partner_type: 'property_agent',
    roles: ['property_agent'],
    onboarding_status: 'approved',
    is_active: true,
    location: { type: 'Point', coordinates: [85.0, 25.0] }
  });

  const res = await request(app)
    .post('/api/auth/login')
    .send({ identifier: phone, password, role: 'partner' });

  return { token: res.body.token, cookies: res.headers['set-cookie'] || [] };
}

// ---------------------------------------------------------------------------
// POST /api/auth/send-otp
// ---------------------------------------------------------------------------
describe('POST /api/auth/send-otp', () => {
  test('returns 200 for any valid phone (SMS mocked in test env)', async () => {
    const res = await request(app)
      .post('/api/auth/send-otp')
      .send({ phone: '9800000001' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('returns 200 and creates OTP record in DB', async () => {
    await request(app)
      .post('/api/auth/send-otp')
      .send({ phone: '9800000002' });

    const { Otp } = require('../models/User');
    const record = await Otp.findOne({ phone: '9800000002' });
    expect(record).toBeTruthy();
    expect(record.otp_hash).toBeTruthy();
    expect(record.expires_at > new Date()).toBe(true);
  });

  test('returns 400 for missing phone', async () => {
    const res = await request(app)
      .post('/api/auth/send-otp')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('returns 404 when checkExists=true and phone not registered', async () => {
    const res = await request(app)
      .post('/api/auth/send-otp')
      .send({ phone: '9000000000', checkExists: true });

    expect(res.status).toBe(404);
    expect(res.body.notExists).toBe(true);
  });

  test('returns 200 when checkExists=true and phone is registered', async () => {
    const { Partner } = require('../models/Partner');
    await Partner.create({
      name: 'Existing Partner',
      phone: '9800000003',
      email: 'exists@test.com',
      partner_type: 'property_agent',
      roles: ['property_agent'],
      onboarding_status: 'approved',
      is_active: true,
      location: { type: 'Point', coordinates: [85.0, 25.0] }
    });

    const res = await request(app)
      .post('/api/auth/send-otp')
      .send({ phone: '9800000003', checkExists: true });

    expect(res.status).toBe(200);
  });

  test('replaces old OTP when re-requested', async () => {
    const { Otp } = require('../models/User');
    const phone = '9800000004';

    await request(app).post('/api/auth/send-otp').send({ phone });
    await request(app).post('/api/auth/send-otp').send({ phone });

    const count = await Otp.countDocuments({ phone });
    expect(count).toBe(1); // old one was deleted
  });
});

// ---------------------------------------------------------------------------
// POST /api/auth/verify-otp — login flow
// ---------------------------------------------------------------------------
describe('POST /api/auth/verify-otp (login flow)', () => {
  const phone = '9700000001';

  beforeEach(async () => {
    const { Partner } = require('../models/Partner');
    await Partner.create({
      name: 'OTP Partner',
      phone,
      email: 'otppartner@test.com',
      partner_type: 'property_agent',
      roles: ['property_agent'],
      onboarding_status: 'approved',
      is_active: true,
      location: { type: 'Point', coordinates: [85.0, 25.0] }
    });
    await seedOtp(phone, '654321');
  });

  test('returns 200 and token on correct OTP', async () => {
    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phone, otp: '654321', role: 'partner', flow: 'login' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeTruthy();
  });

  test('returns 400 on wrong OTP', async () => {
    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phone, otp: '000000', role: 'partner', flow: 'login' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('returns 400 on non-numeric OTP', async () => {
    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phone, otp: 'abcdef', role: 'partner', flow: 'login' });

    expect(res.status).toBe(400);
  });

  test('returns 400 when no OTP record exists', async () => {
    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phone: '9000000099', otp: '654321', role: 'partner', flow: 'login' });

    expect(res.status).toBe(400);
  });

  test('OTP is consumed after successful verify_only', async () => {
    const { Otp } = require('../models/User');

    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phone, otp: '654321', flow: 'verify_only' });

    expect(res.status).toBe(200);

    // OTP record must be deleted after use
    const remaining = await Otp.findOne({ phone });
    expect(remaining).toBeNull();
  });

  test('returns 400 on expired OTP', async () => {
    const { Otp } = require('../models/User');
    await Otp.deleteMany({ phone });

    const hash = await bcrypt.hash('111111', 4);
    await Otp.create({
      phone,
      otp_hash: hash,
      expires_at: new Date(Date.now() - 60_000) // 1 minute in the past
    });

    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phone, otp: '111111', role: 'partner', flow: 'login' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/expired/i);
  });
});

// ---------------------------------------------------------------------------
// POST /api/auth/refresh — token rotation
// ---------------------------------------------------------------------------
describe('POST /api/auth/refresh', () => {
  test('returns 200 with new access token when refresh cookie is valid', async () => {
    const { cookies } = await loginPartner('9600000010');

    const refreshCookie = cookies.find(c => c.startsWith('bb_refresh='));
    expect(refreshCookie).toBeTruthy();

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', refreshCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeTruthy();
  });

  test('returns 401 with no refresh cookie', async () => {
    const res = await request(app).post('/api/auth/refresh');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('returns 401 with tampered refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', 'bb_refresh=tampered.token.value');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('response sets a new refresh cookie with correct attributes', async () => {
    const { cookies } = await loginPartner('9600000011');
    const firstCookie = cookies.find(c => c.startsWith('bb_refresh='));

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', firstCookie);

    const newCookies = res.headers['set-cookie'] || [];
    const newRefreshCookie = newCookies.find(c => c.startsWith('bb_refresh='));
    expect(newRefreshCookie).toBeTruthy();
    expect(newRefreshCookie).toContain('HttpOnly');
    expect(newRefreshCookie).toContain('SameSite');
  });
});

// ---------------------------------------------------------------------------
// POST /api/auth/logout
// ---------------------------------------------------------------------------
describe('POST /api/auth/logout', () => {
  test('returns 200 and clears auth cookies', async () => {
    const { token, cookies } = await loginPartner('9600000020');

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .set('Cookie', cookies.join('; '));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Cookie should be cleared (Max-Age=0 or Expires in the past)
    const setCookies = res.headers['set-cookie'] || [];
    const cleared = setCookies.some(c => c.includes('bb_refresh') && (c.includes('Max-Age=0') || c.includes('Expires')));
    expect(cleared).toBe(true);
  });

  test('returns 401 without token', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(401);
  });
});
