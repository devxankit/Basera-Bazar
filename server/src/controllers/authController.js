const { User, Otp } = require('../models/User');
const logger = require('../utils/logger');
const { Partner } = require('../models/Partner');
const { AdminUser } = require('../models/Admin');
const Executive = require('../models/Executive');
const { sendOTP } = require('../utils/sms');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { getCityCoords } = require('../utils/locationUtils');
const { logActivity } = require('../utils/activityLogger');
const { checkLockout, recordFailedAttempt, resetFailedAttempts } = require('../utils/loginLockout');
const { createNotification } = require('../utils/notificationHelper');
const {
  signAccessToken, signRefreshToken, verifyRefreshToken,
  setAuthCookies, clearAuthCookies,
} = require('../utils/cookieAuth');
const { TeamLeader, OfficeStaff } = require('../models/Staff');

/**
 * @desc    Check if email/phone already exists before signup
 * @route   POST /api/auth/check-exists
 * @access  Public
 */
const checkExists = async (req, res) => {
  try {
    const { phone, email } = req.body;

    if (!phone && !email) {
      return res.status(400).json({ success: false, message: 'Please provide phone or email.' });
    }

    const userPhoneExists = phone ? await User.findOne({ phone }) : null;
    const userEmailExists = email ? await User.findOne({ email: email.toLowerCase() }) : null;
    const partnerPhoneExists = phone ? await Partner.findOne({ phone }) : null;
    const partnerEmailExists = email ? await Partner.findOne({ email: email.toLowerCase() }) : null;

    const phoneConflict = userPhoneExists || partnerPhoneExists;
    const emailConflict = userEmailExists || partnerEmailExists;

    if (phoneConflict && emailConflict) {
      return res.status(409).json({
        success: false,
        code: 'USER_EXISTS',
        message: 'An account with this phone number and email already exists. Please login.',
      });
    }

    if (emailConflict) {
      return res.status(409).json({
        success: false,
        code: 'EMAIL_EXISTS',
        message: 'This email is already registered. Please use a different email or login.',
      });
    }

    if (phoneConflict) {
      return res.status(409).json({
        success: false,
        code: 'PHONE_EXISTS',
        message: 'This phone number is already registered. Please use a different number or login.',
      });
    }

    return res.status(200).json({ success: true, message: 'No conflict. Safe to proceed.' });

  } catch (error) {
    logger.error({ err: error }, 'Error in checkExists:');
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

/**
 * @desc    Generate and send OTP to user's phone
 * @route   POST /api/auth/send-otp
 * @access  Public
 */
const requestOtp = async (req, res) => {
  try {
    const { phone: rawPhone, checkExists: shouldCheckExists } = req.body;
    const phone = rawPhone ? rawPhone.trim() : '';

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Please provide a phone number.' });
    }

    if (shouldCheckExists) {
      const user = await User.findOne({ phone });
      const partner = await Partner.findOne({ phone });

      if (!user && !partner) {
        return res.status(404).json({
          success: false,
          message: 'Account not found with this number.',
          notExists: true,
        });
      }

      const account = user || partner;
      if (account && account.is_active === false) {
        return res.status(403).json({
          success: false,
          code: 'ACCOUNT_INACTIVE',
          message: 'Account is inactive. Please contact the administrator.'
        });
      }
    }

    // Cryptographically secure 6-digit OTP
    const otpCode = crypto.randomInt(100000, 1000000).toString();

    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otpCode, salt);

    await Otp.deleteMany({ phone });

    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + 5);

    await Otp.create({
      phone,
      otp_hash: otpHash,
      expires_at: expirationDate,
    });

    // Await SMS delivery — return 502 if it fails so the client knows to retry
    try {
      await sendOTP(phone, otpCode);
    } catch (smsErr) {
      logger.error({ err: smsErr }, '[SMS] Failed to send OTP');
      return res.status(502).json({ success: false, message: 'Failed to send OTP. Please try again.' });
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully! Please check your phone.',
    });

  } catch (error) {
    logger.error({ err: error }, 'Error in requestOtp controller:');
    res.status(500).json({ success: false, message: 'Server error processing request.' });
  }
};

