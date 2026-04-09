const express = require('express');
const router = express.Router();
const { getNearbyServices, getMandiListings, createPropertyListing, getListingById, getAllListings } = require('../controllers/listingController');

const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

// public routes (No authentication needed to view)
router.get('/', getAllListings);
router.get('/services', getNearbyServices);
router.get('/mandi', getMandiListings);
router.get('/:id', getListingById);

// private routes (Partner specific)
router.post('/properties', protect, authorizeRoles('partner'), createPropertyListing);

module.exports = router;
