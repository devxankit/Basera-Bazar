const logger = require('../../utils/logger');
const { Partner } = require('../../models/Partner');
const { AdminUser } = require('../../models/Admin');
const { User } = require('../../models/User');
const { PropertyListing, ServiceListing, MandiListing } = require('../../models/Listing');
const { Transaction } = require('../../models/Finance');
const { ActivityLog } = require('../../utils/activityLogger');
const { Enquiry } = require('../../models/Enquiry');
const WithdrawalRequest = require('../../models/Wallet');

function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

const getDashboardStats = async (req, res) => {
  try {
    const { range = 'weekly' } = req.query;

    let startDate = new Date();
    let dateFormat = "%Y-%m-%d";

    if (range === 'monthly') {
      startDate.setDate(startDate.getDate() - 30);
      dateFormat = "%Y-W%V";
    } else if (range === 'yearly') {
      startDate.setFullYear(startDate.getFullYear() - 1);
      dateFormat = "%Y-%m";
    } else {
      startDate.setDate(startDate.getDate() - 7);
    }

    const [
      userCollectionCounts, partnerCollectionCounts, adminCollectionCounts,
      totalProperties, totalServices, totalProducts, totalRevenueData,
      registrationTrendsUser, registrationTrendsPartner, registrationTrendsAdmin,
      pendingProperties, pendingServices, adminSummary, partnerSummary, userSummary,
      withdrawalsCount
    ] = await Promise.all([
      User.countDocuments(),
      Partner.countDocuments({ onboarding_status: 'approved' }),
      AdminUser.countDocuments(),
      PropertyListing.countDocuments({ status: 'active' }),
      ServiceListing.countDocuments({ status: 'active' }),
      MandiListing.countDocuments({ status: 'active' }),
      Transaction.aggregate([{ $match: { status: 'success' } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
      User.aggregate([{ $match: { createdAt: { $gte: startDate } } }, { $group: { _id: { $dateToString: { format: dateFormat, date: "$createdAt" } }, count: { $sum: 1 } } }]),
      Partner.aggregate([{ $match: { createdAt: { $gte: startDate } } }, { $group: { _id: { $dateToString: { format: dateFormat, date: "$createdAt" } }, count: { $sum: 1 } } }]),
      AdminUser.aggregate([{ $match: { createdAt: { $gte: startDate } } }, { $group: { _id: { $dateToString: { format: dateFormat, date: "$createdAt" } }, count: { $sum: 1 } } }]),
      PropertyListing.find({ status: 'pending_approval' }).populate('partner_id', 'name').sort({ createdAt: -1 }).limit(5),
      ServiceListing.find({ status: 'pending_approval' }).populate('partner_id', 'name').sort({ createdAt: -1 }).limit(5),
      AdminUser.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
      Partner.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
      User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
      WithdrawalRequest.countDocuments({ status: 'pending' })
    ]);

    const totalUsersCount = userCollectionCounts + partnerCollectionCounts + adminCollectionCounts;
    const totalRevenue = totalRevenueData.length > 0 ? totalRevenueData[0].total : 0;

    const trendMap = {};
    let totalNewInPeriod = 0;
    [registrationTrendsUser, registrationTrendsPartner, registrationTrendsAdmin].forEach(trendSet => {
      trendSet.forEach(curr => {
        trendMap[curr._id] = (trendMap[curr._id] || 0) + curr.count;
        totalNewInPeriod += curr.count;
      });
    });

    let cumulativeBase = totalUsersCount - totalNewInPeriod;
    const chartData = [];
    if (range === 'monthly') {
      for (let i = 4; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - (i * 7));
        const key = `${d.getFullYear()}-W${getISOWeek(d).toString().padStart(2, '0')}`;
        cumulativeBase += (trendMap[key] || 0);
        chartData.push({ name: i === 0 ? 'This Week' : `Week ${4 - i + 1}`, users: cumulativeBase });
      }
    } else if (range === 'yearly') {
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const dateStr = d.toISOString().split('-').slice(0, 2).join('-');
        cumulativeBase += (trendMap[dateStr] || 0);
        chartData.push({ name: d.toLocaleDateString('en-US', { month: 'short' }), users: cumulativeBase });
      }
    } else {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        cumulativeBase += (trendMap[dateStr] || 0);
        chartData.push({ name: d.toLocaleDateString('en-US', { weekday: 'short' }), users: cumulativeBase });
      }
    }

    const distributionMap = { 'Admin': 0, 'Agent': 0, 'Customer': 0, 'Service Provider': 0, 'Supplier': 0 };
    adminSummary.forEach(r => { distributionMap['Admin'] += r.count; });
    partnerSummary.forEach(r => {
      if (r._id && distributionMap[r._id] !== undefined) distributionMap[r._id] += r.count;
      else if (r._id === 'partner') distributionMap['Service Provider'] += r.count;
    });
    userSummary.forEach(r => {
      if (r._id === 'Customer' || r._id === 'user') distributionMap['Customer'] += r.count;
      else if (r._id && distributionMap[r._id] !== undefined) distributionMap[r._id] += r.count;
    });

    const finalDistribution = Object.keys(distributionMap).map(key => ({ name: key, value: distributionMap[key] }));

    res.status(200).json({
      success: true,
      data: {
        users: totalUsersCount,
        partners: partnerCollectionCounts,
        properties: totalProperties,
        services: totalServices,
        products: totalProducts,
        revenue: totalRevenue,
        analytics: { chartData, distribution: finalDistribution },
        pending: {
          properties: pendingProperties,
          withdrawals: withdrawalsCount,
          others: [...pendingServices.map(s => ({ ...s.toObject(), type: 'Service' }))]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
        }
      }
    });
  } catch (error) {
    logger.error({ err: error }, "Dashboard stats error:");
    res.status(500).json({ success: false, message: 'Error fetching stats.' });
  }
};

