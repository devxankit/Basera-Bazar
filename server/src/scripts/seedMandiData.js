require('dotenv').config();
const mongoose = require('mongoose');
const { Category } = require('../models/System');
const { Partner } = require('../models/Partner');
const { MandiListing } = require('../models/Listing');

async function seedMandiData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    // 1. Create Mandi Categories (type: product)
    const mandiCategories = [
      { name: 'Bricks', slug: 'mandi-bricks', type: 'product' },
      { name: 'Cement', slug: 'mandi-cement', type: 'product' },
      { name: 'Sand', slug: 'mandi-sand', type: 'product' },
      { name: 'TMT Saria', slug: 'mandi-saria', type: 'product' },
      { name: 'Aggregate', slug: 'mandi-aggregate', type: 'product' }
    ];

    console.log('Upserting Categories...');
    const createdCats = [];
    for (const cat of mandiCategories) {
      const c = await Category.findOneAndUpdate(
        { slug: cat.slug },
        cat,
        { upsert: true, new: true }
      );
      createdCats.push(c);
    }
    console.log(`Seeded ${createdCats.length} categories.`);

    // 2. Create Mandi Sellers
    const sellers = [
      {
        name: 'Sharma Materials',
        phone: '9876543210',
        email: 'sharma@mandi.com',
        partner_type: 'mandi_seller',
        is_active: true,
        onboarding_status: 'approved',
        profile: {
          mandi_profile: {
            business_name: 'Sharma Construction Materials',
            business_description: 'Top quality bricks and cement in the city.',
            material_types: ['Bricks', 'Cement', 'Sand']
          }
        }
      },
      {
        name: 'Gupta Steel & Cement',
        phone: '9876543211',
        email: 'gupta@mandi.com',
        partner_type: 'mandi_seller',
        is_active: true,
        onboarding_status: 'approved',
        profile: {
          mandi_profile: {
            business_name: 'Gupta Steel Traders',
            business_description: 'Official distributor for TMT Saria and Grade-A Cement.',
            material_types: ['TMT Saria', 'Cement', 'Aggregate']
          }
        }
      }
    ];

    console.log('Upserting Sellers...');
    const seededSellers = [];
    for (const s of sellers) {
      const seller = await Partner.findOneAndUpdate(
        { phone: s.phone },
        s,
        { upsert: true, new: true }
      );
      seededSellers.push(seller);
    }
    console.log(`Seeded ${seededSellers.length} sellers.`);

    // 3. Create Mandi Listings
    const findCat = (name) => createdCats.find(c => c.name === name)._id;

    const listings = [
      {
        partner_id: seededSellers[0]._id,
        category_id: findCat('Bricks'),
        title: 'Premium Red Clay Bricks',
        material_name: 'Bricks',
        description: 'First-class red clay bricks, highly durable for construction.',
        thumbnail: 'https://images.unsplash.com/photo-1590069230005-db393739175c?auto=format&fit=crop&q=80&w=300',
        pricing: { unit: '1000 Pcs', price_per_unit: 7500 },
        stock_quantity: 50000,
        status: 'active'
      },
      {
        partner_id: seededSellers[0]._id,
        category_id: findCat('Cement'),
        title: 'UltraTech Premium Cement',
        material_name: 'Cement',
        description: 'UltraTech high-strength cement for all-purpose construction.',
        thumbnail: 'https://images.unsplash.com/photo-1518709368027-e455497fba30?auto=format&fit=crop&q=80&w=300',
        pricing: { unit: '50kg Bag', price_per_unit: 420 },
        stock_quantity: 1000,
        status: 'active'
      },
      {
        partner_id: seededSellers[1]._id,
        category_id: findCat('TMT Saria'),
        title: 'TATA Tiscon 550SD TMT Bar',
        material_name: 'TMT Saria',
        description: 'TATA Tiscon super-ductile iron rods for earthquake protection.',
        thumbnail: 'https://images.unsplash.com/photo-1621905252507-b35242f9a0c7?auto=format&fit=crop&q=80&w=300',
        pricing: { unit: 'Metric Ton', price_per_unit: 62000 },
        stock_quantity: 100,
        status: 'active'
      },
      {
        partner_id: seededSellers[1]._id,
        category_id: findCat('Aggregate'),
        title: 'Blue Metal Crushed Stone (20mm)',
        material_name: 'Aggregate',
        description: 'High quality crushed stone for concrete casting.',
        thumbnail: 'https://images.unsplash.com/photo-1574360523441-2166f49c8dfb?auto=format&fit=crop&q=80&w=300',
        pricing: { unit: 'Brass', price_per_unit: 4500 },
        stock_quantity: 200,
        status: 'active'
      }
    ];

    console.log('Upserting Listings...');
    for (const l of listings) {
      await MandiListing.findOneAndUpdate(
        { partner_id: l.partner_id, title: l.title },
        l,
        { upsert: true, new: true }
      );
    }
    console.log(`Seeded ${listings.length} listings.`);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seedMandiData();
