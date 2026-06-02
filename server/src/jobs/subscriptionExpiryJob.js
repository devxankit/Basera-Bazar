const logger = require('../utils/logger');
const { Partner } = require('../models/Partner');
const { Subscription } = require('../models/Finance');
const { ServiceListing, PropertyListing, MandiListing } = require('../models/Listing');
const { createNotification } = require('../utils/notificationHelper');
const { getActiveSubscriptions } = require('../utils/subscriptionUtils');
const invalidate = require('../utils/cacheInvalidator');

// Deactivate all active listings for a partner and tag them so we can restore on renewal
const deactivatePartnerListings = async (partnerId) => {
  const filter = { partner_id: partnerId, status: 'active' };
  const update = { $set: { status: 'inactive', status_reason: 'subscription_expired' } };
  const [svc, prop, mandi] = await Promise.all([
    ServiceListing.updateMany(filter, update),
    PropertyListing.updateMany(filter, update),
    MandiListing.updateMany(filter, update),
  ]);
  return svc.modifiedCount + prop.modifiedCount + mandi.modifiedCount;
};

// Expire a single partner (mark expired, deactivate listings, notify)
const expirePartner = async (partner, reason) => {
  const listingsDeactivated = await deactivatePartnerListings(partner._id);

  await Partner.findByIdAndUpdate(partner._id, {
    $set: {
      subscription_expired: true,
      subscription_expired_at: new Date(),
      active_subscription_id: null,
    },
  });

  // Fire-and-forget notification — don't let a notification failure abort the job
  createNotification(
    'partner',
    partner._id,
    'Subscription Expired',
    reason === 'trial'
      ? 'Your free trial has ended. Renew your subscription to keep your listings active and receive leads.'
      : 'Your subscription has expired. Renew now to reactivate your listings and continue receiving leads.',
    { type: 'subscription_expired' }
  ).catch((err) => logger.error({ err }, '[EXPIRY] Notification failed'));

  logger.info(
    `[EXPIRY] Partner ${partner._id} (${partner.name}) expired. Reason: ${reason}. Listings deactivated: ${listingsDeactivated}`
  );
};

const runSubscriptionExpiryJob = async () => {
  logger.info('[EXPIRY] Running subscription expiry check...');
  const now = new Date();

  // Find all active or trial subscriptions that have passed their ends_at
  // (Trial subscriptions now have real Subscription docs with ends_at set at approval time)
  const expiredSubs = await Subscription.find({
    status: { $in: ['active', 'trial'] },
    ends_at: { $lte: now },
  }).lean();

  let processed = 0;
  const handledPartners = new Set();
  for (const sub of expiredSubs) {
    try {
      // Atomic update: only succeeds if status is still active/trial (prevents double-processing)
      const updated = await Subscription.findOneAndUpdate(
        { _id: sub._id, status: { $in: ['active', 'trial'] } },
        { $set: { status: 'expired' } },
        { new: true }
      );
      if (!updated) continue; // Already processed by another instance

      // Process each partner at most once per run (a partner may hold several subs)
      const partnerKey = String(sub.partner_id);
      if (handledPartners.has(partnerKey)) continue;
      handledPartners.add(partnerKey);

      const partner = await Partner.findById(sub.partner_id);
      if (!partner) continue;

      // A partner may hold multiple concurrent subscriptions. Only lock them out
      // when NONE remain active — otherwise the surviving plan(s) keep them
      // covered (uncovered roles simply fall back to the free tier).
      const remaining = await getActiveSubscriptions(partner._id);

      if (remaining.length === 0) {
        if (partner.subscription_expired !== true) {
          await expirePartner(partner, sub.plan_snapshot?.price > 0 ? 'paid' : 'trial');
          processed++;
        }
      } else if (String(partner.active_subscription_id) !== String(remaining[0]._id)) {
        // Keep the legacy pointer valid by aiming it at a surviving subscription.
        await Partner.findByIdAndUpdate(partner._id, { $set: { active_subscription_id: remaining[0]._id } });
      }
    } catch (err) {
      logger.error({ err }, `[EXPIRY] Failed to expire subscription ${sub._id}`);
    }
  }

  if (processed > 0) {
    invalidate.publicListings().catch(() => {});
    invalidate.adminDashboard().catch(() => {});
  }

  logger.info(`[EXPIRY] Done. Subscriptions expired: ${processed} of ${expiredSubs.length} found.`);
};

const scheduleSubscriptionExpiryJob = () => {
  // Run once on startup after DB connection settles
  setTimeout(() => {
    runSubscriptionExpiryJob().catch((err) =>
      logger.error({ err }, '[EXPIRY] Startup run failed')
    );
  }, 15000);

  // Then run every hour
  setInterval(() => {
    runSubscriptionExpiryJob().catch((err) =>
      logger.error({ err }, '[EXPIRY] Interval run failed')
    );
  }, 60 * 60 * 1000);
};

module.exports = { scheduleSubscriptionExpiryJob, runSubscriptionExpiryJob };
