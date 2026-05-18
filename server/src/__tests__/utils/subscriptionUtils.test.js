'use strict';

jest.mock('../../models/Finance', () => ({
  Subscription: { findOne: jest.fn() },
  SubscriptionPlan: { findOne: jest.fn() },
}));
jest.mock('../../models/Listing', () => ({
  MandiListing: { countDocuments: jest.fn(), find: jest.fn(), updateMany: jest.fn() },
  PropertyListing: { countDocuments: jest.fn() },
  ServiceListing: { countDocuments: jest.fn() },
}));

const { Subscription, SubscriptionPlan } = require('../../models/Finance');
const { MandiListing, PropertyListing, ServiceListing } = require('../../models/Listing');
const {
  getActiveSubscription,
  getPartnerLimits,
  checkListingLimit,
  checkFeaturedLimit,
  getMandiLimits,
  enforceMandiLimits,
} = require('../../utils/subscriptionUtils');

beforeEach(() => jest.clearAllMocks());

const ACTIVE_SUB = {
  partner_id: 'p1',
  status: 'active',
  ends_at: new Date(Date.now() + 86_400_000),
  plan_snapshot: { listings_limit: 5, featured_listings_limit: 2, leads_limit: 10, name: 'Pro' },
  save: jest.fn().mockResolvedValue({}),
};

describe('getActiveSubscription', () => {
  test('returns active subscription when one exists and is not expired', async () => {
    Subscription.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(ACTIVE_SUB) });
    const result = await getActiveSubscription('p1');
    expect(result).toBe(ACTIVE_SUB);
  });

  test('returns null when no subscription found', async () => {
    Subscription.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });
    const result = await getActiveSubscription('p1');
    expect(result).toBeNull();
  });

  test('marks expired subscription and returns null', async () => {
    const expiredSub = {
      ...ACTIVE_SUB,
      ends_at: new Date(Date.now() - 1000),
      save: jest.fn().mockResolvedValue({}),
    };
    Subscription.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(expiredSub) });
    const result = await getActiveSubscription('p1');
    expect(expiredSub.save).toHaveBeenCalled();
    expect(expiredSub.status).toBe('expired');
    expect(result).toBeNull();
  });
});

describe('getPartnerLimits', () => {
  test('returns plan_snapshot limits when active sub exists', async () => {
    Subscription.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(ACTIVE_SUB) });
    const limits = await getPartnerLimits('p1');
    expect(limits.listings).toBe(5);
    expect(limits.featured).toBe(2);
  });

  test('falls back to free plan when no active sub', async () => {
    Subscription.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });
    SubscriptionPlan.findOne.mockResolvedValue({ listings_limit: 1, featured_listings_limit: 0, leads_limit: 5, name: 'Free' });
    const limits = await getPartnerLimits('p1');
    expect(limits.plan_name).toBe('Free');
  });

  test('returns hardcoded defaults when no free plan in DB', async () => {
    Subscription.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });
    SubscriptionPlan.findOne.mockResolvedValue(null);
    const limits = await getPartnerLimits('p1');
    expect(limits.listings).toBe(1);
    expect(limits.plan_name).toBe('Basic Free');
  });
});

describe('checkListingLimit', () => {
  test('returns allowed:true when under limit', async () => {
    Subscription.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(ACTIVE_SUB) });
    PropertyListing.countDocuments.mockResolvedValue(1);
    ServiceListing.countDocuments.mockResolvedValue(0);
    MandiListing.countDocuments.mockResolvedValue(0);
    const result = await checkListingLimit('p1');
    expect(result.allowed).toBe(true);
  });

  test('returns allowed:false with message when at limit', async () => {
    Subscription.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(ACTIVE_SUB) });
    PropertyListing.countDocuments.mockResolvedValue(3);
    ServiceListing.countDocuments.mockResolvedValue(2);
    MandiListing.countDocuments.mockResolvedValue(0);
    const result = await checkListingLimit('p1');
    expect(result.allowed).toBe(false);
    expect(result.message).toContain('5');
  });

  test('returns allowed:true when listings_limit is -1 (unlimited)', async () => {
    const unlimitedSub = { ...ACTIVE_SUB, plan_snapshot: { ...ACTIVE_SUB.plan_snapshot, listings_limit: -1 } };
    Subscription.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(unlimitedSub) });
    const result = await checkListingLimit('p1');
    expect(result.allowed).toBe(true);
  });
});

describe('checkFeaturedLimit', () => {
  test('returns allowed:false when at featured limit', async () => {
    Subscription.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(ACTIVE_SUB) });
    PropertyListing.countDocuments.mockResolvedValue(1);
    ServiceListing.countDocuments.mockResolvedValue(1);
    MandiListing.countDocuments.mockResolvedValue(0);
    const result = await checkFeaturedLimit('p1');
    expect(result.allowed).toBe(false);
  });
});

describe('enforceMandiLimits', () => {
  test('deactivates listings over the limit', async () => {
    Subscription.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(ACTIVE_SUB) });
    const listings = [
      { _id: 'a', status: 'active' },
      { _id: 'b', status: 'active' },
      { _id: 'c', status: 'active' },
      { _id: 'd', status: 'active' },
      { _id: 'e', status: 'active' },
      { _id: 'f', status: 'active' }, // 6th item, over limit of 5
    ];
    MandiListing.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(listings) });
    MandiListing.updateMany.mockResolvedValue({});
    await enforceMandiLimits('p1');
    expect(MandiListing.updateMany).toHaveBeenCalledWith(
      { _id: { $in: ['f'] } },
      { status: 'inactive' }
    );
  });
});
