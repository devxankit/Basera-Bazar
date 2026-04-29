const mongoose = require('mongoose');

const milestoneRewardSchema = new mongoose.Schema({
  partner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true },
  milestone_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MilestoneConfig', required: true },
  shipping_address: {
    full_name: { type: String, required: true },
    phone: { type: String, required: true },
    full_address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true }
  },
  status: {
    type: String,
    enum: ['pending', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  tracking_id: { type: String },
  shipped_at: { type: Date },
  delivered_at: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('MilestoneReward', milestoneRewardSchema);
