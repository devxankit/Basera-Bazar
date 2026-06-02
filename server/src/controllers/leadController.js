const BroadcastLead = require('../models/BroadcastLead');
const logger = require('../utils/logger');
const { Partner } = require('../models/Partner');
const { createNotification } = require('../utils/notificationHelper');
const { getPartnerLimits, getActiveSubscription } = require('../utils/subscriptionUtils');

/**
 * @desc    Create a broadcast lead and notify local partners
 * @route   POST /api/leads/broadcast
 * @access  Private (User)
 */
exports.createBroadcastLead = async (req, res) => {
  try {
    const {
      name, phone, email,
      state, district, full_address,
      products, requirement_details, document_url,
      target_category
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone number are required.' });
    }
    if (!district || typeof district !== 'string') {
      return res.status(400).json({ success: false, message: 'District is required to broadcast your requirement.' });
    }
    if (!['service', 'supplier'].includes(target_category)) {
      return res.status(400).json({ success: false, message: 'Invalid category. Must be "service" or "supplier".' });
    }
    if (!products?.length || products.some(p => !p.item_name?.trim())) {
      return res.status(400).json({ success: false, message: 'At least one product/service item is required.' });
    }

    const lead = await BroadcastLead.create({
      user_id: req.user.id,
      name,
      phone,
      email,
      delivery_location: {
        state,
        district,
        full_address
      },
      products,
      requirement_details,
      document_url,
      target_category
    });

    // ── BROADCAST TO PARTNERS ──
    // Find partners in the same district and category
    // For 'service', match partner_type: 'service_provider'
    // For 'supplier', match partner_type: 'supplier' or 'mandi_seller'
    
    let partnerTypeFilter = [];
    if (target_category === 'service') {
      partnerTypeFilter = ['service_provider'];
    } else {
      partnerTypeFilter = ['supplier', 'mandi_seller'];
    }

    const localPartners = await Partner.find({
      district: { $regex: new RegExp(district, 'i') },
      partner_type: { $in: partnerTypeFilter },
      onboarding_status: 'approved',
      is_active: true
    }).select('_id name fcmTokens fcmTokenMobile');

    logger.info(`[BroadcastLead] Found ${localPartners.length} partners in ${district} for category ${target_category}`)

    const notificationTitle = `New Requirement: ${target_category === 'service' ? 'Service' : 'Product'} Quotation Request`;
    const notificationBody = `${name} is looking for ${products?.[0]?.item_name || 'materials'} in ${district}. Check details and contact now!`;

    // Send notifications in parallel (ignoring failures for individual partners)
    await Promise.all(localPartners.map(partner =>
      createNotification(
        'partner',
        partner._id,
        notificationTitle,
        notificationBody,
        { type: 'broadcast_lead', lead_id: lead._id.toString() }
      )
    )).catch(err => logger.error("[BroadcastLead] Notification error:", err))

    res.status(201).json({
      success: true,
      message: `Lead broadcasted to ${localPartners.length} local providers.`,
      data: lead
    });

  } catch (error) {
    logger.error({ err: error }, "Error in createBroadcastLead:")
    res.status(500).json({ success: false, message: 'Server error broadcasting lead.' });
  }
};

/**
 * @desc    Get broadcast leads for a partner's city
 * @route   GET /api/leads/partner
 * @access  Private (Partner)
 */
exports.getPartnerLeads = async (req, res) => {
  try {
    const partner = await Partner.findById(req.user.id);
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found.' });
    }

    if (partner.subscription_expired) {
      return res.status(403).json({
        success: false,
        code: 'SUBSCRIPTION_EXPIRED',
        message: 'Your subscription has expired. Please renew your plan to access leads.'
      });
    }

    if (!partner.district) {
      return res.status(200).json({ success: true, count: 0, data: [], limitReached: false });
    }

    const query = {
      'delivery_location.district': { $regex: new RegExp(partner.district, 'i') },
      status: 'active'
    };

    // Filter by category relevance
    if (partner.partner_type === 'service_provider') {
      query.target_category = 'service';
    } else if (['supplier', 'mandi_seller'].includes(partner.partner_type)) {
      query.target_category = 'supplier';
    }

    const leads = await BroadcastLead.find(query).sort({ createdAt: -1 }).limit(200);

    // Check limits
    const leadRole = req.user.active_role || req.user.partner_type;
    const limits = await getPartnerLimits(req.user.id, leadRole);
    const sub = await getActiveSubscription(req.user.id, leadRole);
    const usage = sub?.usage?.enquiries_received_this_month || 0;
    const limitReached = limits.leads !== -1 && usage >= limits.leads;

    // Redact if limit reached
    const processedLeads = leads.map(l => {
      const obj = l.toObject();
      if (limitReached) {
        obj.phone = obj.phone ? obj.phone.substring(0, 3) + '*******' : '***';
        obj.email = obj.email ? '*******@' + (obj.email.split('@')[1] || 'hidden.com') : null;
        obj.limitReached = true;
      }
      return obj;
    });

    res.status(200).json({
      success: true,
      count: processedLeads.length,
      data: processedLeads,
      limitReached
    });

  } catch (error) {
    logger.error({ err: error }, "Error in getPartnerLeads:")
    res.status(500).json({ success: false, message: 'Server error fetching leads.' });
  }
};
/**
 * @desc    Get broadcast lead details for partner
 * @route   GET /api/leads/partner/:id
 * @access  Private (Partner)
 */
exports.getPartnerLeadById = async (req, res) => {
  try {
    if (req.user.subscription_expired) {
      return res.status(403).json({
        success: false,
        code: 'SUBSCRIPTION_EXPIRED',
        message: 'Your subscription has expired. Please renew your plan to access leads.'
      });
    }

    const lead = await BroadcastLead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found.' });

    // Check limits
    const leadRole = req.user.active_role || req.user.partner_type;
    const limits = await getPartnerLimits(req.user.id, leadRole);
    const sub = await getActiveSubscription(req.user.id, leadRole);
    const usage = sub?.usage?.enquiries_received_this_month || 0;
    
    // For broadcast leads, we don't have a per-partner "read" status in the model
    // So we just check if the limit is reached.
    // Note: This is simpler than Enquiries which track "read" status.
    const limitReached = limits.leads !== -1 && usage >= limits.leads;

    const data = lead.toObject();
    if (limitReached) {
      data.phone = data.phone ? data.phone.substring(0, 3) + '*******' : '***';
      data.email = data.email ? '*******@' + (data.email.split('@')[1] || 'hidden.com') : null;
      data.limitReached = true;
    }

    res.status(200).json({ success: true, data });

  } catch (error) {
    logger.error({ err: error }, "Error in getPartnerLeadById:")
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
