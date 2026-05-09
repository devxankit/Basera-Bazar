const Executive = require('../models/Executive');
const { Partner } = require('../models/Partner');
const { Transaction } = require('../models/Finance');
const { Otp } = require('../models/User');
const { sendOTP } = require('../utils/sms');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { logActivity } = require('../utils/activityLogger');
const WithdrawalRequest = require('../models/Wallet');
const { AppConfig } = require('../models/System');
const invalidate = require('../utils/cacheInvalidator');

// Helper function to generate JWT
const generateToken = (id, role, email, version = 0) => {
  return jwt.sign({ id, role, email, version }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

/**
 * @desc    Step 1: Basic registration and OTP send
 * @route   POST /api/executive/register/step1
 */
exports.registerStep1 = async (req, res) => {
  try {
    let { name, email, phone, password } = req.body;
    // Normalize phone
    phone = phone.replace(/\s+/g, '').replace(/^\+91/, '').replace(/^91/, '').replace(/\D/g, '').slice(-10);

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // Check if exists
    const existing = await Executive.findOne({ $or: [{ email }, { phone }] });
    if (existing && existing.onboarding_status !== 'incomplete') {
      return res.status(400).json({ success: false, message: 'Executive already registered.' });
    }

    // Generate OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otpCode, salt);

    await Otp.deleteMany({ phone });
    await Otp.create({
      phone,
      otp_hash: otpHash,
      expires_at: new Date(Date.now() + 5 * 60 * 1000)
    });

    console.log(`[DEV] Bypass: Use 123456 for ${phone}`);
    // sendOTP(phone, otpCode); // Disabled for development

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully.'
    });
  } catch (error) {
    console.error('Executive Register Step 1 Error:', error);
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
};

/**
 * @desc    Verify OTP and create initial account
 * @route   POST /api/executive/register/verify
 */
exports.verifyRegistrationOtp = async (req, res) => {
  try {
    let { phone, otp, name, email, password } = req.body;
    // Normalize phone
    phone = phone.replace(/\s+/g, '').replace(/^\+91/, '').replace(/^91/, '').replace(/\D/g, '').slice(-10);

    const otpRecord = await Otp.findOne({ phone }).sort({ createdAt: -1 });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'OTP expired or not found.' });
    }

    // Check for mock OTP in development
    const isMockOtp = otp.toString() === '123456';
    const isMatch = isMockOtp || await bcrypt.compare(otp.toString(), otpRecord.otp_hash);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }

    await Otp.deleteOne({ _id: otpRecord._id });

    // Unified lookup to avoid duplicate key errors
    let executive = await Executive.findOne({ $or: [{ phone }, { email }] });
    
    if (executive) {
      executive.name = name;
      executive.email = email;
      executive.phone = phone;
      executive.password = password; // Hashing handled by model pre-save hook
      await executive.save();
    } else {
      executive = await Executive.create({
        name,
        email,
        phone,
        password, // Hashing handled by model pre-save hook
        onboarding_status: 'incomplete'
      });
    }

    const token = generateToken(executive._id, 'executive', executive.email, executive.token_version || 0);

    res.status(200).json({
      success: true,
      token,
      executive: {
        id: executive._id,
        name: executive.name,
        role: 'executive',
        onboarding_status: executive.onboarding_status
      }
    });
  } catch (error) {
    console.error('Executive OTP Verify Error:', error);
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
};

/**
 * @desc    Step 2: Update Bank & Address Details
 * @route   PUT /api/executive/register/step2
 */
