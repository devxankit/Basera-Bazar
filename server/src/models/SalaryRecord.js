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
    refPath: 'staff_model',
    index: true,
    default: null
  },
  staff_type: {
    type: String,
    enum: ['executive', 'team_leader', 'office_staff'],
    default: 'executive'
  },
  staff_model: {
    type: String,
    enum: ['TeamLeader', 'Executive', 'OfficeStaff'],
    default: function() {
      if (this.staff_type === 'team_leader') return 'TeamLeader';
      if (this.staff_type === 'field_executive' || this.staff_type === 'executive') return 'Executive';
      if (this.staff_type === 'office_staff') return 'OfficeStaff';
      return null;
    }
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

// Legacy: one record per executive per month.
// Use a partial filter (not sparse) so the unique constraint applies ONLY to real
// executive records. A plain `sparse` index still indexes TL/OS rows because their
// `executive_id` is explicitly null (with `month` present), causing E11000 collisions
// when more than one non-executive staff member is processed in the same month (bug #338).
salaryRecordSchema.index(
  { executive_id: 1, month: 1 },
  { unique: true, partialFilterExpression: { executive_id: { $type: 'objectId' } } }
);
// New: one record per staff per month
salaryRecordSchema.index({ staff_id: 1, month: 1 }, { unique: true, sparse: true });

salaryRecordSchema.pre('save', function(next) {
  if (this.staff_type === 'team_leader') {
    this.staff_model = 'TeamLeader';
  } else if (this.staff_type === 'field_executive' || this.staff_type === 'executive') {
    this.staff_model = 'Executive';
  } else if (this.staff_type === 'office_staff') {
    this.staff_model = 'OfficeStaff';
  }
  if (typeof next === 'function') {
    next();
  }
});

module.exports = mongoose.model('SalaryRecord', salaryRecordSchema);
