const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema(
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
    // Team leader responsible for first approval (null if staff is a TL themselves)
    team_leader_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TeamLeader' },
    leave_type: {
      type: String,
      enum: ['sick', 'casual', 'earned'],
      required: true,
    },
    start_date: { type: String, required: true }, // 'YYYY-MM-DD'
    end_date: { type: String, required: true },   // 'YYYY-MM-DD'
    total_days: { type: Number, required: true },
    reason: { type: String, required: true, minlength: 10, maxlength: 500 },
    status: {
      type: String,
      enum: ['pending', 'tl_approved', 'tl_rejected', 'admin_approved', 'admin_rejected'],
      default: 'pending',
    },
    tl_note: { type: String, maxlength: 500 },
    tl_reviewed_at: { type: Date },
    admin_note: { type: String, maxlength: 500 },
    admin_reviewed_at: { type: Date },
    admin_reviewed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
  },
  { timestamps: true }
);

leaveRequestSchema.index({ staff_id: 1, status: 1, createdAt: -1 });
leaveRequestSchema.index({ team_leader_id: 1, status: 1 });
leaveRequestSchema.index({ status: 1, createdAt: -1 });

leaveRequestSchema.pre('save', function(next) {
  if (this.staff_type === 'team_leader') {
    this.staff_model = 'TeamLeader';
  } else if (this.staff_type === 'field_executive' || this.staff_type === 'executive') {
    this.staff_model = 'Executive';
  } else if (this.staff_type === 'office_staff') {
    this.staff_model = 'OfficeStaff';
  }
  next();
});

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
