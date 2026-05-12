const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ─── Team Leader (State Head) ────────────────────────────────────────────────

const teamLeaderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['team_leader'], default: 'team_leader' },
    state: { type: String, required: true, trim: true },
    district: { type: String, trim: true },
    zone: { type: String, trim: true },
    fixed_salary: { type: Number, min: 25000, max: 50000, default: 25000 },
    commission_rate: { type: Number, min: 0, max: 20, default: 5 },
    onboarding_status: {
      type: String,
      enum: ['incomplete', 'pending_approval', 'approved', 'rejected', 'suspended'],
      default: 'incomplete',
    },
    kyc: {
      aadhar_number: { type: String },
      aadhar_image: { type: String },
      pan_number: { type: String },
      pan_image: { type: String },
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
      rejection_reason: { type: String },
    },
    bank_details: {
      account_number: { type: String },
      ifsc_code: { type: String },
      bank_name: { type: String },
      account_holder_name: { type: String },
    },
    address: {
      address_line: { type: String },
      city: { type: String },
      state: { type: String },
      pincode: { type: String },
    },
    profile_image: { type: String },
    wallet_balance: { type: Number, default: 0 },
    total_commission_earned: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true },
    token_version: { type: Number, default: 0 },
    fcmTokens: { type: [String], default: [] },
    failed_login_attempts: { type: Number, default: 0 },
    lockout_until: { type: Date },
    deactivated_at: { type: Date },
    deactivation_reason: { type: String },
  },
  { timestamps: true }
);

teamLeaderSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

teamLeaderSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

teamLeaderSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.password;
    if (ret.kyc) {
      delete ret.kyc.aadhar_number;
      delete ret.kyc.pan_number;
    }
    if (ret.bank_details) delete ret.bank_details.account_number;
    return ret;
  },
});

teamLeaderSchema.index({ state: 1, is_active: 1 });

// ─── Office Staff (Calling) ──────────────────────────────────────────────────

const officeStaffSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['office_staff'], default: 'office_staff' },
    team_leader_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TeamLeader', required: true },
    fixed_salary: { type: Number, min: 8000, max: 15000, default: 8000 },
    calling_specialization: {
      type: String,
      enum: ['lead_generation', 'follow_up', 'customer_support', 'data_update'],
      default: 'lead_generation',
    },
    onboarding_status: {
      type: String,
      enum: ['incomplete', 'pending_approval', 'approved', 'rejected', 'suspended'],
      default: 'incomplete',
    },
    kyc: {
      aadhar_number: { type: String },
      aadhar_image: { type: String },
      pan_number: { type: String },
      pan_image: { type: String },
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
      rejection_reason: { type: String },
    },
    bank_details: {
      account_number: { type: String },
      ifsc_code: { type: String },
      bank_name: { type: String },
      account_holder_name: { type: String },
    },
    address: {
      address_line: { type: String },
      city: { type: String },
      state: { type: String },
      pincode: { type: String },
    },
    profile_image: { type: String },
    wallet_balance: { type: Number, default: 0 },
    total_incentive_earned: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true },
    token_version: { type: Number, default: 0 },
    fcmTokens: { type: [String], default: [] },
    failed_login_attempts: { type: Number, default: 0 },
    lockout_until: { type: Date },
    deactivated_at: { type: Date },
    deactivation_reason: { type: String },
  },
  { timestamps: true }
);

officeStaffSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

officeStaffSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

officeStaffSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.password;
    if (ret.kyc) {
      delete ret.kyc.aadhar_number;
      delete ret.kyc.pan_number;
    }
    if (ret.bank_details) delete ret.bank_details.account_number;
    return ret;
  },
});

officeStaffSchema.index({ team_leader_id: 1, is_active: 1 });

const TeamLeader = mongoose.model('TeamLeader', teamLeaderSchema);
const OfficeStaff = mongoose.model('OfficeStaff', officeStaffSchema);

module.exports = { TeamLeader, OfficeStaff };
