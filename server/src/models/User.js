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
  },
  city: { type: String },
  state: { type: String },
  pincode: { type: String },
  label: { type: String } // e.g., 'Home', 'Work' for saved_locations
}, { _id: false });

const userSchema = new mongoose.Schema({
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
  default_location: {
    type: pointSchema,
    default: null
  },
  saved_locations: [pointSchema],
  is_active: {
    type: Boolean,
    default: true
  },
  is_blocked: {
    type: Boolean,
    default: false
  },
  fcm_token: {
    type: String,
    default: null
  },
  password: {
    type: String,
    default: null // Optional for OTP-only users
  },
  role: {
    type: String,
    enum: ['Customer', 'Admin', 'Agent', 'Supplier', 'Service Provider', 'user', 'super_admin'],
    default: 'Customer'
  },
  rating: {
    type: Number,
    default: 0
  },
  last_login: {
    type: Date,
    default: null
  },
  deleted_at: {
    type: Date,
    default: null
  },
  token_version: {
    type: Number,
    default: 0
  },
  active_subscription_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    default: null
  }
}, { timestamps: true });

// Add method to compare password
userSchema.methods.matchPassword = async function(enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password') || !this.password) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Indexes
userSchema.index({ default_location: '2dsphere' });
// phone unique index is handled by field definition

const otpSchema = new mongoose.Schema({
  otp_hash: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  expires_at: {
    type: Date,
    required: true,
    index: { expires: 0 } // TTL index
  }
}, { timestamps: true });

module.exports = {
  User: mongoose.model('User', userSchema),
  Otp: mongoose.model('Otp', otpSchema)
};
