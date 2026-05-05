const mongoose = require('mongoose');
const { PropertyListing, ServiceListing, MandiListing } = require('./server/src/models/Listing');
const dotenv = require('dotenv');
dotenv.config({ path: './server/.env' });

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const pDistricts = await PropertyListing.distinct('address.district');
    const sDistricts = await ServiceListing.distinct('address.district');
    const mDistricts = await MandiListing.distinct('address.district');

    console.log('Property Districts:', pDistricts);
    console.log('Service Districts:', sDistricts);
    console.log('Mandi Districts:', mDistricts);

    const muzP = await PropertyListing.countDocuments({ 'address.district': /muzaffarpur/i });
    const muzS = await ServiceListing.countDocuments({ 'address.district': /muzaffarpur/i });
    const muzM = await MandiListing.countDocuments({ 'address.district': /muzaffarpur/i });

    console.log('Muzaffarpur Property Count:', muzP);
    console.log('Muzaffarpur Service Count:', muzS);
    console.log('Muzaffarpur Mandi Count:', muzM);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkData();
