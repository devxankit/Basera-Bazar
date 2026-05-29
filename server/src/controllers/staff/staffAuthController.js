const logger = require('../../utils/logger');
const { TeamLeader, OfficeStaff } = require('../../models/Staff');
const Executive = require('../../models/Executive');
const { checkLockout, recordFailedAttempt, resetFailedAttempts } = require('../../utils/loginLockout');
const { signAccessToken, signRefreshToken, setAuthCookies } = require('../../utils/cookieAuth');

// ─── Staff Unified Login ─────────────────────────────────────────────────────

const staffLogin = async (req, res) => {
  const { identifier, password, role } = req.body;
  try {
    let Model;
    if (role === 'team_leader') Model = TeamLeader;
    else if (role === 'office_staff') Model = OfficeStaff;
    else if (role === 'executive') Model = Executive;
    else return res.status(400).json({ success: false, message: 'Invalid role specified.' });

    const query = /^[6-9]\d{9}$/.test(identifier)
      ? { phone: identifier }
      : { email: identifier.toLowerCase() };

    const staff = await Model.findOne(query);
    if (!staff) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const lockout = checkLockout(staff);
    if (lockout.locked) {
      return res.status(429).json({
        success: false,
        message: `Account locked. Try again after ${lockout.retryAfter.toLocaleTimeString()}.`,
      });
    }

    if (!['approved', 'verified'].includes(staff.onboarding_status)) {
      return res.status(403).json({ success: false, message: 'Your account is not yet approved.' });
    }

    if (!staff.is_active) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated.' });
    }

    const isMatch = await staff.matchPassword(password);
    if (!isMatch) {
      await recordFailedAttempt(Model, staff._id);
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    await resetFailedAttempts(Model, staff._id);

    const accessToken  = signAccessToken(staff._id, role, staff.email, staff.token_version);
    const refreshTokenVal = signRefreshToken(staff._id, role, staff.token_version);
    setAuthCookies(res, accessToken, refreshTokenVal);

    const {
      _id, name, phone, email, profile_image, onboarding_status,
      is_active, state, calling_specialization, fixed_salary, commission_rate
    } = staff.toJSON();

    res.status(200).json({
      success: true,
      token: accessToken, // kept for localStorage fallback on older clients
      user: {
        _id, name, phone, email, profile_image, onboarding_status,
        is_active, state, calling_specialization, fixed_salary, commission_rate, role
      }
    });
  } catch (err) {
    logger.error({ err }, 'staffLogin Error');
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

const staffLogout = async (req, res) => {
  try {
    const { role, id } = req.user;
    let Model;
    if (role === 'team_leader') Model = TeamLeader;
    else if (role === 'office_staff') Model = OfficeStaff;
    else Model = Executive;

    await Model.findByIdAndUpdate(id, { $inc: { token_version: 1 } });
    res.status(200).json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    logger.error({ err }, 'staffLogout Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getStaffMe = async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
};

const changeStaffPassword = async (req, res) => {
  const { current_password, new_password } = req.body;
  try {
    const { role, id } = req.user;
    let Model;
    if (role === 'team_leader') Model = TeamLeader;
    else if (role === 'office_staff') Model = OfficeStaff;
    else Model = Executive;

    const staff = await Model.findById(id).select('+password');
    if (!staff) return res.status(404).json({ success: false, message: 'Not found.' });

    const isMatch = await staff.matchPassword(current_password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });

    staff.password = new_password;
    await staff.save();

    res.status(200).json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    logger.error({ err }, 'changeStaffPassword Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const staffForgotPassword = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: 'Phone number required.' });

    // Check in all staff models — allow any active account regardless of onboarding status
    const [tl, os, fe] = await Promise.all([
      TeamLeader.findOne({ phone, is_active: true }),
      OfficeStaff.findOne({ phone, is_active: true }),
      Executive.findOne({ phone, is_active: true }),
    ]);

    const staff = tl || os || fe;
    if (!staff) return res.status(404).json({ success: false, message: 'No active staff account found with this phone.' });

    const crypto = require('crypto');
    const isMockMode = process.env.TESTING_MODE === 'true' || !process.env.SMS_API_KEY || process.env.SMS_API_KEY === 'your_smsindiahub_api_key';
    const otpCode = isMockMode ? '123456' : crypto.randomInt(100000, 1000000).toString();

    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otpCode, salt);

    const { Otp } = require('../../models/User');

    await Otp.deleteMany({ phone });
    await Otp.create({
      phone,
      otp_hash: otpHash,
      expires_at: new Date(Date.now() + 5 * 60 * 1000),
    });

    if (process.env.TESTING_MODE !== 'true') {
      try {
        await require('../../utils/sms').sendOTP(phone, otpCode);
      } catch (smsErr) {
        if (process.env.NODE_ENV === 'development') {
          logger.warn(`[DEV] SMS failed — OTP for ${phone}: ${otpCode}`);
        } else {
          throw smsErr;
        }
      }
    }

    res.status(200).json({ success: true, message: 'OTP sent successfully.' });
  } catch (err) {
    logger.error({ err }, 'staffForgotPassword Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const staffResetPassword = async (req, res) => {
  try {
    const { phone, otp, new_password } = req.body;
    if (!phone || !otp || !new_password) return res.status(400).json({ success: false, message: 'Phone, OTP and new password required.' });

    const { Otp } = require('../../models/User');
    const otpRecord = await Otp.findOne({ phone }).sort({ createdAt: -1 });

    if (!otpRecord || otpRecord.expires_at < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP expired or not found.' });
    }

    const bcrypt = require('bcryptjs');
    let isMatch = await bcrypt.compare(otp, otpRecord.otp_hash);
    const isMockMode = process.env.TESTING_MODE === 'true' || !process.env.SMS_API_KEY || process.env.SMS_API_KEY === 'your_smsindiahub_api_key';
    if (!isMatch && isMockMode) {
      isMatch = otp.toString() === '123456';
    }
    if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid OTP.' });

    // Find staff again to update
    const [tl, os, fe] = await Promise.all([
      TeamLeader.findOne({ phone }),
      OfficeStaff.findOne({ phone }),
      Executive.findOne({ phone }),
    ]);

    const staff = tl || os || fe;
    if (!staff) return res.status(404).json({ success: false, message: 'Staff account not found.' });

    // Prevent reuse of the current (previous) password
    const isSameAsOld = await bcrypt.compare(new_password, staff.password);
    if (isSameAsOld) {
      return res.status(400).json({ success: false, message: 'New password must be different from your current password.' });
    }

    staff.password = new_password;
    staff.token_version = (staff.token_version || 0) + 1; // Logout all sessions
    await staff.save();

    await Otp.deleteOne({ _id: otpRecord._id });

    res.status(200).json({ success: true, message: 'Password reset successfully. Please login with new password.' });
  } catch (err) {
    logger.error({ err }, 'staffResetPassword Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  staffLogin,
  staffLogout,
  getStaffMe,
  changeStaffPassword,
  staffForgotPassword,
  staffResetPassword,
};
