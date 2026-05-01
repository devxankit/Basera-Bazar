const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkOrders() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const Order = require('../src/models/Order');
    const User = require('../src/models/User');
    const Partner = require('../src/models/Partner');

    const orders = await Order.find().sort({ createdAt: -1 }).limit(10);
    console.log(`Found ${orders.length} recent orders\n`);

    for (const order of orders) {
      const user = await User.findById(order.user_id);
      const partner = await Partner.findById(order.user_id);
      
      console.log(`Order ID: ${order.order_id} (${order._id})`);
      console.log(`User ID: ${order.user_id}`);
      console.log(`Linked to User: ${user ? user.name : 'NO'}`);
      console.log(`Linked to Partner: ${partner ? partner.name : 'NO'}`);
      console.log(`Items: ${order.items.length}`);
      console.log(`Status: ${order.status}`);
      console.log('---');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkOrders();
