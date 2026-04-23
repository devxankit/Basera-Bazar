const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { User } = require('../models/User');
const { AdminUser } = require('../models/Admin');
const { Partner } = require('../models/Partner');
const { ServiceListing, PropertyListing, SupplierListing, MandiListing } = require('../models/Listing');
const { Category, Brand, Unit, ProductName, Banner, Location } = require('../models/System');
const { Enquiry } = require('../models/Enquiry');
const bcrypt = require('bcryptjs');

dotenv.config();

const seedData = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`🚀 Connected to MongoDB: ${conn.connection.host}`);

    // Collections to clear
    const collections = [
      'users', 'adminusers', 'partners', 'servicelistings', 
      'propertylistings', 'supplierlistings', 'mandilistings', 
      'categories', 'enquiries', 'brands', 'units', 'productnames', 
      'banners', 'locations'
    ];
    
    for (const collName of collections) {
      try {
        await mongoose.connection.db.dropCollection(collName);
        console.log(`🗑️ Dropped collection: ${collName}`);
      } catch (err) {
        if (err.code !== 26) console.log(`⚠️ Note: ${collName} not dropped (${err.message})`);
      }
    }

    console.log('🧹 Cleared existing collections.');

    // 1. Create Super Admin
    await AdminUser.create({
      email: 'superadmin@gmail.com',
      password: 'password123',
      role: 'super_admin'
    });
    console.log('✅ Created Super Admin');

    // 2. Create Brands & Units
    const brands = await Brand.insertMany([
      { name: 'UltraTech Cement' },
      { name: 'ACC Limited' },
      { name: 'TATA Tiscon' },
      { name: 'Havells' },
      { name: 'Asian Paints' },
      { name: 'Jaguar' }
    ]);
    const units = await Unit.insertMany([
      { name: 'Bag', abbreviation: 'bag' },
      { name: 'Ton', abbreviation: 'ton' },
      { name: 'Square Feet', abbreviation: 'sqft' },
      { name: 'Piece', abbreviation: 'pc' },
      { name: 'Running Feet', abbreviation: 'rft' }
    ]);
    console.log('✅ Created Brands and Units');

    // 3. Create Categories (Hierarchical)
    // Properties
    const propCat = await Category.create({ name: 'Property', slug: 'property', type: 'property' });
    const resProp = await Category.create({ name: 'Residential', slug: 'residential', type: 'property', parent_id: propCat._id });
    const commProp = await Category.create({ name: 'Commercial', slug: 'commercial', type: 'property', parent_id: propCat._id });
    const aptProp = await Category.create({ name: 'Apartment', slug: 'apartment', type: 'property', parent_id: resProp._id });
    const villaProp = await Category.create({ name: 'Villa', slug: 'villa', type: 'property', parent_id: resProp._id });
    const officeProp = await Category.create({ name: 'Office Space', slug: 'office-space', type: 'property', parent_id: commProp._id });

    // Services
    const servCat = await Category.create({ name: 'Services', slug: 'services', type: 'service' });
    const maintServ = await Category.create({ name: 'Maintenance', slug: 'maintenance', type: 'service', parent_id: servCat._id });
    const constServ = await Category.create({ name: 'Construction', slug: 'construction', type: 'service', parent_id: servCat._id });
    const homeServ = await Category.create({ name: 'Home Services', slug: 'home-services', type: 'service', parent_id: servCat._id });

    // Individual Service Categories (Matching AddService.jsx)
    await Category.insertMany([
      { name: 'AC maintenance', slug: 'ac-maintenance', type: 'service', parent_id: maintServ._id },
      { name: 'CCTV Services', slug: 'cctv-services', type: 'service', parent_id: maintServ._id },
      { name: 'Architect', slug: 'architect', type: 'service', parent_id: constServ._id },
      { name: 'Carpenter', slug: 'carpenter', type: 'service', parent_id: homeServ._id },
      { name: 'Civil Engineer', slug: 'civil-engineer', type: 'service', parent_id: constServ._id },
      { name: 'Electrician', slug: 'electrician', type: 'service', parent_id: maintServ._id },
      { name: 'Interior Designer', slug: 'interior-designer', type: 'service', parent_id: homeServ._id },
      { name: 'Lift Installation', slug: 'lift-installation', type: 'service', parent_id: constServ._id },
      { name: 'packers and movers', slug: 'packers-movers', type: 'service', parent_id: homeServ._id },
      { name: 'Painter', slug: 'painter', type: 'service', parent_id: homeServ._id },
      { name: 'Plumber', slug: 'plumber', type: 'service', parent_id: maintServ._id },
      { name: 'Surveyor Ameen', slug: 'surveyor-ameen', type: 'service', parent_id: constServ._id },
      { name: 'Vastu Consultant', slug: 'vastu-consultant', type: 'service', parent_id: homeServ._id }
    ]);

    // Fetch some IDs for later seeding
    const elecServ = await Category.findOne({ name: 'Electrician' });
    const archServ = await Category.findOne({ name: 'Architect' });

    // Products/Materials
    const prodCat = await Category.create({ name: 'Products', slug: 'products', type: 'product' });
    const matCat = await Category.create({ name: 'Building Materials', slug: 'building-materials', type: 'product', parent_id: prodCat._id });
    const cementCat = await Category.create({ name: 'Cement', slug: 'cement', type: 'product', parent_id: matCat._id });
    const steelCat = await Category.create({ name: 'Steel', slug: 'steel', type: 'product', parent_id: matCat._id });
    
    console.log('✅ Created Categories (Hierarchy established)');

    // 4. Create Product Names
    await ProductName.insertMany([
      { name: 'UltraTech Weather Plus', category_id: cementCat._id, brand_id: brands[0]._id },
      { name: 'ACC Gold Water Shield', category_id: cementCat._id, brand_id: brands[1]._id },
      { name: 'TATA Tiscon 550SD', category_id: steelCat._id, brand_id: brands[2]._id }
    ]);
    console.log('✅ Created Product Names');

    // 5. Create Locations
    await Location.insertMany([
      { city: 'Gwalior', state: 'Madhya Pradesh', coordinates: { coordinates: [78.1785, 26.2124] } },
      { city: 'Indore', state: 'Madhya Pradesh', coordinates: { coordinates: [75.8577, 22.7196] } },
      { city: 'Delhi', state: 'Delhi', coordinates: { coordinates: [77.1025, 28.7041] } }
    ]);
    console.log('✅ Created Locations');

    // 6. Create Users
    const users = await User.insertMany([
      { name: 'Rahul Sharma', phone: '9000000001', email: 'rahul@example.com', role: 'user' },
      { name: 'Priya Verma', phone: '9000000002', email: 'priya@example.com', role: 'user' },
      { name: 'Amit Gupta', phone: '9000000003', email: 'amit@example.com', role: 'user' },
      { name: 'Sneha Reddy', phone: '9000000004', email: 'sneha@example.com', role: 'user' }
    ]);
    console.log('✅ Created Users');

    // 7. Create Partners
    const partnerPass = await bcrypt.hash('partner123', 10);
    const partners = await Partner.insertMany([
      { 
        name: 'Skyline Properties', phone: '9999999901', partner_type: 'property_agent', 
        onboarding_status: 'approved', password: partnerPass, 
        location: { coordinates: [77.1, 28.7] },
        profile: { property_profile: { agency_name: 'Skyline Realtors', rera_number: 'RERA-DEL-101' } }
      },
      { 
        name: 'SafeHome Services', phone: '9999999902', partner_type: 'service_provider', 
        onboarding_status: 'approved', password: partnerPass,
        location: { coordinates: [78.1, 26.2] },
        profile: { service_profile: { category_id: maintServ._id } }
      },
      { 
        name: 'Elite Bricks & Steel', phone: '9999999903', partner_type: 'supplier', 
        onboarding_status: 'approved', password: partnerPass,
        location: { coordinates: [75.8, 22.7] },
        profile: { supplier_profile: { business_name: 'Elite Suppliers', gst_number: '23AAAAA0000A1Z5' } }
      }
    ]);
    console.log('✅ Created Partners');

    // 8. Create Listings
    // Properties
    const properties = await PropertyListing.insertMany([
      {
        partner_id: partners[0]._id, title: 'Luxury 4BHK Penthouse', description: 'Stunning views and premium amenities.',
        property_type: 'apartment', listing_intent: 'sell', location: { coordinates: [77.1, 28.7] },
        pricing: { amount: 25000000 }, details: { bhk: 4, bathrooms: 4, area: { value: 3200, unit: 'sqft' } }, status: 'active'
      },
      {
        partner_id: partners[0]._id, title: 'Prime Retail Shop', description: 'High footfall area for business.',
        property_type: 'office', listing_intent: 'rent', location: { coordinates: [77.1, 28.7] },
        pricing: { amount: 75000 }, details: { area: { value: 500, unit: 'sqft' } }, status: 'active'
      }
    ]);

    // Services
    const services = await ServiceListing.insertMany([
      {
        partner_id: partners[1]._id, category_id: elecServ._id, title: 'Expert House Wiring',
        description: 'Quality electrical work for new homes.', location: { coordinates: [78.1, 26.2] },
        service_radius_km: 20, status: 'active'
      },
      {
        partner_id: partners[1]._id, category_id: archServ._id, title: 'Modern Home Architect',
        description: 'Functional and beautiful home designs.', location: { coordinates: [78.1, 26.2] },
        service_radius_km: 50, status: 'active'
      }
    ]);

    // Mandi Listings (Bulk Products)
    const mandi = await MandiListing.insertMany([
      {
        partner_id: partners[2]._id, title: 'Bulk UltraTech Cement', material_name: 'Cement',
        pricing: { unit: 'bag', price_per_unit: 420, effective_date: new Date() }, status: 'active'
      },
      {
        partner_id: partners[2]._id, title: 'TATA Tiscon Reinforcement', material_name: 'Steel',
        pricing: { unit: 'ton', price_per_unit: 68000, effective_date: new Date() }, status: 'active'
      }
    ]);
    console.log('✅ Created Listings');

    // 9. Create Enquiries
    await Enquiry.insertMany([
      { 
        enquiry_type: 'property', user_id: users[0]._id, listing_id: properties[0]._id, 
        partner_id: properties[0].partner_id, status: 'new', 
        listing_snapshot: { title: 'Penthouse Inquiry' } 
      },
      { 
        enquiry_type: 'service', user_id: users[1]._id, listing_id: services[0]._id, 
        partner_id: services[0].partner_id, status: 'contacted', 
        listing_snapshot: { title: 'Electrician needed' } 
      },
      { 
        enquiry_type: 'mandi', user_id: users[2]._id, listing_id: mandi[0]._id, 
        status: 'new', listing_snapshot: { title: '200 Bags Cement' } 
      }
    ]);
    console.log('✅ Created Enquiries');

    // 10. Create Banners
    await Banner.insertMany([
      { title: 'Summer Bonanza', image_url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb', position: 'home_top', priority: 1 },
      { title: 'New Property Launch', image_url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa', position: 'home_middle', priority: 2 }
    ]);
    console.log('✅ Created Banners');

    console.log('🏁 Production-ready seeding complete!');
    process.exit();
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
