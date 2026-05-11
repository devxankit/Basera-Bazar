const express = require('express');
const router = express.Router();
const {
  getWalletStats,
  requestWithdrawal,
  getWithdrawalHistory
} = require('../controllers/walletController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');
const idempotency = require('../middlewares/idempotencyMiddleware');

// All wallet routes require an authenticated partner account
router.get('/stats', protect, authorizeRoles('partner'), getWalletStats);
router.post('/withdraw', protect, authorizeRoles('partner'), idempotency, requestWithdrawal);
router.get('/history', protect, authorizeRoles('partner'), getWithdrawalHistory);

module.exports = router;
