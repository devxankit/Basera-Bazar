const { Partner } = require('../models/Partner');
const Order = require('../models/Order');
const WithdrawalRequest = require('../models/Wallet');
const { AppConfig } = require('../models/System');
const { logActivity } = require('../utils/activityLogger');

/**
 * @desc    Approve/Reject Mandi Seller KYC
 * @route   PATCH /api/admin/marketplace/kyc/:id
 * @access  Private (Admin Only)
 */
const updateSellerKYC = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    const adminId = req.user.id;

    const partner = await Partner.findById(id);
    if (!partner || (partner.partner_type !== 'mandi_seller' && !(partner.roles && partner.roles.includes('mandi_seller')))) {
      return res.status(404).json({ success: false, message: 'Mandi seller not found.' });
    }

    partner.kyc.status = status;
    partner.kyc.reviewed_by = adminId;
    partner.kyc.reviewed_at = Date.now();

    if (status === 'approved') {
      partner.onboarding_status = 'approved';
    } else if (status === 'rejected') {
      partner.onboarding_status = 'rejected';
    }

    await partner.save();

    await logActivity({
      actor_name: req.user.name,
      actor_id: adminId,
      action: 'kyc_update',
      entity_type: 'partner',
      entity_id: id,
      description: `Updated KYC status for ${partner.name} to ${status}. Note: ${note || 'None'}`
    });

    res.status(200).json({ success: true, message: `KYC ${status} successfully.` });

  } catch (error) {
    console.error("KYC Admin Error:", error);
    res.status(500).json({ success: false, message: 'Error updating KYC.' });
  }
};

/**
 * @desc    Get/Set Global Commission Rate
 * @route   POST /api/admin/marketplace/commission
 * @access  Private (Admin Only)
 */
const updateCommissionRate = async (req, res) => {
  try {
    const { rate } = req.body;
    const adminId = req.user.id;

    let config = await AppConfig.findOne({ key: 'mandi_commission_rate' });
    
    if (!config) {
      config = await AppConfig.create({ 
        key: 'mandi_commission_rate', 
        value: rate,
        description: 'Global commission percentage for Mandi Bazar marketplace'
      });
    } else {
      config.value = rate;
      config.updated_by = adminId;
      await config.save();
    }

    await logActivity({
      actor_name: req.user.name,
      actor_id: adminId,
      action: 'updated',
      entity_type: 'AppConfig',
      entity_id: config._id,
      description: `Updated Mandi commission rate to ${rate}%`
    });

    res.status(200).json({ success: true, message: 'Commission rate updated.', data: config });

  } catch (error) {
    console.error("Commission Update Error:", error);
    res.status(500).json({ success: false, message: 'Error updating commission rate.' });
  }
};

/**
 * @desc    Manage Withdrawal Requests
 * @route   PATCH /api/admin/marketplace/withdrawals/:id
 * @access  Private (Admin Only)
 */
const processWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_note, transaction_id } = req.body;
    const adminId = req.user.id;

    const request = await WithdrawalRequest.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request already processed.' });
    }

    request.status = status;
    request.admin_note = admin_note;
    request.transaction_id = transaction_id;
    request.processed_at = Date.now();
    await request.save();

    // If rejected, refund the balance to the seller's withdrawable_balance
    if (status === 'rejected') {
      await Partner.findByIdAndUpdate(request.partner_id, {
        $inc: { 'wallet.withdrawable_balance': request.amount }
      });
    }

    await logActivity({
      actor_name: req.user.name,
      actor_id: adminId,
      action: 'withdrawal_processed',
      entity_type: 'WithdrawalRequest',
      entity_id: id,
      description: `Withdrawal request of ${request.amount} ${status} by admin.`
    });

    res.status(200).json({ success: true, message: `Request ${status}.` });

  } catch (error) {
    console.error("Process Withdrawal Error:", error);
    res.status(500).json({ success: false, message: 'Error processing withdrawal.' });
  }
};

/**
 * @desc    Get All Withdrawal Requests
 * @route   GET /api/admin/marketplace/withdrawals
 */
const getAllWithdrawals = async (req, res) => {
  try {
    const requests = await WithdrawalRequest.find()
      .populate('partner_id', 'name phone email')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching withdrawals.' });
  }
};

/**
 * @desc    Get All Marketplace Orders
 * @route   GET /api/admin/marketplace/orders
 */
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('customer_id', 'name phone')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching orders.' });
  }
};

module.exports = {
  updateSellerKYC,
  updateCommissionRate,
  processWithdrawal,
  getAllWithdrawals,
  getAllOrders
};
