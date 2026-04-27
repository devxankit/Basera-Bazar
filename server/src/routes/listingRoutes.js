const express = require('express');
const router = express.Router();
const { 
  getNearbyServices, 
  getMandiListings, 
  createPropertyListing, 
  createServiceListing,
  createMandiListing,
  getListingById, 
  getAllListings, 
  getPublicBanners,
  getPublicCategories,
  getMyListings,
  updateListing,
  deleteListing
} = require('../controllers/listingController');

const { protect, authorizeRoles, optionalProtect } = require('../middlewares/authMiddleware');
const cacheMiddleware = require('../middlewares/cacheMiddleware');
const debounceMiddleware = require('../middlewares/debounceMiddleware');

// public routes (No authentication needed to view)
router.get('/', debounceMiddleware, cacheMiddleware(2), getAllListings);
router.get('/banners', debounceMiddleware, cacheMiddleware(60), getPublicBanners); // Banners change rarely
router.get('/services', debounceMiddleware, cacheMiddleware(5), getNearbyServices);
router.get('/mandi', debounceMiddleware, cacheMiddleware(5), getMandiListings);
router.get('/categories', debounceMiddleware, cacheMiddleware(60), getPublicCategories); // Categories change rarely

// private routes (Partner specific) — MUST be before /:id catch-all!
router.get('/my', protect, authorizeRoles('partner'), getMyListings);
router.post('/properties', protect, authorizeRoles('partner'), createPropertyListing);
router.post('/services', protect, authorizeRoles('partner'), createServiceListing);
router.post('/mandi', protect, authorizeRoles('partner'), createMandiListing);

router.put('/:id', protect, authorizeRoles('partner'), updateListing);
router.delete('/:id', protect, authorizeRoles('partner'), deleteListing);

// Parameterized catch-all — MUST be LAST
router.get('/:id', optionalProtect, getListingById);

module.exports = router;
