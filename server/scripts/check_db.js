const mongoose = require('mongoose');
require('dotenv').config();
const { Partner } = require('../src/models/Partner');
const { Category } = require('../src/models/System');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const suppliers = await Partner.find({ role: 'Supplier' });
  console.log("Suppliers by role:", suppliers.map(s => s.name));
  
  const suppliers2 = await Partner.find({ partner_type: 'supplier' });
  console.log("Suppliers by type:", suppliers2.map(s => s.name));
  
  const categories = await Category.find();
  console.log("Categories:", categories.map(c => c.name));
  
  process.exit(0);
}
run();
