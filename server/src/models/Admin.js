const mongoose = require('mongoose');

const adminUserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password_hash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['super_admin'],
    default: 'super_admin'
  },
  permissions: {
    type: [String],
    default: [] // For granular scaling if needed in future despite single role
  }
}, { timestamps: true });

// email unique index is handled by field definition

const auditLogSchema = new mongoose.Schema({
  performed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser',
    required: true
  },
  action: {
    type: String,
    required: true
    // e.g. 'approve_partner', 'suspend_listing', 'assign_mandi_enquiry'
  },
  entity_type: {
    type: String,
    required: true
  },
  entity_id: {
    type: mongoose.Schema.Types.Mixed, // Object ID usually, but sometimes String
    required: true
  },
  changes: {
    before: { type: mongoose.Schema.Types.Mixed },
    after: { type: mongoose.Schema.Types.Mixed }
  },
  ip_address: { type: String },
  user_agent: { type: String }
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: false } // Immutable
});

// Logs shouldn't be mutable after creation so we only allow insert, usually managed at app layer.

module.exports = {
  AdminUser: mongoose.model('AdminUser', adminUserSchema),
  AuditLog: mongoose.model('AuditLog', auditLogSchema)
};
