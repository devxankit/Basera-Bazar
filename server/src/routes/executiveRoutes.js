const express = require('express');
const router = express.Router();
const {
  registerStep1,
  verifyRegistrationOtp,
  updateStep2,
  updateStep3,
  login,
  getDashboard,
  getMyPartners,
  getMyTransactions,
  requestWithdrawal,
  updateProfile,
  updateBankDetails,
} = require('../controllers/executiveController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const cacheMiddleware = require('../middlewares/cacheMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { executiveBankDetailsSchema, executiveProfileUpdateSchema } = require('../utils/validators');

router.post('/register/step1', registerStep1);
router.post('/register/verify', verifyRegistrationOtp);
router.post('/login', login);

// Protected routes
router.use(protect);

router.put('/register/step2', updateStep2);
router.put('/register/step3', updateStep3);
router.get('/dashboard', cacheMiddleware(5, true), getDashboard);
router.get('/my-partners', cacheMiddleware(3, true), getMyPartners);
router.get('/transactions', cacheMiddleware(5, true), getMyTransactions);
router.post('/withdraw', requestWithdrawal);
router.put('/profile', validate(executiveProfileUpdateSchema), updateProfile);
router.put('/bank-details', validate(executiveBankDetailsSchema), updateBankDetails);

// TEMP DEBUG ENDPOINT
router.get('/debug/:phone', async (req, res) => {
  const Executive = require('../models/Executive');
  const execs = await Executive.find({ phone: req.params.phone });
  res.json({ count: execs.length, execs });
});

module.exports = router;
