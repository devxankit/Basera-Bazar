'use strict';

// Regression tests for bug-sheet fixes: #355/#348 (attendance verify),
// #344/#345 (office-staff reports route), #338 (salary processing no-500).

const request = require('supertest');
const { connectTestDB, clearCollections, disconnectTestDB } = require('./setup/testHelpers');

let app, adminTok, tlTok, osTok, tlId, osId;

beforeAll(async () => {
  await connectTestDB();
  app = require('../index');
});
afterAll(async () => { await disconnectTestDB(); });

beforeEach(async () => {
  await clearCollections();
  const { AdminUser } = require('../models/Admin');
  const { TeamLeader, OfficeStaff } = require('../models/Staff');

  await AdminUser.create({ name: 'Admin', phone: '9900000010', email: 'a@p.com', password: 'AdminPass@123', role: 'super_admin', is_active: true });
  const tl = await TeamLeader.create({ name: 'TL', phone: '9900000020', email: 't@p.com', state: 'Bihar', district: 'Patna', zone: 'East', fixed_salary: 30000, commission_rate: 10, password: 'TLPass@123', onboarding_status: 'approved', is_active: true, address: { address_line: 'R', city: 'Patna', state: 'Bihar', pincode: '800001' } });
  const os = await OfficeStaff.create({ name: 'OS', phone: '9900000021', email: 'o@p.com', team_leader_id: tl._id, fixed_salary: 15000, calling_specialization: 'lead_generation', password: 'OSPass@123', onboarding_status: 'approved', is_active: true, address: { address_line: 'R', city: 'Patna', state: 'Bihar', pincode: '800001' } });
  tlId = tl._id.toString(); osId = os._id.toString();

  adminTok = (await request(app).post('/api/auth/login').send({ identifier: '9900000010', password: 'AdminPass@123', role: 'super_admin' })).body.token;
  tlTok = (await request(app).post('/api/auth/staff/login').send({ identifier: '9900000020', password: 'TLPass@123', role: 'team_leader' })).body.token;
  osTok = (await request(app).post('/api/auth/staff/login').send({ identifier: '9900000021', password: 'OSPass@123', role: 'office_staff' })).body.token;
});

const seedAttendance = async () => {
  const StaffAttendance = require('../models/StaffAttendance');
  return StaffAttendance.create({
    staff_id: osId, staff_type: 'office_staff', team_leader_id: tlId,
    date: new Date().toISOString().slice(0, 10), check_in_time: new Date(), status: 'present',
    check_in_location: { type: 'Point', coordinates: [85.0, 25.0] },
  });
};

describe('#355 admin verify attendance', () => {
  test('verify with {action:"approve"} succeeds and marks verified_by_admin', async () => {
    const att = await seedAttendance();
    const res = await request(app)
      .put(`/api/admin/staff/attendance/${att._id}/verify`)
      .set('Authorization', `Bearer ${adminTok}`)
      .send({ action: 'approve' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const StaffAttendance = require('../models/StaffAttendance');
    const after = await StaffAttendance.findById(att._id).lean();
    expect(after.verified_by_admin).toBe(true);
  });

  test('verify with no body is rejected (documents why the UI must send action)', async () => {
    const att = await seedAttendance();
    const res = await request(app)
      .put(`/api/admin/staff/attendance/${att._id}/verify`)
      .set('Authorization', `Bearer ${adminTok}`)
      .send({});
    expect(res.status).toBe(400);
  });
});

describe('#348 team-leader verify attendance', () => {
  test('TL verify marks verified_by_team_leader and returns 200', async () => {
    const att = await seedAttendance();
    const res = await request(app)
      .put(`/api/team-leader/attendance/${att._id}/verify`)
      .set('Authorization', `Bearer ${tlTok}`);
    expect(res.status).toBe(200);
    const StaffAttendance = require('../models/StaffAttendance');
    const after = await StaffAttendance.findById(att._id).lean();
    expect(after.verified_by_team_leader).toBe(true);
  });
});

describe('#344/#345 office-staff reports route', () => {
  test('GET /office-staff/reports/history (route the UI now calls) returns 200', async () => {
    const res = await request(app)
      .get('/api/office-staff/reports/history')
      .set('Authorization', `Bearer ${osTok}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('a submitted report is then visible in history', async () => {
    await request(app).post('/api/office-staff/reports/daily')
      .set('Authorization', `Bearer ${osTok}`)
      .send({ partners_visited: 2, leads_generated: 1, notes: 'probe report' });
    const res = await request(app).get('/api/office-staff/reports/history').set('Authorization', `Bearer ${osTok}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('mandi shop-by-category shows products (location fallback)', () => {
  test('a product in another district still appears when none exist locally', async () => {
    const mongoose = require('mongoose');
    const { Category } = require('../models/System');
    const { MandiListing } = require('../models/Listing');
    const cat = await Category.create({ name: 'Aggregate (Gitti)', slug: 'aggregate', type: 'product', is_active: true });
    await MandiListing.create({
      partner_id: new mongoose.Types.ObjectId(), category_id: cat._id,
      title: '20mm Gitti', material_name: 'Aggregate', status: 'active',
      address: { state: 'Madhya Pradesh', district: 'Indore' },
      pricing: { unit: 'Ton', price_per_unit: 1200 },
      location: { type: 'Point', coordinates: [75.85, 22.71] },
    });

    // Buyer browsing from Jaipur — no local sellers, should fall back to all areas
    const res = await request(app).get(`/api/mandi/marketplace/category/${cat._id}?district=Jaipur&state=Rajasthan`);
    expect(res.status).toBe(200);
    expect(res.body.data.listings.length).toBe(1);
    expect(res.body.data.nationwide).toBe(true);

    // Buyer in Indore — local result, no fallback flag
    const local = await request(app).get(`/api/mandi/marketplace/category/${cat._id}?district=Indore`);
    expect(local.body.data.listings.length).toBe(1);
    expect(local.body.data.nationwide).toBe(false);
  });
});

describe('#354 office-staff can override today\'s report', () => {
  test('re-submitting the same day updates instead of being rejected', async () => {
    const first = await request(app).post('/api/office-staff/reports/daily')
      .set('Authorization', `Bearer ${osTok}`).send({ partners_visited: 1, notes: 'first' });
    expect(first.status).toBe(200);
    const second = await request(app).post('/api/office-staff/reports/daily')
      .set('Authorization', `Bearer ${osTok}`).send({ partners_visited: 5, notes: 'corrected' });
    expect(second.status).toBe(200);
    expect(second.body.message).toMatch(/updated/i);
    expect(second.body.data.partners_visited).toBe(5);
  });
});

describe('#338 monthly salary processing', () => {
  test('process-monthly does not 500', async () => {
    const res = await request(app)
      .post('/api/admin/staff/salary/process-monthly')
      .set('Authorization', `Bearer ${adminTok}`)
      .send({ month: new Date().toISOString().slice(0, 7) });
    expect(res.status).toBeLessThan(500);
    expect(res.body.success).toBe(true);
  });
});
