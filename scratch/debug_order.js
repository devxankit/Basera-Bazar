const mongoose = require('mongoose');
const Order = require('./server/src/models/Order');
const { Partner } = require('./server/src/models/Partner');
require('dotenv').config({ path: './server/.env' });

async function checkOrder() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to DB");

  const orderId = '69f47e1b70385d1e8ed2b4f0';
  const order = await Order.findById(orderId);
  
  if (!order) {
    console.log("Order not found");
    process.exit(0);
  }

  console.log("Order ID:", order.order_id);
  console.log("Order Status:", order.status);
  
  order.items.forEach((item, index) => {
    console.log(`Item ${index}:`, item.name);
    console.log(`Seller ID in Item:`, item.seller_id);
  });

  // Also check if there's any partner with this ID or similar
  const allPartners = await Partner.find({}, '_id name');
  console.log("All Partners:");
  allPartners.forEach(p => console.log(`- ${p._id}: ${p.name}`));

  process.exit(0);
}

checkOrder();
