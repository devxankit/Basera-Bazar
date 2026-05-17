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
  getActivities,
  getPartnerSubscriptionLimits
} = require('../controllers/partnerController');

const { protect, authorizeRoles } = require('../middlewares/authMiddleware');
const cacheMiddleware = require('../middlewares/cacheMiddleware');
const validate = require('../middlewares/validateMiddleware');
const {
  partnerRegistrationSchema,
  partnerAddRoleSchema,
  partnerDeleteRoleSchema,
  partnerSwitchRoleSchema,
} = require('../utils/validators');

// -------------------------------------------------------------------------
// PUBLIC ROUTES
// -------------------------------------------------------------------------

router.get('/public', cacheMiddleware(5, false), getPublicPartners);
router.get('/public/:id', cacheMiddleware(10, false), getPublicPartnerById);

// -------------------------------------------------------------------------
// PROTECTED ROUTES (Only Partners can access these!)
// -------------------------------------------------------------------------

router.post(
  '/onboard', 
  protect,
  authorizeRoles('partner'),
  validate(partnerRegistrationSchema),
  onboardPartner
);

router.get(
  '/profile',
  protect,
  authorizeRoles('partner'),
  cacheMiddleware(10, true),
  getMyPartnerProfile
);

router.get(
  '/stats',
  protect,
  authorizeRoles('partner'),
  cacheMiddleware(5, true),
  getPartnerStats
);

// Multi-Role Management
router.post(
  '/add-role',
  protect,
  authorizeRoles('partner'),
  validate(partnerAddRoleSchema),
  addRole
);

router.delete(
  '/delete-role',
  protect,
  authorizeRoles('partner'),
  validate(partnerDeleteRoleSchema),
  deleteRole
);

router.put(
  '/switch-role',
  protect,
  authorizeRoles('partner'),
  validate(partnerSwitchRoleSchema),
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
  cacheMiddleware(3, true),
  getActivities
);

router.get(
  '/subscription/limits',
  protect,
  authorizeRoles('partner'),
  cacheMiddleware(5, true),
  getPartnerSubscriptionLimits
);

module.exports = router;
