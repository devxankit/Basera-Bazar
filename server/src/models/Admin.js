const mongoose = require('mongoose');

const adminUserSchema = new mongoose.Schema({
  name: {
    type: String,
    default: 'Super Admin'
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
    role: {
    type: String,
    enum: ['super_admin', 'SuperAdmin', 'Admin'],
    default: 'Admin'
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Suspended'],
    default: 'Active'
  },
  permissions: {
    type: [String],
    default: []
  },
  profileImage: {
    type: String,
    default: ''
  },
  token_version: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Hash password before saving
adminUserSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await require('bcryptjs').genSalt(10);
  this.password = await require('bcryptjs').hash(this.password, salt);
});

// Compare password method
adminUserSchema.methods.matchPassword = async function(enteredPassword) {
  return await require('bcryptjs').compare(enteredPassword, this.password);
};

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
