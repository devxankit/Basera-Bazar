const express = require('express');
const router = express.Router();
const { 
  createMarketplaceOrder, 
  verifyMarketplacePayment, 
  updateLeadStatus,
  getUserOrders,
  getSellerOrders
} = require('../controllers/orderController');
const { protect } = require('../middlewares/authMiddleware');

// Marketplace Transaction Routes
router.post('/checkout', protect, createMarketplaceOrder);
router.post('/payment/verify', verifyMarketplacePayment);

// Tracking Routes
router.get('/my-orders', protect, getUserOrders);
router.get('/seller-orders', protect, getSellerOrders);

// Lead Management (Mandi Bazar)
router.patch('/lead/:orderId/:itemId/status', protect, updateLeadStatus);

module.exports = router;
