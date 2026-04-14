const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  applicable_to: {
    type: [String],
    enum: ['service_provider', 'property_agent', 'supplier', 'mandi_seller'],
    required: true
  },
  duration_days: { type: Number, required: true },
  price: { type: Number, required: true }, // Whole rupees
  
  // Limits
  listings_limit: { type: Number, default: 0 }, // -1 for unlimited
  featured_listings_limit: { type: Number, default: 0 },
  leads_limit: { type: Number, default: 0 },
  
  features: { type: [String], default: [] }, // Additional bullet points
  
  is_active: { type: Boolean, default: true },
  razorpay_plan_id: { type: String }, // Optional, for recurring
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' }
}, { timestamps: true });

const subscriptionSchema = new mongoose.Schema({
  partner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true },
  plan_id: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan' },
  plan_snapshot: { type: mongoose.Schema.Types.Mixed, required: true },
  status: {
    type: String,
    enum: ['pending_payment', 'active', 'expired', 'cancelled', 'trial'],
    default: 'pending_payment'
  },
  starts_at: { type: Date },
  ends_at: { type: Date },
  usage: {
    listings_created: { type: Number, default: 0 },
    enquiries_received_this_month: { type: Number, default: 0 },
    usage_reset_at: { type: Date }
  },
  razorpay_subscription_id: { type: String },
  granted_by_admin: { type: Boolean, default: false } // Manual bypass
}, { timestamps: true });
subscriptionSchema.index({ ends_at: 1 }); // Expiry cron index

const razorpayOrderSchema = new mongoose.Schema({
  razorpay_order_id: { type: String, required: true, unique: true },
  entity_type: { type: String, required: true }, // e.g., 'partner', 'user'
  entity_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  purpose: { type: String, required: true }, // 'subscription', 'featured_listing'
  amount: { type: Number, required: true }, // Whole rupees!
  status: {
    type: String,
    enum: ['created', 'attempted', 'paid', 'failed', 'refunded'],
    default: 'created'
  },
  webhook_events: [{ type: mongoose.Schema.Types.Mixed }], // Full payload cache
  refund: {
    razorpay_refund_id: { type: String },
    amount: { type: Number }, // Whole rupees
    status: { type: String },
    initiated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' }
  },
  razorpay_payment_id: { type: String }
}, { timestamps: true });

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['subscription_payment', 'mandi_commission', 'refund', 'admin_credit'],
    required: true
  },
  amount: { type: Number, required: true }, // Whole rupees
  direction: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'pending', 'refunded'],
    required: true
  },
  razorpay_order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'RazorpayOrder' }, // Nullable if admin credit
  reference_id: { type: mongoose.Schema.Types.ObjectId } // Polymorphic logic
}, { timestamps: true });

const commissionSchema = new mongoose.Schema({
  enquiry_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Enquiry', required: true },
  partner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true },
  deal_value: { type: Number, required: true }, // Whole rupees
  commission_rate: { type: Number, required: true }, // Percentage
  commission_amount: { type: Number, required: true }, // deal_value * (rate / 100) (Whole rupees)
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'paid', 'disputed', 'waived'],
    default: 'pending'
  },
  transaction_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }
}, { timestamps: true });

module.exports = {
  SubscriptionPlan: mongoose.model('SubscriptionPlan', subscriptionPlanSchema),
  Subscription: mongoose.model('Subscription', subscriptionSchema),
  RazorpayOrder: mongoose.model('RazorpayOrder', razorpayOrderSchema),
  Transaction: mongoose.model('Transaction', transactionSchema),
  Commission: mongoose.model('Commission', commissionSchema)
};
