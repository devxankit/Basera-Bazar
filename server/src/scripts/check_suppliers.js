require('dotenv').config();
const mongoose = require('mongoose');
const { Partner } = require('../models/Partner');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const partners = await Partner.find({ roles: 'supplier' });
  console.log(`Found ${partners.length} suppliers:`);
  partners.forEach(p => {
    console.log(JSON.stringify({
      id: p._id,
      name: p.name,
      district: p.district,
      state: p.state,
      is_active: p.is_active,
      onboarding_status: p.onboarding_status,
      roles: p.roles
    }, null, 2));
  });

  await mongoose.connection.close();
}

run().catch(console.error);
