const mongoose = require('mongoose');

const staffPerformanceSchema = new mongoose.Schema(
  {
    staff_id: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'staff_model' },
    staff_type: {
      type: String,
      enum: ['team_leader', 'field_executive', 'office_staff'],
      required: true,
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
    month: { type: String, required: true }, // 'YYYY-MM'
    target_id: { type: mongoose.Schema.Types.ObjectId, ref: 'StaffTarget' },
    target_value: { type: Number, default: 0 },
    achieved_value: { type: Number, default: 0 },
    achievement_rate: { type: Number, min: 0, max: 1, default: 0 }, // 0.0–1.0
    incentive_earned: { type: Number, default: 0 },
    team_commission_earned: { type: Number, default: 0 }, // for team leaders
    is_deficient: { type: Boolean, default: false },       // achievement_rate < 0.70
    consecutive_deficient_months: { type: Number, default: 0 },
    salary_cut_applied: { type: Boolean, default: false },
    salary_cut_amount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'finalized'],
      default: 'pending',
    },
    finalized_by: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
    finalized_at: { type: Date },
  },
  { timestamps: true }
);

staffPerformanceSchema.index({ staff_id: 1, month: 1 }, { unique: true });
staffPerformanceSchema.index({ month: 1, staff_type: 1 });
staffPerformanceSchema.index({ month: 1, achievement_rate: -1 }); // for leaderboard

staffPerformanceSchema.pre('save', function(next) {
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

module.exports = mongoose.model('StaffPerformance', staffPerformanceSchema);