const getAdminActivities = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { type, search } = req.query;

    const query = {};
    if (type && type !== 'enquiry') query.entity_type = type;
    if (search) query.description = { $regex: search, $options: 'i' };

    const [auditActivities, recentEnquiries] = await Promise.all([
      ActivityLog.find(query).sort({ createdAt: -1 }).limit(limit),
      (!type || type === 'enquiry')
        ? Enquiry.find(search ? { 'user_details.name': { $regex: search, $options: 'i' } } : {})
          .sort({ createdAt: -1 }).limit(limit).lean()
        : Promise.resolve([])
    ]);

    const enquiryActivities = recentEnquiries.map(enq => ({
      _id: enq._id,
      entity_type: 'enquiry',
      description: `New ${enq.enquiry_type} enquiry from ${enq.user_details?.name || 'a customer'}`,
      status: 'COMPLETED',
      createdAt: enq.createdAt,
      meta: { enquiry_type: enq.enquiry_type, user: enq.user_details }
    }));

    const allActivities = [...auditActivities, ...enquiryActivities]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice((page - 1) * limit, page * limit);

    res.status(200).json({
      success: true,
      count: allActivities.length,
      total: allActivities.length,
      pages: 1,
      currentPage: page,
      data: allActivities
    });
  } catch (error) {
    logger.error({ err: error }, "Activities error:");
    res.status(500).json({ success: false, message: 'Error fetching activities.' });
  }
};

const getPendingApprovals = async (req, res) => {
  try {
    const { type } = req.params;
    let listings = [];

    if (type === 'properties') {
      listings = await PropertyListing.find({ status: 'pending_approval' }).populate('partner_id', 'name phone').sort({ createdAt: -1 });
    } else if (type === 'others') {
      const [services, products] = await Promise.all([
        ServiceListing.find({ status: 'pending_approval' }).populate('partner_id', 'name phone'),
        MandiListing.find({ status: 'pending_approval' }).populate('partner_id', 'name phone')
      ]);
      listings = [...services.map(s => ({ ...s._doc, category: 'service' })), ...products.map(p => ({ ...p._doc, category: 'product' }))];
    } else {
      return res.status(400).json({ success: false, message: 'Invalid queue type.' });
    }

    res.status(200).json({ success: true, count: listings.length, data: listings });
  } catch (error) {
    logger.error({ err: error }, "Pending approvals error:");
    res.status(500).json({ success: false, message: 'Error fetching approval queue.' });
  }
};

const getAdminProfile = async (req, res) => {
  try {
    const adminId = req.user._id || req.user.id;
    const adminEmail = req.user.email;

    if (!adminId && !adminEmail) {
      return res.status(401).json({ success: false, message: 'Invalid session context. Please re-login.' });
    }

    let admin = await AdminUser.findById(adminId).select('-password');
    if (!admin && adminEmail) {
      admin = await AdminUser.findOne({ email: adminEmail }).select('-password');
    }

    if (!admin) {
      return res.status(404).json({ success: false, message: `Admin account not found. (Email: ${adminEmail || 'Unknown'})` });
    }

    res.json({ success: true, data: admin });
  } catch (err) {
    logger.error({ err }, 'getAdminProfile Error:');
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Your session contains an invalid identity ID. Please logout and re-login.' });
    }
    res.status(500).json({ success: false, message: 'Server error retrieving profile.' });
  }
};

const updateAdminProfile = async (req, res) => {
  try {
    const adminId = req.user._id || req.user.id;
    const adminEmail = req.user.email;

    if (!adminId && !adminEmail) {
      return res.status(401).json({ success: false, message: 'Invalid session context. Please re-login.' });
    }

    const { name, email, phone, address, city, state, profileImage } = req.body;

    let admin = await AdminUser.findById(adminId);
    if (!admin && adminEmail) admin = await AdminUser.findOne({ email: adminEmail });
    if (!admin) return res.status(404).json({ success: false, message: 'Admin account not found.' });

    if (name) admin.name = name;
    if (email) {
      const emailExists = await AdminUser.findOne({ email, _id: { $ne: admin._id } });
      if (emailExists) {
        return res.status(409).json({ success: false, message: 'This email is already in use by another administrator.' });
      }
      admin.email = email;
    }
    if (phone !== undefined) admin.phone = phone;
    if (address !== undefined) admin.address = address;
    if (city !== undefined) admin.city = city;
    if (state !== undefined) admin.state = state;
    if (profileImage !== undefined) admin.profileImage = profileImage;

    await admin.save();
    const updated = admin.toObject();
    delete updated.password;
    res.json({ success: true, message: 'Profile updated successfully.', data: updated });
  } catch (err) {
    logger.error({ err }, 'updateAdminProfile Error:');
    res.status(500).json({ success: false, message: 'Server error updating profile.' });
  }
};

const changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both current and new password are required.' });
    }
    const admin = await AdminUser.findById(req.user._id);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found.' });

    const isMatch = await admin.matchPassword(currentPassword);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Current password is incorrect.' });

    admin.password = newPassword;
    await admin.save();
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    logger.error({ err }, 'changeAdminPassword Error:');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  getDashboardStats,
  getAdminActivities,
  getPendingApprovals,
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword
};
