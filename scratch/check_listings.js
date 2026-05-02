const mongoose = require('mongoose');
const { MandiListing } = require('./server/src/models/Listing');

async function check() {
  await mongoose.connect('mongodb://localhost:27017/basera-bazar'); // Adjust if needed
  const listings = await MandiListing.find({ status: 'active' });
  console.log(`Found ${listings.length} active Mandi listings:`);
  listings.forEach(l => {
    console.log(`- ${l.title} (ID: ${l._id}, Cat: ${l.category_id}, SubCat: ${l.subcategory_id}, Stock: ${l.stock_quantity})`);
  });
  process.exit();
}

check();
