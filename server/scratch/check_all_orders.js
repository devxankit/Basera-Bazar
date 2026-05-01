const mongoose = require('mongoose');
const Order = require('../src/models/Order');
const { Partner } = require('../src/models/Partner');
const { User } = require('../src/models/User');
require('dotenv').config();

async function checkOrders() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    const orders = await Order.find({});
    console.log(`Total Orders in DB: ${orders.length}`);

    orders.forEach(o => {
      console.log(`Order ${o._id}: user_id=${o.user_id}, status=${o.status}`);
    });

    // Check all users
    const allUsers = await User.find({}, '_id name');
    console.log("\nAll Users:");
    allUsers.forEach(u => console.log(`- ${u._id}: ${u.name}`));

    // Check all partners
    const allPartners = await Partner.find({}, '_id name');
    console.log("\nAll Partners:");
    allPartners.forEach(p => console.log(`- ${p._id}: ${p.name}`));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkOrders();
