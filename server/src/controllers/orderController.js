const mongoose = require('mongoose');
const logger = require('../utils/logger');
const crypto = require('crypto');
const Order = require('../models/Order');
const { MandiListing } = require('../models/Listing');
const { Partner } = require('../models/Partner');
const { RazorpayOrder, Transaction } = require('../models/Finance');
const { AppConfig } = require('../models/System');
const axios = require('axios');
const { sendOTP } = require('../utils/sms');

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

    // 2.4 — Validate each item's shape before any DB work
    for (const item of items) {
      const id = item.productId || item.product_id;
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: `Invalid or missing product_id in cart items.` });
      }
      if (!Number.isInteger(item.qty) || item.qty < 1) {
        return res.status(400).json({ success: false, message: `qty must be a positive integer for each cart item.` });
      }
    }

    // Fetch Global Fallbacks
    const tokenConfig = await AppConfig.findOne({ key: 'mandi_token_amount' });
    const commissionConfig = await AppConfig.findOne({ key: 'mandi_commission_rate' });
    
    const globalDefaultRate = commissionConfig ? Number(commissionConfig.value) : 0;
    const globalFallbackToken = tokenConfig ? Number(tokenConfig.value) : 500;

    let totalAmount = 0;
    let totalBookingToken = 0;
    const processedItems = [];

    // 1. Batch-fetch all products in one query (eliminates N+1)
    const productIds = items.map(item => item.productId || item.product_id);
    const products = await MandiListing.find({ _id: { $in: productIds } }).populate('category_id');
    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    for (const item of items) {
      const id = (item.productId || item.product_id).toString();
      const product = productMap.get(id);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product ${id} not found` });
      }

      if (product.stock_quantity < item.qty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.title}. Only ${product.stock_quantity} available.`
        });
      }

      // 2.5 — Guard against missing pricing fields before arithmetic
      const pricePerUnit = product.pricing?.price_per_unit;
      const unit = product.pricing?.unit;
      if (!pricePerUnit || !unit) {
        return res.status(422).json({
          success: false,
          message: `Product "${product.title}" has incomplete pricing data and cannot be ordered.`,
        });
      }

      const itemTotal = pricePerUnit * item.qty;

      // Calculate dynamic commission — use category rate, fallback to global default
      const categoryRate = product.category_id?.mandi_commission_percentage ?? globalDefaultRate;
      const itemCommission = itemTotal * (categoryRate / 100);

      totalAmount += itemTotal;
      totalBookingToken += itemCommission;

      processedItems.push({
        productId: product._id,
        seller_id: product.partner_id,
        name: product.title,
        qty: item.qty,
        price: pricePerUnit,
        unit,
        status: 'pending',
        commission_rate: categoryRate,
        commission_amount: itemCommission,
        delivery_otp: (process.env.TESTING_MODE === 'true' || !process.env.SMS_API_KEY || process.env.SMS_API_KEY === 'your_smsindiahub_api_key') ? '123456' : crypto.randomInt(100000, 1000000).toString()
      });
    }

    // Ensure we don't have a zero token if there are unique sellers (Business logic fallback)
    if (totalBookingToken <= 0) {
      const uniqueSellersSize = new Set(processedItems.map(item => item.seller_id.toString())).size;
      totalBookingToken = globalFallbackToken * uniqueSellersSize;
    }

    // 2. Create Razorpay order (Actual or Mock)
    let rpOrder;
    const hasKeys = process.env.NODE_ENV !== 'test' && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID !== 'your_razorpay_key_id';
    
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
 * Helper to process marketplace order payment (shared between AJAX verify and Redirect callback)
 */
const processMarketplacePaymentActivation = async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  // 1. Signature Verification (Only if not mock — mock bypass only allowed outside production)
  const isMock = process.env.NODE_ENV !== 'production' && razorpay_order_id.startsWith('order_mock_');
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

  const rzOrder = await RazorpayOrder.findOne({ razorpay_order_id });
  if (!rzOrder) {
    throw new Error('Payment record not found.');
  }

  if (rzOrder.status === 'paid') {
    const order = await Order.findOne({ 'token_payment.razorpay_order_id': razorpay_order_id });
    return { order };
  }

  // 1. Update Razorpay record
  rzOrder.status = 'paid';
  rzOrder.razorpay_payment_id = razorpay_payment_id || `pay_${crypto.randomBytes(8).toString('hex')}`;
  await rzOrder.save();

  // 2. Find the marketplace order using token_payment intent
  const order = await Order.findOne({ 'token_payment.razorpay_order_id': razorpay_order_id });
  if (!order) {
    throw new Error('Marketplace order not found.');
  }

  // 3 & 4. Update Token Payment status and reduce stock atomically inside a session.
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    order.token_payment.status = 'paid';
    order.token_payment.paid_at = Date.now();
    order.token_payment.razorpay_payment_id = rzOrder.razorpay_payment_id;
    order.status = 'token_paid';
    await order.save({ session });

    for (const item of order.items) {
      const updated = await MandiListing.findOneAndUpdate(
        { _id: item.productId, stock_quantity: { $gte: item.qty } },
        { $inc: { stock_quantity: -item.qty } },
        { session, new: true }
      );
      if (!updated) {
        await session.abortTransaction();
        session.endSession();
        throw new Error(`Stock no longer available for "${item.name}".`);
      }
    }
    await session.commitTransaction();
  } catch (txErr) {
    await session.abortTransaction();
    throw txErr;
  } finally {
    session.endSession();
  }

  // 5. Record Transaction for Financial Report
  await Transaction.create({
    user_id: order.user_id, // The payer (customer)
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
  }

  return { order };
};

