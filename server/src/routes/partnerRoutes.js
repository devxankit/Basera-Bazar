const express = require('express');
const router = express.Router();

const { onboardPartner, getMyPartnerProfile, getPartnerStats } = require('../controllers/partnerController');

// Import our security middlewares!
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

// -------------------------------------------------------------------------
// PROTECTED ROUTES (Only Partners can access these!)
// Notice how we put `protect` and `authorizeRoles('partner')` BEFORE the controller.
// If the user fails those checks, Express never even runs the controller.
// -------------------------------------------------------------------------

router.post(
  '/onboard', 
  protect, // 1. Must be logged in (Provides req.user)
  authorizeRoles('partner'), // 2. Must specifically have the 'partner' role
  onboardPartner // 3. Finally, run the DB logic
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

module.exports = router;
