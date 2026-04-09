const { Partner } = require('../models/Partner');
const { Enquiry } = require('../models/Enquiry');
const { AuditLog } = require('../models/Admin');

/**
 * @desc    Find nearest Mandi Seller partners for lead assignment
 * @route   GET /api/admin/partners/mandi-search?lat=&lng=&radius=
 * @access  Private (Super Admin Only)
 */
const findNearestMandiSellers = async (req, res) => {
  try {
    const { lat, lng, radius = 100 } = req.query; // default 100km search radius for bulk items

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Please provide lat and lng.' });
    }

    // This is the custom geo-search query we built for you to easily find the nearest mandi sellers.
    // We restrict it to partners where partner_type === 'mandi_seller' AND onboarding_status === 'approved'.
    const nearestSellers = await Partner.find({
      partner_type: 'mandi_seller',
      onboarding_status: 'approved',
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          // Convert KM to meters for MongoDB
          $maxDistance: parseFloat(radius) * 1000 
        }
      }
    });

    res.status(200).json({
      success: true,
      count: nearestSellers.length,
      data: nearestSellers
    });

  } catch (error) {
    console.error("Error finding mandi sellers:", error);
    res.status(500).json({ success: false, message: 'Server error finding nearest sellers.' });
  }
};

/**
 * @desc    Assign a specific Mandi Enquiry to a searched Mandi Seller
 * @route   PUT /api/admin/enquiries/mandi/:id/assign
 * @access  Private (Super Admin Only)
 */
const assignMandiEnquiry = async (req, res) => {
  try {
    const adminId = req.user.id;
    const enquiryId = req.params.id;
    const { target_partner_id } = req.body;

    const enquiry = await Enquiry.findById(enquiryId);

    if (!enquiry || enquiry.enquiry_type !== 'mandi') {
      return res.status(404).json({ success: false, message: 'Valid mandi enquiry not found.' });
    }

    // 1. Actually do the assignment! Update the previously null partner_id field
    enquiry.partner_id = target_partner_id;
    enquiry.mandi_assignment = {
      assigned_to_partner_id: target_partner_id,
      assigned_by: adminId,
      fulfillment_status: 'assigned'
    };

    await enquiry.save();

    // 2. Create an Immutable Audit Log!
    // This tracks exactly WHICH admin pushed this deal to WHICH partner.
    await AuditLog.create({
      performed_by: adminId,
      action: 'assign_mandi_enquiry',
      entity_type: 'Enquiry',
      entity_id: enquiryId,
      changes: {
        after: { assigned_to: target_partner_id }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Successfully assigned Mandi lead to partner.',
      data: enquiry
    });

  } catch (error) {
    console.error("Error assigning mandi lead:", error);
    res.status(500).json({ success: false, message: 'Server error during lead assignment.' });
  }
};

module.exports = {
  findNearestMandiSellers,
  assignMandiEnquiry
};