exports.updateStep2 = async (req, res) => {
  try {
    const { address, bank_details } = req.body;
    
    // Attempt to find executive by various ID fields from req.user
    const userId = req.user?._id || req.user?.id;
    let executive;

    if (userId) {
      executive = await Executive.findById(userId);
    }

    // Fallback: Try finding by phone
    if (!executive && req.user?.phone) {
      executive = await Executive.findOne({ phone: req.user.phone });
    }

    // SELF-HEALING: If still not found, create a skeleton record to avoid blocking the user
    if (!executive && userId) {
      console.log('Self-healing: Creating missing executive record for ID:', userId);
      executive = new Executive({
        _id: userId,
        name: req.user?.name || 'Executive User',
        email: req.user?.email || 'pending@baserabazar.com',
        phone: req.user?.phone || '0000000000',
        password: 'dummy_password_to_be_reset', // This is safe because they are already authenticated via OTP
        onboarding_status: 'incomplete'
      });
      // We don't save yet, we let the updates below apply first
    }

    if (!executive) {
      return res.status(401).json({ success: false, message: 'Identification failed. Please verify your OTP again.' });
    }

    executive.address = address;
    executive.bank_details = bank_details;
    await executive.save();

    await invalidate.executiveProfile(req.user.id);
    await invalidate.adminDashboard();

    res.status(200).json({
      success: true,
      message: 'Step 2 completed. Please proceed to KYC.',
      data: executive
    });
  } catch (error) {
    console.error('Executive Step 2 Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Step 3: KYC Details & Final Submission
 * @route   PUT /api/executive/register/step3
 */
exports.updateStep3 = async (req, res) => {
  try {
    const { kyc } = req.body;
    const userId = req.user?._id || req.user?.id;
    let executive;

    if (userId) {
      executive = await Executive.findById(userId);
    }

    if (!executive && req.user?.phone) {
      executive = await Executive.findOne({ phone: req.user.phone });
    }

    // SELF-HEALING: Re-create if missing even at this late stage
    if (!executive && userId) {
      executive = new Executive({
        _id: userId,
        name: req.user?.name || 'Executive User',
        email: req.user?.email || 'pending@baserabazar.com',
        phone: req.user?.phone || '0000000000',
        password: 'dummy_password_to_be_reset',
        onboarding_status: 'incomplete'
      });
    }

    if (!executive) {
      return res.status(401).json({ success: false, message: 'Identification failed. Please verify your OTP again.' });
    }

    // Final Save
    try {
      executive.kyc = kyc;
      executive.onboarding_status = 'pending';
      await executive.save();
    } catch (saveError) {
      console.error('Executive Final Save Error:', saveError);
      return res.status(400).json({ 
        success: false, 
        message: `Failed to save KYC: ${saveError.message || 'Database error'}` 
      });
    }

    // Failsafe Logging - Never let a log failure break the registration
    try {
      logActivity({
        actor_name: executive.name,
        actor_id: executive._id,
        action: 'submitted_onboarding',
        entity_type: 'executive',
        entity_name: executive.name,
        entity_id: executive._id,
        description: `Executive ${executive.name} submitted onboarding documents.`
      });
    } catch (logError) {
      console.warn('Non-critical: Activity log failed for executive submission:', logError.message);
    }

    res.status(200).json({
      success: true,
      message: 'Registration submitted for verification.',
      executive
    });
  } catch (error) {
    console.error('Executive Step 3 Error:', error);
    res.status(500).json({ success: false, message: 'Server error during document submission.' });
  }
};

/**
 * @desc    Executive Login
 * @route   POST /api/executive/login
 */
exports.login = async (req, res) => {
  try {
    let { phone, password } = req.body;
    // Normalize phone (strip prefix and spaces)
    phone = phone.replace(/\s+/g, '').replace(/^\+91/, '').replace(/^91/, '').replace(/\D/g, '').slice(-10);
    
    console.log(`[LOGIN DEBUG] Attempting login for normalized phone: "${phone}"`);
    
    // Check for duplicates
    const allExecs = await Executive.find({ phone });
    console.log(`[LOGIN DEBUG] Found ${allExecs.length} executives with phone ${phone}`);
    if (allExecs.length > 0) {
       allExecs.forEach((ex, i) => console.log(`  Exec ${i+1}: _id=${ex._id}, is_active=${ex.is_active}, name=${ex.name}`));
    }

    // Find the executive, if duplicates exist, prefer the active one
    const executive = await Executive.findOne({ phone }).sort({ is_active: -1, createdAt: -1 });

    if (!executive) {
      console.log(`[LOGIN DEBUG] No executive found for phone: "${phone}"`);
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    console.log(`[LOGIN DEBUG] Executive found: ${executive.name} (${executive._id})`);
    
    const isMatch = await executive.matchPassword(password);
    console.log(`[LOGIN DEBUG] Password match result: ${isMatch}`);
    
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Block deactivated executives - only block when EXPLICITLY set to false
    // null/undefined means field was never set → treat as active (schema default: true)
    console.log(`[LOGIN DEBUG] is_active raw value: ${JSON.stringify(executive.is_active)} | type: ${typeof executive.is_active}`);
    
    if (executive.is_active === false) {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_INACTIVE',
        message: 'Your account is deactivated. Please contact the administrator.'
      });
    }
    
    // If is_active is null/undefined (corrupted by old bug), heal it back to true
    if (executive.is_active == null) {
      console.log(`[LOGIN DEBUG] Healing corrupted is_active field for ${executive._id}`);
      await Executive.findByIdAndUpdate(executive._id, { $set: { is_active: true } });
    }

    const token = generateToken(executive._id, 'executive', executive.email, executive.token_version);

    res.status(200).json({
      success: true,
      token,
      executive: {
        id: executive._id,
        name: executive.name,
        email: executive.email,
        phone: executive.phone,
        role: executive.role || 'executive',
        onboarding_status: executive.onboarding_status,
        is_active: executive.is_active,
        referral_code: executive.referral_code,
        wallet_balance: executive.wallet_balance
      }
    });
  } catch (error) {
    console.error('Executive Login Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Get Executive Dashboard
 * @route   GET /api/executive/dashboard
 */
exports.getDashboard = async (req, res) => {
  try {
    const executive = await Executive.findById(req.user.id);
    if (!executive) {
      return res.status(404).json({ success: false, message: 'Executive not found.' });
    }

    // Calculate Stats
    const allPartners = await Partner.find({ referral_code_used: executive.referral_code });
    const totalSellers = allPartners.length;
    const pendingVerify = allPartners.filter(p => p.onboarding_status === 'pending_approval' || p.kyc?.status === 'pending').length;
    
    // For "Paid Sellers" and "Commissioned", we check if they have a non-trial active subscription
    const paidSellers = await Partner.countDocuments({
      referral_code_used: executive.referral_code,
      active_subscription_id: { $ne: null }
    });
    
    // Fetch Dynamic Commission Setting
    const commissionSetting = await AppConfig.findOne({ key: 'executive_commission_amount' });
    const commissionAmount = commissionSetting ? commissionSetting.value : 100;

    res.status(200).json({
      success: true,
      data: {
        profile: {
          name: executive.name,
          phone: executive.phone,
          email: executive.email,
          referral_code: executive.referral_code,
          onboarding_status: executive.onboarding_status,
          is_active: executive.is_active,
          wallet_balance: executive.wallet_balance,
          total_earnings: executive.total_earnings,
          approved_at: executive.approved_at,
          kyc: executive.kyc,
          bank_details: executive.bank_details,
          address: executive.address
        },
        stats: {
          totalSellers,
          pendingVerify,
          paidSellers,
          commissioned: paidSellers // Currently 1:1 payout on first subscription
        },
        settings: {
          referral_commission: commissionAmount
        }
      }
    });
  } catch (error) {
    console.error('Executive Dashboard Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Get My Onboarded Partners
 * @route   GET /api/executive/my-partners
 */
exports.getMyPartners = async (req, res) => {
  try {
    const executive = await Executive.findById(req.user.id);
    const partners = await Partner.find({ referral_code_used: executive.referral_code })
      .select('name business_name phone onboarding_status createdAt active_subscription_id')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: partners });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Get My Earnings Transactions
 * @route   GET /api/executive/transactions
 */
exports.getMyTransactions = async (req, res) => {
  try {
    const [transactions, withdrawals] = await Promise.all([
      Transaction.find({ executive_id: req.user.id }).sort({ createdAt: -1 }),
      WithdrawalRequest.find({ user_id: req.user.id, user_type: 'Executive' }).sort({ createdAt: -1 })
    ]);

    // Format withdrawals to match transaction list UI
    const formattedWithdrawals = withdrawals.map(w => ({
      _id: w._id,
      amount: w.amount,
      type: 'executive_withdrawal',
      direction: 'debit',
      status: w.status === 'approved' || w.status === 'completed' ? 'success' : w.status,
      createdAt: w.createdAt,
      is_withdrawal: true
    }));

    // Merge and sort
    const allActivity = [...transactions, ...formattedWithdrawals].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.status(200).json({ success: true, data: allActivity });
  } catch (error) {
    console.error('Fetch Transactions Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Withdrawal Request
 * @route   POST /api/executive/withdraw
 */
exports.requestWithdrawal = async (req, res) => {
  try {
    const { amount } = req.body;
    const executive = await Executive.findById(req.user.id);

    if (!executive) {
      return res.status(404).json({ success: false, message: 'Executive not found.' });
    }

    if (amount > executive.wallet_balance) {
      return res.status(400).json({ success: false, message: 'Insufficient balance.' });
    }

    const withdrawal = await WithdrawalRequest.create({
      user_id: executive._id,
      user_type: 'Executive',
      amount,
      bank_details: executive.bank_details
    });

    executive.wallet_balance -= amount;
    await executive.save();

    await invalidate.executiveProfile(req.user.id);
    await invalidate.adminDashboard();

    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully.',
      data: withdrawal
    });
  } catch (error) {
    console.error('Executive Withdrawal Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
/**
 * @desc    Update Executive Profile
 * @route   PUT /api/executive/profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const executive = await Executive.findById(req.user.id);

    if (!executive) {
      return res.status(404).json({ success: false, message: 'Executive not found.' });
    }

    if (name) executive.name = name;
    if (email) executive.email = email;

    await executive.save();

    await invalidate.executiveProfile(req.user.id);
    await invalidate.adminDashboard();

    res.status(200).json({
      success: true,
      message: 'KYC documents uploaded successfully. Profile under review.',
      data: {
        id: executive._id,
        name: executive.name,
        email: executive.email,
        phone: executive.phone,
        onboarding_status: executive.onboarding_status
      }
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ success: false, message: 'Server error during profile update.' });
  }
};

/**
 * @desc    Update Bank Details
 * @route   PUT /api/executive/bank-details
 */
exports.updateBankDetails = async (req, res) => {
  try {
    const { account_number, ifsc_code, bank_name, account_holder_name } = req.body;
    const executive = await Executive.findById(req.user.id);

    if (!executive) {
      return res.status(404).json({ success: false, message: 'Executive not found.' });
    }

    executive.bank_details = {
      account_number: account_number || executive.bank_details?.account_number,
      ifsc_code: ifsc_code || executive.bank_details?.ifsc_code,
      bank_name: bank_name || executive.bank_details?.bank_name,
      account_holder_name: account_holder_name || executive.bank_details?.account_holder_name,
    };

    await executive.save();

    await invalidate.executiveProfile(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Bank details updated successfully.',
      bank_details: executive.bank_details
    });
  } catch (error) {
    console.error('Update Bank Details Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
