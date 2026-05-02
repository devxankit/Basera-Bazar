const express = require('express');
const router = express.Router();
const { initiateSubscription, verifySubscription } = require('../controllers/financeController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

// Subscription Routes
router.post('/subscription/initiate', protect, authorizeRoles('partner'), initiateSubscription);
router.post('/subscription/verify', protect, authorizeRoles('partner'), verifySubscription);

module.exports = router;
