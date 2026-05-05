const { Subscription, SubscriptionPlan } = require('../models/Finance');
const { MandiListing, PropertyListing, ServiceListing } = require('../models/Listing');

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
 * Retrieves general limits based on subscription.
 */
async function getPartnerLimits(partnerId) {
    const sub = await getActiveSubscription(partnerId);
    
    if (sub && sub.plan_snapshot) {
        return {
            listings: sub.plan_snapshot.listings_limit !== undefined ? sub.plan_snapshot.listings_limit : -1,
            featured: sub.plan_snapshot.featured_listings_limit !== undefined ? sub.plan_snapshot.featured_listings_limit : 0,
            leads: sub.plan_snapshot.leads_limit !== undefined ? sub.plan_snapshot.leads_limit : 0,
            plan_name: sub.plan_snapshot.name
        };
    }
    
    // Fallback to "Free" plan from DB if it exists
    const freePlan = await SubscriptionPlan.findOne({ 
        $or: [{ name: /Free/i }, { price: 0 }], 
        is_active: true 
    });
    
    if (freePlan) {
        return {
            listings: freePlan.listings_limit,
            featured: freePlan.featured_listings_limit,
            leads: freePlan.leads_limit,
            plan_name: freePlan.name
        };
    }

    // Default hardcoded limits if no plan is found at all (Very restrictive)
    return {
        listings: 1,
        featured: 0,
        leads: 5,
        plan_name: 'Basic Free'
    };
}

/**
 * Checks if a partner can create a new listing.
 */
async function checkListingLimit(partnerId) {
    const limits = await getPartnerLimits(partnerId);
    if (limits.listings === -1) return { allowed: true };

    // Count all active listings across all models for this partner
    const counts = await Promise.all([
        PropertyListing.countDocuments({ partner_id: partnerId, status: { $in: ['active', 'pending_approval'] }, deleted_at: null }),
        ServiceListing.countDocuments({ partner_id: partnerId, status: { $in: ['active', 'pending_approval'] }, deleted_at: null }),
        MandiListing.countDocuments({ partner_id: partnerId, status: { $in: ['active', 'pending_approval'] }, deleted_at: null })
    ]);

    const totalActive = counts.reduce((a, b) => a + b, 0);

    if (totalActive >= limits.listings) {
        return { 
            allowed: false, 
            message: `You have reached your limit of ${limits.listings} active listings. Please delete an existing listing or upgrade your plan to add more.`,
            limit: limits.listings,
            current: totalActive
        };
    }

    return { allowed: true };
}

/**
 * Checks if a partner can feature more listings.
 */
async function checkFeaturedLimit(partnerId) {
    const limits = await getPartnerLimits(partnerId);
    if (limits.featured === -1) return { allowed: true };

    const counts = await Promise.all([
        PropertyListing.countDocuments({ partner_id: partnerId, is_featured: true, status: { $ne: 'deleted' }, deleted_at: null }),
        ServiceListing.countDocuments({ partner_id: partnerId, is_featured: true, status: { $ne: 'deleted' }, deleted_at: null }),
        MandiListing.countDocuments({ partner_id: partnerId, is_featured: true, status: { $ne: 'deleted' }, deleted_at: null })
    ]);

    const totalFeatured = counts.reduce((a, b) => a + b, 0);

    if (totalFeatured >= limits.featured) {
        return { 
            allowed: false, 
            message: `You have reached your limit of ${limits.featured} featured listings. Please un-feature an existing item or upgrade your plan.`,
            limit: limits.featured,
            current: totalFeatured
        };
    }

    return { allowed: true };
}

/**
 * Legacy support for Mandi-specific calls
 */
async function getMandiLimits(partnerId) {
    return getPartnerLimits(partnerId);
}

async function enforceMandiLimits(partnerId) {
    // We can keep this for auto-cleanup if plans change, but creation-time checks are better.
    const limits = await getMandiLimits(partnerId);
    if (limits.listings === -1) return;

    const activeListings = await MandiListing.find({ 
        partner_id: partnerId, 
        status: 'active',
        deleted_at: null 
    }).sort({ createdAt: 1 });

    if (activeListings.length > limits.listings) {
        const toDeactivate = activeListings.slice(limits.listings);
        const ids = toDeactivate.map(l => l._id);
        await MandiListing.updateMany({ _id: { $in: ids } }, { status: 'inactive' });
    }
}

module.exports = {
    getActiveSubscription,
    getPartnerLimits,
    checkListingLimit,
    checkFeaturedLimit,
    getMandiLimits,
    enforceMandiLimits
};
