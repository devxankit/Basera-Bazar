const CacheManager = require('./cache');

/**
 * Cache Invalidator Utility
 * Provides semantic functions to clear specific cache areas 
 * when mutations occur across the platform.
 */
const cacheInvalidator = {
  // -----------------------------------------------------
  // ADMIN CACHE
  // -----------------------------------------------------
  adminDashboard: async () => {
    // Clear all stats, activities, lists
    await CacheManager.clearByPrefix('__express__public:/api/admin');
    await CacheManager.clearByPrefix('__express__user:'); // For any admin-scoped calls
  },

  adminStaff: async () => {
    await CacheManager.clearByPrefix('__express__public:/api/admin/staff');
    await CacheManager.clearByPrefix('__express__user:');
  },
  
  // -----------------------------------------------------
  // PUBLIC / GLOBAL CACHE
  // -----------------------------------------------------
  publicOffers: async () => {
    await CacheManager.clearByPrefix('__express__public:/api/admin/system/offers');
  },
  
  publicPlans: async () => {
    await CacheManager.clearByPrefix('__express__public:/api/admin/subscriptions/plans');
  },

  publicCategories: async () => {
    await CacheManager.clearByPrefix('__express__public:/api/listings/categories');
    await CacheManager.clearByPrefix('__express__public:/api/admin/system/categories');
  },

  publicBanners: async () => {
    await CacheManager.clearByPrefix('__express__public:/api/listings/banners');
    await CacheManager.clearByPrefix('__express__public:/api/admin/system/banners');
  },

  publicListings: async () => {
    // Clears all public marketplace searches/feeds
    await CacheManager.clearByPrefix('__express__public:/api/listings');
    await CacheManager.clearByPrefix('__express__public:/api/mandi');
  },

  // -----------------------------------------------------
  // USER SPECIFIC CACHE
  // -----------------------------------------------------
  executiveProfile: async (executiveId) => {
    if (!executiveId) return;
    await CacheManager.clearByPrefix(`__express__user:${executiveId}:/api/executive`);
  },

  partnerProfile: async (partnerId) => {
    if (!partnerId) return;
    await CacheManager.clearByPrefix(`__express__user:${partnerId}:/api/partners`);
  },

  // Clears the leave list cache for a specific staff member (any role)
  staffLeaves: async (staffId) => {
    if (!staffId) return;
    const id = staffId.toString();
    await Promise.all([
      CacheManager.clearByPrefix(`__express__user:${id}:/api/executive/leaves`),
      CacheManager.clearByPrefix(`__express__user:${id}:/api/office-staff/leaves`),
      CacheManager.clearByPrefix(`__express__user:${id}:/api/team-leader/leaves`),
    ]);
  },

  officeStaffProfile: async (officeStaffId) => {
    if (!officeStaffId) return;
    await CacheManager.clearByPrefix(`__express__user:${officeStaffId}:/api/office-staff`);
  },

  staffProfile: async (staffId, staffType) => {
    if (!staffId) return;
    const id = staffId.toString();
    if (staffType === 'field_executive') {
      await CacheManager.clearByPrefix(`__express__user:${id}:/api/executive`);
    } else if (staffType === 'office_staff') {
      await CacheManager.clearByPrefix(`__express__user:${id}:/api/office-staff`);
    }
  }
};

module.exports = cacheInvalidator;
