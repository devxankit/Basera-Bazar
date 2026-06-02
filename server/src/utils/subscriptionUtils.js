const { Subscription, SubscriptionPlan } = require('../models/Finance');
const { Partner } = require('../models/Partner');
const { MandiListing, PropertyListing, ServiceListing } = require('../models/Listing');

// Which listing model backs each role. Suppliers do not create listings.
const ROLE_LISTING_MODEL = {
    property_agent: PropertyListing,
    service_provider: ServiceListing,
    mandi_seller: MandiListing,
    supplier: null,
};

// Treat unlimited (-1) as the highest possible limit when comparing plans.
const normLimit = (n) => (n === -1 ? Infinity : (typeof n === 'number' ? n : 0));

/**
 * Resolve the role to evaluate limits for. Falls back to the partner's
 * active_role when no explicit role is supplied (keeps older call sites working).
 */
async function resolveRole(partnerId, role) {
    if (role) return role;
    const partner = await Partner.findById(partnerId).select('active_role partner_type roles').lean();
    return partner?.active_role || partner?.partner_type || partner?.roles?.[0] || null;
}

/**
 * Does a subscription apply to a given role?
 * A plan with an empty/absent applicable_to (e.g. a free trial or legacy plan)
 * is treated as the universal free-tier baseline and applies to every role.
 */
function subAppliesToRole(sub, role) {
    const aps = sub?.plan_snapshot?.applicable_to;
    if (!Array.isArray(aps) || aps.length === 0) return true;
    return !role || aps.includes(role);
}

/**
 * Fetch every active/trial subscription for a partner, expiring any that have
 * lapsed. A partner may hold several at once (e.g. an all-roles plan plus a
 * per-role plan).
 */
async function getActiveSubscriptions(partnerId) {
    const subs = await Subscription.find({
        partner_id: partnerId,
        status: { $in: ['active', 'trial'] }
    }).populate('plan_id');

    const now = new Date();
    const valid = [];
    for (const sub of subs) {
        if (sub.ends_at && new Date(sub.ends_at) < now) {
            sub.status = 'expired';
            await sub.save();
            continue;
        }
        valid.push(sub);
    }
    return valid;
}

// Order subscriptions best-first: most generous listing limit, then most recent.
function sortByGenerosity(subs) {
    return [...subs].sort((a, b) => {
        const diff = normLimit(b.plan_snapshot?.listings_limit) - normLimit(a.plan_snapshot?.listings_limit);
        if (diff !== 0) return diff;
        return new Date(b.starts_at || b.createdAt || 0) - new Date(a.starts_at || a.createdAt || 0);
    });
}

/**
 * The best active subscription that covers a specific role, or null when the
 * role is only covered by the free tier.
 */
async function getActiveSubscriptionForRole(partnerId, role) {
    const subs = await getActiveSubscriptions(partnerId);
    const applicable = subs.filter(s => subAppliesToRole(s, role));
    if (applicable.length === 0) return null;
    return sortByGenerosity(applicable)[0];
}

/**
 * Backward-compatible single-subscription lookup. With no role, returns the
 * partner's most generous active subscription (or null).
 */
async function getActiveSubscription(partnerId, role = null) {
    if (role) return getActiveSubscriptionForRole(partnerId, role);
    const subs = await getActiveSubscriptions(partnerId);
    if (subs.length === 0) return null;
    return sortByGenerosity(subs)[0];
}

/**
 * The roles a partner currently has paid/covered access to (union of
 * applicable_to across active subscriptions). Free-tier/legacy subs that apply
 * to all roles are excluded here — coverage means "covered by a chosen plan".
 */
async function getCoveredRoles(partnerId) {
    const subs = await getActiveSubscriptions(partnerId);
    const covered = new Set();
    for (const sub of subs) {
        const aps = sub?.plan_snapshot?.applicable_to;
        if (Array.isArray(aps)) aps.forEach(r => covered.add(r));
    }
    return [...covered];
}

async function getFreeTierLimits() {
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

    // Very restrictive hardcoded fallback if no free plan is configured.
    return { listings: 1, featured: 0, leads: 5, plan_name: 'Basic Free' };
}

/**
 * Limits for a partner scoped to a single role. If a subscription covers the
 * role we use its snapshot; otherwise the role runs on the free tier.
 */
async function getPartnerLimits(partnerId, role = null) {
    const resolvedRole = await resolveRole(partnerId, role);
    const sub = await getActiveSubscriptionForRole(partnerId, resolvedRole);

    if (sub && sub.plan_snapshot) {
        return {
            listings: sub.plan_snapshot.listings_limit !== undefined ? sub.plan_snapshot.listings_limit : -1,
            featured: sub.plan_snapshot.featured_listings_limit !== undefined ? sub.plan_snapshot.featured_listings_limit : 0,
            leads: sub.plan_snapshot.leads_limit !== undefined ? sub.plan_snapshot.leads_limit : 0,
            plan_name: sub.plan_snapshot.name,
            role: resolvedRole
        };
    }

    return { ...(await getFreeTierLimits()), role: resolvedRole };
}

/**
 * Count a single role's listings. `featured` switches to featured-only counting.
 */
async function countRoleListings(partnerId, role, { featured = false } = {}) {
    const Model = ROLE_LISTING_MODEL[role];
    if (!Model) return 0;

    const filter = { partner_id: partnerId, deleted_at: null };
    if (featured) {
        filter.is_featured = true;
        filter.status = { $ne: 'deleted' };
    } else {
        filter.status = { $in: ['active', 'pending_approval'] };
    }
    return Model.countDocuments(filter);
}

/**
 * Checks if a partner can create a new listing for a role (defaults to active_role).
 */
async function checkListingLimit(partnerId, role = null) {
    const resolvedRole = await resolveRole(partnerId, role);
    const limits = await getPartnerLimits(partnerId, resolvedRole);
    if (limits.listings === -1) return { allowed: true };

    const totalActive = await countRoleListings(partnerId, resolvedRole);

    if (totalActive >= limits.listings) {
        return {
            allowed: false,
            message: `You have reached your limit of ${limits.listings} active listings for this role. Please delete an existing listing or upgrade your plan to add more.`,
            limit: limits.listings,
            current: totalActive
        };
    }

    return { allowed: true };
}

/**
 * Checks if a partner can feature more listings for a role (defaults to active_role).
 */
async function checkFeaturedLimit(partnerId, role = null) {
    const resolvedRole = await resolveRole(partnerId, role);
    const limits = await getPartnerLimits(partnerId, resolvedRole);
    if (limits.featured === -1) return { allowed: true };

    const totalFeatured = await countRoleListings(partnerId, resolvedRole, { featured: true });

    if (totalFeatured >= limits.featured) {
        return {
            allowed: false,
            message: `You have reached your limit of ${limits.featured} featured listings for this role. Please un-feature an existing item or upgrade your plan.`,
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
    return getPartnerLimits(partnerId, 'mandi_seller');
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
    getActiveSubscriptions,
    getActiveSubscriptionForRole,
    getCoveredRoles,
    getPartnerLimits,
    getFreeTierLimits,
    checkListingLimit,
    checkFeaturedLimit,
    getMandiLimits,
    enforceMandiLimits,
    subAppliesToRole,
};
