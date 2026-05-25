const crypto = require('crypto');
const logger = require('../utils/logger');
const axios = require('axios');
const { RazorpayOrder, Subscription, SubscriptionPlan, Transaction } = require('../models/Finance');
const { Partner } = require('../models/Partner');
const { ServiceListing, PropertyListing, MandiListing } = require('../models/Listing');
const { AppConfig } = require('../models/System');
const { creditExecutivePayout } = require('../utils/executiveHelper');

/**
 * Helper to create Razorpay Order via axios
 */
const createRPOrder = async (amount, currency = 'INR') => {
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
  const response = await axios.post('https://api.razorpay.com/v1/orders', {
    amount: Math.round(amount * 100), // Razorpay expects paise
    currency,
    receipt: `receipt_${Date.now()}`
  }, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    }
  });
  return response.data;
};

/**
 * @desc    Initiate Subscription Payment
 * @route   POST /api/finance/subscription/initiate
 * @access  Private (Partner)
 */
const initiateSubscription = async (req, res) => {
  try {
    const partnerId = req.user.id;
    const { plan_id } = req.body;

    const plan = await SubscriptionPlan.findById(plan_id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    // 1. Create Razorpay Order (Fallback to mock if keys missing)
    let rpOrder;
    const hasKeys = process.env.NODE_ENV !== 'test' && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID !== 'your_razorpay_key_id';
    
    if (hasKeys) {
      rpOrder = await createRPOrder(plan.price);
    } else {
      rpOrder = { id: `order_mock_${crypto.randomBytes(4).toString('hex')}`, amount: plan.price * 100 };
    }

    // 2. Store Order Record
    await RazorpayOrder.create({
      razorpay_order_id: rpOrder.id,
      entity_type: 'partner',
      entity_id: partnerId,
      purpose: `subscription_${plan_id}`,
      amount: plan.price,
      status: 'created'
    });

    res.status(200).json({
      success: true,
      order_id: rpOrder.id,
      amount: rpOrder.amount,
      key: hasKeys ? process.env.RAZORPAY_KEY_ID : 'rzp_test_mock',
      plan_name: plan.name
    });

  } catch (error) {
    const errorMsg = error.response?.data?.error?.description || error.response?.data?.message || error.message;
    logger.error({ err: errorMsg }, "Subscription Init Error:")
    res.status(500).json({ 
      success: false, 
      message: `Failed to initialize payment: ${errorMsg}` 
    });
  }
};

/**
 * @desc    Verify Subscription Payment
 * @route   POST /api/finance/subscription/verify
 * @access  Private (Partner)
 */
/**
 * Helper to process subscription activation (shared between AJAX verify and Redirect callback)
 */
const processSubscriptionActivation = async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature, plan_id, partnerId }) => {
  // 1. Signature Verification (skip for mock orders in demo/test mode)
  const isMock = (process.env.DEMO_OTP_ENABLED === 'true' || process.env.NODE_ENV === 'test') && razorpay_order_id.startsWith('order_mock_');
  if (!isMock) {
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      throw new Error('Invalid payment signature');
    }
  }

  // 2. Update Order Status
  const order = await RazorpayOrder.findOne({ razorpay_order_id });
  if (!order) {
    logger.warn({ razorpay_order_id }, 'RazorpayOrder record not found during subscription verification');
    throw new Error('Payment record not found.');
  }
  order.status = 'paid';
  order.razorpay_payment_id = razorpay_payment_id;
  await order.save();

  // 3. Activate Subscription
  const plan = await SubscriptionPlan.findById(plan_id);
  if (!plan) throw new Error('Plan details not found');

  const startsAt = new Date();
  const endsAt = new Date();
  endsAt.setDate(endsAt.getDate() + (plan.duration_days || 30));

  const subscription = await Subscription.create({
    partner_id: partnerId,
    plan_id: plan._id,
    plan_snapshot: plan,
    status: 'active',
    starts_at: startsAt,
    ends_at: endsAt,
    granted_by_admin: false,
    cancel_at_period_end: false // Reset on new activation
  });

  // 4. Update Partner Profile & Grant Role Credit if 1+1 Offer is active
  if (plan.price > 1) {
    const offerConfig = await AppConfig.findOne({ key: 'OFFER_1_PLUS_1' });
    if (offerConfig && offerConfig.value?.is_active) {
      await Partner.findByIdAndUpdate(partnerId, { 
        $inc: { role_credits: 1 },
        $set: { active_subscription_id: subscription._id }
      });
    } else {
      await Partner.findByIdAndUpdate(partnerId, {
        $set: { active_subscription_id: subscription._id }
      });
    }
  } else {
    await Partner.findByIdAndUpdate(partnerId, {
      $set: { active_subscription_id: subscription._id }
    });
  }

  // 5. Re-activate partner if their subscription had expired, and restore their listings
  const expiredFilter = { partner_id: partnerId, status: 'inactive', status_reason: 'subscription_expired' };
  const restoreUpdate = { $set: { status: 'active', status_reason: null } };
  await Promise.all([
    Partner.findByIdAndUpdate(partnerId, {
      $set: { subscription_expired: false, subscription_expired_at: null }
    }),
    ServiceListing.updateMany(expiredFilter, restoreUpdate),
    PropertyListing.updateMany(expiredFilter, restoreUpdate),
    MandiListing.updateMany(expiredFilter, restoreUpdate),
  ]);

  // 6. Create Transaction Record for Payment History
  await Transaction.create({
    partner_id: partnerId,
    type: 'subscription_payment',
    amount: plan.price,
    direction: 'debit',
    status: 'success',
    razorpay_order_id: order?._id,
    reference_id: subscription._id
  });

  // 7. Trigger Executive Commission if referred — applies to EVERY paid plan above ₹1
  if (plan.price > 1) {
    const partner = await Partner.findById(partnerId);
    if (partner && partner.referral_code_used) {
      await creditExecutivePayout(
        partner.referral_code_used,
        partnerId,
        partner.business_name || partner.name,
        plan.price
      );

      // Set assigned_executive on first subscription (if not already set)
      if (!partner.referred_by_executive || !partner.assigned_executive) {
        const Executive = require('../models/Executive');
        const exec = await Executive.findOne({ referral_code: partner.referral_code_used, is_active: true });
        if (exec) {
          await Partner.findByIdAndUpdate(partnerId, {
            referred_by_executive: exec._id,
            assigned_executive: exec._id
          });
        }
      }
    }
  }

  return subscription;
};

