const mongoose = require('mongoose');
const { PropertyListing } = require('./src/models/Listing');

mongoose.connect('mongodb+srv://admin:admin123@baserabazar.mcz2j.mongodb.net/baserabazar?retryWrites=true&w=majority')
  .then(async () => {
    try {
       const allProps = await PropertyListing.find({}).limit(10);
       allProps.forEach(p => {
         console.log(`Title: ${p.title}, PartnerID: ${p.partner_id}, Status: ${p.status}`);
       });
    } catch(e) { console.log(e); }
    process.exit(0);
  });
