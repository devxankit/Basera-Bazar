/**
 * Admin controller barrel — re-exports all domain-specific admin controllers.
 * Domain files live under ./admin/ for maintainability.
 */
const dashboard = require('./admin/dashboardController');
const users = require('./admin/usersController');
const listings = require('./admin/listingsController');
const leads = require('./admin/leadsController');
const subscriptions = require('./admin/subscriptionsController');
const system = require('./admin/systemController');
const reports = require('./admin/reportsController');
const mandi = require('./admin/mandiController');
const executives = require('./admin/executiveController');
const notifications = require('./admin/notificationController');

module.exports = {
  // Dashboard
  ...dashboard,

  // Users
  ...users,

  // Listings
  ...listings,

  // Leads
  ...leads,

  // Subscriptions
  ...subscriptions,

  // System (categories, banners, offers, mandi settings)
  ...system,

  // Reports
  ...reports,

  // Mandi / Role requests
  ...mandi,

  // Executives & Withdrawals
  ...executives,

  // Push Notifications
  ...notifications,
};
