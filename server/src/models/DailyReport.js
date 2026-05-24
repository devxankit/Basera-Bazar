const mongoose = require('mongoose');

const dailyReportSchema = new mongoose.Schema(
  {
    staff_id: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'staff_model' },
    staff_type: {
      type: String,
      enum: ['field_executive', 'office_staff'],
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
    team_leader_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TeamLeader' },
    date: { type: String, required: true }, // 'YYYY-MM-DD'

    // Field Executive specific
    partners_visited: { type: Number, default: 0 },
    partners_registered: { type: Number, default: 0 },
    subscriptions_sold: { type: Number, default: 0 },
    leads_uploaded: { type: Number, default: 0 },
    gps_trail: [
      {
        lat: Number,
        lng: Number,
        timestamp: Date,
      },
    ],

    // Office Staff specific
    calls_made: { type: Number, default: 0 },
    follow_ups_done: { type: Number, default: 0 },
    leads_generated: { type: Number, default: 0 },
    data_entries_updated: { type: Number, default: 0 },

    notes: { type: String, maxlength: 1000 },
    report_attachments: [{ type: String }], // Cloudinary URLs

    status: {
      type: String,
      enum: ['draft', 'submitted', 'tl_verified', 'tl_rejected', 'admin_verified', 'admin_rejected'],
      default: 'draft',
    },
    tl_remarks: { type: String, maxlength: 500 },
    tl_verified_at: { type: Date },
    admin_remarks: { type: String, maxlength: 500 },
    admin_verified_at: { type: Date },
    admin_verified_by: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
  },
  { timestamps: true }
);

dailyReportSchema.index({ staff_id: 1, date: 1 }, { unique: true });
dailyReportSchema.index({ team_leader_id: 1, date: 1, status: 1 });
dailyReportSchema.index({ staff_type: 1, date: 1, status: 1 });

dailyReportSchema.pre('save', function(next) {
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

module.exports = mongoose.model('DailyReport', dailyReportSchema);
