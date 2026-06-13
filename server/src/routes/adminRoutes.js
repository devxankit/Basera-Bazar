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
  getBanners,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
  getSubscriptionReport,
  getUserReport,
  getTransactionLedger,
  getFinancialStats,
  createPropertyListing,
  createServiceListing,
  updateSubscriptionStatus,
  getMandiSettings,
  updateMandiSettings,
  processRoleRequest,
  getRoleRequests,
  getOfferConfig,
  updateOfferConfig,
  getAllExecutives,
  getExecutiveDetail,
  updateExecutiveStatus,
  toggleExecutiveActiveStatus,
  deleteExecutive,
  resetExecutiveKyc,
  getWithdrawalRequests,
  updateWithdrawalStatus,
  getExecutiveSettings,
  updateExecutiveSettings,
  getSupplierCategories,
  getSupplierCategoryDetail,
  createSupplierCategory,
  updateSupplierCategory,
  deleteSupplierCategory,
  validateReferralCode,
  createDailyTask,
  getDailyTaskHistory,
  getTodayTaskProgress,
  setExecutiveSalary,
  getMonthlyPerformance,
  getSalaryRecords,
  markSalaryPaid,
  triggerMonthlyDeduction,
  getBadgeCounts,
  getPageContent,
  updatePageContent,
  searchRecipients,
  sendPushBroadcast,
  getBroadcastHistory
} = require('../controllers/adminController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');
const cacheMiddleware = require('../middlewares/cacheMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { idParamSchema } = require('../utils/validators');

// Publicly readable system data
// Partners need to see plans and active offers during registration
router.get('/subscriptions/plans', getSubscriptionPlans);
router.get('/system/offers', getOfferConfig);
router.post('/system/validate-referral', validateReferralCode);
router.get('/mandi/settings', getMandiSettings);
router.get('/system/page-content', getPageContent);

// ALL Admin routes below this point must be protected and restricted to super_admin
router.use(protect);
router.use(authorizeRoles('super_admin'));

// Dashboard Stats & Feeds
router.get('/dashboard/stats', cacheMiddleware(2, true), getDashboardStats);
router.get('/dashboard/badge-counts', cacheMiddleware(2, true), getBadgeCounts);
router.get('/dashboard/activities', cacheMiddleware(1, true), getAdminActivities);
router.get('/dashboard/pending/:type', cacheMiddleware(2, true), getPendingApprovals);

// Admin Profile Management
router.get('/profile/me', getAdminProfile);
router.put('/profile/update', updateAdminProfile);
router.put('/profile/change-password', changeAdminPassword);

// User Management
const vId = validate(idParamSchema, 'params');
router.get('/users', getUsers);
router.get('/users/:id', vId, getUserDetail);
router.post('/users', createUser);
router.put('/users/:id', vId, updateUser);
router.delete('/users/:id', vId, deleteUser);
router.get('/users/:id/subscriptions', vId, getUserSubscriptionHistory);
router.get('/subscriptions', getAllSubscriptions);
router.post('/subscriptions', createManualSubscription);

// Listing Management
router.get('/listings/:type', getListings);
router.post('/listings/property', createPropertyListing);
router.post('/listings/service', createServiceListing);
router.get('/listings/detail/:id', vId, getListingDetail);
router.patch('/listings/:id/status', vId, updateListingStatus);
router.put('/listings/:id', vId, updateListing);
router.delete('/listings/:id', vId, deleteListing);

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

// Supplier Category Management
router.get('/system/supplier-categories', getSupplierCategories);
router.get('/system/supplier-categories/:id', getSupplierCategoryDetail);
router.post('/system/supplier-categories', createSupplierCategory);
router.put('/system/supplier-categories/:id', updateSupplierCategory);
router.delete('/system/supplier-categories/:id', deleteSupplierCategory);



router.get('/system/banners', getBanners);
router.get('/system/banners/:id', getBannerById);
router.post('/system/banners', createBanner);
router.put('/system/banners/:id', updateBanner);
router.delete('/system/banners/:id', deleteBanner);

// Reports
router.get('/reports/transactions', getTransactionLedger);
router.get('/reports/financial-stats', getFinancialStats);
router.get('/reports/payments', getTransactionLedger); // Consistent with transactions
router.get('/reports/subscriptions', getSubscriptionReport);
router.get('/reports/users', getUserReport);



// The geo-search route requested by the user
router.get('/partners/mandi-search', findNearestMandiSellers);

// The actual assignment logic route
router.put('/enquiries/mandi/:id/assign', assignMandiEnquiry);

// Partner Role Upgrade Management
router.get('/partners/role-requests', getRoleRequests);
router.post('/partners/role-request-action', processRoleRequest);

// Mandi Marketplace Global Settings
router.put('/mandi/settings', updateMandiSettings);

// Offer Management
router.put('/system/offers', updateOfferConfig);

// Page Content (Help & Privacy) Management
router.put('/system/page-content', updatePageContent);

// Executive Management
router.get('/executives', getAllExecutives);
router.get('/executives/config/settings', getExecutiveSettings);
router.put('/executives/config/settings', updateExecutiveSettings);

// Executive Daily Tasks
router.get('/executives/tasks/today', getTodayTaskProgress);
router.get('/executives/tasks', getDailyTaskHistory);
router.post('/executives/tasks', createDailyTask);

// Executive Salary
router.get('/executives/performance', getMonthlyPerformance);
router.get('/executives/salary-records', getSalaryRecords);
router.put('/executives/salary-records/:id/pay', markSalaryPaid);
router.post('/executives/process-monthly', triggerMonthlyDeduction);

// Parameterized Executive Routes (Must come after sub-resource routes)
router.get('/executives/:id', getExecutiveDetail);
router.patch('/executives/:id/status', updateExecutiveStatus);
router.patch('/executives/:id/toggle-active', toggleExecutiveActiveStatus);
router.delete('/executives/:id', deleteExecutive);
router.post('/executives/:id/reset-kyc', resetExecutiveKyc);
router.put('/executives/:id/salary', setExecutiveSalary);

// Withdrawal Requests
router.get('/withdrawals', getWithdrawalRequests);
router.patch('/withdrawals/:id/status', updateWithdrawalStatus);

// Push Notifications
router.get('/push-notifications/search-recipients', searchRecipients);
router.post('/push-notifications/send', sendPushBroadcast);
router.get('/push-notifications/history', getBroadcastHistory);

// Dynamic Form Data Endpoints
// Subscription Plan Management
router.get('/subscriptions/plans', getSubscriptionPlans);
router.post('/subscriptions/plans', createSubscriptionPlan);
router.get('/subscriptions/:id', getSubscriptionById);
router.put('/subscriptions/plans/:id', updateSubscriptionPlan);
router.delete('/subscriptions/plans/:id', deleteSubscriptionPlan);
router.patch('/subscriptions/:id/status', updateSubscriptionStatus);

module.exports = router;
