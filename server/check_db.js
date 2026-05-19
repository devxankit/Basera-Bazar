const mongoose = require('mongoose');
const { Partner } = require('./src/models/Partner');
const { ServiceListing, PropertyListing } = require('./src/models/Listing');
const { Category } = require('./src/models/System');

const uri = 'mongodb+srv://ujjawal:ujjawal2002@cluster0.jmyqtq6.mongodb.net/baserabazar?retryWrites=true&w=majority&appName=Cluster0';

async function run() {
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const partnerCount = await Partner.countDocuments();
  console.log('Total partners:', partnerCount);

  const partners = await Partner.find({}, 'name phone onboarding_status is_active roles partner_type kyc');
  console.log('Partners list:');
  partners.forEach(p => {
    console.log(`- ${p.name} (${p.phone}): onboarding_status=${p.onboarding_status}, is_active=${p.is_active}, roles=${JSON.stringify(p.roles)}, partner_type=${p.partner_type}, kyc.status=${p.kyc?.status}`);
  });

  const categories = await Category.find({}, 'name type is_active parent_id');
  console.log('\nCategories list:');
  categories.forEach(c => {
    console.log(`- ${c.name} (type=${c.type}, is_active=${c.is_active}, id=${c._id})`);
  });

  const services = await ServiceListing.find({});
  console.log('\nService Listings:');
  services.forEach(s => {
    console.log(`- Title: ${s.title}, partner_id: ${s.partner_id}, category_id: ${s.category_id}, status: ${s.status}, address: ${JSON.stringify(s.address)}`);
  });

  await mongoose.disconnect();
}

run().catch(console.error);
