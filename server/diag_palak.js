const mongoose = require('mongoose');
const PropertyListing = require('./src/models/Listing').PropertyListing;
const Partner = require('./src/models/Partner');

mongoose.connect('mongodb+srv://admin:admin123@baserabazar.mcz2j.mongodb.net/baserabazar?retryWrites=true&w=majority')
  .then(async () => {
    try {
       console.log("--- DEBUG PALAK ---");
       const partner = await Partner.findOne({ phone: '8770620342' });
       if (!partner) {
         console.log("Partner Palak not found with phone 8770620342");
       } else {
         console.log("Palak ID:", partner._id);
         console.log("Palak Phone:", partner.phone);
         
         const allProps = await PropertyListing.find({}).limit(5);
         console.log("Total properties in DB (sample):", allProps.length);
         
         // Search by phone fallback
         const propsByPhone = await PropertyListing.find({ 
            $or: [
              { phone: '8770620342' }, 
              { contact_phone: '8770620342' },
              { partner_id: partner._id }
            ]
         });
         console.log("Properties found for Palak:", propsByPhone.length);
         propsByPhone.forEach(p => {
            console.log(`- Title: ${p.title}, PartnerID: ${p.partner_id}, Status: ${p.status}`);
         });
       }
    } catch(e) { console.error(e); }
    process.exit(0);
  });
