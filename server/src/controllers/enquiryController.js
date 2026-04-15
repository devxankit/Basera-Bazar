const { Enquiry } = require('../models/Enquiry');
const { ServiceListing, PropertyListing, SupplierListing, MandiListing } = require('../models/Listing');

/**
 * @desc    Submit a new Enquiry for a listing
 * @route   POST /api/enquiries
 * @access  Private (User Token Required)
 */
const createEnquiry = async (req, res) => {
  try {
    const userId = req.user.id;
    const { enquiry_type, listing_id, content } = req.body;

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
      targetListing = await SupplierListing.findById(listing_id);
      partnerId = targetListing ? targetListing.partner_id : null;
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
    const newEnquiry = await Enquiry.create({
      enquiry_type,
      user_id: userId,
      listing_id,
      partner_id: partnerId,
      content,
      listing_snapshot: targetListing 
    });

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

module.exports = {
  createEnquiry,
  getMyEnquiries
};
