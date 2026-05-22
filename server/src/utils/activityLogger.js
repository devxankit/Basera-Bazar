const mongoose = require('mongoose');
const logger = require('./logger');

const activityLogSchema = new mongoose.Schema({
  actor_name: { type: String, default: 'System' },
  actor_id: { type: mongoose.Schema.Types.ObjectId },
  action: {
    type: String,
    required: true,
    enum: [
      'created', 'updated', 'deleted', 'approved', 'rejected',
      'registered', 'subscribed', 'login', 'logout',
      'submitted_onboarding', 'onboarding',
      'withdrawn', 'credited', 'deactivated', 'activated',
      'paid', 'verified', 'cancelled', 'payment_failed', 'executive_commission_earned'
    ]
  },
  entity_type: {
    type: String,
    required: true,
    enum: [
      'user', 'partner', 'executive', 'property', 'service',
      'supplier', 'product', 'category', 'subcategory', 'banner',
      'subscription', 'system', 'withdrawal', 'payment',
      'wallet', 'lead', 'order', 'mandi_product'
    ]
  },
  entity_name: { type: String },
  entity_id: { type: mongoose.Schema.Types.ObjectId },
  description: { type: String, required: true },
  status: { type: String, default: 'COMPLETED', enum: ['COMPLETED', 'FAILED', 'PENDING'] },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ entity_type: 1, createdAt: -1 });
// Auto-delete logs older than 90 days
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const ActivityLog = mongoose.models.ActivityLog || mongoose.model('ActivityLog', activityLogSchema);

/**
 * Fire-and-forget activity logger. Never throws — failures are logged to console only.
 */
async function logActivity(opts) {
  try {
    await ActivityLog.create({
      actor_name: opts.actor_name || 'System',
      actor_id: opts.actor_id || null,
      action: opts.action,
      entity_type: opts.entity_type,
      entity_name: opts.entity_name || '',
      entity_id: opts.entity_id || null,
      description: opts.description,
      status: opts.status || 'COMPLETED',
      metadata: opts.metadata || {}
    });
  } catch (err) {
    logger.error({ err: err.message }, '[ActivityLogger] Failed to write activity log:');
  }
}

module.exports = { ActivityLog, logActivity };
