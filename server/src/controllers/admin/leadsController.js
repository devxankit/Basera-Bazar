const logger = require('../../utils/logger');
const { Enquiry } = require('../../models/Enquiry');
const BroadcastLead = require('../../models/BroadcastLead');

const getLeads = async (req, res) => {
  try {
    const { owner, role, type, readStatus, contactStatus, search, dateFrom, dateTo } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    let query = {};
    if (type && type !== 'all') query.enquiry_type = type;
    if (readStatus === 'read') query.is_read = true;
    if (readStatus === 'unread') query.is_read = false;
    if (contactStatus && contactStatus !== 'all') query.contact_status = contactStatus;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    let enquiries = [];
    if (type === 'broadcast') {
      enquiries = [];
    } else {
      enquiries = await Enquiry.find(query)
        .populate('user_id', 'name phone email createdAt')
        .populate('partner_id', 'name phone role profileImage')
        .sort({ createdAt: -1 });
    }

    let broadcastLeads = [];
    if (!type || type === 'all' || type === 'broadcast' || type === 'service' || type === 'supplier') {
      let broadcastQuery = {};
      if (type === 'service') broadcastQuery.target_category = 'service';
      if (type === 'supplier') broadcastQuery.target_category = 'supplier';
      if (dateFrom || dateTo) {
        broadcastQuery.createdAt = {};
        if (dateFrom) broadcastQuery.createdAt.$gte = new Date(dateFrom);
        if (dateTo) broadcastQuery.createdAt.$lte = new Date(dateTo);
      }
      broadcastLeads = await BroadcastLead.find(broadcastQuery).populate('user_id', 'name phone email createdAt').sort({ createdAt: -1 });
    }

    const normalizedBroadcast = broadcastLeads.map(lead => ({
      ...lead.toObject(), enquiry_type: `broadcast_${lead.target_category}`,
      user_details: { name: lead.name, email: lead.email, phone: lead.phone },
      message: lead.requirement_details || 'Broadcast Requirement',
      listing_snapshot: { title: `BROADCAST: ${lead.target_category.toUpperCase()}`, category: lead.target_category },
      is_read: false, contact_status: 'new', is_broadcast: true
    }));

    let allLeads = [...enquiries, ...normalizedBroadcast];

    if (role || search || owner) {
      const searchText = (search || '').toLowerCase();
      allLeads = allLeads.filter(lead => {
        const matchesRole = !role || role === 'all' || (lead.partner_id && (lead.partner_id.role === role || (role === 'ServiceProvider' && lead.partner_id.role === 'service_provider')));
        const matchesOwner = !owner || owner === 'all' || (lead.partner_id && lead.partner_id._id.toString() === owner);
        const matchesSearch = !search || (lead.user_id && ((lead.user_id.name || '').toLowerCase().includes(searchText) || (lead.user_id.email || '').toLowerCase().includes(searchText) || (lead.user_id.phone || '').includes(searchText))) || ((lead.name || '').toLowerCase().includes(searchText)) || ((lead.phone || '').includes(searchText)) || (lead.listing_snapshot && lead.listing_snapshot.title && lead.listing_snapshot.title.toLowerCase().includes(searchText)) || (lead._id.toString().includes(searchText));
        return matchesRole && matchesSearch && matchesOwner;
      });
    }

    allLeads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const total = allLeads.length;
    const paginated = allLeads.slice(skip, skip + limit);

    const enquiriesWithMetrics = await Promise.all(paginated.map(async (lead) => {
      const rawUserId = lead.user_id?._id || lead.user_id;
      const total_user_inquiries = rawUserId ? await Enquiry.countDocuments({ user_id: rawUserId }) : 0;
      return { ...(lead.toObject ? lead.toObject() : lead), total_user_inquiries };
    }));

    res.status(200).json({ success: true, count: enquiriesWithMetrics.length, total, page, totalPages: Math.ceil(total / limit), data: enquiriesWithMetrics });
  } catch (error) {
    logger.error({ err: error }, "Error fetching leads:");
    res.status(500).json({ success: false, message: 'Error fetching leads.' });
  }
};

const getLeadById = async (req, res) => {
  try {
    const { id } = req.params;
    const { broadcast } = req.query;

    if (broadcast === 'true') {
      const lead = await BroadcastLead.findById(id).populate('user_id', 'name phone email createdAt');
      if (!lead) return res.status(404).json({ success: false, message: 'Broadcast lead not found' });
      return res.status(200).json({ success: true, data: { ...lead.toObject(), is_broadcast: true, enquiry_type: `broadcast_${lead.target_category}`, user_details: { name: lead.name, email: lead.email, phone: lead.phone }, message: lead.requirement_details } });
    }

    const rawLead = await Enquiry.findById(id).lean();
    if (!rawLead) {
      const bLead = await BroadcastLead.findById(id).populate('user_id', 'name phone email createdAt');
      if (bLead) return res.status(200).json({ success: true, data: { ...bLead.toObject(), is_broadcast: true, enquiry_type: `broadcast_${bLead.target_category}`, user_details: { name: bLead.name, email: bLead.email, phone: bLead.phone }, message: bLead.requirement_details } });
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const rawUserId = rawLead.user_id;
    const lead = await Enquiry.findById(id).populate('user_id', 'name phone email createdAt').populate('partner_id', 'name phone role email profileImage createdAt').populate('mandi_assignment.assigned_to_partner_id', 'name phone role profileImage');

    if (!lead.is_read) { lead.is_read = true; lead.status = 'read'; await lead.save(); }

    const totalCount = await Enquiry.countDocuments({ user_id: rawUserId });
    res.status(200).json({ success: true, data: lead, metrics: { totalInquiries: totalCount } });
  } catch (error) {
    logger.error({ err: error }, "Error fetching lead detail:");
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const updateLeadStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_read, contact_status } = req.body;

    const update = {};
    if (is_read !== undefined) { update.is_read = is_read; update.status = is_read ? 'read' : 'new'; }
    if (contact_status !== undefined) { update.contact_status = contact_status; if (contact_status === 'contacted') update.status = 'contacted'; }

    const lead = await Enquiry.findByIdAndUpdate(id, update, { new: true });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.status(200).json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const deleteLead = async (req, res) => {
  try {
    const lead = await Enquiry.findByIdAndDelete(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.status(200).json({ success: true, message: 'Lead removed from database' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getLeads, getLeadById, updateLeadStatus, deleteLead };
