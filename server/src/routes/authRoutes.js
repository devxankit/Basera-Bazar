const express = require('express');
const router = express.Router();

const { checkExists, requestOtp, verifyOtp, getMe, updateProfile, changePassword, loginWithPassword, register, checkSignupConflicts } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { loginSchema } = require('../utils/validators');

// POST /api/auth/check-exists — Check if email/phone already registered (Signup)
router.post('/check-exists', checkExists);

// POST /api/auth/check-conflicts
router.post('/check-conflicts', checkSignupConflicts);

// POST /api/auth/send-otp
router.post('/send-otp', requestOtp);

// POST /api/auth/verify-otp
router.post('/verify-otp', verifyOtp);

// POST /api/auth/login (Password login)
router.post('/login', validate(loginSchema), loginWithPassword);

// TEMP: Setup admin
router.get('/setup-admin', async (req, res) => {
  const { AdminUser } = require('../models/Admin');
  try {
    console.log(`[Setup] Checking for admin account...`);
    const existing = await AdminUser.findOne({ email: 'superadmin@gmail.com' });
    if (existing) {
      return res.json({ success: true, message: 'Admin already exists', email: existing.email });
    }
    await AdminUser.create({
      name: 'Super Admin',
      email: 'superadmin@gmail.com',
      password: 'password123',
      role: 'super_admin',
      status: 'Active'
    });
    res.json({ success: true, message: 'Admin created successfully', email: 'superadmin@gmail.com', password: 'password123' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auth/me (Get current user profile)
router.get('/me', protect, getMe);

// PUT /api/auth/profile (Update name, email, phone)
router.put('/profile', protect, updateProfile);

// PUT /api/auth/change-password (Change password with verification)
router.put('/change-password', protect, changePassword);

module.exports = router;
