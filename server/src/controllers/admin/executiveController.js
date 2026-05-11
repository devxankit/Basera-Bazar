const { Partner } = require('../../models/Partner');
const logger = require('../../utils/logger');
const { AppConfig } = require('../../models/System');
const { ActivityLog, logActivity } = require('../../utils/activityLogger');
const Executive = require('../../models/Executive');
const WithdrawalRequest = require('../../models/Wallet');
const { createNotification } = require('../../utils/notificationHelper');
const invalidate = require('../../utils/cacheInvalidator');

const getAllExecutives = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const total = await Executive.countDocuments();
    const executives = await Executive.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const enrichedExecutives = await Promise.all(executives.map(async (exec) => {
      const onboardedCount = exec.referral_code
        ? await Partner.countDocuments({ referral_code_used: exec.referral_code })
        : 0;
      return { ...exec, onboardedCount };
    }));

    res.status(200).json({ success: true, data: enrichedExecutives, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    logger.error({ err: error }, 'getAllExecutives Error:')
    res.status(500).json({ success: false, message: 'Server error fetching executives.' });
  }
};

const getExecutiveDetail = async (req, res) => {
  try {
    const executive = await Executive.findById(req.params.id).lean();
    if (!executive) return res.status(404).json({ success: false, message: 'Executive not found' });

    const partners = await Partner.find({ referral_code_used: executive.referral_code })
      .select('name business_name phone onboarding_status createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { ...executive, partners, onboardedCount: partners.length }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateExecutiveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejection_reason } = req.body;

    const executive = await Executive.findById(id);
    if (!executive) return res.status(404).json({ success: false, message: 'Executive not found' });

    executive.onboarding_status = status === 'approved' ? 'verified' : status;
    if (status === 'approved') {
      executive.is_active = true;
      executive.approved_at = new Date();
    } else if (status === 'rejected') {
      executive.kyc.rejection_reason = rejection_reason;
      executive.is_active = false;
    }

    await executive.save();

    await createNotification(
      'executive',
      executive._id,
      status === 'approved' ? 'Account Verified! 🎉' : 'KYC Rejected',
      status === 'approved'
        ? 'Congratulations! Your account has been verified. You can now start onboarding partners.'
        : `Your KYC documents were rejected. Reason: ${rejection_reason}`,
      { type: 'executive_verification', status }
    );

    await invalidate.executiveProfile(id);
    await invalidate.adminDashboard();

    res.status(200).json({ success: true, message: `Executive ${status} successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const toggleExecutiveActiveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const executive = await Executive.findById(id);
    if (!executive) return res.status(404).json({ success: false, message: 'Executive not found' });

    const newStatus = !executive.is_active;
    executive.is_active = newStatus;

    if (!newStatus) {
      executive.deactivated_at = new Date();
      executive.deactivation_reason = reason || 'Deactivated by Admin';
      executive.token_version = (executive.token_version || 0) + 1;
    } else {
      executive.deactivated_at = null;
      executive.deactivation_reason = null;
    }

    await executive.save();

    res.status(200).json({
      success: true,
      message: `Executive ${newStatus ? 'activated' : 'deactivated'} successfully`,
      data: { is_active: newStatus }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteExecutive = async (req, res) => {
  try {
    const { id } = req.params;
    const executive = await Executive.findById(id);
    if (!executive) return res.status(404).json({ success: false, message: 'Executive not found' });

    if (executive.referral_code) {
      await Partner.updateMany(
        { referral_code_used: executive.referral_code },
        { $set: { referral_code_used: null, referred_by_executive: null } }
      );
    }

    await Executive.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: 'Executive removed from database' });
  } catch (error) {
    logger.error({ err: error }, 'deleteExecutive Error:')
    res.status(500).json({ success: false, message: 'Server error deleting executive.' });
  }
};

const getWithdrawalRequests = async (req, res) => {
  try {
    const { user_type } = req.query;
    const query = user_type ? { user_type } : {};
    const requests = await WithdrawalRequest.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    logger.error({ err: error }, 'getWithdrawalRequests Error:');
    res.status(500).json({ success: false, message: 'Server error fetching withdrawal requests.' });
  }
};

const updateWithdrawalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_note, transaction_id } = req.body;

    const ALLOWED_STATUSES = ['approved', 'rejected', 'completed'];
    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Allowed values: ${ALLOWED_STATUSES.join(', ')}` });
    }

    const request = await WithdrawalRequest.findById(id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    if (request.status !== 'pending' && request.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: `Cannot update a withdrawal that is already '${request.status}'.`
      });
    }

    const validTransitions = {
      pending: ['approved', 'rejected'],
      approved: ['completed']
    };
    if (!validTransitions[request.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from '${request.status}' to '${status}'.`
      });
    }

    request.status = status;
    if (admin_note) request.admin_note = admin_note;
    if (transaction_id) request.transaction_id = transaction_id;
    if (status === 'completed') request.processed_at = new Date();

    await request.save();

    await logActivity({
      actor_name: req.user.name,
      actor_id: req.user.id,
      action: status === 'completed' ? 'settled' : status,
      entity_type: 'withdrawal',
      entity_name: request.bank_details?.account_holder_name || 'Unknown',
      entity_id: request._id,
      description: `Admin ${req.user.name} marked withdrawal as '${status}' for ${request.bank_details?.account_holder_name || 'Unknown'}`
    });

    if (status === 'rejected') {
      if (request.user_type === 'Executive') {
        await Executive.findByIdAndUpdate(request.user_id, { $inc: { wallet_balance: request.amount } });
      } else if (request.user_type === 'Partner') {
        await Partner.findByIdAndUpdate(request.user_id || request.partner_id, {
          $inc: { 'wallet.withdrawable_balance': request.amount }
        });
      }
    }

    res.status(200).json({ success: true, message: `Withdrawal request marked as '${status}' successfully` });
  } catch (error) {
    logger.error({ err: error }, 'updateWithdrawalStatus Error:')
    res.status(500).json({ success: false, message: 'Server error updating withdrawal status.' });
  }
};

const resetExecutiveKyc = async (req, res) => {
  try {
    const { id } = req.params;
    const executive = await Executive.findById(id);
    if (!executive) return res.status(404).json({ success: false, message: 'Executive not found' });

    executive.kyc = {
      live_photo: null,
      aadhar_number: null,
      aadhar_image: null,
      pan_number: null,
      pan_image: null,
      rejection_reason: null
    };
    executive.onboarding_status = 'incomplete';
    executive.is_active = false;

    await executive.save();

    await logActivity({
      actor_name: req.user.name,
      actor_id: req.user.id,
      action: 'kyc_reset',
      entity_type: 'executive',
      entity_name: executive.name,
      entity_id: executive._id,
      description: `Admin ${req.user.name} reset KYC for executive ${executive.name}`
    });

    res.status(200).json({ success: true, message: 'Executive KYC reset successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getExecutiveSettings = async (req, res) => {
  try {
    const commissionAmount = await AppConfig.findOne({ key: 'executive_commission_amount' });
    res.status(200).json({
      success: true,
      data: { commission_amount: commissionAmount ? commissionAmount.value : 100 }
    });
  } catch (error) {
    logger.error({ err: error }, 'Get executive settings error:')
    res.status(500).json({ success: false, message: 'Error fetching Executive settings.' });
  }
};

const updateExecutiveSettings = async (req, res) => {
  try {
    const { commission_amount } = req.body;

    if (commission_amount !== undefined) {
      await AppConfig.findOneAndUpdate(
        { key: 'executive_commission_amount' },
        {
          value: Number(commission_amount),
          description: 'Amount credited to Executive wallet per verified partner referral'
        },
        { upsert: true, new: true }
      );
    }

    await logActivity({
      actor_name: req.user.name,
      actor_id: req.user.id,
      action: 'settings_updated',
      entity_type: 'system',
      entity_name: 'Executive Commission',
      description: `Updated executive commission to ₹${commission_amount}`
    });

    res.status(200).json({ success: true, message: 'Executive settings updated successfully!' });
  } catch (error) {
    logger.error({ err: error }, 'Update executive settings error:')
    res.status(500).json({ success: false, message: 'Error updating Executive settings.' });
  }
};

const validateReferralCode = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Referral code is required.' });
    }

    const executive = await Executive.findOne({
      referral_code: code.toUpperCase(),
      onboarding_status: { $in: ['approved', 'verified'] },
      is_active: true
    });

    if (!executive) {
      return res.status(404).json({ success: false, message: 'Invalid or inactive referral code.' });
    }

    res.status(200).json({ success: true, message: 'Code validated!', data: { name: executive.name } });
  } catch (error) {
    logger.error({ err: error }, 'Validate referral error:')
    res.status(500).json({ success: false, message: 'Error validating referral code.' });
  }
};

module.exports = {
  getAllExecutives,
  getExecutiveDetail,
  updateExecutiveStatus,
  toggleExecutiveActiveStatus,
  deleteExecutive,
  getWithdrawalRequests,
  updateWithdrawalStatus,
  resetExecutiveKyc,
  getExecutiveSettings,
  updateExecutiveSettings,
  validateReferralCode
};
