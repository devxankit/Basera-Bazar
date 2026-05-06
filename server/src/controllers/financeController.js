const crypto = require('crypto');
const axios = require('axios');
const { RazorpayOrder, Subscription, SubscriptionPlan, Transaction } = require('../models/Finance');
const { Partner } = require('../models/Partner');
const { AppConfig } = require('../models/System');

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
    const hasKeys = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID !== 'your_razorpay_key_id';
    
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
    console.error("Subscription Init Error:", errorMsg);
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
const verifySubscription = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan_id } = req.body;
    const partnerId = req.user.id;

    // 1. Signature Verification (Only if not mock)
    if (!razorpay_order_id.startsWith('order_mock_')) {
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ success: false, message: 'Invalid payment signature' });
      }
    }

    // 2. Update Order Status
    const order = await RazorpayOrder.findOne({ razorpay_order_id });
    if (order) {
      order.status = 'paid';
      order.razorpay_payment_id = razorpay_payment_id;
      await order.save();
    }

    // 3. Activate Subscription
    const plan = await SubscriptionPlan.findById(plan_id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan details not found' });

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
    const updatePayload = {
      active_subscription_id: subscription._id
    };

    // Check for 1+1 Offer (Buy 1 role get 1 free)
    // Only for premium plans (Price > 1)
    if (plan.price > 1) {
      const offerConfig = await AppConfig.findOne({ key: 'OFFER_1_PLUS_1' });
      if (offerConfig && offerConfig.value?.is_active) {
        // Increment role credits
        await Partner.findByIdAndUpdate(partnerId, { 
          $inc: { role_credits: 1 },
          $set: { active_subscription_id: subscription._id }
        });
      } else {
        await Partner.findByIdAndUpdate(partnerId, {
          active_subscription_id: subscription._id
        });
      }
    } else {
      await Partner.findByIdAndUpdate(partnerId, {
        active_subscription_id: subscription._id
      });
    }

    // 5. Create Transaction Record for Payment History
    await Transaction.create({
      partner_id: partnerId,
      type: 'subscription_payment',
      amount: plan.price,
      direction: 'debit',
      status: 'success',
      razorpay_order_id: order?._id,
      reference_id: subscription._id
    });

    res.status(200).json({ 
      success: true, 
      message: 'Subscription activated successfully!',
      subscription 
    });

  } catch (error) {
    console.error("Verification Error:", error);
    res.status(500).json({ success: false, message: 'Verification failed' });
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
    let transactions = await Transaction.find({ partner_id: partnerId }).sort({ createdAt: -1 });

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
          console.error(`[Finance] Failed to create backfill transaction:`, txErr);
        }
      }
    }

    res.status(200).json({ success: true, count: transactions.length, data: transactions });
  } catch (error) {
    console.error("Error fetching transactions:", error);
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
    console.error("Cancellation Error:", error);
    res.status(500).json({ success: false, message: 'Failed to cancel subscription' });
  }
};

module.exports = {
  initiateSubscription,
  verifySubscription,
  cancelSubscription,
  getMyTransactions,
  // Keep mock for internal tests if needed
  mockCreateRazorpayOrder: async (req, res) => res.json({ message: 'Use real initiate route' }),
  mockRazorpayWebhook: async (req, res) => res.json({ message: 'Use real verify route' })
};
