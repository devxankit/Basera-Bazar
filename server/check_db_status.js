const mongoose = require('mongoose');
require('dotenv').config();
const { ServiceListing, PropertyListing, MandiListing } = require('./src/models/Listing');
const { Partner } = require('./src/models/Partner');

async function checkData() {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/baserabazar';
    console.log('Connecting to:', uri.split('@')[1] || uri);
    await mongoose.connect(uri);
    console.log('Connected to DB');

    const serviceCounts = await ServiceListing.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
    const propertyCounts = await PropertyListing.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
    const mandiCounts = await MandiListing.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
    const partnerCounts = await Partner.aggregate([{ $group: { _id: '$onboarding_status', count: { $sum: 1 } } }]);

    console.log('\n--- Service Listings ---');
    console.table(serviceCounts);

    console.log('\n--- Property Listings ---');
    console.table(propertyCounts);

    console.log('\n--- Mandi Listings ---');
    console.table(mandiCounts);

    console.log('\n--- Partners ---');
    console.table(partnerCounts);

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkData();
