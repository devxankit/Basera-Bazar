const { Enquiry } = require('../models/Enquiry');
const { ServiceListing, PropertyListing, MandiListing } = require('../models/Listing');
const { Partner } = require('../models/Partner');
const { Notification } = require('../models/System');

/**
 * @desc    Submit a new Enquiry for a listing
 * @route   POST /api/enquiries
 * @access  Private (User Token Required)
 */
const createEnquiry = async (req, res) => {
  try {
    const userId = req.user.id;
    const { enquiry_type, listing_id, content, inquiry_type } = req.body;

    let targetListing;
    let partnerId = null;

    // 1. Validate the listing exists based on the type they provided
    // We also map the correct Partner ID internally so the user can't maliciously fake it
    if (enquiry_type === 'service') {
      targetListing = await ServiceListing.findById(listing_id);
      partnerId = targetListing ? targetListing.partner_id : null;
    } else if (enquiry_type === 'property') {
      targetListing = await PropertyListing.findById(listing_id);
      partnerId = targetListing ? targetListing.partner_id : null;
    } else if (enquiry_type === 'supplier') {
      targetListing = await Partner.findById(listing_id);
      partnerId = targetListing ? targetListing._id : null;
    } else if (enquiry_type === 'mandi') {
      targetListing = await MandiListing.findById(listing_id);
      // BIG DIFFERENCE: For Mandi, we intentionally DO NOT map the partnerID right now. 
      // It stays null so the Admin can manually assign it later!
      partnerId = null; 
    }

    if (!targetListing) {
      return res.status(404).json({ success: false, message: 'Requested listing does not exist.' });
    }

  // 2. Create the enquiry in the database
    // We save a snapshot of user_details so the Lead remains readable 
    // even if the user profile is changed or deleted.
    const newEnquiry = await Enquiry.create({
      enquiry_type,
      user_id: userId,
      user_details: req.body.user_details || {
        name: req.user.name,
        phone: req.user.phone,
        email: req.user.email
      },
      listing_id,
      partner_id: partnerId,
      content,
      inquiry_type: inquiry_type || 'General Inquiry',
      listing_snapshot: targetListing 
    });

    // 3. Update Listing Stats
    if (!targetListing.stats) {
      targetListing.stats = { views: 0, enquiries: 0, calls: 0, whatsapp_clicks: 0 };
    }
    targetListing.stats.enquiries = (targetListing.stats.enquiries || 0) + 1;
    await targetListing.save();

    // 4. Create Notification for Partner (if applicable)
    if (partnerId) {
      const { createNotification } = require('../utils/notificationHelper');
      await createNotification(
        'partner',
        partnerId,
        'New Lead Received!',
        `You have a new ${enquiry_type} inquiry for "${targetListing.title || targetListing.serviceName || targetListing.name || 'your business'}" from ${req.user.name}.`,
        {
          type: 'enquiry',
          enquiry_id: newEnquiry._id,
          listing_id: targetListing._id
        }
      );
    }

    res.status(201).json({ 
      success: true, 
      message: 'Enquiry submitted successfully! We will contact you soon.',
      data: newEnquiry
    });

  } catch (error) {
    console.error("Error creating enquiry:", error);
    res.status(500).json({ success: false, message: 'Server error processing enquiry.' });
  }
};

/**
 * @desc    Get user's history of sent enquiries
 * @route   GET /api/users/enquiries
 * @access  Private (User Token Required)
 */
const getMyEnquiries = async (req, res) => {
  try {
    // Note: We use req.user.id to FORCE the query to only return their own data!
    // This is how we ensure data isolation.
    const enquiries = await Enquiry.find({ user_id: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: enquiries.length, data: enquiries });
  } catch (error) {
    console.error("Error getting user enquiries:", error);
    res.status(500).json({ success: false, message: 'Server error fetching history.' });
  }
};

/**
 * @desc    Get inquiries for the logged in partner (Leads)
 * @route   GET /api/partners/enquiries
 * @access  Private (Partner Token Required)
 */
const getPartnerInquiries = async (req, res) => {
  try {
    const { limit, status } = req.query;
    const query = { partner_id: req.user._id };
    if (status) query.status = status;

    const inquiries = await Enquiry.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) || 50);

    res.status(200).json({ 
      success: true, 
      count: inquiries.length, 
      data: inquiries 
    });
  } catch (error) {
    console.error("Error getting partner inquiries:", error);
    res.status(500).json({ success: false, message: 'Server error fetching leads.' });
  }
};

/**
 * @desc    Get single inquiry details for partner
 * @route   GET /api/partners/enquiries/:id
 * @access  Private
 */
const getInquiryById = async (req, res) => {
  try {
    const inquiry = await Enquiry.findById(req.params.id);

    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found.' });
    }

    // Security: Check ownership
    if (inquiry.partner_id && inquiry.partner_id.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized to view this lead.' });
    }

    // Mark as read if it was new
    if (!inquiry.is_read) {
      inquiry.is_read = true;
      if (inquiry.status === 'new') inquiry.status = 'read';
      await inquiry.save();
    }

    res.status(200).json({ success: true, data: inquiry });
  } catch (error) {
    console.error("Error fetching lead detail:", error);
    res.status(500).json({ success: false, message: 'Error fetching lead details.' });
  }
};

/**
 * @desc    Update inquiry status
 * @route   PATCH /api/partners/enquiries/:id/status
 * @access  Private
 */
const updateInquiryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const inquiry = await Enquiry.findById(req.params.id);

    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found.' });
    }

    if (inquiry.partner_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    inquiry.status = status;
    if (status === 'contacted') {
      inquiry.contact_status = 'contacted';
      inquiry.is_read = true;
    } else if (status === 'read') {
      inquiry.contact_status = 'not_contacted';
      inquiry.is_read = true;
    } else if (status === 'new') {
      inquiry.contact_status = 'not_contacted';
      inquiry.is_read = false;
    }
    
    await inquiry.save();

    res.status(200).json({ success: true, data: inquiry });
  } catch (error) {
    console.error("Error updating lead status:", error);
    res.status(500).json({ success: false, message: 'Error updating status.' });
  }
};

/**
 * @desc    Delete an inquiry
 * @route   DELETE /api/partners/enquiries/:id
 * @access  Private
 */
const deleteInquiry = async (req, res) => {
  try {
    const inquiry = await Enquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found.' });
    }

    if (inquiry.partner_id.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized.' });
    }

    await inquiry.deleteOne();

    res.status(200).json({ success: true, message: 'Lead deleted successfully.' });
  } catch (error) {
    console.error("Error deleting lead:", error);
    res.status(500).json({ success: false, message: 'Error deleting lead.' });
  }
};

module.exports = {
  createEnquiry,
  getMyEnquiries,
  getPartnerInquiries,
  getInquiryById,
  updateInquiryStatus,
  deleteInquiry
};
