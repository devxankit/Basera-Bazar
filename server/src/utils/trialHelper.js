const logger = require('./logger');
const { Partner } = require('../models/Partner');
const { Subscription, SubscriptionPlan } = require('../models/Finance');
const invalidate = require('./cacheInvalidator');

/**
 * Create a real free-trial Subscription document for a partner and link it
 * as their active_subscription_id. Safe to call multiple times — skips if
 * the partner already has an active subscription.
 */
const grantFreeTrial = async (partnerId) => {
  try {
    // Skip if already has a subscription
    const partner = await Partner.findById(partnerId).select('active_subscription_id createdAt');
    if (!partner) return null;
    if (partner.active_subscription_id) return null;

    const freePlan = await SubscriptionPlan.findOne({ price: 0 })
      .sort({ duration_days: -1 })
      .lean();

    const freePlanDays = freePlan?.duration_days || 30;
    const startsAt = partner.createdAt || new Date();
    const endsAt = new Date(startsAt.getTime() + freePlanDays * 24 * 60 * 60 * 1000);

    const snapshot = freePlan
      ? {
          name: freePlan.name,
          price: 0,
          duration_days: freePlan.duration_days,
          listings_limit: freePlan.listings_limit,
          featured_listings_limit: freePlan.featured_listings_limit,
          leads_limit: freePlan.leads_limit,
        }
      : {
          name: 'Free Trial',
          price: 0,
          duration_days: freePlanDays,
          listings_limit: 1,
          featured_listings_limit: 0,
          leads_limit: 50,
        };

    const sub = await Subscription.create({
      partner_id: partnerId,
      plan_id: freePlan?._id || null,
      plan_snapshot: snapshot,
      status: 'trial',
      starts_at: startsAt,
      ends_at: endsAt,
      granted_by_admin: true,
    });

    await Partner.findByIdAndUpdate(partnerId, {
      $set: { active_subscription_id: sub._id },
    });

    await invalidate.partnerProfile(partnerId);

    logger.info(`[TRIAL] Free trial created for partner ${partnerId} — expires ${endsAt.toISOString()}`);
    return sub;
  } catch (err) {
    logger.error({ err }, `[TRIAL] Failed to grant free trial for partner ${partnerId}`);
    return null;
  }
};

module.exports = { grantFreeTrial };
