'use strict';

const request = require('supertest');
const { connectTestDB, clearCollections, disconnectTestDB } = require('./setup/testHelpers');

let app;
let partnerToken;
let partnerId;
let propertyCategoryId;
let serviceCategoryId;
let mandiCategoryId;

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
  const { Category } = require('../models/System');

  // 1. Create Categories
  const propCat = await Category.create({
    name: 'Properties',
    slug: 'properties',
    type: 'property',
    is_active: true
  });
  propertyCategoryId = propCat._id.toString();

  const servCat = await Category.create({
    name: 'Services',
    slug: 'services',
    type: 'service',
    is_active: true
  });
  serviceCategoryId = servCat._id.toString();

  const mndCat = await Category.create({
    name: 'Mandi Items',
    slug: 'mandi-items',
    type: 'product',
    is_active: true
  });
  mandiCategoryId = mndCat._id.toString();

  // 2. Create Partner
  const partner = await Partner.create({
    name: 'Test Partner Seller',
    phone: '9900000002',
    password: 'Partner@12345',
    partner_type: 'property_agent',
    roles: ['property_agent', 'service_provider', 'mandi_seller'],
    onboarding_status: 'approved',
    is_active: true,
    location: { type: 'Point', coordinates: [85.0, 25.0] }
  });
  partnerId = partner._id.toString();

  // 3. Log in Partner to get token
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ identifier: '9900000002', password: 'Partner@12345', role: 'partner' });

  partnerToken = loginRes.body.token;
});

describe('Listings and Mandi Integration Tests', () => {
  // ---------------------------------------------------------------------------
  // Property / Service / Mandi Creation & Deletion
  // ---------------------------------------------------------------------------
  test('Partner creates a property listing successfully', async () => {
    const res = await request(app)
      .post('/api/listings/properties')
      .set('Authorization', `Bearer ${partnerToken}`)
      .send({
        title: 'Gorgeous 2 BHK Flat',
        categoryId: propertyCategoryId,
        propertyType: 'apartment',
        intention: 'For Sale',
        price: { value: 65, unit: 'L' },
        longitude: 85.0,
        latitude: 25.0,
        district: 'Patna',
        state: 'Bihar',
        completeAddress: 'Boring Road Patna',
        pinCode: '800001',
        details: {
          area: 1200,
          areaUnit: 'sq. ft.',
          bedrooms: '2 BHK',
          bathrooms: '2',
          furnishing: 'semi furnished',
          facing: 'east'
        }
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Gorgeous 2 BHK Flat');
    expect(res.body.data.details.area.unit).toBe('sqft'); // Mapped
  });

  test('Partner creates a service listing successfully', async () => {
    const res = await request(app)
      .post('/api/listings/services')
      .set('Authorization', `Bearer ${partnerToken}`)
      .send({
        title: 'Professional Home Painting',
        category_id: serviceCategoryId,
        service_radius_km: 15,
        service_type: 'Painting',
        years_of_experience: 5,
        address: {
          district: 'Patna',
          state: 'Bihar',
          full_address: 'Patna Central',
          pincode: '800001'
        },
        location: {
          type: 'Point',
          coordinates: [85.0, 25.0]
        }
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Professional Home Painting');
  });

  test('Partner creates a mandi product listing successfully', async () => {
    const res = await request(app)
      .post('/api/listings/mandi')
      .set('Authorization', `Bearer ${partnerToken}`)
      .send({
        title: 'Premium Clay Bricks',
        material_name: 'Bricks',
        category_id: mandiCategoryId,
        price: 8,
        unit: 'Piece',
        stock: 50000,
        longitude: 85.0,
        latitude: 25.0,
        address: {
          district: 'Patna',
          state: 'Bihar',
          full_address: 'Didarganj, Patna',
          pincode: '800009'
        }
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Premium Clay Bricks');
  });

  // ---------------------------------------------------------------------------
  // Listing Update, Fetching & Queries
  // ---------------------------------------------------------------------------
  test('Partner updates listing and toggles featured status', async () => {
    // 1. Create a listing first
    const { PropertyListing } = require('../models/Listing');
    const property = await PropertyListing.create({
      partner_id: partnerId,
      title: 'Original Property Title',
      property_type: 'apartment',
      listing_intent: 'sell',
      pricing: { amount: 50, currency: 'INR' },
      location: { type: 'Point', coordinates: [85.0, 25.0] },
      category_id: propertyCategoryId,
      status: 'active'
    });

    // 2. Update it
    const updateRes = await request(app)
      .put(`/api/listings/${property._id}`)
      .set('Authorization', `Bearer ${partnerToken}`)
      .send({
        title: 'Updated Property Title',
        propertyType: 'villa',
        details: {
          builtUpArea: 2500,
          unit: 'sq. m.'
        }
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.title).toBe('Updated Property Title');
    expect(updateRes.body.data.property_type).toBe('villa');
    expect(updateRes.body.data.details.area.unit).toBe('sqmt');

    // 3. Get Listing by ID
    const getRes = await request(app)
      .get(`/api/listings/${property._id}`)
      .set('Authorization', `Bearer ${partnerToken}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.title).toBe('Updated Property Title');

    // 4. Toggle featured status (fails if no subscription is active)
    const toggleRes = await request(app)
      .patch(`/api/listings/${property._id}/toggle-featured`)
      .set('Authorization', `Bearer ${partnerToken}`);

    // Since we don't seed an active subscription, it should return 403 or fall back
    expect([403, 200]).toContain(toggleRes.status);
  });

  // ---------------------------------------------------------------------------
  // Mandi bazar & Marketplace Home endpoints
  // ---------------------------------------------------------------------------
  test('Gets Mandi Marketplace public pages & dashboard', async () => {
    // 1. Get marketplace home
    const homeRes = await request(app)
      .get('/api/mandi/marketplace/home');
    expect(homeRes.status).toBe(200);

    // 2. Get category listings
    const catRes = await request(app)
      .get(`/api/mandi/marketplace/category/${mandiCategoryId}`);
    expect(catRes.status).toBe(200);

    // 3. Get seller dashboard
    const dashRes = await request(app)
      .get('/api/mandi/dashboard')
      .set('Authorization', `Bearer ${partnerToken}`);
    expect(dashRes.status).toBe(200);
  });

  // ---------------------------------------------------------------------------
  // Seller Attributes
  // ---------------------------------------------------------------------------
  test('Partner creates and deletes seller attributes', async () => {
    const createRes = await request(app)
      .post('/api/listings/seller-attributes')
      .set('Authorization', `Bearer ${partnerToken}`)
      .send({
        category_id: mandiCategoryId,
        attribute_type: 'brand',
        name: 'Ambuja Cements'
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);

    const deleteRes = await request(app)
      .delete(`/api/listings/seller-attributes/${createRes.body.data._id}`)
      .set('Authorization', `Bearer ${partnerToken}`);

    expect(deleteRes.status).toBe(200);
  });
});
