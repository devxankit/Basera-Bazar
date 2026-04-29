const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MandiListing', required: true },
  seller_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true },
  name: { type: String, required: true },
  qty: { type: Number, required: true },
  price: { type: Number, required: true }, // Price at time of purchase
  unit: { type: String },
  status: {
    type: String,
    enum: ['pending', 'contacted', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  status_history: [
    {
      status: { type: String },
      date: { type: Date, default: Date.now },
      note: { type: String }
    }
  ],
  commission_rate: { type: Number }, // Captured at time of order
  commission_amount: { type: Number }, // Calculated as (price * qty) * (rate / 100)
  delivery_otp: { type: String }, // Random 6-digit OTP for delivery verification
  delivered_at: { type: Date }
}, { _id: true });

const orderSchema = new mongoose.Schema({
  order_id: { type: String, required: true, unique: true }, // Client-friendly ID
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  total_amount: { type: Number, required: true },
  
  token_payment: {
    amount: { type: Number },
    razorpay_order_id: { type: String },
    razorpay_payment_id: { type: String },
    status: { 
      type: String, 
      enum: ['pending', 'paid', 'failed'], 
      default: 'pending' 
    },
    paid_at: { type: Date }
  },

  final_payment: {
    amount: { type: Number },
    method: { type: String, enum: ['cod'], default: 'cod' },
    status: { 
      type: String, 
      enum: ['pending', 'paid'], 
      default: 'pending' 
    },
    paid_at: { type: Date }
  },

  shipping_address: {
    full_name: { type: String },
    phone: { type: String },
    full_address: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number]
    }
  },

  billing_address: {
    full_name: { type: String },
    full_address: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String }
  },

  status: {
    type: String,
    enum: ['pending', 'token_paid', 'contacted', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  }
}, { timestamps: true });

// Index for geo-location of delivery if needed
orderSchema.index({ 'shipping_address.location': '2dsphere' });

module.exports = mongoose.model('Order', orderSchema);
