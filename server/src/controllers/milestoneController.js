const MilestoneConfig = require('../models/MilestoneConfig');
const MilestoneReward = require('../models/MilestoneReward');
const { Partner } = require('../models/Partner');

/**
 * @desc    Get Current Milestone for Partner
 * @route   GET /api/milestones/current
 * @access  Private (Partner Only)
 */
const getCurrentMilestone = async (req, res) => {
  try {
    const partner = await Partner.findById(req.user.id);
    if (!partner) return res.status(404).json({ success: false, message: 'Partner not found.' });

    // Fetch active and non-expired milestone configurations
    const configs = await MilestoneConfig.find({ 
      is_active: true,
      $or: [
        { valid_until: { $gt: new Date() } },
        { valid_until: { $exists: false } },
        { valid_until: null }
      ]
    }).sort({ target_orders: 1 });
    
    if (configs.length === 0) {
      return res.status(200).json({ success: true, data: null });
    }

    // 1. Find the first milestone that the user hasn't completed yet
    // We'll check each config to see if the user has reached the target
    // based on orders placed AFTER that config was created.
    let nextMilestone = null;
    let successfulOrdersCount = 0;

    const Order = require('../models/Order'); // Import Order model

    for (const config of configs) {
      const count = await Order.countDocuments({
        'items.seller_id': req.user.id,
        'items.status': 'delivered',
        'items.delivered_at': { $gte: config.createdAt }
      });

      if (count < config.target_orders) {
        nextMilestone = config;
        successfulOrdersCount = count;
        break;
      }
    }

    // If they finished everything, show the last one as completed or null
    if (!nextMilestone) {
      nextMilestone = configs[configs.length - 1];
      successfulOrdersCount = nextMilestone.target_orders; // Show as 100%
    }
    
    res.status(200).json({
      success: true,
      data: {
        stats: { successful_orders: successfulOrdersCount },
        milestone: nextMilestone
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching milestone.' });
  }
};

/**
 * @desc    Claim Milestone Reward
 * @route   POST /api/milestones/claim
 * @access  Private (Partner Only)
 */
const claimReward = async (req, res) => {
  try {
    const { milestoneId, shipping_address } = req.body;
    const partnerId = req.user.id;

    const partner = await Partner.findById(partnerId);
    const config = await MilestoneConfig.findById(milestoneId);

    if (!config || !partner) {
      return res.status(404).json({ success: false, message: 'Invalid milestone or partner.' });
    }

    if (partner.milestone_stats.successful_orders < config.target_orders) {
      return res.status(400).json({ success: false, message: 'Milestone target not yet reached.' });
    }

    // Check if already claimed
    const existing = await MilestoneReward.findOne({ partner_id: partnerId, milestone_id: milestoneId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Reward already claimed for this milestone.' });
    }

    const reward = await MilestoneReward.create({
      partner_id: partnerId,
      milestone_id: milestoneId,
      shipping_address,
      status: 'pending'
    });

    res.status(201).json({ success: true, message: 'Reward claim submitted successfully!', data: reward });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error claiming reward.' });
  }
};

/**
 * @desc    Admin: Get All Reward Requests
 * @route   GET /api/admin/milestones/rewards
 * @access  Private (Admin Only)
 */
const getRewardRequests = async (req, res) => {
  try {
    const rewards = await MilestoneReward.find()
      .populate('partner_id', 'name phone email')
      .populate('milestone_id')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: rewards });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching reward requests.' });
  }
};

/**
 * @desc    Admin: Update Reward Status
 * @route   PATCH /api/admin/milestones/rewards/:id
 * @access  Private (Admin Only)
 */
const updateRewardStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, tracking_id } = req.body;

    const reward = await MilestoneReward.findById(id);
    if (!reward) return res.status(404).json({ success: false, message: 'Reward request not found.' });

    reward.status = status;
    if (tracking_id) reward.tracking_id = tracking_id;
    if (status === 'shipped') reward.shipped_at = Date.now();
    if (status === 'delivered') reward.delivered_at = Date.now();

    await reward.save();
    res.status(200).json({ success: true, message: `Reward status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating reward status.' });
  }
};

/**
 * @desc    Admin: Create/Update Milestone Config
 * @route   POST /api/admin/milestones/config
 * @access  Private (Admin Only)
 */
const upsertMilestoneConfig = async (req, res) => {
  try {
    const { target_orders, prize_name, prize_description, banner_url, valid_until, is_active, id } = req.body;

    let config;
    if (id) {
      config = await MilestoneConfig.findByIdAndUpdate(id, {
        target_orders, prize_name, prize_description, banner_url, valid_until, is_active
      }, { new: true });
    } else {
      config = await MilestoneConfig.create({
        target_orders, prize_name, prize_description, banner_url, valid_until, is_active
      });
    }

    res.status(200).json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error saving milestone config.' });
  }
};

/**
 * @desc    Admin: Delete Milestone Config
 * @route   DELETE /api/milestones/admin/config/:id
 * @access  Private (Admin Only)
 */
const deleteMilestoneConfig = async (req, res) => {
  try {
    const { id } = req.params;
    await MilestoneConfig.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Milestone configuration deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting config.' });
  }
};

/**
 * @desc    Admin: Get All Milestone Configs
 * @route   GET /api/admin/milestones/configs
 * @access  Private (Admin Only)
 */
const getMilestoneConfigs = async (req, res) => {
  try {
    const configs = await MilestoneConfig.find().sort({ target_orders: 1 });
    res.status(200).json({ success: true, data: configs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching configs.' });
  }
};

module.exports = {
  getCurrentMilestone,
  claimReward,
  getRewardRequests,
  updateRewardStatus,
  upsertMilestoneConfig,
  getMilestoneConfigs,
  deleteMilestoneConfig
};
