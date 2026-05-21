const mongoose = require('mongoose');
const { Partner } = require('../models/Partner');
const WithdrawalRequest = require('../models/Wallet');
const logger = require('../utils/logger');

/**
 * @desc    Get Seller Wallet Stats
 * @route   GET /api/wallet/stats
 * @access  Private (Partner Only)
 */
const getWalletStats = async (req, res) => {
  try {
    const partner = await Partner.findById(req.user.id).select('wallet');
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner account not found.' });
    }
    res.status(200).json({ success: true, data: partner.wallet });
  } catch (error) {
    logger.error({ err: error, partnerId: req.user.id }, 'Error fetching wallet stats');
    res.status(500).json({ success: false, message: 'Error fetching wallet stats.' });
  }
};

/**
 * @desc    Request Withdrawal
 * @route   POST /api/wallet/withdraw
 * @access  Private (Partner Only)
 */
const requestWithdrawal = async (req, res) => {
  const amount = Number(req.body.amount);
  const partnerId = req.user.id;

  if (isNaN(amount) || !isFinite(amount) || amount <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid withdrawal amount.' });
  }

  // Validate bank details exist before touching the balance
  const partnerCheck = await Partner.findById(partnerId).select('bank_details');
  if (!partnerCheck?.bank_details?.account_number) {
    return res.status(400).json({ success: false, message: 'Please add your bank account details before withdrawing.' });
  }

  // Wrap balance deduction + request creation in a transaction so a failure
  // on either step automatically rolls back the other — no manual compensating writes.
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const partner = await Partner.findOneAndUpdate(
      { _id: partnerId, 'wallet.withdrawable_balance': { $gte: amount } },
      { $inc: { 'wallet.withdrawable_balance': -amount } },
      { new: true, session }
    );

    if (!partner) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Insufficient withdrawable balance.' });
    }

    const [request] = await WithdrawalRequest.create(
      [{ user_id: partnerId, user_type: 'Partner', amount, bank_details: partner.bank_details, status: 'pending' }],
      { session }
    );

    await session.commitTransaction();

    logger.info({ partnerId, amount, requestId: request._id }, 'Withdrawal request submitted');
    res.status(201).json({ success: true, message: 'Withdrawal request submitted for Admin approval.', data: request });

  } catch (error) {
    await session.abortTransaction();
    logger.error({ err: error, partnerId, amount }, 'Withdrawal transaction failed — balance rolled back');
    res.status(500).json({ success: false, message: 'Error processing withdrawal request. Please try again.' });
  } finally {
    session.endSession();
  }
};

/**
 * @desc    Get Withdrawal History
 * @route   GET /api/wallet/history
 * @access  Private (Partner Only)
 */
const getWithdrawalHistory = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [history, total] = await Promise.all([
      WithdrawalRequest.find({ user_id: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      WithdrawalRequest.countDocuments({ user_id: req.user.id }),
    ]);

    res.status(200).json({
      success: true,
      data: history,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    logger.error({ err: error, partnerId: req.user.id }, 'Error fetching withdrawal history');
    res.status(500).json({ success: false, message: 'Error fetching withdrawal history.' });
  }
};

module.exports = {
  getWalletStats,
  requestWithdrawal,
  getWithdrawalHistory
};
