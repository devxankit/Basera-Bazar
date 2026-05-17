const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  admin_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'APPROVE_TL', 'REJECT_TL', 'APPROVE_OS', 'REJECT_OS',
      'APPROVE_LEAVE', 'REJECT_LEAVE',
      'CREATE_TARGET', 'UPDATE_TARGET', 'DEACTIVATE_TARGET', 'ACTIVATE_TARGET', 'DELETE_TARGET',
      'VERIFY_ATTENDANCE', 'VERIFY_REPORT',
      'PROCESS_SALARY', 'MARK_SALARY_PAID'
    ]
  },
  resource_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  resource_type: {
    type: String,
    required: true,
    enum: ['TeamLeader', 'OfficeStaff', 'LeaveRequest', 'StaffTarget', 'StaffAttendance', 'DailyReport', 'SalaryRecord']
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  ip_address: String,
  user_agent: String
}, { timestamps: { createdAt: true, updatedAt: false } });

auditLogSchema.index({ admin_id: 1, createdAt: -1 });
auditLogSchema.index({ resource_type: 1, resource_id: 1 });

module.exports = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
