const mongoose = require('mongoose');
const { Category, SupplierCategory } = require('./models/System');
require('dotenv').config({ path: '../.env' });

async function check() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI not found in .env');
    process.exit(1);
  }
  await mongoose.connect(uri);
  
  console.log('--- SupplierCategory ---');
  const supplierCats = await SupplierCategory.find({});
  supplierCats.forEach(c => {
    console.log(`Name: "${c.name}", IsActive: ${c.is_active}, Slug: "${c.slug}"`);
  });

  console.log('\n--- Category (type: supplier) ---');
  const normalCats = await Category.find({ type: 'supplier' });
  normalCats.forEach(c => {
    console.log(`Name: "${c.name}", IsActive: ${c.is_active}, Slug: "${c.slug}"`);
  });

  await mongoose.disconnect();
}

check().catch(console.error);
