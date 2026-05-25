const express = require('express');
const router = express.Router();
const { 
  createMarketplaceOrder, 
  verifyMarketplacePayment, 
  marketplacePaymentCallback,
  updateLeadStatus,
  getUserOrders,
  getSellerOrders,
  getOrderDetails,
  addReview,
  resendOrderOTP,
  getOrderReview
} = require('../controllers/orderController');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { orderCheckoutSchema, orderPaymentVerifySchema, orderStatusSchema, orderReviewSchema, idParamSchema } = require('../utils/validators');

// Marketplace Transaction Routes
router.post('/checkout', protect, validate(orderCheckoutSchema), createMarketplaceOrder);
router.post('/payment/verify', protect, validate(orderPaymentVerifySchema), verifyMarketplacePayment);
router.post('/payment/callback', marketplacePaymentCallback); // Public redirect POST

// Tracking Routes
router.get('/my-orders', protect, getUserOrders);
router.get('/seller-orders', protect, getSellerOrders);
router.get('/:id', protect, validate(idParamSchema, 'params'), getOrderDetails);
router.post('/review', protect, validate(orderReviewSchema), addReview);
router.get('/:id/review', protect, validate(idParamSchema, 'params'), getOrderReview);

// Lead Management (Mandi Bazar)
router.patch('/lead/:orderId/:itemId/status', protect, validate(orderStatusSchema), updateLeadStatus);
router.post('/lead/:orderId/:itemId/send-otp', protect, resendOrderOTP);

module.exports = router;
