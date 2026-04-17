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

// Public Marketplace Routes
router.get('/marketplace/home', getMarketplaceHome);
router.get('/marketplace/category/:id', getCategoryListings);

// Seller Management Routes
router.get('/dashboard', protect, getSellerDashboard);
router.patch('/products/:id', protect, updateProductInventory);

module.exports = router;
