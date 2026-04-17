const mongoose = require('mongoose');
const crypto = require('crypto');
const Order = require('../models/Order');
const { MandiListing } = require('../models/Listing');
const { Partner } = require('../models/Partner');
const { RazorpayOrder, Transaction } = require('../models/Finance');
const { AppConfig } = require('../models/System');

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

    let totalAmount = 0;
    const processedItems = [];

    // 1. Validate Stock and Calculate Total
    for (const item of items) {
      const product = await MandiListing.findById(item.product_id);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product ${item.product_id} not found` });
      }

      if (product.stock_quantity < item.qty) {
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient stock for ${product.title}. Only ${product.stock_quantity} available.` 
        });
      }

      const itemTotal = product.pricing.price_per_unit * item.qty;
      totalAmount += itemTotal;

      processedItems.push({
        product_id: product._id,
        seller_id: product.partner_id,
        name: product.title,
        qty: item.qty,
        price: product.pricing.price_per_unit,
        unit: product.pricing.unit,
        status: 'pending'
      });
    }

    // 2. Fetch Global Token Amount from Config
    const tokenConfig = await AppConfig.findOne({ key: 'mandi_token_amount' });
    const baseToken = tokenConfig ? Number(tokenConfig.value) : 500; // Fallback to 500

    // Compute unique sellers
    const uniqueSellersSize = new Set(processedItems.map(item => item.seller_id.toString())).size;
    const bookingToken = baseToken * uniqueSellersSize;

    // 3. Create Razorpay order for ONLY the Token Amount (in paisa for Razorpay)
    const fakeRazorpayOrderId = `order_${crypto.randomBytes(8).toString('hex')}`;
    
    // 4. Create Marketplace Order with Token Payment Intent
    const orderId = `BSR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newOrder = await Order.create({
      order_id: orderId,
      user_id: userId,
      items: processedItems,
      total_amount: totalAmount, // Full value of goods
      shipping_address,
      billing_address,
      token_payment: {
        amount: bookingToken,
        razorpay_order_id: fakeRazorpayOrderId,
        status: 'pending'
      },
      status: 'pending'
    });

    // 5. Record the Razorpay intent for the Token Amount
    await RazorpayOrder.create({
      razorpay_order_id: fakeRazorpayOrderId,
      entity_type: 'user',
      entity_id: userId,
      purpose: `mandi_token_${newOrder._id}`,
      amount: bookingToken,
      status: 'created'
    });

    res.status(201).json({
      success: true,
      data: {
        order: newOrder,
        razorpay_order_id: fakeRazorpayOrderId,
        payment_amount: bookingToken // Customer only pays this now
      }
    });

  } catch (error) {
    console.error("Create Order Error:", error);
    res.status(500).json({ success: false, message: 'Error creating order.' });
  }
};

/**
 * @desc    Verify Payment for Marketplace Order
 * @route   POST /api/orders/payment/verify
 * @access  Private (User OR Webhook Mock)
 */
const verifyMarketplacePayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id } = req.body;

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
      await MandiListing.findByIdAndUpdate(item.product_id, {
        $inc: { stock_quantity: -item.qty }
      });
    }

    await order.save();

    res.status(200).json({ 
      success: true, 
      message: 'Token payment verified. Your order is successful and the supplier will contact you soon.', 
      data: order 
    });

  } catch (error) {
    console.error("Verify Payment Error:", error);
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
    if (!item || item.seller_id.toString() !== sellerId) {
      return res.status(403).json({ success: false, message: 'Not authorized for this lead.' });
    }

    const currentStatus = item.status;

    // 1. Validation Logic: Enforce linear progression
    // Flow: pending -> contacted -> processing -> shipped -> delivered
    const statusPriority = {
      'pending': 1,
      'contacted': 2,
      'processing': 3,
      'shipped': 4,
      'delivered': 5,
      'cancelled': 0 // Cancelled can happen from pending/contacted usually
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
      order.final_payment.method = 'cod';
      order.final_payment.status = 'paid';
      const itemTotal = item.price * item.qty;
      order.final_payment.amount = (order.final_payment.amount || 0) + itemTotal;
    }

    // Handle Seller Cancellation Penalty
    if (status === 'cancelled') {
        const tokenConfig = await AppConfig.findOne({ key: 'mandi_token_amount' });
        const penaltyAmount = tokenConfig ? Number(tokenConfig.value) : 500;
        
        await Partner.findByIdAndUpdate(sellerId, {
          $inc: { 'profile.mandi_profile.penalty_due': penaltyAmount }
        });
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

/**
 * @desc    Get User Orders
 * @route   GET /api/orders/my-orders
 * @access  Private (User Only)
 */
const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user_id: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
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
    const orders = await Order.find({ 'items.seller_id': sellerId }).sort({ createdAt: -1 });
    
    // Filter items to only show seller's own items
    const filteredOrders = orders.map(order => {
      const obj = order.toObject();
      obj.items = obj.items.filter(i => i.seller_id.toString() === sellerId);
      return obj;
    });

    res.status(200).json({ success: true, data: filteredOrders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching orders.' });
  }
};

module.exports = {
  createMarketplaceOrder,
  verifyMarketplacePayment,
  updateLeadStatus,
  getUserOrders,
  getSellerOrders
};
