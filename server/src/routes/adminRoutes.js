const express = require('express');
const router = express.Router();

const { 
  findNearestMandiSellers, 
  assignMandiEnquiry, 
  getDashboardStats, 
  getUsers, 
  getListings, 
  getLeads, 
  getLeadById,
  updateLeadStatus,
  deleteLead,
  getAdminProfile, 
  updateAdminProfile, 
  changeAdminPassword,
  getUserDetail,
  createUser,
  updateUser,
  deleteUser,
  getUserSubscriptionHistory,
  getAllSubscriptions,
  createManualSubscription,
  getAdminActivities,
  getListingDetail,
  updateListingStatus,
  updateListing,
  deleteListing,
  getPendingApprovals,
  getSubscriptionPlans,
  getSubscriptionById,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  getSystemCategories,
  getCategoryDetail,
  createCategory,
  updateCategory,
  deleteCategory,
  getBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
  getUnits,
  getUnitById,
  createUnit,
  updateUnit,
  deleteUnit,
  getProductNames,
  createProductName,
  getBanners,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
  getSubscriptionReport,
  getUserReport,
  createPropertyListing,
  createServiceListing
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
router.get('/subscriptions', getAllSubscriptions);
router.post('/subscriptions', createManualSubscription);

// Listing Management
router.get('/listings/:type', getListings);
router.post('/listings/property', createPropertyListing);
router.post('/listings/service', createServiceListing);
router.get('/listings/detail/:id', getListingDetail);
router.patch('/listings/:id/status', updateListingStatus);
router.put('/listings/:id', updateListing);
router.delete('/listings/:id', deleteListing);

// Lead Management
router.get('/leads', getLeads);
router.get('/leads/:id', getLeadById);
router.put('/leads/:id/status', updateLeadStatus);
router.delete('/leads/:id', deleteLead);

// System Management (Categories, Brands, Units, etc.)
router.get('/system/categories', getSystemCategories);
router.get('/system/categories/:id', getCategoryDetail);
router.post('/system/categories', createCategory);
router.put('/system/categories/:id', updateCategory);
router.delete('/system/categories/:id', deleteCategory);

router.get('/system/brands', getBrands);
router.get('/system/brands/:id', getBrandById);
router.post('/system/brands', createBrand);
router.put('/system/brands/:id', updateBrand);
router.delete('/system/brands/:id', deleteBrand);

router.get('/system/units', getUnits);
router.get('/system/units/:id', getUnitById);
router.post('/system/units', createUnit);
router.put('/system/units/:id', updateUnit);
router.delete('/system/units/:id', deleteUnit);

router.get('/system/product-names', getProductNames);
router.post('/system/product-names', createProductName);

router.get('/system/banners', getBanners);
router.get('/system/banners/:id', getBannerById);
router.post('/system/banners', createBanner);
router.put('/system/banners/:id', updateBanner);
router.delete('/system/banners/:id', deleteBanner);

// Reports
router.get('/reports/payments', getSubscriptionReport); // Overriding current implementation with consistent report
router.get('/reports/subscriptions', getSubscriptionReport);
router.get('/reports/users', getUserReport);



// The geo-search route requested by the user
router.get('/partners/mandi-search', findNearestMandiSellers);

// The actual assignment logic route
router.put('/enquiries/mandi/:id/assign', assignMandiEnquiry);

// Dynamic Form Data Endpoints
// Subscription Plan Management
router.get('/subscriptions/plans', getSubscriptionPlans);
router.get('/subscriptions/:id', getSubscriptionById);
router.post('/subscriptions/plans', createSubscriptionPlan);
router.put('/subscriptions/plans/:id', updateSubscriptionPlan);
router.delete('/subscriptions/plans/:id', deleteSubscriptionPlan);

module.exports = router;
