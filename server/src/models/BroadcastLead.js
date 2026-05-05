const mongoose = require('mongoose');

const broadcastLeadSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  delivery_location: {
    state: { type: String, required: true },
    district: { type: String, required: true },
    full_address: { type: String }
  },
  products: [{
    item_name: { type: String },
    quantity: { type: Number },
    unit: { type: String }
  }],
  requirement_details: { type: String },
  document_url: { type: String },
  status: {
    type: String,
    enum: ['active', 'closed', 'cancelled'],
    default: 'active'
  },
  target_category: {
    type: String,
    enum: ['service', 'supplier'],
    required: true
  }
}, { timestamps: true });

broadcastLeadSchema.index({ 'delivery_location.district': 1, status: 1 });
broadcastLeadSchema.index({ user_id: 1, createdAt: -1 });

module.exports = mongoose.model('BroadcastLead', broadcastLeadSchema);
