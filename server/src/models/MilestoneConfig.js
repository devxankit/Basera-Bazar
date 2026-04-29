const mongoose = require('mongoose');

const milestoneConfigSchema = new mongoose.Schema({
  target_orders: { type: Number, required: true },
  prize_name: { type: String, required: true },
  prize_description: { type: String },
  banner_url: { type: String },
  valid_until: { type: Date },
  is_active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('MilestoneConfig', milestoneConfigSchema);
