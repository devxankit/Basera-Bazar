// File: server/src/routes/mandiRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getSellerDashboard, 
  updateProductInventory, 
  getMarketplaceHome, 
  getCategoryListings 
} = require('../controllers/mandiController');
const { protect } = require('../middlewares/authMiddleware');
const cacheMiddleware = require('../middlewares/cacheMiddleware');
const debounceMiddleware = require('../middlewares/debounceMiddleware');

// Public Marketplace Routes
router.get('/marketplace/home', debounceMiddleware, cacheMiddleware(10), getMarketplaceHome);
router.get('/marketplace/category/:id', debounceMiddleware, cacheMiddleware(5), getCategoryListings);

// Seller Management Routes
router.get('/dashboard', protect, getSellerDashboard);
router.patch('/products/:id', protect, updateProductInventory);

module.exports = router;
