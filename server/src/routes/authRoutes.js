const express = require('express');
const router = express.Router();

const { checkExists, requestOtp, verifyOtp, getMe, updateProfile, changePassword, loginWithPassword, register, checkSignupConflicts } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

// POST /api/auth/check-exists — Check if email/phone already registered (Signup)
router.post('/check-exists', checkExists);

// POST /api/auth/check-conflicts
router.post('/check-conflicts', checkSignupConflicts);

// POST /api/auth/send-otp
router.post('/send-otp', requestOtp);

// POST /api/auth/verify-otp
router.post('/verify-otp', verifyOtp);

// POST /api/auth/login (Password login)
router.post('/login', loginWithPassword);

// GET /api/auth/me (Get current user profile)
router.get('/me', protect, getMe);

// PUT /api/auth/profile (Update name, email, phone)
router.put('/profile', protect, updateProfile);

// PUT /api/auth/change-password (Change password with verification)
router.put('/change-password', protect, changePassword);

module.exports = router;