/**
 * @desc    Verify Subscription Payment
 * @route   POST /api/finance/subscription/verify
 * @access  Private (Partner)
 */
const verifySubscription = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan_id } = req.body;
    const partnerId = req.user.id;

    const subscription = await processSubscriptionActivation({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan_id,
      partnerId
    });

    res.status(200).json({ 
      success: true, 
      message: 'Subscription activated successfully!',
      subscription 
    });

  } catch (error) {
    logger.error({ err: error.message || error }, "Verification Error:")
    let statusCode = 500;
    if (error.message.includes('not found') || error.message.includes('details not found')) {
      statusCode = 404;
    } else if (error.message.includes('signature') || error.message.includes('Invalid')) {
      statusCode = 400;
    }
    res.status(statusCode).json({ success: false, message: error.message || 'Verification failed' });
  }
};

/**
 * @desc    Handle Razorpay Redirect Callback (PWA/WebView fallback)
 * @route   POST /api/finance/subscription/callback
 * @access  Public (Redirect POST)
 */
const subscriptionCallback = async (req, res) => {
  const { plan_id, origin, redirect_to } = req.query;
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, error } = req.body;

  const redirectOrigin = origin ? decodeURIComponent(origin) : 'https://baserabazar.in';
  // Where to send the user on failure (back to the page they came from — registration or subscription)
  const failureReturnPath = redirect_to ? decodeURIComponent(redirect_to) : '/partner/subscription';
  // Context label for the status page UI copy
  const context = failureReturnPath.includes('register') ? 'registration' : 'subscription';

  const buildStatusUrl = (status, finalRedirect, message = '') => {
    const params = new URLSearchParams({
      status,
      redirect: finalRedirect,
      context,
      ...(message && { message }),
    });
    return `${redirectOrigin}/payment/status?${params.toString()}`;
  };

  if (error) {
    logger.error({ err: error }, "Razorpay Redirect Callback Error Payload:");
    const errReason = error.description || error.reason || 'Payment failed. Please try again.';
    return res.redirect(buildStatusUrl('failed', failureReturnPath, errReason));
  }

  try {
    // 1. Retrieve the corresponding Order record to find the partner ID
    const rzOrder = await RazorpayOrder.findOne({ razorpay_order_id });
    if (!rzOrder) {
      throw new Error('Payment record not found.');
    }
    const partnerId = rzOrder.entity_id;

    // 2. Activate Subscription
    await processSubscriptionActivation({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan_id,
      partnerId
    });

    // 3. Redirect to status page — success
    // After the countdown, the status page redirects to /partner/home
    return res.redirect(buildStatusUrl('success', '/partner/home'));
  } catch (err) {
    logger.error({ err: err.message || err }, "Subscription Callback Error:");
    return res.redirect(buildStatusUrl('failed', failureReturnPath, err.message || 'Verification failed. Please contact support.'));
  }
};

