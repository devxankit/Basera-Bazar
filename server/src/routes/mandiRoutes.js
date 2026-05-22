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
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const cacheMiddleware = require('../middlewares/cacheMiddleware');
const debounceMiddleware = require('../middlewares/debounceMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { mandiInventorySchema, idParamSchema } = require('../utils/validators');

// Public Marketplace Routes
router.get('/marketplace/home', debounceMiddleware, cacheMiddleware(10), getMarketplaceHome);
router.get('/marketplace/category/:id', debounceMiddleware, cacheMiddleware(5), getCategoryListings);

// Seller Management Routes (partner only)
router.get('/dashboard', protect, authorizeRoles('partner'), getSellerDashboard);
router.patch('/products/:id', protect, authorizeRoles('partner'), validate(idParamSchema, 'params'), validate(mandiInventorySchema), updateProductInventory);

module.exports = router;
