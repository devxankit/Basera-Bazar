const Executive = require('../models/Executive');
const logger = require('../utils/logger');
const { Partner } = require('../models/Partner');
const { Transaction } = require('../models/Finance');
const { Otp } = require('../models/User');
const { sendOTP } = require('../utils/sms');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { logActivity } = require('../utils/activityLogger');
const { checkLockout, recordFailedAttempt, resetFailedAttempts } = require('../utils/loginLockout');
const { signAccessToken, signRefreshToken, setAuthCookies } = require('../utils/cookieAuth');
const WithdrawalRequest = require('../models/Wallet');
const { AppConfig } = require('../models/System');
const invalidate = require('../utils/cacheInvalidator');
const DailyTask = require('../models/DailyTask');
const SalaryRecord = require('../models/SalaryRecord');


// Helper function to generate JWT
const generateToken = (id, role, email, version = 0) => {
  return jwt.sign({ id, role, email, version }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

/**
 * @desc    Step 1: Basic registration and OTP send
 * @route   POST /api/executive/register/step1
 */
exports.registerStep1 = async (req, res) => {
  try {
    let { name, email, phone, password } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: 'Phone number is required.' });
    // Normalize phone
    phone = phone.replace(/\s+/g, '').replace(/^\+91/, '').replace(/\D/g, '').slice(-10);

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // Check if exists
    const existing = await Executive.findOne({ $or: [{ email }, { phone }] });
    if (existing && existing.onboarding_status !== 'incomplete') {
      return res.status(400).json({ success: false, message: 'Executive already registered.' });
    }

    // Cryptographically secure 6-digit OTP
    const otpCode = crypto.randomInt(100000, 1000000).toString();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otpCode, salt);

    await Otp.deleteMany({ phone });
    await Otp.create({
      phone,
      otp_hash: otpHash,
      expires_at: new Date(Date.now() + 5 * 60 * 1000)
    });

    if (process.env.NODE_ENV !== 'production') {
      logger.info(`[DEV] OTP for ${phone}: ${otpCode}`);
    }

    try {
      await sendOTP(phone, otpCode);
    } catch (smsErr) {
      if (process.env.NODE_ENV === 'development') {
        logger.warn(`[DEV] SMS failed — OTP for ${phone}: ${otpCode}`);
      } else {
        logger.error({ err: smsErr }, '[SMS] Failed to send executive OTP');
        return res.status(502).json({ success: false, message: 'Failed to send OTP. Please try again.' });
      }
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully.'
    });
  } catch (error) {
    logger.error({ err: error }, 'Executive Register Step 1 Error:')
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Verify OTP — returns a short-lived phone_verified_token; no DB write
 * @route   POST /api/executive/register/verify
 */
exports.verifyRegistrationOtp = async (req, res) => {
  try {
    let { phone, otp } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: 'Phone number is required.' });
    phone = phone.replace(/\s+/g, '').replace(/^\+91/, '').replace(/\D/g, '').slice(-10);

    const otpRecord = await Otp.findOne({ phone }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'OTP expired or not found.' });
    }
    if (otpRecord.expires_at && otpRecord.expires_at < new Date()) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ success: false, message: 'OTP expired. Please request a new one.' });
    }
    const isMatch = await bcrypt.compare(otp.toString(), otpRecord.otp_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }

    await Otp.deleteOne({ _id: otpRecord._id });

    // Return a short-lived token — no DB write yet
    const phoneVerifiedToken = jwt.sign(
      { phone, type: 'exec_phone_verified' },
      process.env.JWT_SECRET,
      { expiresIn: '30m' }
    );

    res.status(200).json({ success: true, phone_verified_token: phoneVerifiedToken });
  } catch (error) {
    logger.error({ err: error }, 'Executive OTP Verify Error:');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Create executive account (deferred write — after OTP verified)
 * @route   POST /api/executive/register/create
 */
exports.createExecutive = async (req, res) => {
  try {
    const { phone_verified_token, name, email, password, address, bank_details } = req.body;

    if (!phone_verified_token) {
      return res.status(400).json({ success: false, message: 'Phone verification token is required.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(phone_verified_token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'Phone verification expired. Please restart registration.' });
    }

    if (decoded.type !== 'exec_phone_verified') {
      return res.status(401).json({ success: false, message: 'Invalid verification token.' });
    }

    const phone = decoded.phone;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    // Check for conflicts with fully registered executives
    const conflict = await Executive.findOne({
      $or: [{ phone }, { email }],
      onboarding_status: { $ne: 'incomplete' }
    });
    if (conflict) {
      return res.status(409).json({ success: false, message: 'An executive account already exists with this phone or email.' });
    }

    // Upsert: update incomplete record or create fresh
    let executive = await Executive.findOne({ $or: [{ phone }, { email }] });
    if (executive) {
      executive.name = name;
      executive.email = email;
      executive.phone = phone;
      executive.password = password;
      if (address) executive.address = address;
      if (bank_details) executive.bank_details = bank_details;
      await executive.save();
    } else {
      executive = await Executive.create({
        name, email, phone, password,
        address: address || undefined,
        bank_details: bank_details || undefined,
        onboarding_status: 'incomplete',
      });
    }

    const accessToken = signAccessToken(executive._id, 'executive', executive.email, executive.token_version || 0);
    const refreshTokenVal = signRefreshToken(executive._id, 'executive', executive.token_version || 0);
    setAuthCookies(res, accessToken, refreshTokenVal);

    res.status(201).json({
      success: true,
      token: accessToken,
      executive: {
        id: executive._id,
        name: executive.name,
        email: executive.email,
        phone: executive.phone,
        role: 'executive',
        onboarding_status: executive.onboarding_status,
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Executive Create Error:');
    res.status(500).json({ success: false, message: 'Server error.' });
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

    if (!executive) {
      return res.status(404).json({ success: false, message: 'Registration session not found. Please start registration again.' });
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
    logger.error({ err: error }, 'Executive Step 2 Error:')
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

    if (!executive) {
      return res.status(404).json({ success: false, message: 'Registration session not found. Please start registration again.' });
    }

    // Final Save
    try {
      executive.kyc = kyc;
      executive.onboarding_status = 'pending';
      await executive.save();
      await invalidate.executiveProfile(req.user.id);
      await invalidate.adminDashboard();
    } catch (saveError) {
      logger.error({ err: saveError }, 'Executive Final Save Error:')
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
      logger.warn({ err: logError }, 'Non-critical: Activity log failed for executive submission')
    }

    res.status(200).json({
      success: true,
      message: 'Registration submitted for verification.',
      executive
    });
  } catch (error) {
    logger.error({ err: error }, 'Executive Step 3 Error:')
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
    if (!phone) return res.status(400).json({ success: false, message: 'Phone number is required.' });
    // Normalize phone (strip prefix and spaces)
    phone = phone.replace(/\s+/g, '').replace(/^\+91/, '').replace(/\D/g, '').slice(-10);

    // Find the executive; if duplicates exist (data issue), prefer the active one
    const executive = await Executive.findOne({ phone }).sort({ is_active: -1, createdAt: -1 });

    if (!executive) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    if (executive.is_active === false) {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_INACTIVE',
        message: 'Your account is deactivated. Please contact the administrator.'
      });
    }

    const lockout = checkLockout(executive);
    if (lockout.locked) {
      const mins = Math.ceil((lockout.retryAfter - Date.now()) / 60000);
      return res.status(429).json({
        success: false,
        code: 'ACCOUNT_LOCKED',
        message: `Too many failed attempts. Account locked for ${mins} more minute(s).`
      });
    }

    const isMatch = await executive.matchPassword(password);
    if (!isMatch) {
      await recordFailedAttempt(Executive, executive._id);
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    await resetFailedAttempts(Executive, executive._id);

    if (executive.is_active == null) {
      await Executive.findByIdAndUpdate(executive._id, { $set: { is_active: true } });
    }

    const accessToken  = signAccessToken(executive._id, 'executive', executive.email, executive.token_version);
    const refreshTokenVal = signRefreshToken(executive._id, 'executive', executive.token_version);
    setAuthCookies(res, accessToken, refreshTokenVal);

    res.status(200).json({
      success: true,
      token: accessToken, // kept for localStorage fallback on older clients
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
    logger.error({ err: error }, 'Executive Login Error:')
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
    const allPartners = await Partner.find({ referral_code_used: executive.referral_code })
      .select('onboarding_status kyc active_subscription_id')
      .limit(1000);
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

    // Fetch today's DailyTask
    const now = new Date();
    const todayStr = new Date(now.getTime() + 5.5 * 60 * 60 * 1000).toISOString().split('T')[0];
    const dailyTaskDoc = await DailyTask.findOne({ date: todayStr }).lean();
    
    let daily_task = { exists: false, status: 'no_task' };
    if (dailyTaskDoc) {
      const dayStart = new Date(`${todayStr}T00:00:00.000Z`);
      const dayEnd = new Date(`${todayStr}T23:59:59.999Z`);
      const completed = executive.referral_code ? await Partner.countDocuments({
        referral_code_used: executive.referral_code,
        createdAt: { $gte: dayStart, $lte: dayEnd }
      }) : 0;
      
      const percentage = dailyTaskDoc.target_count > 0 ? Math.round((completed / dailyTaskDoc.target_count) * 100) : 0;
      let status = 'at_risk';
      if (percentage >= 50) status = 'on_track';
      else if (percentage >= 25) status = 'in_progress';
      
      daily_task = {
        exists: true,
        date: todayStr,
        target_count: dailyTaskDoc.target_count,
        description: dailyTaskDoc.description,
        completed,
        percentage,
        status
      };
    }

    // Fetch Last Month's Salary Record
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStr = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
    const lastMonthRecord = await SalaryRecord.findOne({ executive_id: executive._id, month: lastMonthStr }).lean();

    const salary = {
      effective: executive.salary?.effective || executive.salary?.base || 0,
      last_month: lastMonthRecord ? {
        month: lastMonthRecord.month,
        completion_rate: lastMonthRecord.completion_rate,
        deduction_applied: lastMonthRecord.deduction_applied,
        deduction_amount: lastMonthRecord.deduction_amount
      } : null
    };

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
          commissioned: paidSellers
        },
        settings: {
          referral_commission: commissionAmount
        },
        daily_task,
        salary
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Executive Dashboard Error:')
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
    if (!executive) {
      return res.status(404).json({ success: false, message: 'Executive not found.' });
    }

    if (!executive.referral_code) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Find all partners referred by this executive OR currently assigned to them
    const { Subscription } = require('../models/Finance');
    const partners = await Partner.find({
      $or: [
        { referral_code_used: executive.referral_code },
        { assigned_executive: executive._id }
      ]
    })
      .select('name business_name phone onboarding_status createdAt active_subscription_id address city state roles partner_type referred_by_executive assigned_executive')
      .sort({ createdAt: -1 })
      .lean();

    // Enrich each partner with subscription details
    const enriched = await Promise.all(partners.map(async (p) => {
      let subscription = null;
      if (p.active_subscription_id) {
        subscription = await Subscription.findById(p.active_subscription_id)
          .select('plan_snapshot status starts_at ends_at')
          .lean();
      }
      return { ...p, subscription };
    }));

    res.status(200).json({ success: true, data: enriched });
  } catch (error) {
    logger.error({ err: error }, 'getMyPartners Error:')
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Get Full Details of a Single Onboarded Partner
 * @route   GET /api/executive/my-partners/:partnerId
 */
exports.getMyPartnerDetail = async (req, res) => {
  try {
    const executive = await Executive.findById(req.user.id);
    if (!executive) return res.status(404).json({ success: false, message: 'Executive not found.' });

    const { Subscription } = require('../models/Finance');
    const partner = await Partner.findOne({
      _id: req.params.partnerId,
      $or: [
        { referral_code_used: executive.referral_code },
        { assigned_executive: executive._id }
      ]
    })
      .select('-password -fcmTokens -fcmTokenMobile -token_version -failed_login_attempts -lockout_until')
      .lean();

    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found or not in your network.' });
    }

    let subscription = null;
    if (partner.active_subscription_id) {
      subscription = await Subscription.findById(partner.active_subscription_id)
        .select('plan_snapshot status starts_at ends_at')
        .lean();
    }

    // Fetch all subscription history for this partner
    const subscriptionHistory = await Subscription.find({ partner_id: partner._id })
      .select('plan_snapshot status starts_at ends_at')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.status(200).json({
      success: true,
      data: { ...partner, subscription, subscriptionHistory }
    });
  } catch (error) {
    logger.error({ err: error }, 'getMyPartnerDetail Error:')
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
    logger.error({ err: error }, 'Fetch Transactions Error:')
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Withdrawal Request
 * @route   POST /api/executive/withdraw
 */
exports.requestWithdrawal = async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    if (!amount || amount <= 0 || !Number.isFinite(amount)) {
      return res.status(400).json({ success: false, message: 'Withdrawal amount must be a positive number.' });
    }

    // Atomic debit: only succeeds if balance is sufficient, preventing race conditions
    const executive = await Executive.findOneAndUpdate(
      { _id: req.user.id, wallet_balance: { $gte: amount } },
      { $inc: { wallet_balance: -amount } },
      { new: true }
    );

    if (!executive) {
      // Either executive not found or insufficient balance
      const exists = await Executive.exists({ _id: req.user.id });
      if (!exists) {
        return res.status(404).json({ success: false, message: 'Executive not found.' });
      }
      return res.status(400).json({ success: false, message: 'Insufficient balance.' });
    }

    if (!executive.bank_details?.account_number) {
      // Undo the debit if bank details are missing
      await Executive.findByIdAndUpdate(req.user.id, { $inc: { wallet_balance: amount } });
      return res.status(400).json({ success: false, message: 'Please add bank details before requesting a withdrawal.' });
    }

    let withdrawal;
    try {
      withdrawal = await WithdrawalRequest.create({
        user_id: executive._id,
        user_type: 'Executive',
        amount,
        bank_details: executive.bank_details
      });
    } catch (createErr) {
      logger.error({ err: createErr, executiveId: req.user.id, amount }, 'Withdrawal record creation failed — restoring balance');
      await Executive.findByIdAndUpdate(req.user.id, { $inc: { wallet_balance: amount } });
      return res.status(500).json({ success: false, message: 'Error processing withdrawal request. Please try again.' });
    }

    await invalidate.executiveProfile(req.user.id);
    await invalidate.adminDashboard();

    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully.',
      data: withdrawal
    });
  } catch (error) {
    logger.error({ err: error }, 'Executive Withdrawal Error:')
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
      message: 'Profile updated successfully.',
      data: {
        id: executive._id,
        name: executive.name,
        email: executive.email,
        phone: executive.phone,
        onboarding_status: executive.onboarding_status
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Update Profile Error:')
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
    logger.error({ err: error }, 'Update Bank Details Error:')
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Get My Daily Task History
 * @route   GET /api/executive/task-history
 */
exports.getMyTaskHistory = async (req, res) => {
  try {
    const executive = await Executive.findById(req.user.id);
    if (!executive) {
      return res.status(404).json({ success: false, message: 'Executive not found.' });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const [total, tasks, currentMonthTasks] = await Promise.all([
      DailyTask.countDocuments(),
      DailyTask.find().sort({ date: -1 }).skip(skip).limit(limit).lean(),
      DailyTask.find({
        date: { $gte: `${currentMonthStr}-01`, $lte: `${currentMonthStr}-31` }
      }).lean()
    ]);

    if (!executive.referral_code) {
      // No referral code — all completed counts are 0, skip DB queries entirely
      const history = tasks.map((task) => ({
        date: task.date,
        target_count: task.target_count,
        description: task.description,
        completed: 0,
        percentage: 0,
        met: false
      }));

      return res.status(200).json({
        success: true,
        summary: {
          month: currentMonthStr,
          average_completion: 0,
          days_met: 0,
          total_days: currentMonthTasks.length
        },
        data: history,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      });
    }

    // Collect all unique dates we need counts for (paginated tasks + current-month tasks)
    const pagedDates = tasks.map(t => t.date);
    const monthDates = currentMonthTasks.map(t => t.date);
    const allDates = [...new Set([...pagedDates, ...monthDates])].sort();

    // Single aggregation: count partners per day for this executive across all needed dates
    const rangeStart = new Date(`${allDates[0]}T00:00:00.000Z`);
    const rangeEnd = new Date(`${allDates[allDates.length - 1]}T23:59:59.999Z`);

    const partnerCounts = await Partner.aggregate([
      {
        $match: {
          referral_code_used: executive.referral_code,
          createdAt: { $gte: rangeStart, $lte: rangeEnd }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      }
    ]);

    // Build lookup map: countMap[date] = count
    const countMap = {};
    partnerCounts.forEach(pc => { countMap[pc._id] = pc.count; });

    const history = tasks.map((task) => {
      const completed = countMap[task.date] || 0;
      const percentage = task.target_count > 0 ? Math.round((completed / task.target_count) * 100) : 0;
      const met = percentage >= 50;
      return {
        date: task.date,
        target_count: task.target_count,
        description: task.description,
        completed,
        percentage,
        met
      };
    });

    let currentMonthMetDays = 0;
    for (const t of currentMonthTasks) {
      const cnt = countMap[t.date] || 0;
      if (t.target_count > 0 && cnt / t.target_count >= 0.5) {
        currentMonthMetDays++;
      }
    }

    const currentMonthAvg = currentMonthTasks.length > 0 ? Math.round((currentMonthMetDays / currentMonthTasks.length) * 100) : 0;

    res.status(200).json({
      success: true,
      summary: {
        month: currentMonthStr,
        average_completion: currentMonthAvg,
        days_met: currentMonthMetDays,
        total_days: currentMonthTasks.length
      },
      data: history,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    logger.error({ err: error }, 'getMyTaskHistory Error:');
    res.status(500).json({ success: false, message: 'Server error fetching task history.' });
  }
};

/**
 * @desc    Get My Salary Details
 * @route   GET /api/executive/salary
 */
exports.getMySalary = async (req, res) => {
  try {
    const executive = await Executive.findById(req.user.id);
    if (!executive) {
      return res.status(404).json({ success: false, message: 'Executive not found.' });
    }

    const records = await SalaryRecord.find({ executive_id: executive._id })
      .sort({ month: -1, createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      current_salary: executive.salary?.effective || executive.salary?.base || 0,
      base_salary: executive.salary?.base || 0,
      data: records
    });
  } catch (error) {
    logger.error({ err: error }, 'getMySalary Error:');
    res.status(500).json({ success: false, message: 'Server error fetching salary details.' });
  }
};
