'use strict';
const mongoose = require('mongoose');
const { connectTestDB, clearCollections, disconnectTestDB } = require('./setup/testHelpers');
const { TeamLeader, OfficeStaff } = require('../models/Staff');

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearCollections();
});

afterAll(async () => {
  await disconnectTestDB();
});

describe('Staff Creation integration tests', () => {
  test('creates team leader successfully', async () => {
    const payload = {
      name: 'furkan',
      phone: '9999988888',
      email: 'teamlead@gmail.com',
      state: 'Bihar',
      district: 'muzzarfur',
      zone: 'north zone',
      fixed_salary: 25000,
      commission_rate: 5,
      password: 'SecretPassword@123',
      profile_image: '',
      address: { address_line: '', city: '', state: '', pincode: '' },
    };

    const tl = await TeamLeader.create({
      ...payload,
      onboarding_status: 'approved',
    });
    expect(tl).toBeDefined();
    expect(tl.name).toBe('furkan');
  });

  test('creates office staff successfully', async () => {
    const tl = await TeamLeader.create({
      name: 'furkan',
      phone: '9999988888',
      email: 'teamlead@gmail.com',
      state: 'Bihar',
      district: 'muzzarfur',
      zone: 'north zone',
      fixed_salary: 25000,
      commission_rate: 5,
      password: 'SecretPassword@123',
      profile_image: '',
      address: { address_line: '', city: '', state: '', pincode: '' },
      onboarding_status: 'approved',
    });

    const payload = {
      name: 'Office Staff Member',
      phone: '9999911111',
      email: 'officestaff@gmail.com',
      team_leader_id: tl._id,
      fixed_salary: 8000,
      calling_specialization: 'lead_generation',
      password: 'SecretPassword@123',
      profile_image: '',
      address: { address_line: '', city: '', state: '', pincode: '' },
    };

    const os = await OfficeStaff.create({
      ...payload,
      onboarding_status: 'approved',
    });
    expect(os).toBeDefined();
    expect(os.name).toBe('Office Staff Member');
  });
});
