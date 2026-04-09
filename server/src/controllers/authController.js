const { User, Otp } = require('../models/User');
const { Partner } = require('../models/Partner');
const { sendOTP } = require('../utils/sms');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Helper function to generate a secure JWT Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

/**
 * @desc    Check if email/phone already exists before signup
 * @route   POST /api/auth/check-exists
 * @access  Public
 */
const checkExists = async (req, res) => {
  try {
    const { phone, email, role = 'user' } = req.body;

    if (!phone && !email) {
      return res.status(400).json({ success: false, message: 'Please provide phone or email.' });
    }

    const UserModel = role === 'partner' ? Partner : User;

    const phoneExists = phone ? await UserModel.findOne({ phone }) : null;
    const emailExists = email ? await UserModel.findOne({ email: email.toLowerCase() }) : null;

    if (phoneExists && emailExists) {
      return res.status(409).json({
        success: false,
        code: 'USER_EXISTS',
        message: 'An account with this phone number and email already exists. Please login.',
      });
    }

    if (emailExists) {
      return res.status(409).json({
        success: false,
        code: 'EMAIL_EXISTS',
        message: 'This email is already registered. Please use a different email or login.',
      });
    }

    if (phoneExists) {
      return res.status(409).json({
        success: false,
        code: 'PHONE_EXISTS',
        message: 'This phone number is already registered. Please use a different number or login.',
      });
    }

    // No conflict — safe to proceed
    return res.status(200).json({ success: true, message: 'No conflict. Safe to proceed.' });

  } catch (error) {
    console.error('Error in checkExists:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Generate and send OTP to user's phone
 * @route   POST /api/auth/send-otp
 * @access  Public
 */
const requestOtp = async (req, res) => {
  try {
    const { phone, checkExists: shouldCheckExists } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Please provide a phone number.' });
    }

    // If called from Login, check if the user exists in the database
    if (shouldCheckExists) {
      const userExists = await User.findOne({ phone });
      const partnerExists = await Partner.findOne({ phone });

      if (!userExists && !partnerExists) {
        return res.status(404).json({
          success: false,
          message: 'Account not found with this number.',
          notExists: true,
        });
      }
    }

    // Generate a random 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash the OTP for secure storage
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otpCode, salt);

    // Delete any previous OTP requests for this phone
    await Otp.deleteMany({ phone });

    // Save hashed OTP with expiration
    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + 5);

    await Otp.create({
      phone,
      otp_hash: otpHash,
      expires_at: expirationDate,
    });

    // Send OTP (non-blocking)
    sendOTP(phone, otpCode);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully! Please check your phone.',
    });

  } catch (error) {
    console.error('Error in requestOtp controller:', error);
    res.status(500).json({ success: false, message: 'Server error processing request.' });
  }
};

/**
 * @desc    Verify OTP
 *          - If flow is 'login': finds existing user and logs them in
 *          - If flow is 'signup': creates a NEW user with full details
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
const verifyOtp = async (req, res) => {
  try {
    const { phone, otp, role = 'user', flow = 'login', name, email, password } = req.body;

    // 1. Find the OTP record for this phone
    const otpRecord = await Otp.findOne({ phone }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'OTP expired or not found. Please request a new one.' });
    }

    // 2. Compare the provided OTP
    const isMatch = await bcrypt.compare(otp.toString(), otpRecord.otp_hash);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect OTP. Please try again.' });
    }

    // 3. OTP is valid — delete it to prevent reuse
    await Otp.deleteOne({ _id: otpRecord._id });

    let account;
    const assignedRole = role;

    if (flow === 'signup') {
      // SIGNUP flow: Create the new user with all their details
      if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Name, email, and password are required for signup.' });
      }

      const Model = role === 'partner' ? Partner : User;

      // Final safety check (uniqueness already validated on frontend, but double-check here)
      const phoneConflict = await Model.findOne({ phone });
      if (phoneConflict) {
        return res.status(409).json({ success: false, code: 'PHONE_EXISTS', message: 'This phone number is already registered.' });
      }

      const emailConflict = await Model.findOne({ email: email.toLowerCase() });
      if (emailConflict) {
        return res.status(409).json({ success: false, code: 'EMAIL_EXISTS', message: 'This email is already registered.' });
      }

      account = await Model.create({
        phone,
        name,
        email: email.toLowerCase(),
        password,
        ...(role === 'partner' && { partner_type: 'service_provider' }),
      });

    } else {
      // LOGIN flow: Find existing user
      const Model = role === 'partner' ? Partner : User;
      account = await Model.findOne({ phone });

      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'No account found with this phone number.',
          notExists: true,
        });
      }
    }

    // 4. Generate and return JWT
    const token = generateToken(account._id, assignedRole);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: account._id,
        phone: account.phone,
        email: account.email,
        name: account.name,
        role: assignedRole,
      },
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ success: false, message: 'Server error during verification.' });
  }
};

const getMe = async (req, res) => {
  try {
    res.status(200).json({ success: true, data: req.user });
  } catch (error) {
    console.error('Error in getMe:', error);
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

    const updated = await Model.findByIdAndUpdate(
      req.user._id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      data: updated,
    });
  } catch (error) {
    console.error('Profile update error:', error);
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

    console.log(`[Login Attempt] Identifier: ${identifier}, Role: ${role}`);

    const Model = role === 'partner' ? Partner : User;

    // Search by email or phone
    const account = await Model.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { phone: identifier },
      ],
    });

    if (!account) {
      console.log(`[Login Failed] User not found for identifier: ${identifier}`);
      return res.status(404).json({
        success: false,
        code: 'NOT_REGISTERED',
        message: 'No account found with this email or phone. Would you like to sign up?',
      });
    }

    // Check if user has a password set
    if (!account.password) {
      console.log(`[Login Failed] No password set for identifier: ${identifier}`);
      return res.status(400).json({
        success: false,
        code: 'NO_PASSWORD',
        message: 'This account was created using OTP. Please use OTP Login instead.',
      });
    }

    // Verify password
    const isMatch = await account.matchPassword(password);
    if (!isMatch) {
      console.log(`[Login Failed] Incorrect password for identifier: ${identifier}`);
      return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
    }

    const token = generateToken(account._id, role);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: account._id,
        phone: account.phone,
        email: account.email,
        name: account.name,
        role,
      },
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

/**
 * @desc    Register a new user (legacy endpoint, kept for compatibility)
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  try {
    const { fullName, email, phone, password, role = 'user' } = req.body;

    if (!fullName || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
    }

    const Model = role === 'partner' ? Partner : User;

    const existing = await Model.findOne({ $or: [{ phone }, { email }] });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User already exists with this phone or email.' });
    }

    const newUser = await Model.create({ name: fullName, email, phone, password });
    const token = generateToken(newUser._id, role);

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: { id: newUser._id, name: newUser.name, phone: newUser.phone, email: newUser.email, role },
    });

  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
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

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const isPartner = req.user.role === 'partner';
    const Model = isPartner ? Partner : User;

    // Fetch the full document so .save() triggers the pre-save hook for hashing
    const account = await Model.findById(req.user._id);

    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    // If user has no password (OTP-only), allow setting one without checking current
    if (account.password) {
      const isMatch = await account.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
      }
    }

    // Set and save — the pre-save hook will hash the new password automatically
    account.password = newPassword;
    await account.save();

    res.status(200).json({ success: true, message: 'Password updated successfully!' });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Server error updating password.' });
  }
};

module.exports = {
  checkExists,
  requestOtp,
  verifyOtp,
  getMe,
  updateProfile,
  changePassword,
  loginWithPassword,
  register,
};
