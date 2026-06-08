'use strict';

const request = require('supertest');
const { connectTestDB, clearCollections, disconnectTestDB } = require('./setup/testHelpers');

let app;
let tlToken;
let tlId;
let osToken;
let osId;

beforeAll(async () => {
  await connectTestDB();
  app = require('../index');
});

afterAll(async () => {
  await disconnectTestDB();
});

beforeEach(async () => {
  await clearCollections();

  const { TeamLeader, OfficeStaff } = require('../models/Staff');

  // 1. Create Team Leader
  const tl = await TeamLeader.create({
    name: 'TL Manager',
    phone: '9900000020',
    email: 'tl.manager@basera.com',
    state: 'Bihar',
    district: 'Patna',
    zone: 'East',
    fixed_salary: 30000,
    commission_rate: 10,
    password: 'TLPassword@123',
    onboarding_status: 'approved',
    is_active: true,
    address: { address_line: 'Fraser Road', city: 'Patna', state: 'Bihar', pincode: '800001' }
  });
  tlId = tl._id.toString();

  // 2. Create Office Staff member linked to TL
  const os = await OfficeStaff.create({
    name: 'Office Staff Worker',
    phone: '9900000021',
    email: 'os.worker@basera.com',
    team_leader_id: tl._id,
    fixed_salary: 15000,
    calling_specialization: 'lead_generation',
    password: 'OSPassword@123',
    onboarding_status: 'approved',
    is_active: true,
    address: { address_line: 'Fraser Road', city: 'Patna', state: 'Bihar', pincode: '800001' }
  });
  osId = os._id.toString();

  // 3. Log in both TL and OS
  const tlLogin = await request(app)
    .post('/api/auth/staff/login')
    .send({ identifier: '9900000020', password: 'TLPassword@123', role: 'team_leader' });
  tlToken = tlLogin.body.token;

  const osLogin = await request(app)
    .post('/api/auth/staff/login')
    .send({ identifier: '9900000021', password: 'OSPassword@123', role: 'office_staff' });
  osToken = osLogin.body.token;
});

describe('Staff Auth, TL & Office Staff Integration Tests', () => {
  // ---------------------------------------------------------------------------
  // Profile & Authentication
  // ---------------------------------------------------------------------------
  test('Staff gets self profile and dashboards', async () => {
    // 1. Get profile (any staff)
    const tlMeRes = await request(app)
      .get('/api/auth/staff/me')
      .set('Authorization', `Bearer ${tlToken}`);

    expect(tlMeRes.status).toBe(200);
    expect(tlMeRes.body.user.name).toBe('TL Manager');

    // 2. Get TL Dashboard
    const tlDashRes = await request(app)
      .get('/api/team-leader/dashboard')
      .set('Authorization', `Bearer ${tlToken}`);
    expect(tlDashRes.status).toBe(200);

    // 3. Get OS Dashboard
    const osDashRes = await request(app)
      .get('/api/office-staff/dashboard')
      .set('Authorization', `Bearer ${osToken}`);
    expect(osDashRes.status).toBe(200);
  });

  // ---------------------------------------------------------------------------
  // Attendance & Verification
  // ---------------------------------------------------------------------------
  test('Office staff check-in/out and TL verifies attendance', async () => {
    // 1. Office Staff check-in
    const checkinRes = await request(app)
      .post('/api/office-staff/attendance/check-in')
      .set('Authorization', `Bearer ${osToken}`)
      .send({
        latitude: 25.0,
        longitude: 85.0
      });

    expect(checkinRes.status).toBe(200);
    expect(checkinRes.body.success).toBe(true);

    // 2. Get today checkin
    const todayCheckin = await request(app)
      .get('/api/office-staff/attendance/today')
      .set('Authorization', `Bearer ${osToken}`);
    expect(todayCheckin.status).toBe(200);
    const attendanceId = todayCheckin.body.data._id;

    // 3. Office Staff check-out
    const checkoutRes = await request(app)
      .post('/api/office-staff/attendance/check-out')
      .set('Authorization', `Bearer ${osToken}`);
    expect(checkoutRes.status).toBe(200);

    // 4. TL retrieves team attendance list
    const teamAttRes = await request(app)
      .get('/api/team-leader/attendance')
      .set('Authorization', `Bearer ${tlToken}`);
    expect(teamAttRes.status).toBe(200);

    // 5. TL verifies checkin record
    const verifyRes = await request(app)
      .put(`/api/team-leader/attendance/${attendanceId}/verify`)
      .set('Authorization', `Bearer ${tlToken}`)
      .send({ status: 'present' });
    expect(verifyRes.status).toBe(200);
  });

  // ---------------------------------------------------------------------------
  // Daily Reports & Leaves
  // ---------------------------------------------------------------------------
  test('Office staff submits daily report and requests leave', async () => {
    // 1. Submit Daily Report
    const reportRes = await request(app)
      .post('/api/office-staff/reports/daily')
      .set('Authorization', `Bearer ${osToken}`)
      .send({
        calls_made: 25,
        connected_calls: 15,
        interested_leads: 3,
        notes: 'Made good progress today on listings leads.'
      });

    expect(reportRes.status).toBe(200);
    expect(reportRes.body.success).toBe(true);

    // 2. Request Leave
    const leaveRes = await request(app)
      .post('/api/office-staff/leaves')
      .set('Authorization', `Bearer ${osToken}`)
      .send({
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        reason: 'Personal medical appointment',
        leave_type: 'sick'
      });

    expect(leaveRes.status).toBe(201);
    expect(leaveRes.body.success).toBe(true);
  });

  test('Staff can deactivate self account', async () => {
    const deactivateRes = await request(app)
      .post('/api/auth/staff/deactivate-account')
      .set('Authorization', `Bearer ${tlToken}`);

    expect(deactivateRes.status).toBe(200);
    expect(deactivateRes.body.success).toBe(true);

    // Try logging in again - should fail
    const tlLoginFail = await request(app)
      .post('/api/auth/staff/login')
      .send({ identifier: '9900000020', password: 'TLPassword@123', role: 'team_leader' });

    expect(tlLoginFail.status).toBe(403);
    expect(tlLoginFail.body.message).toContain('deactivated');
  });
});
