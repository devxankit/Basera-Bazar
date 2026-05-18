'use strict';

jest.mock('../../models/Partner', () => ({
  Partner: {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn().mockResolvedValue({}),
  },
}));
jest.mock('../../models/Finance', () => ({
  Subscription: { create: jest.fn() },
  SubscriptionPlan: { findOne: jest.fn() },
}));
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

const { Partner } = require('../../models/Partner');
const { Subscription, SubscriptionPlan } = require('../../models/Finance');
const { grantFreeTrial } = require('../../utils/trialHelper');

const PARTNER_ID = 'partner123';
const FREE_PLAN = {
  _id: 'plan1',
  name: 'Free Trial',
  price: 0,
  duration_days: 30,
  listings_limit: 1,
  featured_listings_limit: 0,
  leads_limit: 50,
};
const CREATED_SUB = { _id: 'sub1', status: 'trial' };

beforeEach(() => jest.clearAllMocks());

describe('grantFreeTrial', () => {
  test('returns null when partner does not exist', async () => {
    Partner.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
    expect(await grantFreeTrial(PARTNER_ID)).toBeNull();
  });

  test('returns null when partner already has an active subscription', async () => {
    Partner.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ active_subscription_id: 'existing_sub', createdAt: new Date() }),
    });
    expect(await grantFreeTrial(PARTNER_ID)).toBeNull();
    expect(Subscription.create).not.toHaveBeenCalled();
  });

  test('creates a trial subscription and links it to the partner', async () => {
    Partner.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ active_subscription_id: null, createdAt: new Date() }),
    });
    SubscriptionPlan.findOne.mockReturnValue({ sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(FREE_PLAN) }) });
    Subscription.create.mockResolvedValue(CREATED_SUB);

    const result = await grantFreeTrial(PARTNER_ID);
    expect(result).toBe(CREATED_SUB);
    expect(Subscription.create).toHaveBeenCalledWith(
      expect.objectContaining({
        partner_id: PARTNER_ID,
        status: 'trial',
        granted_by_admin: true,
      })
    );
    expect(Partner.findByIdAndUpdate).toHaveBeenCalledWith(
      PARTNER_ID,
      { $set: { active_subscription_id: CREATED_SUB._id } }
    );
  });

  test('uses default 30-day trial when no free plan in DB', async () => {
    Partner.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ active_subscription_id: null, createdAt: new Date() }),
    });
    SubscriptionPlan.findOne.mockReturnValue({ sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }) });
    Subscription.create.mockResolvedValue(CREATED_SUB);

    await grantFreeTrial(PARTNER_ID);
    const createArg = Subscription.create.mock.calls[0][0];
    expect(createArg.plan_snapshot.duration_days).toBe(30);
    expect(createArg.plan_snapshot.name).toBe('Free Trial');
  });

  test('returns null and swallows error on DB failure', async () => {
    Partner.findById.mockReturnValue({
      select: jest.fn().mockRejectedValue(new Error('DB down')),
    });
    expect(await grantFreeTrial(PARTNER_ID)).toBeNull();
  });
});
