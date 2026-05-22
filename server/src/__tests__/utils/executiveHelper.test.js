'use strict';

jest.mock('../../models/Executive', () => ({
  findOne: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));
jest.mock('../../models/Finance', () => ({
  Transaction: { create: jest.fn() },
}));
jest.mock('../../models/System', () => ({
  AppConfig: { findOne: jest.fn() },
}));
jest.mock('../../utils/activityLogger', () => ({
  logActivity: jest.fn(),
}));
jest.mock('../../utils/notificationHelper', () => ({
  createNotification: jest.fn(),
  sendPushNotification: jest.fn().mockResolvedValue({}),
}));
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

const Executive = require('../../models/Executive');
const { Transaction } = require('../../models/Finance');
const { AppConfig } = require('../../models/System');
const { creditExecutivePayout } = require('../../utils/executiveHelper');

const makeExec = (overrides = {}) => ({
  _id: 'exec1',
  name: 'John Exec',
  referral_code: 'REF001',
  is_active: true,
  wallet_balance: 500,
  total_earnings: 1000,
  payout_rate: 100,
  save: jest.fn().mockResolvedValue({}),
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());

describe('creditExecutivePayout', () => {
  test('does nothing when referralCode is empty', async () => {
    await creditExecutivePayout('', 'p1', 'Partner A', 1000);
    expect(Executive.findOne).not.toHaveBeenCalled();
  });

  test('does nothing when no active executive found for referral code', async () => {
    Executive.findOne.mockResolvedValue(null);
    await creditExecutivePayout('NOCODE', 'p1', 'Partner A', 1000);
    expect(Transaction.create).not.toHaveBeenCalled();
  });

  test('credits commission to executive wallet based on plan price', async () => {
    const exec = makeExec();
    Executive.findOne.mockResolvedValue(exec);
    Executive.findByIdAndUpdate.mockResolvedValue({});
    AppConfig.findOne.mockResolvedValue({ key: 'executive_commission_rate', value: '10' });
    Transaction.create.mockResolvedValue({});

    await creditExecutivePayout('REF001', 'p1', 'Partner A', 1000);

    // 10% of 1000 = 100
    expect(Executive.findByIdAndUpdate).toHaveBeenCalledWith('exec1', {
      $inc: { wallet_balance: 100, total_earnings: 100 }
    });
    expect(Transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 100, direction: 'credit', type: 'executive_commission' })
    );
  });

  test('uses default 10% commission when AppConfig is not set', async () => {
    const exec = makeExec();
    Executive.findOne.mockResolvedValue(exec);
    Executive.findByIdAndUpdate.mockResolvedValue({});
    AppConfig.findOne.mockResolvedValue(null);
    Transaction.create.mockResolvedValue({});

    await creditExecutivePayout('REF001', 'p1', 'Partner A', 200);

    // 10% of 200 = 20
    expect(Executive.findByIdAndUpdate).toHaveBeenCalledWith('exec1', {
      $inc: { wallet_balance: 20, total_earnings: 20 }
    });
  });

  test('uses payout_rate fallback when planPrice is 0', async () => {
    const exec = makeExec({ payout_rate: 150 });
    Executive.findOne.mockResolvedValue(exec);
    Executive.findByIdAndUpdate.mockResolvedValue({});
    AppConfig.findOne.mockResolvedValue(null);
    Transaction.create.mockResolvedValue({});

    await creditExecutivePayout('REF001', 'p1', 'Partner A', 0);

    // Falls back to executive.payout_rate = 150
    expect(Executive.findByIdAndUpdate).toHaveBeenCalledWith('exec1', {
      $inc: { wallet_balance: 150, total_earnings: 150 }
    });
  });

  test('credits minimum ₹1 when commission rounds to 0', async () => {
    const exec = makeExec();
    Executive.findOne.mockResolvedValue(exec);
    Executive.findByIdAndUpdate.mockResolvedValue({});
    AppConfig.findOne.mockResolvedValue({ key: 'executive_commission_rate', value: '0.001' });
    Transaction.create.mockResolvedValue({});

    await creditExecutivePayout('REF001', 'p1', 'Partner A', 1);

    // 0.001% of 1 = ~0, but minimum is 1
    expect(Executive.findByIdAndUpdate).toHaveBeenCalledWith('exec1', {
      $inc: { wallet_balance: 1, total_earnings: 1 }
    });
  });

  test('swallows error and does not throw when something fails', async () => {
    Executive.findOne.mockRejectedValue(new Error('DB error'));
    await expect(
      creditExecutivePayout('REF001', 'p1', 'Partner A', 500)
    ).resolves.toBeUndefined();
  });
});
