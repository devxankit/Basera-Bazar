const mongoose = require('mongoose');

const adminNotificationSchema = new mongoose.Schema({
  sender_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  target_type: {
    type: String,
    enum: ['all_customers', 'all_partners', 'all_executives', 'all_team_leaders', 'all_office_staff', 'specific_user'],
    required: true
  },
  target_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  target_user_model: {
    type: String,
    enum: ['User', 'Partner', 'Executive', 'TeamLeader', 'OfficeStaff'],
    required: false
  },
  target_user_name: {
    type: String,
    required: false
  },
  scheduled_at: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['scheduled', 'processing', 'sent', 'failed'],
    default: 'sent' // Default to sent if sent immediately
  },
  sent_count: {
    type: Number,
    default: 0
  },
  success_count: {
    type: Number,
    default: 0
  },
  failure_count: {
    type: Number,
    default: 0
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Indexes for query performance
adminNotificationSchema.index({ status: 1, scheduled_at: 1 });
adminNotificationSchema.index({ created_at: -1 });

module.exports = mongoose.model('AdminNotification', adminNotificationSchema);