/**
 * @desc    Verify OTP and log in or sign up
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
const verifyOtp = async (req, res) => {
  try {
    const {
      phone: rawPhone, otp, role = 'user', flow = 'login',
      partner_type,
      name, email, password,
      address, city, state, district, pincode, coords,
      service_radius_km, referral_code
    } = req.body;
    const phone = rawPhone ? rawPhone.trim() : '';

    logger.info({ phone, role: req.body?.role }, '[AUTH] Verify OTP request received');

    if (!otp || typeof otp !== 'string' || !/^\d{6}$/.test(otp.trim())) {
      return res.status(400).json({ success: false, message: 'Invalid OTP format.' });
    }

    const otpRecord = await Otp.findOne({ phone }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'OTP expired or not found. Please request a new one.' });
    }

    // Check expiry before comparing hash
    if (otpRecord.expires_at && otpRecord.expires_at < new Date()) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ success: false, message: 'OTP expired. Please request a new one.' });
    }

    const isMatch = await bcrypt.compare(otp.toString(), otpRecord.otp_hash);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect OTP. Please try again.' });
    }

    let account;
    const assignedRole = role;

    // Handle "verify only" flow — consume OTP and return success
    if (flow === 'verify_only') {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(200).json({ success: true, message: 'OTP verified successfully.' });
    }

    if (flow === 'signup') {
      const Model = role === 'partner' ? Partner : (role === 'super_admin' ? AdminUser : User);

      const existingAccount = await Model.findOne({ phone });

      if (existingAccount) {
        account = existingAccount;

        let needsUpdate = false;
        if (!account.name || account.name === 'Unknown' || account.name === 'Potential Customer') {
          account.name = name;
          needsUpdate = true;
        }
        if (!account.email && email) {
          account.email = email.toLowerCase();
          needsUpdate = true;
        }

        if (needsUpdate) {
          await account.save();
          logger.info(`[AUTH] Profile healed for user ${account.id}`);
        }
      } else {
        if (!name || !email) {
          return res.status(400).json({ success: false, message: 'Name and email are required for account creation.' });
        }

        const emailConflict = await Model.findOne({ email: email.toLowerCase() });
        if (emailConflict) {
          return res.status(409).json({ success: false, code: 'EMAIL_EXISTS', message: 'This email is already registered.' });
        }

        let finalCoords = coords;
        if (!finalCoords && city) {
          finalCoords = getCityCoords(city);
        }
        if (!finalCoords) {
          finalCoords = [85.3647, 26.1209];
        }

        const OtherModel = role === 'partner' ? User : Partner;
        const crossConflict = await OtherModel.findOne({ phone });
        if (crossConflict) {
          return res.status(409).json({
            success: false,
            code: 'PHONE_EXISTS_OTHER',
            message: `This phone number is already registered as a ${role === 'partner' ? 'Customer' : 'Partner'}.`
          });
        }

        const initialPartnerType = partner_type || 'service_provider';
        account = await Model.create({
          phone,
          name,
          email: email.toLowerCase(),
          password: password || undefined,
          ...(role === 'partner' && {
            partner_type: initialPartnerType,
            roles: [initialPartnerType],
            active_role: initialPartnerType,
            service_radius_km: service_radius_km || 100
          }),
          default_location: role === 'user' ? {
            type: 'Point',
            coordinates: finalCoords,
            city,
            state,
            district,
            pincode
          } : undefined,
          location: role !== 'user' ? {
            type: 'Point',
            coordinates: finalCoords
          } : undefined,
          ...(role !== 'user' && {
            address: typeof address === 'object' ? (address.full_address || '') : address,
            city,
            state,
            district,
            pincode
          }),
          ...(role === 'partner' && referral_code && {
            referral_code_used: referral_code
          })
        });

        if (role === 'partner' && referral_code) {
          const executive = await Executive.findOne({ referral_code: referral_code.toUpperCase(), is_active: true });
          if (executive && ['approved', 'verified'].includes(executive.onboarding_status)) {
            account.referred_by_executive = executive._id;
            await account.save();
          }
        }

        logActivity({
          actor_name: account.name,
          actor_id: account._id,
          action: 'registered',
          entity_type: role === 'partner' ? 'partner' : 'user',
          entity_name: account.name,
          entity_id: account._id,
          description: `New ${role === 'partner' ? account.partner_type || 'partner' : 'user'} registered: ${account.name}`
        });
      }

    } else {
      const Model = role === 'partner' ? Partner : (role === 'super_admin' ? AdminUser : User);
      account = await Model.findOne({ phone });

      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'No account found with this phone number.',
          notExists: true,
        });
      }

      if (account.is_active === false) {
        return res.status(403).json({
          success: false,
          code: 'ACCOUNT_INACTIVE',
          message: 'Your account is deactivated. Please contact the administrator.'
        });
      }
    }

    await Otp.deleteOne({ _id: otpRecord._id });

    const accessToken  = signAccessToken(account._id, assignedRole, account.email, account.token_version);
    const refreshToken = signRefreshToken(account._id, assignedRole, account.token_version);
    setAuthCookies(res, accessToken, refreshToken);

    logger.info(`[AUTH] Login successful: ${account.phone} (ID: ${account._id}) as ${assignedRole}`);

    res.status(200).json({
      success: true,
      token: accessToken, // kept for localStorage fallback on older clients
      user: {
        id: account._id,
        phone: account.phone,
        email: account.email,
        name: account.name,
        profileImage: account.profileImage || '',
        role: assignedRole,
        partner_type: account.partner_type || null,
        roles: account.roles || (account.partner_type ? [account.partner_type] : []),
        active_role: account.active_role || account.partner_type || null,
      },
    });

  } catch (error) {
    logger.error({
      err: error.message,
      stack: error.stack
    }, 'OTP verification error:');
    
    // Check if it's a validation error (e.g. missing required location fields)
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    
    res.status(500).json({ success: false, message: 'Server error during verification.' });
  }
};

const getMe = async (req, res) => {
  try {
    res.status(200).json({ success: true, data: req.user });
  } catch (error) {
    logger.error({ err: error }, 'Error in getMe:');
    res.status(500).json({ success: false, message: 'Server error fetching profile.' });
  }
};

/**
 * @desc    Update User/Partner Profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = async (req, res) => {
  try {
    const isPartner = req.user.role === 'partner';
    const Model = isPartner ? Partner : User;

    // Whitelist allowed fields to prevent mass-assignment
    const ALLOWED_USER_FIELDS = ['name', 'email', 'phone', 'profileImage', 'default_location', 'city', 'state', 'district', 'pincode'];
    const ALLOWED_PARTNER_FIELDS = [
      'name', 'email', 'image', 'profileImage', 'business_name', 'business_description', 'business_logo', 
      'address', 'city', 'state', 'district', 'pincode', 'partner_type', 'roles', 'active_role', 
      'service_radius_km', 'location', 'kyc.pan_number', 'kyc.pan_image', 'kyc.aadhar_number', 
      'kyc.aadhar_front_image', 'kyc.aadhar_back_image', 'kyc.gst_number', 'kyc.gst_image', 
      'onboarding_status', 'profile.mandi_profile.business_name', 'profile.mandi_profile.business_logo', 
      'profile.mandi_profile.business_description'
    ];

    const allowedFields = isPartner ? ALLOWED_PARTNER_FIELDS : ALLOWED_USER_FIELDS;
    const updateData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    // Geocoding fallback for location updates
    if (updateData.city && !req.body.coords && !req.body.location) {
      const cityCoords = getCityCoords(updateData.city);
      if (cityCoords) {
        if (isPartner) {
          updateData.location = { type: 'Point', coordinates: cityCoords };
        } else {
          updateData.default_location = {
            ...(req.body.default_location || {}),
            type: 'Point',
            coordinates: cityCoords
          };
        }
      }
    }

    const updated = await Model.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      data: updated,
    });
  } catch (error) {
    logger.error({ err: error }, 'Profile update error:');
    res.status(500).json({ success: false, message: 'Server error updating profile.' });
  }
};

/**
 * @desc    Login with Email/Phone + Password
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginWithPassword = async (req, res) => {
  try {
    const { identifier: rawIdentifier, password, role = 'user' } = req.body;
    const identifier = rawIdentifier ? rawIdentifier.trim() : null;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Please provide your email/phone and password.' });
    }

    const Model = role === 'partner' ? Partner : (role === 'super_admin' ? AdminUser : User);

    const account = await Model.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { phone: identifier },
      ],
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        code: 'NOT_REGISTERED',
        message: 'No account found with those credentials.'
      });
    }

    // Check account status before anything else
    if (account.is_active === false) {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_INACTIVE',
        message: 'Your account is deactivated. Please contact the administrator.'
      });
    }

    // Per-account lockout check
    const lockout = checkLockout(account);
    if (lockout.locked) {
      const mins = Math.ceil((lockout.retryAfter - Date.now()) / 60000);
      return res.status(429).json({
        success: false,
        code: 'ACCOUNT_LOCKED',
        message: `Too many failed attempts. Account locked for ${mins} more minute(s).`
      });
    }

    if (!account.password) {
      return res.status(400).json({
        success: false,
        code: 'NO_PASSWORD',
        message: 'This account was created using OTP. Please use OTP Login instead.',
      });
    }

    const isMatch = await account.matchPassword(password);
    if (!isMatch) {
      await recordFailedAttempt(Model, account._id);
      return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
    }

    await resetFailedAttempts(Model, account._id);

    const accessToken  = signAccessToken(account._id, role, account.email, account.token_version);
    const refreshToken = signRefreshToken(account._id, role, account.token_version);
    setAuthCookies(res, accessToken, refreshToken);

    res.status(200).json({
      success: true,
      token: accessToken, // kept for localStorage fallback on older clients
      user: {
        id: account._id,
        phone: account.phone,
        email: account.email,
        name: account.name,
        profileImage: account.profileImage || '',
        role,
        partner_type: account.partner_type || null,
        roles: account.roles || (account.partner_type ? [account.partner_type] : []),
        active_role: account.active_role || account.partner_type || null,
      },
    });

  } catch (error) {
    logger.error({ err: error }, 'Login Error:');
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

/**
 * @desc    Change Password (requires current password verification)
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new password.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
    }

    const isPartner = req.user.role === 'partner';
    const Model = isPartner ? Partner : User;

    const account = await Model.findById(req.user._id);

    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    if (account.password) {
      const isMatch = await account.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
      }
    }

    account.password = newPassword;
    await account.save();

    res.status(200).json({ success: true, message: 'Password updated successfully!' });

  } catch (error) {
    logger.error({ err: error }, 'Change password error:');
    res.status(500).json({ success: false, message: 'Server error updating password.' });
  }
};

/**
 * @desc    Check if phone or email already exists for signup
 * @route   POST /api/auth/check-conflicts
 * @access  Public
 */
