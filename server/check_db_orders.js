const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: '.env' });

// We need to define the model here because we can't easily require it from the server directory without setup
const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },
  seller_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner' },
  name: String,
  status: String
});

const orderSchema = new mongoose.Schema({
  order_id: String,
  items: [orderItemSchema],
  status: String,
  token_payment: { status: String }
}, { timestamps: true });

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

async function checkOrders() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) throw new Error('MONGO_URI not found in .env');
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
    
    const orders = await Order.find({}).sort({ createdAt: -1 }).limit(5);
    console.log(`Found ${orders.length} orders (showing last 5)`);
    
    orders.forEach(o => {
      console.log(`Order ID: ${o._id}, Client ID: ${o.order_id}, Status: ${o.status}, Token: ${o.token_payment?.status}`);
      o.items.forEach(i => {
        console.log(`  Item: ${i.name}, Seller: ${i.seller_id}, Status: ${i.status}`);
      });
    });
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkOrders();
