const express = require('express');
const router = express.Router();

const { 
  findNearestMandiSellers, 
  assignMandiEnquiry, 
  getDashboardStats, 
  getUsers, 
  getListings, 
  getLeads, 
  getAdminProfile, 
  updateAdminProfile, 
  changeAdminPassword,
  getUserDetail,
  createUser,
  updateUser,
  deleteUser,
  getUserSubscriptionHistory,
  getAdminActivities,
  getListingDetail,
  updateListingStatus,
  updateListing,
  deleteListing,
  getPendingApprovals,
  getSubscriptionPlans,
  getSystemCategories,
  getCategoryDetail,
  createCategory,
  updateCategory,
  deleteCategory,
  getBrands,
  createBrand,
  getUnits,
  createUnit,
  getProductNames,
  createProductName,
  getBanners,
  createBanner,
  getSubscriptionReport,
  getUserReport,
  createPropertyListing
} = require('../controllers/adminController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

// ALL Admin routes must be protected and restricted solely to 'super_admin' roles
router.use(protect);
router.use(authorizeRoles('super_admin'));

// Dashboard Stats & Feeds
router.get('/dashboard/stats', getDashboardStats);
router.get('/dashboard/activities', getAdminActivities);
router.get('/dashboard/pending/:type', getPendingApprovals);

// Admin Profile Management
router.get('/profile/me', getAdminProfile);
router.put('/profile/update', updateAdminProfile);
router.put('/profile/change-password', changeAdminPassword);

// User Management
router.get('/users', getUsers);
router.get('/users/:id', getUserDetail);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/users/:id/subscriptions', getUserSubscriptionHistory);

// Listing Management
router.get('/listings/:type', getListings);
router.post('/listings/property', createPropertyListing);
router.get('/listings/detail/:id', getListingDetail);
router.patch('/listings/:id/status', updateListingStatus);
router.put('/listings/:id', updateListing);
router.delete('/listings/:id', deleteListing);

// Lead Management
router.get('/leads', getLeads);

// System Management (Categories, Brands, Units, etc.)
router.get('/system/categories', getSystemCategories);
router.get('/system/categories/:id', getCategoryDetail);
router.post('/system/categories', createCategory);
router.put('/system/categories/:id', updateCategory);
router.delete('/system/categories/:id', deleteCategory);

router.get('/system/brands', getBrands);
router.post('/system/brands', createBrand);

router.get('/system/units', getUnits);
router.post('/system/units', createUnit);

router.get('/system/product-names', getProductNames);
router.post('/system/product-names', createProductName);

router.get('/system/banners', getBanners);
router.post('/system/banners', createBanner);

// Reports
router.get('/reports/payments', getSubscriptionReport); // Overriding current implementation with consistent report
router.get('/reports/subscriptions', getSubscriptionReport);
router.get('/reports/users', getUserReport);

// System Maintenance
router.post('/maintenance/clear-cache', (req, res) => {
  res.status(200).json({ success: true, message: 'System cache cleared successfully (Mock)' });
});

// The geo-search route requested by the user
router.get('/partners/mandi-search', findNearestMandiSellers);

// The actual assignment logic route
router.put('/enquiries/mandi/:id/assign', assignMandiEnquiry);

// Dynamic Form Data Endpoints
router.get('/subscriptions/plans', getSubscriptionPlans);

module.exports = router;
