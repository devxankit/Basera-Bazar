const express = require('express');
const router = express.Router();

const { onboardPartner, getMyPartnerProfile, getPartnerStats, addRole, switchRole, deleteRole } = require('../controllers/partnerController');

// Import our security middlewares!
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

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

module.exports = router;
