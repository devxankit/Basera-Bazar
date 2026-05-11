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
  try {
    const { amount } = req.body;
    const partnerId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid withdrawal amount.' });
    }

    // Atomic check-and-deduct — prevents double-spend from concurrent requests
    const partner = await Partner.findOneAndUpdate(
      { _id: partnerId, 'wallet.withdrawable_balance': { $gte: amount } },
      { $inc: { 'wallet.withdrawable_balance': -amount } },
      { new: true }
    );

    if (!partner) {
      return res.status(400).json({ success: false, message: 'Insufficient withdrawable balance.' });
    }

    // Use bank_details from the partner's DB record — never trust client-supplied data
    if (!partner.bank_details || !partner.bank_details.account_number) {
      // Restore the deducted balance before returning the error
      await Partner.findByIdAndUpdate(partnerId, { $inc: { 'wallet.withdrawable_balance': amount } });
      return res.status(400).json({ success: false, message: 'Please add your bank account details before withdrawing.' });
    }

    let request;
    try {
      request = await WithdrawalRequest.create({
        user_id: partnerId,
        user_type: 'Partner',
        amount,
        bank_details: partner.bank_details,
        status: 'pending'
      });
    } catch (createErr) {
      // Compensating transaction: restore the deducted balance if record creation fails
      logger.error({ err: createErr, partnerId, amount }, 'Withdrawal record creation failed — restoring balance');
      await Partner.findByIdAndUpdate(partnerId, { $inc: { 'wallet.withdrawable_balance': amount } });
      return res.status(500).json({ success: false, message: 'Error processing withdrawal request. Please try again.' });
    }

    logger.info({ partnerId, amount, requestId: request._id }, 'Withdrawal request submitted');

    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted for Admin approval.',
      data: request
    });

  } catch (error) {
    logger.error({ err: error, partnerId: req.user.id }, 'Error processing withdrawal request');
    res.status(500).json({ success: false, message: 'Error processing withdrawal request.' });
  }
};

/**
 * @desc    Get Withdrawal History
 * @route   GET /api/wallet/history
 * @access  Private (Partner Only)
 */
const getWithdrawalHistory = async (req, res) => {
  try {
    const history = await WithdrawalRequest.find({ user_id: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: history });
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
