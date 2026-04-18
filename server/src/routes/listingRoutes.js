const express = require('express');
const router = express.Router();
const { 
  getNearbyServices, 
  getMandiListings, 
  createPropertyListing, 
  createServiceListing,
  createSupplierListing,
  getListingById, 
  getAllListings, 
  getPublicBanners,
  getPublicCategories,
  getMyListings
} = require('../controllers/listingController');

const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

// public routes (No authentication needed to view)
router.get('/', getAllListings);
router.get('/banners', getPublicBanners);
router.get('/services', getNearbyServices);
router.get('/mandi', getMandiListings);
router.get('/categories', getPublicCategories);

// private routes (Partner specific) — MUST be before /:id catch-all!
router.get('/my', protect, authorizeRoles('partner'), getMyListings);
router.post('/properties', protect, authorizeRoles('partner'), createPropertyListing);
router.post('/services', protect, authorizeRoles('partner'), createServiceListing);
router.post('/suppliers', protect, authorizeRoles('partner'), createSupplierListing);

// Parameterized catch-all — MUST be LAST
router.get('/:id', getListingById);

module.exports = router;
