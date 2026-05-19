const mongoose = require('mongoose');

const MONGO_URI = "mongodb+srv://ujjawal:ujjawal2002@cluster0.jmyqtq6.mongodb.net/baserabazar?retryWrites=true&w=majority&appName=Cluster0";

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB.");

  // Define minimal Partner schema
  const partnerSchema = new mongoose.Schema({}, { strict: false, collection: 'partners' });
  const Partner = mongoose.model('Partner', partnerSchema);

  // Define minimal ServiceListing schema
  const serviceSchema = new mongoose.Schema({}, { strict: false, collection: 'listings' });
  const ServiceListing = mongoose.model('ServiceListing', serviceSchema);

  const services = await ServiceListing.find({ listing_type: 'service' });
  console.log(`Found ${services.length} services.`);

  for (const s of services) {
    const p = await Partner.findById(s.get('partner_id'));
    console.log(JSON.stringify({
      id: s._id,
      title: s.get('title'),
      status: s.get('status'),
      is_featured: s.get('is_featured'),
      address: s.get('address'),
      category_id: s.get('category_id'),
      partner: p ? {
        id: p._id,
        name: p.get('name'),
        onboarding_status: p.get('onboarding_status'),
        is_active: p.get('is_active')
      } : null
    }, null, 2));
  }

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