/**
 * @desc    Get My Transactions
 * @route   GET /api/finance/transactions
 * @access  Private (Partner)
 */
const getMyTransactions = async (req, res) => {
  try {
    const partnerId = req.user.id;
    let transactions = await Transaction.find({
      partner_id: partnerId,
      type: { $ne: 'executive_commission' }
    }).sort({ createdAt: -1 });

    // Backfill: If no transactions found but partner has an active subscription, create one for them
    if (transactions.length === 0) {
      const { Partner } = require('../models/Partner');
      const partner = await Partner.findById(partnerId).populate('active_subscription_id');
      
      if (partner && partner.active_subscription_id) {
        const sub = partner.active_subscription_id;
        try {
          const newTx = await Transaction.create({
            partner_id: partnerId,
            amount: sub.plan_snapshot?.price || 0,
            currency: 'INR',
            status: 'success',
            type: 'subscription_payment',
            direction: 'debit',
            description: `Initial payment for ${sub.plan_snapshot?.name || 'Package'}`,
            payment_method: 'razorpay',
            createdAt: sub.starts_at // Use the subscription start date
          });
          transactions = [newTx];
        } catch (txErr) {
          logger.error({ err: txErr }, `[Finance] Failed to create backfill transaction:`)
        }
      }
    }

    res.status(200).json({ success: true, count: transactions.length, data: transactions });
  } catch (error) {
    logger.error({ err: error }, "Error fetching transactions:")
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Cancel Subscription (Set to not renew at end of period)
 * @route   POST /api/finance/subscription/cancel
 * @access  Private (Partner)
 */
const cancelSubscription = async (req, res) => {
  try {
    const partnerId = req.user.id;

    const subscription = await Subscription.findOne({
      partner_id: partnerId,
      status: 'active'
    });

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'No active subscription found to cancel.' });
    }

    if (subscription.cancel_at_period_end) {
      return res.status(400).json({ success: false, message: 'Subscription is already scheduled for cancellation.' });
    }

    subscription.cancel_at_period_end = true;
    await subscription.save();

    res.status(200).json({
      success: true,
      message: `Your subscription will remain active until ${new Date(subscription.ends_at).toLocaleDateString()}, after which it will not renew.`,
      data: subscription
    });

  } catch (error) {
    logger.error({ err: error }, "Cancellation Error:")
    res.status(500).json({ success: false, message: 'Failed to cancel subscription' });
  }
};

module.exports = {
  initiateSubscription,
  verifySubscription,
  subscriptionCallback,
  cancelSubscription,
  getMyTransactions,
  // Keep mock for internal tests if needed
  mockCreateRazorpayOrder: async (req, res) => res.json({ message: 'Use real initiate route' }),
  mockRazorpayWebhook: async (req, res) => res.json({ message: 'Use real verify route' })
};
