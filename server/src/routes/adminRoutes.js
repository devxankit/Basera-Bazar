const express = require('express');
const router = express.Router();

const { findNearestMandiSellers, assignMandiEnquiry } = require('../controllers/adminController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

// ALL Admin routes must be protected and restricted solely to 'super_admin' roles
router.use(protect);
router.use(authorizeRoles('super_admin'));

// The geo-search route requested by the user
router.get('/partners/mandi-search', findNearestMandiSellers);

// The actual assignment logic route
router.put('/enquiries/mandi/:id/assign', assignMandiEnquiry);

module.exports = router;
