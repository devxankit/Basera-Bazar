const mongoose = require('mongoose');
const path = require('path');
const { ServiceListing, PropertyListing, MandiListing } = require('../models/Listing');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const services = await ServiceListing.find({});
  console.log(`Total Services in DB: ${services.length}`);
  services.forEach(s => {
    console.log(`Service: ${s.title}, District: ${s.address?.district}, State: ${s.address?.state}, Coords: ${JSON.stringify(s.location?.coordinates)}`);
  });

  const properties = await PropertyListing.find({});
  console.log(`Total Properties in DB: ${properties.length}`);

  const mandi = await MandiListing.find({});
  console.log(`Total Mandi in DB: ${mandi.length}`);

  await mongoose.connection.close();
}

check();
