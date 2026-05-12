const mongoose = require('mongoose');

const staffAttendanceSchema = new mongoose.Schema(
  {
    staff_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    staff_type: {
      type: String,
      enum: ['team_leader', 'field_executive', 'office_staff'],
      required: true,
    },
    date: { type: String, required: true }, // 'YYYY-MM-DD'
    check_in_time: { type: Date },
    check_out_time: { type: Date },
    // GPS data — only for field_executive
    check_in_location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: { type: [Number] }, // [lng, lat]
    },
    check_in_selfie: { type: String }, // Cloudinary URL
    geo_fence_valid: { type: Boolean },
    geo_fence_distance_m: { type: Number }, // distance from reference point
    // Working hours (auto-calculated on check-out)
    working_hours: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['present', 'absent', 'half_day', 'on_leave'],
      default: 'absent',
    },
    // Verification chain
    verified_by_team_leader: { type: Boolean, default: false },
    team_leader_verified_at: { type: Date },
    team_leader_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TeamLeader' },
    verified_by_admin: { type: Boolean, default: false },
    admin_verified_at: { type: Date },
    admin_verified_by: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
    remarks: { type: String },
  },
  { timestamps: true }
);

staffAttendanceSchema.index({ staff_id: 1, date: 1 }, { unique: true });
staffAttendanceSchema.index({ staff_type: 1, date: 1 });
staffAttendanceSchema.index({ team_leader_id: 1, date: 1 });
staffAttendanceSchema.index({ 'check_in_location': '2dsphere' }, { sparse: true });

module.exports = mongoose.model('StaffAttendance', staffAttendanceSchema);
