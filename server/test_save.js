const mongoose = require('mongoose');
require('dotenv').config();

async function testSave() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const { PropertyListing } = require('./src/models/Listing');
    
    // Find one pending property
    const listing = await PropertyListing.findOne({ status: 'pending_approval' });
    if (!listing) {
      console.log("No pending property found.");
      process.exit(0);
    }
    
    console.log("Found listing:", listing.title);
    listing.status = 'active';
    
    try {
      await listing.save();
      console.log("Save successful!");
    } catch (saveErr) {
      console.error("Save failed with Validation Error:", saveErr.message);
      if (saveErr.errors) {
        console.error("Details:", Object.keys(saveErr.errors).map(k => `${k}: ${saveErr.errors[k].message}`));
      }
    }
    process.exit(0);
  } catch(e) {
    console.error("Connection or other error:", e);
    process.exit(1);
  }
}
testSave();
