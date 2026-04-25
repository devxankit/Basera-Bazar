const mongoose = require('mongoose');
require('dotenv').config();
const { ServiceListing, PropertyListing, MandiListing } = require('./src/models/Listing');
const { Partner } = require('./src/models/Partner');

async function approveEverything() {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error('MONGO_URI not found in .env');
    
    console.log('Connecting to DB...');
    await mongoose.connect(uri);
    console.log('Connected!');

    console.log('Approving Property Listings...');
    const pRes = await PropertyListing.updateMany(
      { status: { $ne: 'active' } },
      { $set: { status: 'active', is_featured: true } }
    );
    console.log(`Updated ${pRes.modifiedCount} properties.`);

    console.log('Approving Service Listings...');
    const sRes = await ServiceListing.updateMany(
      { status: { $ne: 'active' } },
      { $set: { status: 'active', is_featured: true } }
    );
    console.log(`Updated ${sRes.modifiedCount} services.`);

    console.log('Approving Mandi Listings...');
    const mRes = await MandiListing.updateMany(
      { status: { $ne: 'active' } },
      { $set: { status: 'active' } }
    );
    console.log(`Updated ${mRes.modifiedCount} mandi items.`);

    console.log('Approving Partners...');
    const parRes = await Partner.updateMany(
      { onboarding_status: { $ne: 'approved' } },
      { $set: { onboarding_status: 'approved', is_active: true } }
    );
    console.log(`Updated ${parRes.modifiedCount} partners.`);

    console.log('\nSUCCESS: All data is now ACTIVE and should be visible in the app.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

approveEverything();
