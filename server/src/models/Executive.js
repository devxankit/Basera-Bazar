const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

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
    enum: ['executive'],
    default: 'executive'
  },
  is_active: {
    type: Boolean,
    default: true
  },
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
    default: [],
    validate: {
      validator: (arr) => arr.length <= 10,
      message: 'An executive cannot have more than 10 registered devices.'
    }
  },
  failed_login_attempts: { type: Number, default: 0 },
  lockout_until: { type: Date, default: null },
  salary: {
    base: { type: Number, default: 0 },
    effective: { type: Number, default: 0 },
    last_processed_month: { type: String, default: null }
  },
  team_leader_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TeamLeader',
    default: null
  }
}, { timestamps: true });

// Strip sensitive PII from all JSON responses
executiveSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    if (ret.kyc) {
      delete ret.kyc.aadhar_number;
      delete ret.kyc.pan_number;
    }
    if (ret.bank_details) {
      if (ret.bank_details.account_number) {
        ret.bank_details.account_number = 'XXXX' + ret.bank_details.account_number.slice(-4);
      }
    }
    return ret;
  }
});

executiveSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

executiveSchema.pre('save', async function () {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  // Generate a cryptographically secure referral code on approval
  if (!this.referral_code && this.onboarding_status !== 'incomplete') {
    let code;
    let attempts = 0;
    do {
      code = 'EX' + crypto.randomBytes(3).toString('hex').toUpperCase();
      attempts++;
    } while (
      attempts < 10 &&
      (await this.constructor.exists({ referral_code: code, _id: { $ne: this._id } }))
    );

    if (attempts >= 10) {
      throw new Error('Failed to generate a unique referral code. Please try again.');
    }

    this.referral_code = code;
  }
});

executiveSchema.index({ onboarding_status: 1, createdAt: -1 });

module.exports = mongoose.model('Executive', executiveSchema);
