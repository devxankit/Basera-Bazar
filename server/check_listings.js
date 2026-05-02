const mongoose = require('mongoose');
const { MandiListing } = require('./src/models/Listing');
require('dotenv').config();

async function check() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/baserabazar');
  const listings = await MandiListing.find({ status: 'active' });
  console.log(`Found ${listings.length} active Mandi listings:`);
  listings.forEach(l => {
    console.log(`- ${l.title} (ID: ${l._id}, Cat: ${l.category_id}, SubCat: ${l.subcategory_id}, Stock: ${l.stock_quantity})`);
  });
  process.exit();
}

check();
