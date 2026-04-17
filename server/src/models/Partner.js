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
    commission_rate: { type: Number }, // Expected to be deprecated
    business_name: { type: String },
    business_logo: { type: String },
    business_description: { type: String },
    penalty_due: { type: Number, default: 0 } // Log due amount if they cancel an order
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
  role: {
    type: String,
    enum: ['Agent', 'Supplier', 'Service Provider'],
    required: false
  },
  state: { type: String, trim: true },
  city: { type: String, trim: true },
  district: { type: String, trim: true },
  address: { type: String, trim: true },
  pincode: { type: String, trim: true },
  unique_seller_id: {
    type: String,
    sparse: true,
    unique: true
  },
  kyc: {
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    id_type: { type: String },
    id_number: { type: String }, // Generic ID (legacy)
    
    // New Detailed KYC
    pan_number: { type: String },
    pan_image: { type: String },
    aadhar_number: { type: String },
    aadhar_front_image: { type: String },
    aadhar_back_image: { type: String },
    gst_number: { type: String },
    gst_image: { type: String },

    reviewed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
    reviewed_at: { type: Date }
  },
  onboarding_status: {
    type: String,
    enum: ['incomplete', 'pending_approval', 'approved', 'rejected', 'suspended'],
    default: 'incomplete'
  },
  location: {
    type: pointSchema,
    required: true
  },
  service_radius_km: {
    type: Number,
    required: true,
    default: 100
  },
  active_subscription_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    default: null
  },
  is_active: {
    type: Boolean,
    default: true
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
  },
  token_version: {
    type: Number,
    default: 0
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
