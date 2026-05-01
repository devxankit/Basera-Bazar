const express = require('express');
const router = express.Router();
const { 
  createMarketplaceOrder, 
  verifyMarketplacePayment, 
  updateLeadStatus,
  getUserOrders,
  getSellerOrders,
  getOrderDetails,
  addReview,
  resendOrderOTP
} = require('../controllers/orderController');
const { protect } = require('../middlewares/authMiddleware');

// Marketplace Transaction Routes
router.post('/checkout', protect, createMarketplaceOrder);
router.post('/payment/verify', verifyMarketplacePayment);

// Tracking Routes
router.get('/my-orders', protect, getUserOrders);
router.get('/seller-orders', protect, getSellerOrders);
router.get('/:id', protect, getOrderDetails);
router.post('/review', protect, addReview);

// Lead Management (Mandi Bazar)
router.patch('/lead/:orderId/:itemId/status', protect, updateLeadStatus);
router.post('/lead/:orderId/:itemId/send-otp', protect, resendOrderOTP);

module.exports = router;
