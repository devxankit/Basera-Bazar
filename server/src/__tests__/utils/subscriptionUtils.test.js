'use strict';

jest.mock('../../models/Finance', () => ({
  Subscription: { find: jest.fn() },
  SubscriptionPlan: { findOne: jest.fn() },
}));
jest.mock('../../models/Listing', () => ({
  MandiListing: { countDocuments: jest.fn(), find: jest.fn(), updateMany: jest.fn() },
  PropertyListing: { countDocuments: jest.fn() },
  ServiceListing: { countDocuments: jest.fn() },
}));
jest.mock('../../models/Partner', () => ({
  Partner: { findById: jest.fn() },
}));

const { Subscription, SubscriptionPlan } = require('../../models/Finance');
const { MandiListing, PropertyListing, ServiceListing } = require('../../models/Listing');
const { Partner } = require('../../models/Partner');
const {
  getActiveSubscription,
  getActiveSubscriptionForRole,
  getCoveredRoles,
  getPartnerLimits,
  checkListingLimit,
  checkFeaturedLimit,
  enforceMandiLimits,
} = require('../../utils/subscriptionUtils');

beforeEach(() => jest.clearAllMocks());

// Helpers to wire up the chained mongoose calls used by the util.
const mockSubsFind = (subs) => {
  Subscription.find.mockReturnValue({ populate: jest.fn().mockResolvedValue(subs) });
};
const mockActiveRole = (role) => {
  Partner.findById.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ active_role: role }) }) });
};

const makeSub = (overrides = {}) => ({
  partner_id: 'p1',
  status: 'active',
  ends_at: new Date(Date.now() + 86_400_000),
  starts_at: new Date(),
  plan_snapshot: { listings_limit: 5, featured_listings_limit: 2, leads_limit: 10, name: 'Pro', applicable_to: ['property_agent'] },
  save: jest.fn().mockResolvedValue({}),
  ...overrides,
});

describe('getActiveSubscription', () => {
  test('returns the most generous active subscription', async () => {
    const small = makeSub({ plan_snapshot: { listings_limit: 2, name: 'Lite', applicable_to: ['property_agent'] } });
    const big = makeSub({ plan_snapshot: { listings_limit: 10, name: 'Max', applicable_to: ['property_agent'] } });
    mockSubsFind([small, big]);
    const result = await getActiveSubscription('p1');
    expect(result.plan_snapshot.name).toBe('Max');
  });

  test('returns null when no active subscriptions', async () => {
    mockSubsFind([]);
    expect(await getActiveSubscription('p1')).toBeNull();
  });

  test('expires lapsed subscriptions and excludes them', async () => {
    const expired = makeSub({ ends_at: new Date(Date.now() - 1000) });
    mockSubsFind([expired]);
    const result = await getActiveSubscription('p1');
    expect(expired.save).toHaveBeenCalled();
    expect(expired.status).toBe('expired');
    expect(result).toBeNull();
  });
});

describe('getActiveSubscriptionForRole', () => {
  test('only returns a sub whose applicable_to includes the role', async () => {
    const supplierPlan = makeSub({ plan_snapshot: { listings_limit: 9, name: 'Supplier', applicable_to: ['supplier'] } });
    mockSubsFind([supplierPlan]);
    expect(await getActiveSubscriptionForRole('p1', 'property_agent')).toBeNull();
    mockSubsFind([supplierPlan]);
    expect((await getActiveSubscriptionForRole('p1', 'supplier')).plan_snapshot.name).toBe('Supplier');
  });

  test('a plan with empty applicable_to applies to every role (free tier baseline)', async () => {
    const trial = makeSub({ plan_snapshot: { listings_limit: 1, name: 'Trial', applicable_to: [] } });
    mockSubsFind([trial]);
    expect((await getActiveSubscriptionForRole('p1', 'mandi_seller')).plan_snapshot.name).toBe('Trial');
  });
});

describe('getCoveredRoles', () => {
  test('returns the union of applicable_to across active subs', async () => {
    mockSubsFind([
      makeSub({ plan_snapshot: { applicable_to: ['supplier'], name: 'A' } }),
      makeSub({ plan_snapshot: { applicable_to: ['mandi_seller', 'supplier'], name: 'B' } }),
    ]);
    const roles = await getCoveredRoles('p1');
    expect(roles.sort()).toEqual(['mandi_seller', 'supplier']);
  });
});

describe('getPartnerLimits', () => {
  test('returns plan_snapshot limits when a covering sub exists', async () => {
    mockSubsFind([makeSub()]);
    const limits = await getPartnerLimits('p1', 'property_agent');
    expect(limits.listings).toBe(5);
    expect(limits.featured).toBe(2);
  });

  test('falls back to free plan when no sub covers the role', async () => {
    mockSubsFind([makeSub({ plan_snapshot: { applicable_to: ['supplier'], name: 'Supplier', listings_limit: 9 } })]);
    SubscriptionPlan.findOne.mockResolvedValue({ listings_limit: 1, featured_listings_limit: 0, leads_limit: 5, name: 'Free' });
    const limits = await getPartnerLimits('p1', 'property_agent');
    expect(limits.plan_name).toBe('Free');
  });

  test('returns hardcoded defaults when no free plan in DB', async () => {
    mockSubsFind([]);
    SubscriptionPlan.findOne.mockResolvedValue(null);
    const limits = await getPartnerLimits('p1', 'property_agent');
    expect(limits.listings).toBe(1);
    expect(limits.plan_name).toBe('Basic Free');
  });

  test('defaults to the partner active_role when no role is given', async () => {
    mockActiveRole('property_agent');
    mockSubsFind([makeSub()]);
    const limits = await getPartnerLimits('p1');
    expect(limits.role).toBe('property_agent');
    expect(limits.listings).toBe(5);
  });
});

describe('checkListingLimit (per-role counting)', () => {
  test('allowed when under the role limit, counting only that role model', async () => {
    mockSubsFind([makeSub()]);
    PropertyListing.countDocuments.mockResolvedValue(1);
    const result = await checkListingLimit('p1', 'property_agent');
    expect(result.allowed).toBe(true);
    expect(PropertyListing.countDocuments).toHaveBeenCalled();
    expect(ServiceListing.countDocuments).not.toHaveBeenCalled();
  });

  test('blocked when the role is at its limit', async () => {
    mockSubsFind([makeSub()]);
    PropertyListing.countDocuments.mockResolvedValue(5);
    const result = await checkListingLimit('p1', 'property_agent');
    expect(result.allowed).toBe(false);
    expect(result.message).toContain('5');
  });

  test('unlimited (-1) is always allowed', async () => {
    mockSubsFind([makeSub({ plan_snapshot: { listings_limit: -1, name: 'Unlimited', applicable_to: ['property_agent'] } })]);
    const result = await checkListingLimit('p1', 'property_agent');
    expect(result.allowed).toBe(true);
  });
});

describe('checkFeaturedLimit', () => {
  test('blocked when at featured limit for the role', async () => {
    mockSubsFind([makeSub()]);
    PropertyListing.countDocuments.mockResolvedValue(2);
    const result = await checkFeaturedLimit('p1', 'property_agent');
    expect(result.allowed).toBe(false);
  });
});

describe('enforceMandiLimits', () => {
  test('deactivates mandi listings over the limit', async () => {
    mockSubsFind([makeSub({ plan_snapshot: { listings_limit: 5, name: 'Pro', applicable_to: ['mandi_seller'] } })]);
    const listings = [
      { _id: 'a' }, { _id: 'b' }, { _id: 'c' }, { _id: 'd' }, { _id: 'e' }, { _id: 'f' },
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
