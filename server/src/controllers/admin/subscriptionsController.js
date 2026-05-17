const mongoose = require('mongoose');
const logger = require('../../utils/logger');
const { Enquiry } = require('../../models/Enquiry');
const { PropertyListing, ServiceListing, MandiListing } = require('../../models/Listing');
const { SubscriptionPlan } = require('../../models/Finance');
const invalidate = require('../../utils/cacheInvalidator');

const getSubscriptionPlans = async (req, res) => {
  try {
    const { role, active_only } = req.query;
    const query = {};
    if (active_only === 'true') query.is_active = true;
    if (role) query.applicable_to = role;
    const plans = await SubscriptionPlan.find(query).sort({ price: 1 });
    res.status(200).json({ success: true, count: plans.length, data: plans });
  } catch (error) {
    logger.error({ err: error }, "Error fetching plans:");
    res.status(500).json({ success: false, message: 'Error fetching subscription plans.' });
  }
};

const createSubscriptionPlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.create({ ...req.body, created_by: req.user?._id });
    await invalidate.publicPlans();
    await invalidate.adminDashboard();
    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    logger.error({ err: error }, "Error creating plan:");
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const updateSubscriptionPlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    await invalidate.publicPlans();
    await invalidate.adminDashboard();
    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    logger.error({ err: error }, "Error updating plan:");
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const deleteSubscriptionPlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    await invalidate.publicPlans();
    await invalidate.adminDashboard();
    res.status(200).json({ success: true, message: 'Subscription plan eliminated.' });
  } catch (error) {
    logger.error({ err: error }, "Error deleting plan:");
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getSubscriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    let subscription;

    if (id.startsWith('VIRTUAL-FREE-')) {
      const partnerId = id.replace('VIRTUAL-FREE-', '');
      const partner = await mongoose.model('User').findById(partnerId).lean();
      if (!partner) return res.status(404).json({ success: false, message: 'Partner not found for virtual subscription' });
      const defaultFreePlan = await mongoose.model('SubscriptionPlan').findOne({ $or: [{ name: /Free/i }, { price: 0 }] }).lean();
      subscription = { _id: id, partner_id: partner, plan_snapshot: defaultFreePlan ? { name: defaultFreePlan.name, price: defaultFreePlan.price, duration_days: defaultFreePlan.duration_days, listings_limit: defaultFreePlan.listings_limit, featured_listings_limit: defaultFreePlan.featured_listings_limit, leads_limit: defaultFreePlan.leads_limit } : { name: 'Free Tier', price: 0, duration_days: 30, listings_limit: 1, featured_listings_limit: 1, leads_limit: 50 }, status: 'active', starts_at: partner.createdAt, ends_at: new Date(new Date(partner.createdAt).getTime() + (30 * 24 * 60 * 60 * 1000)), is_virtual: true };
    } else {
      subscription = await mongoose.model('Subscription').findById(id).populate('partner_id', 'name email phone partner_type role profileImage address state district createdAt').populate('plan_id');
      if (subscription) subscription = subscription.toObject();
    }

    if (!subscription) return res.status(404).json({ success: false, message: 'Subscription not found' });

    const now = new Date();
    if (!subscription.is_virtual && subscription.status === 'active' && subscription.ends_at && new Date(subscription.ends_at) < now) {
      subscription.status = 'expired';
      await mongoose.model('Subscription').findByIdAndUpdate(subscription._id, { $set: { status: 'expired' } });
    }

    const partnerId = subscription.partner_id?._id || subscription.partner_id;
    const startDate = subscription.starts_at;
    const endDate = subscription.ends_at || now;

    const [propertyCount, serviceCount, supplierCount, featuredPropertyCount, featuredServiceCount, enquiryCount] = await Promise.all([
      PropertyListing.countDocuments({ partner_id: partnerId, createdAt: { $gte: startDate, $lte: endDate } }),
      ServiceListing.countDocuments({ partner_id: partnerId, createdAt: { $gte: startDate, $lte: endDate } }),
      MandiListing.countDocuments({ partner_id: partnerId, createdAt: { $gte: startDate, $lte: endDate } }),
      PropertyListing.countDocuments({ partner_id: partnerId, is_featured: true, createdAt: { $gte: startDate, $lte: endDate } }),
      ServiceListing.countDocuments({ partner_id: partnerId, is_featured: true, createdAt: { $gte: startDate, $lte: endDate } }),
      Enquiry.countDocuments({ partner_id: partnerId, createdAt: { $gte: startDate, $lte: endDate } })
    ]);

    const usageData = { listings_created: propertyCount + serviceCount + supplierCount, featured_listings_used: featuredPropertyCount + featuredServiceCount, enquiries_received_this_month: enquiryCount, usage_reset_at: subscription.usage?.usage_reset_at || new Date(new Date(startDate).getTime() + (30 * 24 * 60 * 60 * 1000)) };

    if (!subscription.is_virtual) {
      await mongoose.model('Subscription').findByIdAndUpdate(subscription._id, { $set: { usage: usageData, status: subscription.status } });
    }
    subscription.usage = usageData;

    let transaction = null;
    if (!subscription.is_virtual) {
      transaction = await mongoose.model('Transaction').findOne({ reference_id: subscription._id, type: 'subscription_payment' }).populate('razorpay_order_id');
    }

    res.status(200).json({ success: true, data: subscription, transaction: transaction || null });
  } catch (error) {
    logger.error({ err: error }, "getSubscriptionById error:");
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const updateSubscriptionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['active', 'expired', 'cancelled', 'trial'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const subscription = await mongoose.model('Subscription').findByIdAndUpdate(id, { $set: { status } }, { new: true });
    if (!subscription) return res.status(404).json({ success: false, message: 'Subscription not found' });
    await invalidate.adminDashboard();
    res.status(200).json({ success: true, data: subscription, message: `Subscription ${status} successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  getSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  getSubscriptionById,
  updateSubscriptionStatus
};
