const express = require('express');
const router = express.Router();
const { initiateSubscription, verifySubscription, subscriptionCallback, initiateRoleUpgrade, verifyRoleUpgrade, roleUpgradeCallback, cancelSubscription, getMyTransactions, getMyActiveSubscriptions } = require('../controllers/financeController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { financeInitiateSchema, financeVerifySchema, roleUpgradeInitiateSchema, roleUpgradeVerifySchema } = require('../utils/validators');

// Subscription Routes
router.post('/subscription/initiate', protect, authorizeRoles('partner'), validate(financeInitiateSchema), initiateSubscription);
router.post('/subscription/verify', protect, authorizeRoles('partner'), validate(financeVerifySchema), verifySubscription);
router.post('/subscription/callback', subscriptionCallback); // Public redirect POST
router.post('/subscription/cancel', protect, authorizeRoles('partner'), cancelSubscription);

// Role Upgrade Fee Routes (one-time payment to unlock an additional role)
router.post('/role-upgrade/initiate', protect, authorizeRoles('partner'), validate(roleUpgradeInitiateSchema), initiateRoleUpgrade);
router.post('/role-upgrade/verify', protect, authorizeRoles('partner'), validate(roleUpgradeVerifySchema), verifyRoleUpgrade);
router.post('/role-upgrade/callback', roleUpgradeCallback); // Public redirect POST

router.get('/subscriptions/active', protect, authorizeRoles('partner'), getMyActiveSubscriptions);
router.get('/transactions', protect, authorizeRoles('partner'), getMyTransactions);

module.exports = router;
