const mongoose = require('mongoose');
const logger = require('../utils/logger');
const crypto = require('crypto');
const Order = require('../models/Order');
const { MandiListing } = require('../models/Listing');
const { Partner } = require('../models/Partner');
const { RazorpayOrder, Transaction } = require('../models/Finance');
const { AppConfig, Category } = require('../models/System');
const axios = require('axios');

/**
 * @desc    Create Marketplace Order (Initiate Payment)
 * @route   POST /api/orders/checkout
 * @access  Private (User Token Required)
 */
/**
 * Helper to create Razorpay Order via axios
 */
const createRPOrder = async (amount, currency = 'INR') => {
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
  const response = await axios.post('https://api.razorpay.com/v1/orders', {
    amount: Math.round(amount * 100), // Razorpay expects paise
    currency,
    receipt: `mandi_${Date.now()}`
  }, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    }
  });
  return response.data;
};

/**
 * @desc    Create Marketplace Order (Initiate Payment)
 * @route   POST /api/orders/checkout
 * @access  Private (User Token Required)
 */
const createMarketplaceOrder = async (req, res) => {
  try {
    const { items, shipping_address, billing_address } = req.body;
    const userId = req.user.id;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // Fetch Global Fallbacks
    const tokenConfig = await AppConfig.findOne({ key: 'mandi_token_amount' });
    const commissionConfig = await AppConfig.findOne({ key: 'mandi_commission_rate' });
    
    const globalDefaultRate = commissionConfig ? Number(commissionConfig.value) : 0;
    const globalFallbackToken = tokenConfig ? Number(tokenConfig.value) : 500;

    let totalAmount = 0;
    let totalBookingToken = 0;
    const processedItems = [];

    // 1. Validate Stock and Calculate Commissions per Category
    for (const item of items) {
      const product = await MandiListing.findById(item.productId || item.product_id).populate('category_id');
      if (!product) {
        return res.status(404).json({ success: false, message: `Product ${item.productId || item.product_id} not found` });
      }

      if (product.stock_quantity < item.qty) {
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient stock for ${product.title}. Only ${product.stock_quantity} available.` 
        });
      }

      const itemTotal = product.pricing.price_per_unit * item.qty;
      
      // Calculate dynamic commission
      // Use category percentage, fallback to global default
      const categoryRate = product.category_id?.mandi_commission_percentage ?? globalDefaultRate;
      const itemCommission = itemTotal * (categoryRate / 100);
      
      totalAmount += itemTotal;
      totalBookingToken += itemCommission;

      processedItems.push({
        productId: product._id,
        seller_id: product.partner_id,
        name: product.title,
        qty: item.qty,
        price: product.pricing.price_per_unit,
        unit: product.pricing.unit,
        status: 'pending',
        commission_rate: categoryRate,
        commission_amount: itemCommission,
        delivery_otp: crypto.randomInt(100000, 1000000).toString()
      });
    }

    // Ensure we don't have a zero token if there are unique sellers (Business logic fallback)
    if (totalBookingToken <= 0) {
      const uniqueSellersSize = new Set(processedItems.map(item => item.seller_id.toString())).size;
      totalBookingToken = globalFallbackToken * uniqueSellersSize;
    }

    // 2. Create Razorpay order (Actual or Mock)
    let rpOrder;
    const hasKeys = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID !== 'your_razorpay_key_id';
    
    if (hasKeys) {
      rpOrder = await createRPOrder(totalBookingToken);
    } else {
      rpOrder = { id: `order_mock_${crypto.randomBytes(8).toString('hex')}`, amount: totalBookingToken * 100 };
    }
    
    // 3. Create Marketplace Order record
    const orderId = `BSR-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const newOrder = await Order.create({
      order_id: orderId,
      user_id: userId,
      items: processedItems,
      total_amount: totalAmount,
      shipping_address,
      billing_address,
      token_payment: {
        amount: totalBookingToken,
        razorpay_order_id: rpOrder.id,
        status: 'pending'
      },
      status: 'pending'
    });

    // 4. Record the Razorpay intent
    await RazorpayOrder.create({
      razorpay_order_id: rpOrder.id,
      entity_type: 'user',
      entity_id: userId,
      purpose: `mandi_token_${newOrder._id}`,
      amount: totalBookingToken,
      status: 'created'
    });

    res.status(201).json({
      success: true,
      data: {
        order: newOrder,
        razorpay_order_id: rpOrder.id,
        payment_amount: totalBookingToken,
        key: hasKeys ? process.env.RAZORPAY_KEY_ID : 'rzp_test_mock'
      }
    });

  } catch (error) {
    logger.error({ err: error }, "Order Creation Error:")
    res.status(500).json({ 
      success: false, 
      message: 'Error creating order.'
    });
  }
};

/**
 * @desc    Verify Payment for Marketplace Order
 * @route   POST /api/orders/payment/verify
 * @access  Private (User OR Webhook Mock)
 */
const verifyMarketplacePayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // 1. Signature Verification (Only if not mock)
    const isMock = razorpay_order_id.startsWith('order_mock_');
    if (!isMock) {
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ success: false, message: 'Invalid payment signature' });
      }
    }

    const rzOrder = await RazorpayOrder.findOne({ razorpay_order_id });
    if (!rzOrder) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    if (rzOrder.status === 'paid') {
      return res.status(200).json({ success: true, message: 'Payment already verified.' });
    }

    // 1. Update Razorpay record
    rzOrder.status = 'paid';
    rzOrder.razorpay_payment_id = razorpay_payment_id || `pay_${crypto.randomBytes(8).toString('hex')}`;
    await rzOrder.save();

    // 2. Find the marketplace order using token_payment intent
    const order = await Order.findOne({ 'token_payment.razorpay_order_id': razorpay_order_id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Marketplace order not found.' });
    }

    // 3. Update Token Payment status and Order status to 'token_paid' (Active Lead)
    order.token_payment.status = 'paid';
    order.token_payment.paid_at = Date.now();
    order.token_payment.razorpay_payment_id = rzOrder.razorpay_payment_id;
    order.status = 'token_paid';

    // 4. Reduce Stock (The lead is now committed)
    for (let item of order.items) {
      await MandiListing.findByIdAndUpdate(item.productId, {
        $inc: { stock_quantity: -item.qty }
      });
    }

    // 5. Record Transaction for Financial Report
    await Transaction.create({
      partner_id: order.user_id, // The payer
      type: 'mandi_commission',
      amount: order.token_payment.amount,
      direction: 'credit', // Credit to the platform
      status: 'success',
      razorpay_order_id: rzOrder._id,
      reference_id: order._id
    });

    // 6. Notify Sellers (Active Leads)
    try {
      const { createNotification } = require('../utils/notificationHelper');
      for (let item of order.items) {
        await createNotification(
          'partner',
          item.seller_id,
          'New Order Received! 🛍️',
          `You have a new order for ${item.name} (${item.qty} units). Total: ₹${item.price * item.qty}.`,
          { type: 'mandi_order', orderId: order._id, itemId: item._id }
        );
      }
    } catch (notifErr) {
      logger.error({ err: notifErr }, "Seller Notification Error:")
      // Don't fail the payment verification if notification fails
    }

    res.status(200).json({ 
      success: true, 
      message: 'Token payment verified. Your order is successful and the supplier will contact you soon.', 
      data: order 
    });

  } catch (error) {
    logger.error({ err: error }, "Verify Payment Error:")
    res.status(500).json({ success: false, message: 'Error verifying payment.' });
  }
};

