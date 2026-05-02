const express = require('express');
const router = express.Router();

const { 
  onboardPartner, 
  getMyPartnerProfile, 
  getPartnerStats, 
  addRole, 
  switchRole, 
  deleteRole,
  getPublicPartners,
  getPublicPartnerById,
  getPartnerSubscriptionPlans,
  toggleFeature,
  getActivities
} = require('../controllers/partnerController');

// Import our security middlewares!
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

// -------------------------------------------------------------------------
// PUBLIC ROUTES
// -------------------------------------------------------------------------

router.get('/public', getPublicPartners);
router.get('/public/:id', getPublicPartnerById);

// -------------------------------------------------------------------------
// PROTECTED ROUTES (Only Partners can access these!)
// -------------------------------------------------------------------------

router.post(
  '/onboard', 
  protect,
  authorizeRoles('partner'),
  onboardPartner
);

router.get(
  '/profile',
  protect,
  authorizeRoles('partner'),
  getMyPartnerProfile
);

router.get(
  '/stats',
  protect,
  authorizeRoles('partner'),
  getPartnerStats
);

// Multi-Role Management
router.post(
  '/add-role',
  protect,
  authorizeRoles('partner'),
  addRole
);

router.delete(
  '/delete-role',
  protect,
  authorizeRoles('partner'),
  deleteRole
);

router.put(
  '/switch-role',
  protect,
  authorizeRoles('partner'),
  switchRole
);

// Subscription Plans
router.get(
  '/subscriptions/plans',
  protect,
  authorizeRoles('partner'),
  getPartnerSubscriptionPlans
);

router.put(
  '/toggle-feature',
  protect,
  authorizeRoles('partner'),
  toggleFeature
);

router.get(
  '/activities',
  protect,
  authorizeRoles('partner'),
  getActivities
);

module.exports = router;
