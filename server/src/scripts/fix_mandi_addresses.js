const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { MandiListing } = require('../models/Listing');
const { Partner } = require('../models/Partner');

const fixMandiAddresses = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/baserabazar';
    console.log(`Connecting to ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    // Find all mandi listings where address.district or address.state is missing
    const listings = await MandiListing.find({
      $or: [
        { 'address.district': { $exists: false } },
        { 'address.district': '' },
        { 'address.district': null },
        { 'address.state': { $exists: false } },
        { 'address.state': '' },
        { 'address.state': null }
      ]
    });

    console.log(`Found ${listings.length} listings with missing location data.`);

    let fixedCount = 0;
    for (const listing of listings) {
      if (!listing.partner_id) {
        console.warn(`Listing ${listing._id} has no partner_id, skipping.`);
        continue;
      }

      const partner = await Partner.findById(listing.partner_id);
      if (!partner) {
        console.warn(`Partner ${listing.partner_id} not found for listing ${listing._id}, skipping.`);
        continue;
      }

      // Populate missing fields
      const update = {
        'address.district': listing.address?.district || partner.district,
        'address.state': listing.address?.state || partner.state,
        'address.full_address': listing.address?.full_address || partner.address,
        'address.pincode': listing.address?.pincode || partner.pincode,
        'location': listing.location?.coordinates?.length > 1 ? listing.location : partner.location
      };

      await MandiListing.findByIdAndUpdate(listing._id, { $set: update });
      fixedCount++;
      if (fixedCount % 10 === 0) console.log(`Fixed ${fixedCount}/${listings.length}...`);
    }

    console.log(`Successfully fixed ${fixedCount} listings.`);
    process.exit(0);
  } catch (error) {
    console.error('Error fixing addresses:', error);
    process.exit(1);
  }
};

fixMandiAddresses();
