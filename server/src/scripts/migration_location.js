const mongoose = require('mongoose');
const path = require('path');
const { User } = require('../models/User');
const { Partner } = require('../models/Partner');
const { ServiceListing, PropertyListing, SupplierListing, MandiListing } = require('../models/Listing');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const MUZAFFARPUR_COORDS = [85.3647, 26.1209]; // [Longitude, Latitude]

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for location migration...');

    // 1. Migrate Users
    const usersUpdate = await User.updateMany(
      {},
      {
        $set: {
          default_location: {
            type: 'Point',
            coordinates: MUZAFFARPUR_COORDS,
            city: 'Muzaffarpur',
            state: 'Bihar',
            pincode: '842001'
          }
        }
      }
    );
    console.log(`Migrated ${usersUpdate.modifiedCount} users.`);

    // 2. Migrate Partners
    const partnersUpdate = await Partner.updateMany(
      {},
      {
        $set: {
          location: {
            type: 'Point',
            coordinates: MUZAFFARPUR_COORDS
          },
          state: 'Bihar',
          city: 'Muzaffarpur',
          district: 'Muzaffarpur',
          service_radius_km: 100
        }
      }
    );
    console.log(`Migrated ${partnersUpdate.modifiedCount} partners.`);

    // 3. Migrate Listings
    const commonUpdate = {
      location: {
        type: 'Point',
        coordinates: MUZAFFARPUR_COORDS
      },
      address: {
        state: 'Bihar',
        district: 'Muzaffarpur',
        full_address: 'Muzaffarpur, Bihar',
        pincode: '842001'
      },
      service_radius_km: 300
    };

    const sUpdate = await ServiceListing.updateMany({}, { $set: commonUpdate });
    const pUpdate = await PropertyListing.updateMany({}, { $set: { ...commonUpdate, service_radius_km: undefined } });
    const supUpdate = await SupplierListing.updateMany({}, { $set: commonUpdate });
    const mUpdate = await MandiListing.updateMany({}, { $set: commonUpdate });

    console.log(`Migrated ${sUpdate.modifiedCount} Services.`);
    console.log(`Migrated ${pUpdate.modifiedCount} Properties.`);
    console.log(`Migrated ${supUpdate.modifiedCount} Suppliers.`);
    console.log(`Migrated ${mUpdate.modifiedCount} Mandi items.`);

    console.log('Migration Complete.');
  } catch (error) {
    console.error('Migration Failed:', error);
  } finally {
    await mongoose.connection.close();
  }
}

migrate();
