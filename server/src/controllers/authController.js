const { User, Otp } = require('../models/User');
const { Partner } = require('../models/Partner');
const { AdminUser } = require('../models/Admin');
const { sendOTP } = require('../utils/sms');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getCityCoords } = require('../utils/locationUtils');

// Helper function to generate a secure JWT Token
const generateToken = (id, role, email, version = 0) => {
  return jwt.sign({ id, role, email, version }, process.env.JWT_SECRET, {
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

    console.log(`[Signup Check] Checking existence for Phone: ${phone}, Email: ${email}`);

    // Cross-collection check: A user shouldn't be able to register a Customer account 
    // if their phone/email is already tied to a Partner account, and vice-versa.
    
    // 1. Check User Collection
    const userPhoneExists = phone ? await User.findOne({ phone }) : null;
    const userEmailExists = email ? await User.findOne({ email: email.toLowerCase() }) : null;

    // 2. Check Partner Collection
    const partnerPhoneExists = phone ? await Partner.findOne({ phone }) : null;
    const partnerEmailExists = email ? await Partner.findOne({ email: email.toLowerCase() }) : null;

    const phoneConflict = userPhoneExists || partnerPhoneExists;
    const emailConflict = userEmailExists || partnerEmailExists;

    if (phoneConflict && emailConflict) {
      console.log(`[Signup Check] Conflict: Both phone and email exist.`);
      return res.status(409).json({
        success: false,
        code: 'USER_EXISTS',
        message: 'An account with this phone number and email already exists. Please login.',
      });
    }

    if (emailConflict) {
      console.log(`[Signup Check] Conflict: Email already registered.`);
      return res.status(409).json({
        success: false,
        code: 'EMAIL_EXISTS',
        message: 'This email is already registered. Please use a different email or login.',
      });
    }

    if (phoneConflict) {
      console.log(`[Signup Check] Conflict: Phone number already registered.`);
      return res.status(409).json({
        success: false,
        code: 'PHONE_EXISTS',
        message: 'This phone number is already registered. Please use a different number or login.',
      });
    }

    console.log(`[Signup Check] No conflicts found. Proceeding...`);
    return res.status(200).json({ success: true, message: 'No conflict. Safe to proceed.' });

  } catch (error) {
    console.error('Error in checkExists:', error);
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
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
      const user = await User.findOne({ phone });
      const partner = await Partner.findOne({ phone });

      if (!user && !partner) {
        return res.status(404).json({
          success: false,
          message: 'Account not found with this number.',
          notExists: true,
        });
      }

      // NEW: Block inactive users from OTP
      const account = user || partner;
      if (account && account.is_active === false) {
        return res.status(403).json({
          success: false,
          code: 'ACCOUNT_INACTIVE',
          message: 'Account is inactive. Please contact the administrator.'
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
    const { 
      phone, otp, role = 'user', flow = 'login', 
      name, email, password,
      address, city, state, district, pincode, coords,
      service_radius_km
    } = req.body;

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
      const Model = role === 'partner' ? Partner : (role === 'super_admin' ? AdminUser : User);

      // SILENT FALLBACK: If flow is signup but account actually exists, pivot to LOGIN flow automatically
      const existingAccount = await Model.findOne({ phone });
      
      if (existingAccount) {
        account = existingAccount;
        
        // Profile Healing: If the existing account has no name but we just got one, update it!
        // This ensures inquiries from "partially registered" users get their names saved.
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
          console.log(`[AUTH] Profile Healed for user ${account.id} - Name: ${account.name}`);
        }
      } else {
        // Real Signup
        if (!name || !email) {
          return res.status(400).json({ success: false, message: 'Name and email are required for account creation.' });
        }

        const emailConflict = await Model.findOne({ email: email.toLowerCase() });
        if (emailConflict) {
          return res.status(409).json({ success: false, code: 'EMAIL_EXISTS', message: 'This email is already registered.' });
        }

        // Handle Location Geocoding fallback
        let finalCoords = coords;
        if (!finalCoords && city) {
          finalCoords = getCityCoords(city);
        }
        
        // Default to Muzaffarpur if still missing (safety fallback)
        if (!finalCoords) {
          finalCoords = [85.3647, 26.1209];
        }

        account = await Model.create({
          phone,
          name,
          email: email.toLowerCase(),
          password: password || undefined, // Password optional for OTP auto-signup
          ...(role === 'partner' && { 
            partner_type: role === 'partner' ? 'service_provider' : undefined,
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
          address: role !== 'user' ? {
            full_address: address,
            city,
            state,
            district,
            pincode
          } : undefined
        });
      }

    } else {
      // LOGIN flow: Find existing user
      const Model = role === 'partner' ? Partner : (role === 'super_admin' ? AdminUser : User);
      account = await Model.findOne({ phone });

      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'No account found with this phone number.',
          notExists: true,
        });
      }

      // NEW: Block inactive users from Login via OTP
      if (account.is_active === false) {
        return res.status(403).json({
          success: false,
          code: 'ACCOUNT_INACTIVE',
          message: 'Account is inactive. Please contact the administrator.'
        });
      }
    }

    // 4. Generate and return JWT
    const token = generateToken(account._id, assignedRole, account.email, account.token_version);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: account._id,
        phone: account.phone,
        email: account.email,
        name: account.name,
        profileImage: account.profileImage || '',
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

    const updateData = { ...req.body };

    // Handle Geocoding fallback for profile updates
    if (updateData.city && !updateData.coords && !updateData.location) {
      const cityCoords = getCityCoords(updateData.city);
      if (cityCoords) {
        if (isPartner) {
          updateData.location = { type: 'Point', coordinates: cityCoords };
        } else {
          updateData.default_location = {
            ...(updateData.default_location || {}),
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

    const Model = role === 'partner' ? Partner : (role === 'super_admin' ? AdminUser : User);

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
        message: role === 'super_admin' 
          ? 'No administrator account found with these credentials. Please contact support.' 
          : 'No account found with this email or phone. Would you like to sign up?',
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
    console.log(`[Login Attempt] Identifier: ${identifier}, isMatch: ${isMatch}`);
    
    if (!isMatch) {
      console.log(`[Login Failed] Incorrect password for identifier: ${identifier}`);
      return res.status(401).json({ success: false, message: `Incorrect password. Please try again.` });
    }

    // NEW: Block inactive users from Login via Password
    if (account.is_active === false) {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_INACTIVE',
        message: 'Account is inactive. Please contact the administrator.'
      });
    }

    const token = generateToken(account._id, role, account.email, account.token_version);
    console.log(`[Login Success] User: ${account.email}, Role: ${role}`);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: account._id,
        phone: account.phone,
        email: account.email,
        name: account.name,
        profileImage: account.profileImage || '',
        role,
      },
    });

  } catch (error) {
    console.error('Login Error Trace:', error);
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
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

    const Model = role === 'partner' ? Partner : (role === 'super_admin' ? AdminUser : User);

    const existing = await Model.findOne({ $or: [{ phone }, { email }] });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User already exists with this phone or email.' });
    }

    const newUser = await Model.create({ name: fullName, email, phone, password });
    const token = generateToken(newUser._id, role, newUser.email, newUser.token_version);

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: { id: newUser._id, name: newUser.name, phone: newUser.phone, email: newUser.email, profileImage: newUser.profileImage || '', role },
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