const checkSignupConflicts = async (req, res) => {
  try {
    const { phone: rawPhone, email: rawEmail } = req.body;
    const phone = rawPhone ? rawPhone.trim() : '';
    const email = rawEmail ? rawEmail.trim().toLowerCase() : '';

    const [userPhone, partnerPhone, userEmail, partnerEmail] = await Promise.all([
      phone ? User.findOne({ phone }) : null,
      phone ? Partner.findOne({ phone }) : null,
      email ? User.findOne({ email }) : null,
      email ? Partner.findOne({ email }) : null
    ]);

    const existingPhone = !!(userPhone || partnerPhone);
    const existingEmail = !!(userEmail || partnerEmail);

    res.status(200).json({
      success: true,
      conflicts: {
        phone: existingPhone,
        email: existingEmail,
        both: existingPhone && existingEmail
      }
    });

  } catch (error) {
    logger.error({ err: error }, 'Conflict check error:');
    res.status(500).json({ success: false, message: 'Server error checking conflicts.' });
  }
};

const testNotification = async (req, res) => {
  try {
    const { title, body } = req.body;
    const recipientId = req.user._id;
    const recipientType = req.user.role === 'partner' ? 'partner' : 'user';

    const notification = await createNotification(
      recipientType,
      recipientId,
      title || 'Test Notification',
      body || 'This is a test notification from Basera Bazar!',
      { type: 'test' }
    );

    if (notification) {
      res.status(200).json({ success: true, message: 'Test notification sent.', id: notification._id });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send notification. Check server logs for details.',
        debug: { recipientId, recipientType }
      });
    }
  } catch (error) {
    logger.error({ err: error }, 'Test notification error:');
    res.status(500).json({ success: false, message: 'Server error sending test notification.' });
  }
};

