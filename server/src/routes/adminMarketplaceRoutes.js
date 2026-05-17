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
const validate = require('../middlewares/validateMiddleware');
const { idParamSchema, commissionUpdateSchema } = require('../utils/validators');

const vId = validate(idParamSchema, 'params');

// Require Admin/SuperAdmin for these sensitive marketplace operations
router.use(protect);
router.use(authorizeRoles('Admin', 'super_admin', 'SuperAdmin'));

router.patch('/kyc/:id', vId, updateSellerKYC);
router.post('/commission', validate(commissionUpdateSchema), updateCommissionRate);
router.get('/withdrawals', getAllWithdrawals);
router.patch('/withdrawals/:id', vId, processWithdrawal);
router.get('/orders', getAllOrders);
router.get('/debug', debugMarketplace);

module.exports = router;
