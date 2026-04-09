const crypto = require('crypto');
const { RazorpayOrder, Subscription } = require('../models/Finance');

/**
 * @desc    Mock creating a Razorpay Order
 * @route   POST /api/finance/checkout/mock
 * @access  Private (Partner Token Required)
 */
const mockCreateRazorpayOrder = async (req, res) => {
  try {
    const partnerId = req.user.id;
    const { amount, purpose } = req.body; 

    // Generate a fake Razorpay Order ID (starts with order_)
    const fakeOrderId = `order_${crypto.randomBytes(8).toString('hex')}`;

    // Store the intent in our database just like Razorpay actually does it
    const order = await RazorpayOrder.create({
      razorpay_order_id: fakeOrderId,
      entity_type: 'partner',
      entity_id: partnerId,
      purpose, // e.g. "subscription_plan_xyz"
      amount, // Stored in whole rupees
      status: 'created'
    });

    res.status(200).json({
      success: true,
      message: 'Mock Razorpay Order generated',
      data: order
    });

  } catch (error) {
    console.error("Error creating mock order:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Mock Razorpay Webhook Call to confirm payment
 * @route   POST /api/finance/webhook/mock
 * @access  Public (Because in reality this is called by Razorpay servers)
 */
const mockRazorpayWebhook = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id } = req.body;

    const order = await RazorpayOrder.findOne({ razorpay_order_id });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // 1. Update the Order Status to Paid
    order.status = 'paid';
    order.razorpay_payment_id = razorpay_payment_id || `pay_${crypto.randomBytes(8).toString('hex')}`;
    await order.save();

    // 2. Business Logic: If this was a subscription, make it active!
    // We assume the purpose contains "subscription_"
    if (order.purpose && order.purpose.includes('subscription')) {
      // Find their pending subscription and activate it
      const subscription = await Subscription.findOne({ partner_id: order.entity_id, status: 'pending_payment' });
      
      if (subscription) {
        subscription.status = 'active';
        
        // Add 30 days to current date for expiry
        const expires = new Date();
        expires.setDate(expires.getDate() + 30);
        subscription.ends_at = expires;
        
        await subscription.save();
      }
    }

    res.status(200).json({ success: true, message: 'Mock payment webhook accepted' });

  } catch (error) {
    console.error("Webhook Error:", error);
    res.status(500).json({ success: false, message: 'Server error in webhook' });
  }
};

module.exports = {
  mockCreateRazorpayOrder,
  mockRazorpayWebhook
};