/**
 * @desc    Issue a new access token using the refresh cookie
 * @route   POST /api/auth/refresh
 * @access  Public (cookie required)
 */
const refreshToken = async (req, res) => {
  const token = req.cookies?.bb_refresh;
  if (!token) {
    return res.status(401).json({ success: false, message: 'No refresh token.' });
  }

  const decoded = verifyRefreshToken(token);
  if (!decoded) {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
  }

  try {
    // Resolve user and check they still exist + token version matches
    let user;
    const role = decoded.role;
    if (role === 'super_admin') user = await AdminUser.findById(decoded.id).select('_id email token_version is_active');
    else if (role === 'partner')  user = await Partner.findById(decoded.id).select('_id email token_version is_active');
    else if (role === 'executive') user = await Executive.findById(decoded.id).select('_id email token_version is_active');
    else if (role === 'team_leader') user = await TeamLeader.findById(decoded.id).select('_id email token_version is_active');
    else if (role === 'office_staff') user = await OfficeStaff.findById(decoded.id).select('_id email token_version is_active');
    else user = await User.findById(decoded.id).select('_id email token_version is_active');

    if (!user) return res.status(401).json({ success: false, message: 'User no longer exists.' });
    if (user.is_active === false) return res.status(403).json({ success: false, message: 'Account deactivated.' });
    if ((user.token_version || 0) !== (decoded.version || 0)) {
      return res.status(401).json({ success: false, message: 'Session invalidated. Please log in again.' });
    }

    const newAccessToken  = signAccessToken(user._id, role, user.email, user.token_version);
    const newRefreshToken = signRefreshToken(user._id, role, user.token_version);
    setAuthCookies(res, newAccessToken, newRefreshToken);

    res.status(200).json({ success: true, token: newAccessToken });
  } catch (error) {
    logger.error({ err: error }, 'Token refresh error:');
    res.status(500).json({ success: false, message: 'Server error during token refresh.' });
  }
};

