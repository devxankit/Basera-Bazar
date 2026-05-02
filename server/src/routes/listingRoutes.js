const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listingController');

const { protect, authorizeRoles, optionalProtect } = require('../middlewares/authMiddleware');
const cacheMiddleware = require('../middlewares/cacheMiddleware');
const debounceMiddleware = require('../middlewares/debounceMiddleware');

// public routes (No authentication needed to view)
router.get('/', debounceMiddleware, cacheMiddleware(2), listingController.getAllListings);
router.get('/banners', debounceMiddleware, cacheMiddleware(1), listingController.getPublicBanners); // Banners update faster now
router.get('/services', debounceMiddleware, cacheMiddleware(5), listingController.getNearbyServices);
router.get('/mandi', debounceMiddleware, cacheMiddleware(5), listingController.getMandiListings);
router.get('/categories', debounceMiddleware, cacheMiddleware(60), listingController.getPublicCategories); // Categories change rarely

// Seller Attributes (types, sub-types, brands) — public
router.get('/seller-attributes', debounceMiddleware, listingController.getSellerAttributes);

// private routes (Partner specific) — MUST be before /:id catch-all!
router.get('/my', protect, authorizeRoles('partner'), listingController.getMyListings);
router.get('/seller-attributes/my', protect, authorizeRoles('partner'), listingController.getMySellerAttributes);
router.post('/properties', protect, authorizeRoles('partner'), listingController.createPropertyListing);
router.post('/services', protect, authorizeRoles('partner'), listingController.createServiceListing);
router.post('/mandi', protect, authorizeRoles('partner'), listingController.createMandiListing);
router.post('/categories', protect, authorizeRoles('partner'), listingController.createPartnerCategory);
router.delete('/categories/:id', protect, authorizeRoles('partner'), listingController.deletePartnerCategory);
router.post('/seller-attributes', protect, authorizeRoles('partner'), listingController.createSellerAttribute);
router.delete('/seller-attributes/:id', protect, authorizeRoles('partner'), listingController.deleteSellerAttribute);

router.put('/:id', protect, authorizeRoles('partner', 'admin', 'super_admin', 'SuperAdmin', 'Admin'), listingController.updateListing);
router.delete('/:id', protect, authorizeRoles('partner', 'admin', 'super_admin', 'SuperAdmin', 'Admin'), listingController.deleteListing);

// Parameterized catch-all — MUST be LAST
router.post('/:id/interaction', listingController.recordListingInteraction);
router.get('/:id', optionalProtect, listingController.getListingById);

module.exports = router;
