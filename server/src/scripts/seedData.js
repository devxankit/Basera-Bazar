const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { User } = require('../models/User');
const { AdminUser } = require('../models/Admin');
const { Partner } = require('../models/Partner');
const { ServiceListing, PropertyListing, SupplierListing, MandiListing } = require('../models/Listing');
const { Category } = require('../models/System');
const { Enquiry } = require('../models/Enquiry');
const bcrypt = require('bcryptjs');

dotenv.config();

const seedData = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`🚀 Connected to MongoDB: ${conn.connection.host}`);

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      AdminUser.deleteMany({}),
      Partner.deleteMany({}),
      ServiceListing.deleteMany({}),
      PropertyListing.deleteMany({}),
      SupplierListing.deleteMany({}),
      MandiListing.deleteMany({}),
      Category.deleteMany({}),
      Enquiry.deleteMany({})
    ]);

    console.log('🧹 Cleared existing data.');

    // 1. Create Categories
    const categories = await Category.insertMany([
      { name: 'Electrician', slug: 'electrician', type: 'service' },
      { name: 'Plumber', slug: 'plumber', type: 'service' },
      { name: 'Cement', slug: 'cement', type: 'material' },
      { name: 'Bricks', slug: 'bricks', type: 'material' },
      { name: 'Steel', slug: 'steel', type: 'material' },
      { name: 'Sand', slug: 'sand', type: 'material' },
    ]);
    console.log('✅ Created Categories');

    // 2. Create Super Admin
    await AdminUser.create({
      email: 'superadmin@gmail.com',
      password: 'password123',
      role: 'super_admin'
    });
    console.log('✅ Created Super Admin');

    // 3. Create Users
    const users = await User.insertMany([
      { name: 'Ujjawal User', phone: '9876543210', email: 'user@example.com', role: 'user' },
      { name: 'Ankit User', phone: '9876543211', email: 'ankit@example.com', role: 'user' },
    ]);
    console.log('✅ Created Users');

    // 4. Create Partners
    const partner1 = await Partner.create({
      name: 'ABC Real Estate',
      phone: '9988776655',
      partner_type: 'property_agent',
      onboarding_status: 'approved',
      location: { type: 'Point', coordinates: [77.1025, 28.7041] }, // Delhi
      password: await bcrypt.hash('partner123', 10),
      profile: { property_profile: { agency_name: 'ABC Agency', rera_number: 'RERA12345' } }
    });

    const partner2 = await Partner.create({
      name: 'Expert Services',
      phone: '8877665544',
      partner_type: 'service_provider',
      onboarding_status: 'approved',
      location: { type: 'Point', coordinates: [77.2090, 28.6139] },
      password: await bcrypt.hash('partner123', 10),
      profile: { service_profile: { category_id: categories[0]._id } }
    });

    const mandiPartner = await Partner.create({
      name: 'Basera Mandi Seller',
      phone: '7766554433',
      partner_type: 'mandi_seller',
      onboarding_status: 'approved',
      location: { type: 'Point', coordinates: [77.2210, 28.6320] }, // Near CP
      password: await bcrypt.hash('partner123', 10),
      profile: { 
        mandi_profile: { 
          material_types: ['Cement', 'Sand'],
          commission_rate: 2.5
        } 
      }
    });

    console.log('✅ Created Partners (including Mandi Seller)');

    // 5. Create Listings
    await PropertyListing.create({
      partner_id: partner1._id,
      title: 'Luxury 3BHK Apartment',
      description: 'Beautiful 3BHK with modern amenities.',
      property_type: 'apartment',
      listing_intent: 'sell',
      location: { type: 'Point', coordinates: [77.1025, 28.7041] },
      pricing: { amount: 8500000 },
      details: {
        area: { value: 1500, unit: 'sqft' },
        bhk: 3,
        bathrooms: 3,
        furnishing: 'semi-furnished',
        possession: 'ready'
      },
      status: 'active'
    });

    await ServiceListing.create({
      partner_id: partner2._id,
      category_id: categories[0]._id,
      title: 'Professional Electrician',
      description: 'Expert home wiring and repairs.',
      location: { type: 'Point', coordinates: [77.2090, 28.6139] },
      service_radius_km: 15,
      status: 'active'
    });

    const cementMandi = await MandiListing.create({
      partner_id: mandiPartner._id,
      title: 'UltraTech Cement (Bulk)',
      material_name: 'Cement',
      pricing: {
        unit: 'bag',
        price_per_unit: 450,
        effective_date: new Date()
      },
      status: 'active'
    });

    console.log('✅ Created Listings (including Mandi Price List)');

    // 6. Create Enquiries (Leads)
    await Enquiry.create({
      enquiry_type: 'mandi',
      user_id: users[0]._id,
      listing_id: cementMandi._id,
      status: 'new',
      mandi_assignment: {
        fulfillment_status: 'pending_assignment'
      },
      listing_snapshot: {
        title: 'UltraTech Cement (Bulk)',
        material: 'Cement',
        qty: 500,
        unit: 'bags'
      }
    });

    await Enquiry.create({
      enquiry_type: 'mandi',
      user_id: users[1]._id,
      listing_id: cementMandi._id,
      status: 'new',
      mandi_assignment: {
        fulfillment_status: 'pending_assignment'
      },
      listing_snapshot: {
        title: 'Premium Sand Delivery',
        material: 'Sand',
        qty: 2,
        unit: 'truckloads'
      }
    });

    console.log('✅ Created Mandi Leads (unassigned)');

    console.log('🏁 Seeding complete!');
    process.exit();
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