/**
 * @desc    Seller Update Order Lead Status (Contacted/Shipped/Delivered)
 * @route   PATCH /api/orders/lead/:orderId/:itemId/status
 * @access  Private (Partner Only)
 */
const updateLeadStatus = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { status, note, method } = req.body; // method = 'cod' or 'online'
    const sellerId = req.user.id;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    const item = order.items.id(itemId);
    if (!item || item.seller_id.toString() !== sellerId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized for this lead.' });
    }

    const currentStatus = item.status;

    // 1. Validation Logic: Enforce linear progression
    // Flow: pending -> contacted -> processing -> shipped -> delivered
    const statusPriority = {
      'pending': 1,
      'accepted': 2,
      'contacted': 2, // Backward compatibility
      'processing': 3,
      'shipped': 4,
      'delivered': 5,
      'cancelled': 0
    };

    // Block updates to terminal states
    if (currentStatus === 'delivered' || currentStatus === 'cancelled') {
      return res.status(400).json({ success: false, message: `Cannot update a ${currentStatus} item.` });
    }

    // Block backwards progression
    if (status !== 'cancelled' && statusPriority[status] <= statusPriority[currentStatus]) {
      return res.status(400).json({ success: false, message: `Cannot move status back from ${currentStatus} to ${status}.` });
    }

    // Specialized checks for 'shipped' and 'delivered'
    if (currentStatus === 'shipped' && !['delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Shipped items can only be marked as Delivered or Cancelled.' });
    }

    item.status = status;
    item.status_history.push({ status, note });

    // Handle Delivery Logic
    if (status === 'delivered') {
      const { delivery_otp } = req.body;
      if (!delivery_otp) {
        return res.status(400).json({ success: false, message: 'Delivery OTP is required to mark as delivered.' });
      }
      
      // Robust comparison
      if (item.delivery_otp?.toString() !== delivery_otp?.toString()) {
        return res.status(400).json({ success: false, message: 'Invalid Delivery OTP.' });
      }

      item.delivered_at = Date.now();
      order.final_payment.method = 'cod';
      order.final_payment.status = 'paid';
      const itemTotal = item.price * item.qty;
      order.final_payment.amount = (order.final_payment.amount || 0) + itemTotal;

      // Update Partner Success Stats
      await Partner.findByIdAndUpdate(sellerId, {
        $inc: { 'milestone_stats.successful_orders': 1 }
      });
    }

    // Handle Seller Cancellation Penalty
    if (status === 'cancelled') {
        // Penalty is now exactly the commission amount lost from this item
        const penaltyAmount = item.commission_amount || 0;
        
        if (penaltyAmount > 0) {
          await Partner.findByIdAndUpdate(sellerId, {
            $inc: { 'profile.mandi_profile.penalty_due': penaltyAmount }
          });
        }
    }

    await order.save();

    // Check if whole order is delivered
    const allDelivered = order.items.every(i => i.status === 'delivered');
    if (allDelivered) order.status = 'delivered';
    await order.save();

    res.status(200).json({ success: true, message: `Lead status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating lead status.' });
  }
};

const getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const userPhone = req.user.phone;
    
    logger.info(`Fetching orders for User ID: ${userId}, Phone: ${userPhone}`)

    // We fetch orders linked to the specific ID OR orders matching the user's phone number.
    // This handles cases where a person might have both a User and Partner record
    // but wants to see all their marketplace orders in one place.
    const orders = await Order.find({ 
      $or: [
        { user_id: userId },
        { "shipping_address.phone": userPhone }
      ]
    })
      .populate({
        path: 'items.productId',
        model: 'MandiListing'
      })
      .populate({
        path: 'items.seller_id',
        select: 'name shop_name phone profile_image',
        model: 'Partner'
      })
      .sort({ createdAt: -1 });

    logger.info(`Found ${orders.length} total orders matching ID or Phone.`)
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    logger.error({ err: error }, "getUserOrders Error:")
    res.status(500).json({ success: false, message: 'Error fetching orders.' });
  }
};

/**
 * @desc    Get Seller Orders
 * @route   GET /api/orders/seller-orders
 * @access  Private (Partner Only)
 */
const getSellerOrders = async (req, res) => {
  try {
    const sellerId = req.user.id;
    logger.info(`Fetching orders for seller: ${sellerId}`)
    
    const orders = await Order.find({ 'items.seller_id': sellerId })
      .populate('user_id', 'name phone')
      .populate({
        path: 'items.productId',
        model: 'MandiListing'
      })
      .sort({ createdAt: -1 });
    
    logger.info(`Found ${orders.length} matching orders in DB for seller ${sellerId}`)

    // Filter items to only show seller's own items
    const filteredOrders = orders.map(order => {
      const obj = order.toObject();
      obj.items = obj.items.filter(i => i.seller_id.toString() === sellerId.toString());
      return obj;
    });

    res.status(200).json({ success: true, data: filteredOrders });
  } catch (error) {
    logger.error({ err: error }, "Seller Orders Fetch Error:")
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching orders.',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * @desc    Get Detailed Order Info
 * @route   GET /api/orders/:id
 * @access  Private
 */
const getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user_id', 'name phone email')
      .populate({ path: 'items.productId', model: 'MandiListing' })
      .populate({ path: 'items.seller_id', model: 'Partner' });

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching order details' });
  }
};

/**
 * @desc    Add Review to Seller/Item
 * @route   POST /api/orders/review
 * @access  Private (User Only)
 */
const addReview = async (req, res) => {
  try {
    const { order_id, partner_id, behavior_rating, item_ratings, comment } = req.body;
    const userId = req.user.id;
    const Review = require('../models/Review');

    // 1. Verify order exists and is delivered
    const order = await Order.findById(order_id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    // 2. Create or Update the review
    const newReview = await Review.findOneAndUpdate(
      { user_id: userId, order_id: order_id, partner_id: partner_id },
      { 
        user_id: userId,
        partner_id,
        order_id,
        item_ratings,
        behavior_rating,
        comment
      },
      { new: true, upsert: true }
    );

    // 3. Mark items as reviewed in the order
    const itemIds = item_ratings.map(r => r.item_id);
    order.items.forEach(item => {
      if (itemIds.includes(item._id.toString())) {
        item.isReviewed = true;
      }
    });
    await order.save();

    res.status(200).json({ success: true, message: 'Review saved successfully', data: newReview });
  } catch (error) {
    logger.error({ err: error }, "Review Error:")
    res.status(500).json({ success: false, message: 'Error submitting review.' });
  }
};

const resendOrderOTP = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const sellerId = req.user.id;

    const order = await Order.findById(orderId).populate('user_id');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    const item = order.items.id(itemId);
    if (!item || item.seller_id.toString() !== sellerId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    if (item.status === 'delivered') {
      return res.status(400).json({ success: false, message: 'Order already delivered.' });
    }

    const customerPhone = order.shipping_address?.phone || order.user_id?.phone;
    if (!customerPhone) {
      return res.status(400).json({ success: false, message: 'Customer phone not found.' });
    }

    const { sendOTP } = require('../utils/sms');
    // Using a more generic message for delivery
    const success = await sendOTP(customerPhone, item.delivery_otp);

    if (success) {
      return res.status(200).json({ success: true, message: 'OTP sent to customer.' });
    } else {
      return res.status(500).json({ success: false, message: 'Failed to send SMS.' });
    }
  } catch (error) {
    logger.error({ err: error }, 'Update order status error')
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const getOrderReview = async (req, res) => {
  try {
    const { id } = req.params;
    const Review = require('../models/Review');
    const reviews = await Review.find({ order_id: id });
    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching review.' });
  }
};

module.exports = {
  createMarketplaceOrder,
  verifyMarketplacePayment,
  updateLeadStatus,
  getUserOrders,
  getSellerOrders,
  getOrderDetails,
  addReview,
  resendOrderOTP,
  getOrderReview
};
