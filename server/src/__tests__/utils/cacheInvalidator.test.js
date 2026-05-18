'use strict';

jest.mock('../../utils/cache', () => ({
  clearByPrefix: jest.fn().mockResolvedValue(undefined),
}));

const CacheManager = require('../../utils/cache');
const cacheInvalidator = require('../../utils/cacheInvalidator');

beforeEach(() => jest.clearAllMocks());

describe('cacheInvalidator', () => {
  test('adminDashboard clears admin and user-scoped prefixes', async () => {
    await cacheInvalidator.adminDashboard();
    expect(CacheManager.clearByPrefix).toHaveBeenCalledWith(expect.stringContaining('/api/admin'));
    expect(CacheManager.clearByPrefix).toHaveBeenCalledWith(expect.stringContaining('user:'));
  });

  test('adminStaff clears staff and user-scoped prefixes', async () => {
    await cacheInvalidator.adminStaff();
    expect(CacheManager.clearByPrefix).toHaveBeenCalledWith(expect.stringContaining('/api/admin/staff'));
  });

  test('publicOffers clears offers prefix', async () => {
    await cacheInvalidator.publicOffers();
    expect(CacheManager.clearByPrefix).toHaveBeenCalledWith(expect.stringContaining('offers'));
  });

  test('publicPlans clears subscriptions plans prefix', async () => {
    await cacheInvalidator.publicPlans();
    expect(CacheManager.clearByPrefix).toHaveBeenCalledWith(expect.stringContaining('plans'));
  });

  test('publicCategories clears listings and admin categories prefixes', async () => {
    await cacheInvalidator.publicCategories();
    expect(CacheManager.clearByPrefix).toHaveBeenCalledTimes(2);
  });

  test('publicBanners clears listings and admin banners prefixes', async () => {
    await cacheInvalidator.publicBanners();
    expect(CacheManager.clearByPrefix).toHaveBeenCalledTimes(2);
  });

  test('publicListings clears listings and mandi prefixes', async () => {
    await cacheInvalidator.publicListings();
    expect(CacheManager.clearByPrefix).toHaveBeenCalledWith(expect.stringContaining('/api/listings'));
    expect(CacheManager.clearByPrefix).toHaveBeenCalledWith(expect.stringContaining('/api/mandi'));
  });

  test('executiveProfile clears executive-scoped prefix', async () => {
    await cacheInvalidator.executiveProfile('exec123');
    expect(CacheManager.clearByPrefix).toHaveBeenCalledWith(expect.stringContaining('exec123'));
  });

  test('executiveProfile is a no-op when no id given', async () => {
    await cacheInvalidator.executiveProfile(null);
    expect(CacheManager.clearByPrefix).not.toHaveBeenCalled();
  });

  test('partnerProfile clears partner-scoped prefix', async () => {
    await cacheInvalidator.partnerProfile('partner456');
    expect(CacheManager.clearByPrefix).toHaveBeenCalledWith(expect.stringContaining('partner456'));
  });

  test('partnerProfile is a no-op when no id given', async () => {
    await cacheInvalidator.partnerProfile(undefined);
    expect(CacheManager.clearByPrefix).not.toHaveBeenCalled();
  });
});
