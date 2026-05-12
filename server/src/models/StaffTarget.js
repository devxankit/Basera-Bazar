const mongoose = require('mongoose');

const staffTargetSchema = new mongoose.Schema(
  {
    assigned_by: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', required: true },
    target_type: {
      type: String,
      enum: ['partner_onboarding', 'calling', 'lead_generation', 'sales', 'subscription', 'custom'],
      required: true,
    },
    target_period: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      required: true,
    },
    target_value: { type: Number, min: 1, required: true },
    start_date: { type: String, required: true }, // 'YYYY-MM-DD'
    end_date: { type: String, required: true },   // 'YYYY-MM-DD'
    description: { type: String, maxlength: 500 },
    incentive_type: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },
    incentive_rate: { type: Number, min: 0, required: true },
    // Assignment scope
    assign_to_type: {
      type: String,
      enum: ['all', 'team_leader', 'field_executive', 'office_staff'],
      required: true,
    },
    assign_to_ids: [{ type: mongoose.Schema.Types.ObjectId }], // empty = all of that type
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

staffTargetSchema.index({ target_type: 1, start_date: 1, end_date: 1 });
staffTargetSchema.index({ is_active: 1, start_date: 1 });

module.exports = mongoose.model('StaffTarget', staffTargetSchema);
