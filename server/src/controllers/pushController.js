const { Partner } = require('../models/Partner');

/**
 * @desc    Save/Register a Web Push subscription for the partner
 * @route   POST /api/partners/notifications/subscribe
 * @access  Private (Partner)
 */
exports.subscribePartner = async (req, res) => {
  try {
    const partnerId = req.user.id;
    const subscription = req.body;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ success: false, message: 'Invalid subscription object.' });
    }

    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found.' });
    }

    // Initialize if it doesn't exist
    if (!partner.push_subscriptions) partner.push_subscriptions = [];

    // Avoid duplicates by checking endpoint
    const exists = partner.push_subscriptions.find(s => s.endpoint === subscription.endpoint);
    if (!exists) {
      partner.push_subscriptions.push(subscription);
      await partner.save();
    }

    res.status(200).json({ success: true, message: 'Push subscription registered successfully.' });
  } catch (error) {
    console.error('Error in subscribePartner:', error);
    res.status(500).json({ success: false, message: 'Server error registering subscription.' });
  }
};

/**
 * @desc    Get the public VAPID key
 * @route   GET /api/partners/notifications/vapid-key
 * @access  Private (Partner)
 */
exports.getVapidKey = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      public_key: process.env.VAPID_PUBLIC_KEY
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching VAPID key.' });
  }
};
