'use strict';

const request = require('supertest');
const { connectTestDB, clearCollections, disconnectTestDB } = require('./setup/testHelpers');

let app;
let customerToken;
let customerId;
let partnerToken;
let partnerId;
let propertyListingId;

beforeAll(async () => {
  await connectTestDB();
  app = require('../index');
});

afterAll(async () => {
  await disconnectTestDB();
});

beforeEach(async () => {
  await clearCollections();

  const { User } = require('../models/User');
  const { Partner } = require('../models/Partner');
  const { PropertyListing } = require('../models/Listing');
  const { Category } = require('../models/System');

  // 1. Create a Category
  const category = await Category.create({
    name: 'Real Estate',
    slug: 'real-estate',
    type: 'property',
    is_active: true
  });

  // 2. Create Partner & Property Listing
  const partner = await Partner.create({
    name: 'Basera Agent',
    phone: '9900000004',
    password: 'Partner@12345',
    partner_type: 'property_agent',
    roles: ['property_agent'],
    onboarding_status: 'approved',
    is_active: true,
    location: { type: 'Point', coordinates: [85.0, 25.0] }
  });
  partnerId = partner._id.toString();

  const property = await PropertyListing.create({
    partner_id: partner._id,
    title: 'Modern 3 BHK Villa',
    property_type: 'villa',
    listing_intent: 'sell',
    pricing: { amount: 15000000, currency: 'INR' },
    location: { type: 'Point', coordinates: [85.0, 25.0] },
    category_id: category._id,
    status: 'active'
  });
  propertyListingId = property._id.toString();

  // 3. Create Customer
  const customer = await User.create({
    name: 'Jane Doe Customer',
    phone: '9900000003',
    password: 'Customer@12345',
    role: 'user',
    is_active: true,
    default_location: { type: 'Point', coordinates: [85.0, 25.0] }
  });
  customerId = customer._id.toString();

  // 4. Authenticate both
  const customerLogin = await request(app)
    .post('/api/auth/login')
    .send({ identifier: '9900000003', password: 'Customer@12345', role: 'user' });
  customerToken = customerLogin.body.token;

  const partnerLogin = await request(app)
    .post('/api/auth/login')
    .send({ identifier: '9900000004', password: 'Partner@12345', role: 'partner' });
  partnerToken = partnerLogin.body.token;
});

describe('Enquiries and Leads Integration Tests', () => {
  // ---------------------------------------------------------------------------
  // Enquiry Flow
  // ---------------------------------------------------------------------------
  test('Customer submits an enquiry, gets history, and partner updates status', async () => {
    // 1. Submit Enquiry (as Customer)
    const submitRes = await request(app)
      .post('/api/enquiries')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        enquiry_type: 'property',
        listing_id: propertyListingId,
        content: 'I want to schedule a visit to the villa.',
        inquiry_type: 'General Inquiry',
        user_details: {
          name: 'Jane Doe Customer',
          phone: '9900000003',
          email: 'jane@test.com'
        }
      });

    expect(submitRes.status).toBe(201);
    expect(submitRes.body.success).toBe(true);
    expect(submitRes.body.data.content).toBe('I want to schedule a visit to the villa.');
    const enquiryId = submitRes.body.data._id;

    // 2. Fetch history (as Customer)
    const historyRes = await request(app)
      .get('/api/users/enquiries')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(historyRes.status).toBe(200);
    expect(historyRes.body.data.length).toBe(1);
    expect(historyRes.body.data[0].content).toBe('I want to schedule a visit to the villa.');

    // 3. Fetch received leads (as Partner)
    const leadsRes = await request(app)
      .get('/api/partners/enquiries')
      .set('Authorization', `Bearer ${partnerToken}`);

    expect(leadsRes.status).toBe(200);
    expect(leadsRes.body.data.length).toBe(1);

    // 4. Fetch single lead details (as Partner)
    const detailRes = await request(app)
      .get(`/api/partners/enquiries/${enquiryId}`)
      .set('Authorization', `Bearer ${partnerToken}`);
    expect(detailRes.status).toBe(200);

    // 5. Update lead status (as Partner)
    const statusRes = await request(app)
      .patch(`/api/partners/enquiries/${enquiryId}/status`)
      .set('Authorization', `Bearer ${partnerToken}`)
      .send({ status: 'contacted' });

    expect(statusRes.status).toBe(200);
    expect(statusRes.body.data.status).toBe('contacted');

    // 6. Delete lead (as Partner)
    const deleteRes = await request(app)
      .delete(`/api/partners/enquiries/${enquiryId}`)
      .set('Authorization', `Bearer ${partnerToken}`);

    expect(deleteRes.status).toBe(200);
  });

  // ---------------------------------------------------------------------------
  // Broadcast Leads Flow
  // ---------------------------------------------------------------------------
  test('Customer broadcasts a lead and partner views it', async () => {
    // 1. Customer creates a broadcast lead
    const broadcastRes = await request(app)
      .post('/api/leads/broadcast')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        name: 'Urgent Wire Requirement',
        phone: '9900000003',
        email: 'jane@test.com',
        target_category: 'supplier',
        state: 'Bihar',
        district: 'Patna',
        full_address: 'Boring Canal Road',
        products: [
          { item_name: 'Copper Wire 1.5mm', quantity: 20, unit: 'bundle' }
        ],
        requirement_details: 'Need immediate delivery by tomorrow morning.'
      });

    expect(broadcastRes.status).toBe(201);
    expect(broadcastRes.body.success).toBe(true);
    expect(broadcastRes.body.data.name).toBe('Urgent Wire Requirement');

    const leadId = broadcastRes.body.data._id;

    // 2. Partner views leads matching their delivery region/location
    // First, let's set partner's business details or address
    const { Partner } = require('../models/Partner');
    await Partner.findByIdAndUpdate(partnerId, {
      profile: {
        supplier_profile: {
          delivery_radius_km: 100,
          business_name: 'Jane Supplier Store',
          material_categories: ['Electricals']
        }
      },
      district: 'Patna',
      state: 'Bihar'
    });

    const getLeadsRes = await request(app)
      .get('/api/leads/partner')
      .set('Authorization', `Bearer ${partnerToken}`);

    expect(getLeadsRes.status).toBe(200);
    expect(getLeadsRes.body.success).toBe(true);

    // 3. Get single broadcast lead by ID
    const getDetailRes = await request(app)
      .get(`/api/leads/partner/${leadId}`)
      .set('Authorization', `Bearer ${partnerToken}`);

    expect(getDetailRes.status).toBe(200);
    expect(getDetailRes.body.data._id).toBe(leadId);
  });
});
