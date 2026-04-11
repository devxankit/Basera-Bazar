const mongoose = require('mongoose');

// Define the ActivityLog schema inline here to keep it lightweight
const activityLogSchema = new mongoose.Schema({
  actor_name: { type: String, default: 'System' },   // Who did it (admin name, user name, partner name)
  actor_id: { type: mongoose.Schema.Types.ObjectId }, // Their ID
  action: { 
    type: String, 
    required: true, 
    enum: ['created', 'updated', 'deleted', 'approved', 'rejected', 'registered', 'subscribed', 'login', 'logout']
  },
  entity_type: { 
    type: String, 
    required: true,
    enum: ['user', 'partner', 'property', 'service', 'supplier', 'product', 'category', 'subcategory', 'banner', 'subscription', 'system']
  },
  entity_name: { type: String }, // e.g. property title, user name
  entity_id: { type: mongoose.Schema.Types.ObjectId },
  description: { type: String, required: true }, // Human-readable: "Ujjawal added Sunrise Apartment"
  status: { type: String, default: 'COMPLETED', enum: ['COMPLETED', 'FAILED', 'PENDING'] },
  metadata: { type: mongoose.Schema.Types.Mixed } // Optional extra details
}, { timestamps: true });

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ entity_type: 1, createdAt: -1 });

const ActivityLog = mongoose.models.ActivityLog || mongoose.model('ActivityLog', activityLogSchema);

/**
 * Log an activity to the database.
 * This is a "fire and forget" – it will never throw and break the calling function.
 * 
 * @param {Object} opts
 * @param {string}  opts.actor_name  - Name of the person who did the action
 * @param {string}  opts.actor_id    - MongoDB ID of the actor
 * @param {string}  opts.action      - 'created' | 'updated' | 'deleted' | 'approved' | 'rejected' | 'registered' | 'subscribed'
 * @param {string}  opts.entity_type - 'user' | 'partner' | 'property' | 'service' | 'supplier' | 'product' | 'category' | 'banner' | 'subscription'
 * @param {string}  opts.entity_name - Human-readable name of the affected entity
 * @param {string}  opts.entity_id   - MongoDB ID of the affected entity
 * @param {string}  opts.description - Full readable description e.g. "Admin created user John Doe"
 * @param {string}  [opts.status]    - 'COMPLETED' by default
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
    // Never crash the calling function – just log the error silently in the server console
    console.error('[ActivityLogger] Failed to write activity log:', err.message);
  }
}

module.exports = { ActivityLog, logActivity };
