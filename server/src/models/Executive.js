const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const executiveSchema = new mongoose.Schema({
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
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  onboarding_status: {
    type: String,
    enum: ['incomplete', 'pending', 'pending_approval', 'approved', 'rejected', 'verified'],
    default: 'incomplete'
  },
  role: {
    type: String,
    default: 'executive'
  },
  is_active: {
    type: Boolean,
    default: true
  },
  // Step 2: Address & Bank Details
  address: {
    address_line: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String }
  },
  bank_details: {
    account_number: { type: String },
    ifsc_code: { type: String },
    bank_name: { type: String },
    account_holder_name: { type: String }
  },
  // Step 3: KYC Details
  kyc: {
    live_photo: { type: String },
    aadhar_number: { type: String },
    aadhar_image: { type: String },
    pan_number: { type: String },
    pan_image: { type: String },
    rejection_reason: { type: String }
  },
  referral_code: {
    type: String,
    unique: true,
    sparse: true
  },
  wallet_balance: {
    type: Number,
    default: 0
  },
  total_earnings: {
    type: Number,
    default: 0
  },
  token_version: {
    type: Number,
    default: 0
  },
  payout_rate: {
    type: Number,
    default: 100
  },
  deactivated_at: {
    type: Date
  },
  deactivation_reason: {
    type: String
  },
  approved_at: {
    type: Date
  },
  fcmTokens: {
    type: [String],
    default: []
  }
}, { timestamps: true });

// Add method to compare password
executiveSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Pre-save hook for password hashing and referral code generation
executiveSchema.pre('save', async function () {
  // Hash password
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  // Generate unique referral code if not present and approved/pending
  if (!this.referral_code && this.onboarding_status !== 'incomplete') {
    this.referral_code = 'EX' + Math.random().toString(36).substring(2, 8).toUpperCase();
  }
});

module.exports = mongoose.model('Executive', executiveSchema);