/**
 * @desc    Logout — clear cookies and invalidate token version
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logoutUser = async (req, res) => {
  try {
    // Increment token_version so all existing JWTs for this user become invalid
    const role = req.user?.role;
    let Model = User;
    if (role === 'super_admin') Model = AdminUser;
    else if (role === 'partner') Model = Partner;
    else if (role === 'executive') Model = Executive;
    else if (role === 'team_leader') Model = TeamLeader;
    else if (role === 'office_staff') Model = OfficeStaff;

    await Model.findByIdAndUpdate(req.user._id, { $inc: { token_version: 1 } });
    clearAuthCookies(res);
    res.status(200).json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    logger.error({ err: error }, 'Logout error:');
    // Still clear cookies even if DB update fails
    clearAuthCookies(res);
    res.status(200).json({ success: true, message: 'Logged out.' });
  }
};

/**
 * @desc    Reset password via OTP verification (unauthenticated)
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = async (req, res) => {
  try {
    const { phone: rawPhone, otp, newPassword } = req.body;
    const phone = rawPhone ? rawPhone.trim() : '';

    if (!phone || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Phone, OTP and new password are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    // Verify OTP
    const otpRecord = await Otp.findOne({ phone }).sort({ createdAt: -1 });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'OTP expired or not found. Please request a new one.' });
    }
    if (otpRecord.expires_at && otpRecord.expires_at < new Date()) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ success: false, message: 'OTP expired. Please request a new one.' });
    }
    const isMatch = await bcrypt.compare(otp.toString(), otpRecord.otp_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect OTP. Please try again.' });
    }

    // Find account (user or partner)
    let account = await User.findOne({ phone });
    if (!account) account = await Partner.findOne({ phone });
    if (!account) {
      return res.status(404).json({ success: false, message: 'No account found with this phone number.' });
    }

    // Set new password and consume OTP
    account.password = newPassword;
    await account.save();
    await Otp.deleteOne({ _id: otpRecord._id });

    res.status(200).json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    logger.error({ err: error }, 'Reset password error:');
    res.status(500).json({ success: false, message: 'Server error resetting password.' });
  }
};

module.exports = {
  checkExists,
  requestOtp,
  verifyOtp,
  getMe,
  updateProfile,
  changePassword,
  resetPassword,
  loginWithPassword,
  checkSignupConflicts,
  testNotification,
  refreshToken,
  logoutUser,
};
