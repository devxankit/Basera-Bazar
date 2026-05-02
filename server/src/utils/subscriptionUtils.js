const { Subscription, SubscriptionPlan } = require('../models/Finance');
const { MandiListing } = require('../models/Listing');

/**
 * Fetches the active subscription for a partner and handles expiry logic.
 */
async function getActiveSubscription(partnerId) {
    // Find active or trial subscription
    const sub = await Subscription.findOne({ 
        partner_id: partnerId, 
        status: { $in: ['active', 'trial'] } 
    }).populate('plan_id');
    
    if (!sub) return null;
    
    // Check for expiry
    if (sub.ends_at && new Date(sub.ends_at) < new Date()) {
        sub.status = 'expired';
        await sub.save();
        return null;
    }
    
    return sub;
}

/**
 * Retrieves Mandi-specific limits based on subscription.
 */
async function getMandiLimits(partnerId) {
    const sub = await getActiveSubscription(partnerId);
    
    if (sub && sub.plan_snapshot) {
        return {
            listings: sub.plan_snapshot.listings_limit || -1,
            featured: sub.plan_snapshot.featured_listings_limit || 0,
            plan_name: sub.plan_snapshot.name
        };
    }
    
    // Fallback to "Free Trail" plan from DB if it exists
    const freePlan = await SubscriptionPlan.findOne({ name: /Free/i, is_active: true });
    if (freePlan) {
        return {
            listings: freePlan.listings_limit,
            featured: freePlan.featured_listings_limit,
            plan_name: freePlan.name
        };
    }

    // Default hardcoded limits if no plan is found at all
    return {
        listings: 1,
        featured: 0,
        plan_name: 'Basic'
    };
}

/**
 * Enforces subscription limits by deactivating extra listings.
 */
async function enforceMandiLimits(partnerId) {
    const limits = await getMandiLimits(partnerId);
    
    // 1. Enforce Listing Count Limit
    if (limits.listings !== -1) {
        const activeListings = await MandiListing.find({ 
            partner_id: partnerId, 
            status: 'active',
            deleted_at: null 
        }).sort({ createdAt: 1 }); // Keep the oldest ones active

        if (activeListings.length > limits.listings) {
            const toDeactivate = activeListings.slice(limits.listings);
            const ids = toDeactivate.map(l => l._id);
            await MandiListing.updateMany(
                { _id: { $in: ids } },
                { status: 'inactive' }
            );
        }
    }

    // 2. Enforce Featured Ads Limit
    const featuredListings = await MandiListing.find({
        partner_id: partnerId,
        status: 'active',
        is_featured: true,
        deleted_at: null
    }).sort({ createdAt: 1 });

    if (limits.featured !== -1 && featuredListings.length > limits.featured) {
        const toUnfeature = featuredListings.slice(limits.featured);
        const ids = toUnfeature.map(l => l._id);
        await MandiListing.updateMany(
            { _id: { $in: ids } },
            { is_featured: false }
        );
    }
}

module.exports = {
    getActiveSubscription,
    getMandiLimits,
    enforceMandiLimits
};
