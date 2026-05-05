const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

const { PropertyListing, ServiceListing, MandiListing } = require('../src/models/Listing');

async function checkData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');

    const totalProperties = await PropertyListing.countDocuments();
    const activeProperties = await PropertyListing.countDocuments({ status: 'active' });
    const pendingProperties = await PropertyListing.countDocuments({ status: 'pending_approval' });

    console.log(`\nProperty Stats:`);
    console.log(`Total: ${totalProperties}`);
    console.log(`Active: ${activeProperties}`);
    console.log(`Pending Approval: ${pendingProperties}`);

    if (totalProperties > 0) {
      console.log('\nLast 5 Properties:');
      const lastProps = await PropertyListing.find().sort({ createdAt: -1 }).limit(5);
      lastProps.forEach(p => {
        console.log(`- ID: ${p._id}, Title: ${p.title}, Status: ${p.status}, District: ${p.address?.district}, City: ${p.address?.city}`);
      });
    }

    const totalServices = await ServiceListing.countDocuments();
    const activeServices = await ServiceListing.countDocuments({ status: 'active' });
    console.log(`\nService Stats:`);
    console.log(`Total: ${totalServices}`);
    console.log(`Active: ${activeServices}`);

    const totalMandi = await MandiListing.countDocuments();
    const activeMandi = await MandiListing.countDocuments({ status: 'active' });
    console.log(`\nMandi Stats:`);
    console.log(`Total: ${totalMandi}`);
    console.log(`Active: ${activeMandi}`);

    // Check for Muzaffarpur specifically
    const muzProps = await PropertyListing.countDocuments({ 
      $or: [
        { 'address.district': { $regex: /muzaffarpur/i } },
        { 'address.city': { $regex: /muzaffarpur/i } },
        { 'address.full_address': { $regex: /muzaffarpur/i } }
      ]
    });
    console.log(`\nMuzaffarpur specific:`);
    console.log(`Properties in Muzaffarpur (any status): ${muzProps}`);

    const muzActiveProps = await PropertyListing.countDocuments({ 
      status: 'active',
      $or: [
        { 'address.district': { $regex: /muzaffarpur/i } },
        { 'address.city': { $regex: /muzaffarpur/i } },
        { 'address.full_address': { $regex: /muzaffarpur/i } }
      ]
    });
    console.log(`Active Properties in Muzaffarpur: ${muzActiveProps}`);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkData();
