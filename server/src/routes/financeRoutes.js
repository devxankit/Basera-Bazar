const express = require('express');
const router = express.Router();
const { mockCreateRazorpayOrder, mockRazorpayWebhook } = require('../controllers/financeController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

// Mock Checkout relies on the partner being logged in
router.post('/checkout/mock', protect, authorizeRoles('partner'), mockCreateRazorpayOrder);

// The webhook is public so the pseudo-Razorpay server can hit it
router.post('/webhook/mock', mockRazorpayWebhook);

module.exports = router;
