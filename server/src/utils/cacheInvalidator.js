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
  }
};

module.exports = cacheInvalidator;
