const express = require('express');
const router = express.Router();
const { 
  getWalletStats, 
  requestWithdrawal, 
  getWithdrawalHistory 
} = require('../controllers/walletController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/stats', protect, getWalletStats);
router.post('/withdraw', protect, requestWithdrawal);
router.get('/history', protect, getWithdrawalHistory);

module.exports = router;
