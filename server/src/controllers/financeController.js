const crypto = require('crypto');
const axios = require('axios');
const { RazorpayOrder, Subscription, SubscriptionPlan } = require('../models/Finance');
const { Partner } = require('../models/Partner');

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
    console.error("Subscription Init Error:", error.response?.data || error.message);
    res.status(500).json({ success: false, message: 'Failed to initialize payment' });
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
      granted_by_admin: false
    });

    // 4. Update Partner Profile
    await Partner.findByIdAndUpdate(partnerId, {
      active_subscription_id: subscription._id
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

module.exports = {
  initiateSubscription,
  verifySubscription,
  // Keep mock for internal tests if needed
  mockCreateRazorpayOrder: async (req, res) => res.json({ message: 'Use real initiate route' }),
  mockRazorpayWebhook: async (req, res) => res.json({ message: 'Use real verify route' })
};
