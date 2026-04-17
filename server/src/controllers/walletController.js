const { Partner } = require('../models/Partner');
const WithdrawalRequest = require('../models/Wallet'); // This model handles requests

/**
 * @desc    Get Seller Wallet Stats
 * @route   GET /api/wallet/stats
 * @access  Private (Partner Only)
 */
const getWalletStats = async (req, res) => {
  try {
    const partner = await Partner.findById(req.user.id).select('wallet');
    res.status(200).json({ success: true, data: partner.wallet });
  } catch (error) {
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
    const { amount, bank_details } = req.body;
    const partnerId = req.user.id;

    const partner = await Partner.findById(partnerId);

    // 1. Validation
    if (amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid withdrawal amount.' });
    }

    if (partner.wallet.withdrawable_balance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient withdrawable balance.' });
    }

    // 2. Create the request
    const request = await WithdrawalRequest.create({
      partner_id: partnerId,
      amount,
      bank_details,
      status: 'pending'
    });

    // 3. Deduct from withdrawable balance immediately (move to locked/pending state)
    partner.wallet.withdrawable_balance -= amount;
    await partner.save();

    res.status(201).json({ 
      success: true, 
      message: 'Withdrawal request submitted for Admin approval.', 
      data: request 
    });

  } catch (error) {
    console.error("Withdrawal Request Error:", error);
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
    const history = await WithdrawalRequest.find({ partner_id: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching withdrawal history.' });
  }
};

module.exports = {
  getWalletStats,
  requestWithdrawal,
  getWithdrawalHistory
};
