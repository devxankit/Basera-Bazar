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
  getPendingApprovals,
  getSubscriptionPlans,
  getSystemCategories
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

// Lead Management
router.get('/leads', getLeads);

// The geo-search route requested by the user
router.get('/partners/mandi-search', findNearestMandiSellers);

// The actual assignment logic route
router.put('/enquiries/mandi/:id/assign', assignMandiEnquiry);

// Dynamic Form Data Endpoints
router.get('/subscriptions/plans', getSubscriptionPlans);
router.get('/system/categories', getSystemCategories);

module.exports = router;
