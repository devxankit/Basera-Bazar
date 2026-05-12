const mongoose = require('mongoose');

const salaryRecordSchema = new mongoose.Schema({
  executive_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Executive',
    required: true,
    index: true
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
  note: { type: String, default: '' }
}, { timestamps: true });

// One record per executive per month
salaryRecordSchema.index({ executive_id: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('SalaryRecord', salaryRecordSchema);
