const mongoose = require('mongoose');

const salaryRecordSchema = new mongoose.Schema({
  executive_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Executive',
    index: true
  },
  // Polymorphic staff support (team_leader / office_staff)
  staff_id: {
    type: mongoose.Schema.Types.ObjectId,
    index: true,
    default: null
  },
  staff_type: {
    type: String,
    enum: ['executive', 'team_leader', 'office_staff'],
    default: 'executive'
  },
  month: {
    type: String,         // 'YYYY-MM' e.g. '2026-05'
    required: true,
    index: true
  },
  base_salary: {
    type: Number,
    default: 0
  },
  effective_salary: {
    type: Number,
    default: 0
  },
  tasks_total: {
    type: Number,
    default: 0
  },
  tasks_met: {
    type: Number,
    default: 0
  },
  completion_rate: {
    type: Number,         // 0.0 – 1.0
    default: 0
  },
  deduction_applied: {
    type: Boolean,
    default: false
  },
  deduction_amount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending',
    index: true
  },
  paid_at: { type: Date, default: null },
  paid_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser',
    default: null
  },
  note: { type: String, default: '' },
  // Incentive and commission (new staff types)
  incentive_amount: { type: Number, default: 0 },
  team_commission_amount: { type: Number, default: 0 }
}, { timestamps: true });

// Legacy: one record per executive per month
salaryRecordSchema.index({ executive_id: 1, month: 1 }, { unique: true, sparse: true });
// New: one record per staff per month
salaryRecordSchema.index({ staff_id: 1, month: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('SalaryRecord', salaryRecordSchema);
