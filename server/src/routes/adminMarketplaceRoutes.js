const express = require('express');
const router = express.Router();
const { 
  updateSellerKYC, 
  updateCommissionRate, 
  processWithdrawal,
  getAllWithdrawals,
  getAllOrders,
  debugMarketplace
} = require('../controllers/adminMarketplaceController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

// Require Admin/SuperAdmin for these sensitive marketplace operations
router.use(protect);
router.use(authorizeRoles('Admin', 'super_admin', 'SuperAdmin'));

router.patch('/kyc/:id', updateSellerKYC);
router.post('/commission', updateCommissionRate);
router.get('/withdrawals', getAllWithdrawals);
router.patch('/withdrawals/:id', processWithdrawal);
router.get('/orders', getAllOrders);
router.get('/debug', debugMarketplace);

module.exports = router;
