const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

async function fix() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const { PropertyListing } = require('./server/src/models/Listing');
    const result = await PropertyListing.updateMany({ status: 'pending_approval' }, { $set: { status: 'active' } });
    console.log(`Updated ${result.modifiedCount} properties to active.`);
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
fix();
