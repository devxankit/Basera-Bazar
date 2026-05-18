const express = require('express');
const router = express.Router();
const { initiateSubscription, verifySubscription, cancelSubscription, getMyTransactions } = require('../controllers/financeController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { financeInitiateSchema, financeVerifySchema } = require('../utils/validators');

// Subscription Routes
router.post('/subscription/initiate', protect, authorizeRoles('partner'), validate(financeInitiateSchema), initiateSubscription);
router.post('/subscription/verify', protect, authorizeRoles('partner'), validate(financeVerifySchema), verifySubscription);
router.post('/subscription/cancel', protect, authorizeRoles('partner'), cancelSubscription);
router.get('/transactions', protect, authorizeRoles('partner'), getMyTransactions);

module.exports = router;
