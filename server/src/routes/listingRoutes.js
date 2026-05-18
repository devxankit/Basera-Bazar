const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listingController');
const serviceListingController = require('../controllers/serviceListingController');
const propertyListingController = require('../controllers/propertyListingController');
const mandiListingController = require('../controllers/mandiListingController');

const { protect, authorizeRoles, optionalProtect, verifyApproved } = require('../middlewares/authMiddleware');
const cacheMiddleware = require('../middlewares/cacheMiddleware');
const debounceMiddleware = require('../middlewares/debounceMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { listingCategorySchema, idParamSchema } = require('../utils/validators');

// public routes (No authentication needed to view)
router.get('/', debounceMiddleware, cacheMiddleware(2), listingController.getAllListings);
router.get('/banners', debounceMiddleware, cacheMiddleware(1), listingController.getPublicBanners); // Banners update faster now
router.get('/services', debounceMiddleware, cacheMiddleware(5), serviceListingController.getNearbyServices);
router.get('/mandi', debounceMiddleware, cacheMiddleware(5), mandiListingController.getMandiListings);
router.get('/categories', debounceMiddleware, cacheMiddleware(60), listingController.getPublicCategories); // Categories change rarely

// Seller Attributes (types, sub-types, brands) — public
router.get('/seller-attributes', debounceMiddleware, cacheMiddleware(5, false), listingController.getSellerAttributes);

// private routes (Partner specific) — MUST be before /:id catch-all!
router.get('/my', protect, authorizeRoles('partner'), cacheMiddleware(5, true), listingController.getMyListings);
router.get('/seller-attributes/my', protect, authorizeRoles('partner'), cacheMiddleware(10, true), listingController.getMySellerAttributes);
router.post('/properties', protect, authorizeRoles('partner'), verifyApproved, propertyListingController.createPropertyListing);
router.post('/services', protect, authorizeRoles('partner'), verifyApproved, serviceListingController.createServiceListing);
router.post('/mandi', protect, authorizeRoles('partner'), verifyApproved, mandiListingController.createMandiListing);
router.post('/categories', protect, authorizeRoles('partner'), verifyApproved, validate(listingCategorySchema), mandiListingController.createPartnerCategory);
router.delete('/categories/:id', protect, authorizeRoles('partner'), verifyApproved, validate(idParamSchema, 'params'), mandiListingController.deletePartnerCategory);
router.post('/seller-attributes', protect, authorizeRoles('partner'), verifyApproved, listingController.createSellerAttribute);
router.delete('/seller-attributes/:id', protect, authorizeRoles('partner'), verifyApproved, listingController.deleteSellerAttribute);

router.put('/:id', protect, authorizeRoles('partner', 'admin', 'super_admin', 'SuperAdmin', 'Admin'), verifyApproved, listingController.updateListing);
router.patch('/:id/toggle-featured', protect, authorizeRoles('partner'), verifyApproved, listingController.toggleFeaturedListing);
router.delete('/:id', protect, authorizeRoles('partner', 'admin', 'super_admin', 'SuperAdmin', 'Admin'), listingController.deleteListing);

// Parameterized catch-all — MUST be LAST
router.post('/:id/interaction', listingController.recordListingInteraction);
router.get('/:id', optionalProtect, cacheMiddleware(5, false), listingController.getListingById);

module.exports = router;
