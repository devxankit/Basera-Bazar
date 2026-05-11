const logger = require('../../utils/logger');
const { Partner } = require('../../models/Partner');
const { Enquiry } = require('../../models/Enquiry');
const { AuditLog } = require('../../models/Admin');
const { logActivity } = require('../../utils/activityLogger');
const { createNotification } = require('../../utils/notificationHelper');
const invalidate = require('../../utils/cacheInvalidator');

const findNearestMandiSellers = async (req, res) => {
  try {
    const { lat, lng, radius = 100 } = req.query;
    if (!lat || !lng) return res.status(400).json({ success: false, message: 'Please provide lat and lng.' });

    const nearestSellers = await Partner.find({
      $or: [{ roles: 'mandi_seller' }, { partner_type: 'mandi_seller' }],
      onboarding_status: 'approved',
      location: { $near: { $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] }, $maxDistance: parseFloat(radius) * 1000 } }
    });

    res.status(200).json({ success: true, count: nearestSellers.length, data: nearestSellers });
  } catch (error) {
    logger.error({ err: error }, "Error finding mandi sellers:");
    res.status(500).json({ success: false, message: 'Server error finding nearest sellers.' });
  }
};

const assignMandiEnquiry = async (req, res) => {
  try {
    const adminId = req.user.id;
    const enquiryId = req.params.id;
    const { target_partner_id } = req.body;

    const enquiry = await Enquiry.findById(enquiryId);
    if (!enquiry || enquiry.enquiry_type !== 'mandi') return res.status(404).json({ success: false, message: 'Valid mandi enquiry not found.' });

    enquiry.partner_id = target_partner_id;
    enquiry.mandi_assignment = { assigned_to_partner_id: target_partner_id, assigned_by: adminId, fulfillment_status: 'assigned' };
    await enquiry.save();

    await AuditLog.create({ performed_by: adminId, action: 'assign_mandi_enquiry', entity_type: 'Enquiry', entity_id: enquiryId, changes: { after: { assigned_to: target_partner_id } } });

    res.status(200).json({ success: true, message: 'Successfully assigned Mandi lead to partner.', data: enquiry });
  } catch (error) {
    logger.error({ err: error }, "Error assigning mandi lead:");
    res.status(500).json({ success: false, message: 'Server error during lead assignment.' });
  }
};

const processRoleRequest = async (req, res) => {
  try {
    const { partnerId, role, action, rejectionReason } = req.body;
    const adminId = req.user.id;

    if (!partnerId || !role || !action) return res.status(400).json({ success: false, message: 'Please provide partnerId, role, and action.' });

    const partner = await Partner.findById(partnerId);
    if (!partner) return res.status(404).json({ success: false, message: 'Partner not found.' });

    const requestIndex = partner.role_requests.findIndex(r => r.role === role && r.status === 'pending');
    if (requestIndex === -1) return res.status(404).json({ success: false, message: 'Pending request for this role not found.' });

    if (action === 'approve') {
      const request = partner.role_requests[requestIndex];
      if (!partner.roles.includes(role)) partner.roles.push(role);
      request.status = 'approved';
      request.reviewed_at = new Date();
      request.reviewed_by = adminId;
      partner.active_role = role;
      await partner.save();

      await createNotification('partner', partnerId, 'Role Upgrade Approved! 🎉', `Congratulations! Your request for the ${role.replace('_', ' ')} role has been approved. You can now access new features.`, { type: 'role_upgrade_approved', role });
      await logActivity({ actor_name: req.user.name, actor_id: adminId, action: 'approved', entity_type: 'partner_role', entity_name: partner.name, entity_id: partnerId, description: `Approved ${role} role for ${partner.name}` });

    } else if (action === 'reject') {
      partner.role_requests[requestIndex].status = 'rejected';
      partner.role_requests[requestIndex].reviewed_at = new Date();
      partner.role_requests[requestIndex].reviewed_by = adminId;
      partner.role_requests[requestIndex].rejection_reason = rejectionReason || 'Documents were not accepted.';
      await partner.save();

      await createNotification('partner', partnerId, 'Role Upgrade Rejected', `Your request for the ${role.replace('_', ' ')} role was not approved. Reason: ${rejectionReason || 'Documents were not accepted.'}`, { type: 'role_upgrade_rejected', role, reason: rejectionReason });
      await logActivity({ actor_name: req.user.name, actor_id: adminId, action: 'rejected', entity_type: 'partner_role', entity_name: partner.name, entity_id: partnerId, description: `Rejected ${role} role for ${partner.name}. Reason: ${rejectionReason || 'N/A'}` });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action. Use approve or reject.' });
    }

    await invalidate.adminDashboard();
    res.status(200).json({ success: true, message: `Role request ${action}ed successfully.` });
  } catch (error) {
    logger.error({ err: error }, "Process role request error:");
    res.status(500).json({ success: false, message: 'Server error processing role request.' });
  }
};

const getRoleRequests = async (req, res) => {
  try {
    const partnersWithRequests = await Partner.find({ 'role_requests.0': { $exists: true } }).select('name phone email role_requests').sort({ 'role_requests.submitted_at': -1 });

    const roleRequests = [];
    partnersWithRequests.forEach(partner => {
      partner.role_requests.forEach(req => {
        roleRequests.push({ ...req.toObject(), partnerId: partner._id, partnerName: partner.name, partnerPhone: partner.phone, partnerEmail: partner.email });
      });
    });

    roleRequests.sort((a, b) => new Date(b.submitted_at || b.requested_at) - new Date(a.submitted_at || a.requested_at));
    res.status(200).json({ success: true, count: roleRequests.length, data: roleRequests });
  } catch (error) {
    logger.error({ err: error }, "Get role requests error:");
    res.status(500).json({ success: false, message: 'Error fetching role requests.' });
  }
};

module.exports = { findNearestMandiSellers, assignMandiEnquiry, processRoleRequest, getRoleRequests };
