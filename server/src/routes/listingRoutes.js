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
  deleteListing,
  recordListingInteraction
} = require('../controllers/listingController');

const { protect, authorizeRoles, optionalProtect } = require('../middlewares/authMiddleware');
const cacheMiddleware = require('../middlewares/cacheMiddleware');
const debounceMiddleware = require('../middlewares/debounceMiddleware');

// public routes (No authentication needed to view)
router.get('/', debounceMiddleware, cacheMiddleware(2), getAllListings);
router.get('/banners', debounceMiddleware, cacheMiddleware(1), getPublicBanners); // Banners update faster now
router.get('/services', debounceMiddleware, cacheMiddleware(5), getNearbyServices);
router.get('/mandi', debounceMiddleware, cacheMiddleware(5), getMandiListings);
router.get('/categories', debounceMiddleware, cacheMiddleware(60), getPublicCategories); // Categories change rarely

// private routes (Partner specific) — MUST be before /:id catch-all!
router.get('/my', protect, authorizeRoles('partner'), getMyListings);
router.post('/properties', protect, authorizeRoles('partner'), createPropertyListing);
router.post('/services', protect, authorizeRoles('partner'), createServiceListing);
router.post('/mandi', protect, authorizeRoles('partner'), createMandiListing);

router.put('/:id', protect, authorizeRoles('partner', 'admin', 'super_admin', 'SuperAdmin', 'Admin'), updateListing);
router.delete('/:id', protect, authorizeRoles('partner', 'admin', 'super_admin', 'SuperAdmin', 'Admin'), deleteListing);

// Parameterized catch-all — MUST be LAST
router.post('/:id/interaction', recordListingInteraction);
router.get('/:id', optionalProtect, getListingById);

module.exports = router;