/**
 * @desc    Verify Payment for Marketplace Order
 * @route   POST /api/orders/payment/verify
 * @access  Private (User OR Webhook Mock)
 */
const verifyMarketplacePayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const { order } = await processMarketplacePaymentActivation({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });

    res.status(200).json({ 
      success: true, 
      message: 'Token payment verified. Your order is successful and the supplier will contact you soon.', 
      data: order 
    });

  } catch (error) {
    logger.error({ err: error.message || error }, "Verify Payment Error:")
    res.status(error.message.includes('not found') ? 404 : (error.message.includes('Stock') ? 409 : 500)).json({ 
      success: false, 
      message: error.message || 'Error verifying payment.' 
    });
  }
};

/**
 * @desc    Handle Razorpay Redirect Callback (PWA/WebView fallback)
 * @route   POST /api/orders/payment/callback
 * @access  Public (Redirect POST)
 */
const marketplacePaymentCallback = async (req, res) => {
  const { origin } = req.query;
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, error } = req.body;

  const redirectOrigin = origin ? decodeURIComponent(origin) : 'https://baserabazar.in';

  const buildStatusUrl = (status, finalRedirect, message = '') => {
    const params = new URLSearchParams({
      status,
      redirect: finalRedirect,
      context: 'order',
      ...(message && { message }),
    });
    return `${redirectOrigin}/payment/status?${params.toString()}`;
  };

  if (error) {
    logger.error({ err: error }, "Razorpay Order Callback Payment Error:");
    const errReason = error.description || error.reason || 'Payment failed. Please try again.';
    return res.redirect(buildStatusUrl('failed', '/mandi-bazar/checkout', errReason));
  }

  try {
    await processMarketplacePaymentActivation({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });

    return res.redirect(buildStatusUrl('success', '/profile/my-orders'));
  } catch (err) {
    logger.error({ err: err.message || err }, "Marketplace Callback Processing Error:");
    return res.redirect(buildStatusUrl('failed', '/mandi-bazar/checkout', err.message || 'Verification failed. Please contact support.'));
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
    const { status, note } = req.body;
    const sellerId = req.user.id;

    // 1. Validate incoming status before any DB lookup
    const statusPriority = {
      'pending': 1,
      'accepted': 2,
      'contacted': 2, // Backward compatibility
      'processing': 3,
      'shipped': 4,
      'delivered': 5,
      'cancelled': 0,
    };
    if (!status || !Object.prototype.hasOwnProperty.call(statusPriority, status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${Object.keys(statusPriority).join(', ')}.`,
      });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    const item = order.items.id(itemId);
    if (!item || item.seller_id.toString() !== sellerId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized for this lead.' });
    }

    const currentStatus = item.status;

    // 2. Enforce linear progression
    // Flow: pending -> accepted -> processing -> shipped -> delivered

    // Block updates to terminal states
    if (currentStatus === 'delivered' || currentStatus === 'cancelled') {
      return res.status(400).json({ success: false, message: `Cannot update a ${currentStatus} item.` });
    }

    // Allow cancellation from any non-terminal state
    if (status !== 'cancelled') {
      // Block backwards progression
      if (statusPriority[status] < statusPriority[currentStatus]) {
        return res.status(400).json({ success: false, message: `Cannot move status back from ${currentStatus} to ${status}.` });
      }

      // Block skipping steps — only one step forward at a time
      if (statusPriority[status] > statusPriority[currentStatus] + 1) {
        return res.status(400).json({ success: false, message: `Cannot skip from ${currentStatus} to ${status}. Follow the required sequence.` });
      }
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

    // Send notification to customer about status change
    try {
      const { createNotification } = require('../utils/notificationHelper');
      const STATUS_MESSAGES = {
        accepted:   { title: 'Order Accepted',   body: 'Your order has been accepted and is being processed.' },
        processing: { title: 'Order Processing', body: 'Your order is being prepared for delivery.' },
        shipped:    { title: 'Order Shipped',    body: 'Your order is on its way!' },
        delivered:  { title: 'Order Delivered',  body: 'Your order has been delivered successfully.' },
        cancelled:  { title: 'Order Cancelled',  body: 'Your order item has been cancelled.' },
      };
      const msgTemplate = STATUS_MESSAGES[status];
      if (msgTemplate) {
        await createNotification(
          'user', order.user_id,
          msgTemplate.title, msgTemplate.body,
          { type: 'order_status', redirect_url: '/profile/my-orders', order_id: String(order._id) }
        );
      }
    } catch (notifErr) {
      logger.warn({ err: notifErr }, 'Failed to send order status notification');
    }

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
    const orders = await Order.find({ user_id: userId })
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
    const requesterId = (req.user._id || req.user.id).toString();
    const requesterRole = req.user.role;

    const order = await Order.findById(req.params.id)
      .populate('user_id', 'name phone email')
      .populate({ path: 'items.productId', model: 'MandiListing' })
      .populate({
        path: 'items.seller_id',
        model: 'Partner',
        select: 'name shop_name phone profile_image district'
      });

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const isAdmin = ['super_admin', 'SuperAdmin', 'Admin'].includes(requesterRole);
    const isBuyer = order.user_id?._id?.toString() === requesterId;
    const isSeller = order.items.some(i => i.seller_id?._id?.toString() === requesterId || i.seller_id?.toString() === requesterId);

    if (!isAdmin && !isBuyer && !isSeller) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order.' });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    logger.error({ err: error }, 'getOrderDetails error');
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

    // 1. Verify order exists and that the requester is the buyer
    const order = await Order.findById(order_id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    if (order.user_id.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to review this order.' });
    }

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
    const itemIds = (item_ratings || []).map(r => r.item_id).filter(Boolean);
    order.items.forEach(item => {
      if (itemIds.includes(item._id.toString())) {
        item.isReviewed = true;
      }
    });
    await order.save();

    // 4. Recalculate and update partner's avg_rating
    const allReviews = await Review.find({ partner_id: partner_id });
    if (allReviews.length > 0) {
      const avgBehavior = allReviews.reduce((sum, r) => sum + (r.behavior_rating || 0), 0) / allReviews.length;
      const roundedAvg = Math.round(avgBehavior * 10) / 10;
      const partner = await Partner.findById(partner_id);
      if (partner) {
        const role = partner.active_role || partner.partner_type;
        const profileMap = {
          mandi_seller: 'mandi_profile',
          service_provider: 'service_profile',
          supplier: 'supplier_profile',
          property_agent: 'property_profile',
        };
        const profileKey = profileMap[role];
        if (profileKey && partner[profileKey] !== undefined) {
          partner[profileKey].avg_rating = roundedAvg;
          await partner.save();
        }
      }
    }

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

    try {
      await sendOTP(customerPhone, item.delivery_otp);
      return res.status(200).json({ success: true, message: 'OTP sent to customer.' });
    } catch (smsErr) {
      logger.error({ err: smsErr }, '[SMS] Failed to resend order OTP');
      return res.status(502).json({ success: false, message: 'Failed to send SMS. Please try again later.' });
    }
  } catch (error) {
    logger.error({ err: error }, 'Resend order OTP error')
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const getOrderReview = async (req, res) => {
  try {
    const { id } = req.params;
    const requesterId = (req.user._id || req.user.id).toString();
    const requesterRole = req.user.role;
    const Review = require('../models/Review');

    const order = await Order.findById(id).select('user_id items');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    const isAdmin = ['super_admin', 'SuperAdmin', 'Admin'].includes(requesterRole);
    const isBuyer = order.user_id?.toString() === requesterId;
    const isSeller = order.items.some(i => i.seller_id?.toString() === requesterId);

    if (!isAdmin && !isBuyer && !isSeller) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this review.' });
    }

    const reviews = await Review.find({ order_id: id });
    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    logger.error({ err: error }, 'getOrderReview error');
    res.status(500).json({ success: false, message: 'Error fetching review.' });
  }
};

module.exports = {
  createMarketplaceOrder,
  verifyMarketplacePayment,
  marketplacePaymentCallback,
  updateLeadStatus,
  getUserOrders,
  getSellerOrders,
  getOrderDetails,
  addReview,
  resendOrderOTP,
  getOrderReview
};
