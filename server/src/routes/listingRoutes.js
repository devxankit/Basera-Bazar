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
  getPublicCategories
} = require('../controllers/listingController');

const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

// public routes (No authentication needed to view)
router.get('/', getAllListings);
router.get('/banners', getPublicBanners);
router.get('/services', getNearbyServices);
router.get('/mandi', getMandiListings);
router.get('/categories', getPublicCategories);
router.get('/:id', getListingById);

// private routes (Partner specific)
router.post('/properties', protect, authorizeRoles('partner'), createPropertyListing);
router.post('/services', protect, authorizeRoles('partner'), createServiceListing);
router.post('/suppliers', protect, authorizeRoles('partner'), createSupplierListing);

module.exports = router;
