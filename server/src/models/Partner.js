const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const pointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    required: true,
    default: 'Point'
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: true
  }
}, { _id: false });

const partnerProfileSchema = new mongoose.Schema({
  // Embedded schema for profile flexibility based on partner_type
  service_profile: {
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    portfolio: [String],
    certifications: [String],
    avg_rating: { type: Number, default: 0 }
  },
  property_profile: {
    rera_number: { type: String },
    agency_name: { type: String },
    avg_rating: { type: Number, default: 0 }
  },
  supplier_profile: {
    material_categories: [String],
    delivery_radius_km: { type: Number },
    avg_rating: { type: Number, default: 0 }
  },
  mandi_profile: {
    material_types: [String],
    commission_rate: { type: Number } // Percentage set by admin
  }
}, { _id: false });

const partnerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: null
  },
  partner_type: {
    type: String,
    enum: ['service_provider', 'property_agent', 'supplier', 'mandi_seller'],
    required: true
  },
  unique_seller_id: {
    type: String,
    sparse: true,
    unique: true
  },
  kyc: {
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    id_type: { type: String },
    id_number: { type: String },
    id_front_url: { type: String },
    id_back_url: { type: String },
    reviewed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' }
  },
  onboarding_status: {
    type: String,
    enum: ['incomplete', 'pending_approval', 'approved', 'rejected', 'suspended'],
    default: 'incomplete'
  },
  location: {
    type: pointSchema,
    required: false
  },
  active_subscription_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    default: null
  },
  free_credits: {
    total: { type: Number, default: 0 },
    used: { type: Number, default: 0 },
    expires_at: { type: Date }
  },
  password: {
    type: String,
    default: null
  },
  profile: {
    type: partnerProfileSchema,
    default: {}
  },
  deleted_at: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// Add method to compare password
partnerSchema.methods.matchPassword = async function(enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// Hash password before saving
partnerSchema.pre('save', async function() {
  if (!this.isModified('password') || !this.password) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Indexes
partnerSchema.index({ location: '2dsphere' });
// phone and unique_seller_id unique indexes are handled by field definitions

module.exports = {
  Partner: mongoose.model('Partner', partnerSchema)
};
