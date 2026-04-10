const mongoose = require('mongoose');
const { Partner } = require('../models/Partner');
const { Enquiry } = require('../models/Enquiry');
const { AuditLog, AdminUser } = require('../models/Admin');
const { User } = require('../models/User');
const { PropertyListing, ServiceListing, SupplierListing, MandiListing } = require('../models/Listing');
const { Transaction, SubscriptionPlan } = require('../models/Finance');
const { Category } = require('../models/System');

// Helper to get ISO Week number
function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

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

const getDashboardStats = async (req, res) => {
  try {
    const { range = 'weekly' } = req.query;
    
    // 1. Calculate Time Ranges for Registration Trends
    let startDate = new Date();
    let dateFormat = "%Y-%m-%d";
    let groupStep = 'day';
    let limitDays = 7;

    if (range === 'monthly') {
      startDate.setDate(startDate.getDate() - 30);
      dateFormat = "%Y-W%V"; // ISO Week format
      limitDays = 5;
    } else if (range === 'yearly') {
      startDate.setFullYear(startDate.getFullYear() - 1);
      dateFormat = "%Y-%m";
      groupStep = 'month';
      limitDays = 12;
    } else {
      // Default: Weekly
      startDate.setDate(startDate.getDate() - 7);
      limitDays = 7;
    }

    // 1. Calculate Combined Stats in Parallel
    const [
      userCollectionCounts,
      partnerCollectionCounts,
      adminCollectionCounts,
      totalProperties,
      totalServices,
      totalProducts,
      totalRevenueData,
      registrationTrendsUser,
      registrationTrendsPartner,
      registrationTrendsAdmin,
      pendingProperties,
      pendingServices,
      pendingProducts,
      adminSummary,
      partnerSummary,
      userSummary
    ] = await Promise.all([
      // Unify counts across all platform participants
      User.countDocuments(),
      Partner.countDocuments({ onboarding_status: 'approved' }),
      AdminUser.countDocuments(),
      PropertyListing.countDocuments({ status: 'active' }),
      ServiceListing.countDocuments({ status: 'active' }),
      SupplierListing.countDocuments({ status: 'active' }),
      Transaction.aggregate([
        { $match: { status: 'success' } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      // Unify Registration Trends (Combined User, Partner & Admin growth)
      User.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: dateFormat, date: "$createdAt" } }, count: { $sum: 1 } } }
      ]),
      Partner.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: dateFormat, date: "$createdAt" } }, count: { $sum: 1 } } }
      ]),
      AdminUser.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: dateFormat, date: "$createdAt" } }, count: { $sum: 1 } } }
      ]),
      // High Priority queues
      PropertyListing.find({ status: 'pending_approval' }).populate('partner_id', 'name').sort({ createdAt: -1 }).limit(5),
      ServiceListing.find({ status: 'pending_approval' }).populate('partner_id', 'name').sort({ createdAt: -1 }).limit(5),
      SupplierListing.find({ status: 'pending_approval' }).populate('partner_id', 'name').sort({ createdAt: -1 }).limit(5),
      // Distribution Summary
      AdminUser.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
      Partner.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
      User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }])
    ]);

    const totalUsersCount = userCollectionCounts + partnerCollectionCounts + adminCollectionCounts;
    const totalRevenue = totalRevenueData.length > 0 ? totalRevenueData[0].total : 0;

    // 2. Format Registration Trends (Cumulative Merger)
    const trendMap = {};
    let totalNewInPeriod = 0;
    [registrationTrendsUser, registrationTrendsPartner, registrationTrendsAdmin].forEach(trendSet => {
      trendSet.forEach(curr => {
        trendMap[curr._id] = (trendMap[curr._id] || 0) + curr.count;
        totalNewInPeriod += curr.count;
      });
    });

    // Calculate base total (Total before the period started)
    let cumulativeBase = totalUsersCount - totalNewInPeriod;

    const chartData = [];
    if (range === 'monthly') {
      for (let i = 4; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - (i * 7));
        const key = `${d.getFullYear()}-W${getISOWeek(d).toString().padStart(2, '0')}`;
        cumulativeBase += (trendMap[key] || 0);
        chartData.push({ name: i === 0 ? 'This Week' : `Week ${4-i+1}`, users: cumulativeBase });
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

    // 3. User Distribution Mapping (Robust Standardized Categories)
    const distributionMap = {
      'Admin': 0,
      'Agent': 0,
      'Customer': 0,
      'Service Provider': 0,
      'Supplier': 0
    };

    adminSummary.forEach(r => { distributionMap['Admin'] += r.count; });
    partnerSummary.forEach(r => {
      if (r._id && distributionMap[r._id] !== undefined) distributionMap[r._id] += r.count;
      else if (r._id === 'partner') distributionMap['Service Provider'] += r.count; // Fallback for legacy
    });
    userSummary.forEach(r => {
      if (r._id === 'Customer' || r._id === 'user') distributionMap['Customer'] += r.count;
      else if (r._id && distributionMap[r._id] !== undefined) distributionMap[r._id] += r.count;
    });

    const finalDistribution = Object.keys(distributionMap).map(key => ({
      name: key,
      value: distributionMap[key]
    }));



    res.status(200).json({
      success: true,
      data: {
        users: totalUsersCount,
        partners: partnerCollectionCounts,
        properties: totalProperties,
        services: totalServices,
        products: totalProducts,
        revenue: totalRevenue,
        analytics: {
          chartData: chartData,
          distribution: finalDistribution
        },
        pending: {
          properties: pendingProperties,
          others: [
            ...pendingServices.map(s => ({ ...s.toObject(), type: 'Service' })),
            ...pendingProducts.map(p => ({ ...p.toObject(), type: 'Product' }))
          ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
        }
      }
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ success: false, message: 'Error fetching stats.' });
  }
};

/**
 * @desc    Get comprehensive system activities
 * @route   GET /api/admin/dashboard/activities
 * @access  Private (Super Admin Only)
 */
const getAdminActivities = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // We fetch recent users, partners, and listings to create a combined activity feed
    const [users, partners, properties, audiLogs] = await Promise.all([
      User.find().sort({ createdAt: -1 }).limit(10),
      Partner.find().sort({ createdAt: -1 }).limit(10),
      PropertyListing.find().sort({ createdAt: -1 }).limit(10),
      AuditLog.find().populate('performed_by', 'name').sort({ created_at: -1 }).limit(20)
    ]);

    const activities = [
      ...users.map(u => ({ 
        activity: `New Customer registered: ${u.name}`, 
        type: 'USER_REGISTRATION', 
        createdAt: u.createdAt,
        status: 'COMPLETED',
        entityId: u._id
      })),
      ...partners.map(p => ({ 
        activity: `New ${p.partner_type.replace('_', ' ')} registered: ${p.name}`, 
        type: 'PARTNER_ONBOARDING', 
        createdAt: p.createdAt,
        status: p.onboarding_status.toUpperCase(),
        entityId: p._id
      })),
      ...properties.map(l => ({ 
        activity: `New property submitted: ${l.title}`, 
        type: 'PROPERTY_LISTING', 
        createdAt: l.createdAt,
        status: l.status.toUpperCase(),
        entityId: l._id
      })),
      ...audiLogs.map(log => ({
        activity: `${log.performed_by?.name || 'Admin'} performed ${log.action.replace(/_/g, ' ')}`,
        type: 'ADMIN_ACTION',
        createdAt: log.created_at,
        status: 'AUDITED',
        entityId: log.entity_id
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 50);

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (error) {
    console.error("Activities error:", error);
    res.status(500).json({ success: false, message: 'Error fetching combined activities.' });
  }
};

/**
 * @desc    Get detailed profile of a specific user
 * @route   GET /api/admin/users/:id
 * @access  Private (Super Admin Only)
 */
const getUserDetail = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. Find the basic account (check User and Partner)
    let account = await User.findById(id);
    let partnerProfile = null;

    if (!account) {
      account = await Partner.findById(id);
      if (account) partnerProfile = account; // It's a partner
    }

    if (!account) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // 2. Fetch Aggregated Activity Stats
    const [propertyCount, serviceCount, leadCount, subscriptions] = await Promise.all([
      PropertyListing.countDocuments({ partner_id: id }),
      ServiceListing.countDocuments({ partner_id: id }),
      Enquiry.countDocuments({ $or: [{ user_id: id }, { partner_id: id }] }),
      mongoose.model('Subscription').find({ partner_id: id }).sort({ createdAt: -1 }).limit(1)
    ]);

    // 3. Construct the response matching the UI needs
    // We flatten it slightly for the frontend's convenience
    const fullData = {
      ...account.toObject(),
      stats: {
        properties: propertyCount,
        services: serviceCount,
        leads: leadCount,
        subscriptions: subscriptions.length
      },
      active_subscription: subscriptions[0] || null
    };

    res.status(200).json({ success: true, data: fullData });

  } catch (error) {
    console.error("Error fetching user detail:", error);
    res.status(500).json({ success: false, message: 'Error fetching user profile.' });
  }
};

/**
 * @desc    Create a new user or partner manually by admin
 * @route   POST /api/admin/users
 * @access  Private (Super Admin Only)
 */
const createUser = async (req, res) => {
  try {
    const { name, email, phone, role, password, partner_type } = req.body;

    // 1. Validation
    if (!name || !phone || !role || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, phone, role, and password.' });
    }

    // 2. Uniqueness Check across ALL models
    const phoneExists = await Promise.all([
      User.findOne({ phone }),
      Partner.findOne({ phone }),
      AdminUser.findOne({ phone })
    ]);

    if (phoneExists.some(u => u)) {
      return res.status(400).json({ success: false, message: 'Phone number already registered in the system.' });
    }

    if (email) {
      const emailExists = await Promise.all([
        User.findOne({ email: email.toLowerCase() }),
        Partner.findOne({ email: email.toLowerCase() }),
        AdminUser.findOne({ email: email.toLowerCase() })
      ]);
      if (emailExists.some(u => u)) {
        return res.status(400).json({ success: false, message: 'Email already registered.' });
      }
    }

    // 3. Create Account
    let newAccount;
    if (role === 'Customer' || role === 'user') {
      newAccount = await User.create({ name, phone, email: email?.toLowerCase(), password, role: 'Customer' });
    } else if (role === 'Admin') {
      newAccount = await AdminUser.create({ name, phone, email: email?.toLowerCase(), password, role: 'Admin' });
    } else if (['Agent', 'Supplier', 'Service Provider'].includes(role)) {
      // Map frontend roles to backend partner types
      let pType = partner_type || 'service_provider';
      if (role === 'Agent') pType = 'property_agent';
      else if (role === 'Supplier') pType = 'supplier';
      else if (role === 'Service Provider') pType = 'service_provider';

      // Build nested profiles
      const profile = {};
      if (role === 'Supplier') {
        profile.supplier_profile = {
          material_categories: req.body.material_categories || [],
          delivery_radius_km: req.body.delivery_radius_km || 10
        };
      } else if (role === 'Service Provider') {
        profile.service_profile = {
          category_id: req.body.service_category_id || null
        };
      }

      newAccount = await Partner.create({ 
        name, phone, email: email?.toLowerCase(), password, 
        partner_type: pType,
        role,
        state: req.body.state,
        district: req.body.district,
        address: req.body.address,
        active_subscription_id: req.body.active_subscription_id || req.body.subscription_id || null,
        profile,
        onboarding_status: 'approved' 
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid role selection.' });
    }

    res.status(201).json({ success: true, message: 'User created successfully.', data: newAccount });

  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ success: false, message: error.message || 'Error creating user.' });
  }
};

/**
 * @desc    Update existing user or partner
 * @route   PUT /api/admin/users/:id
 * @access  Private (Super Admin Only)
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active, role, material_categories, delivery_radius_km, subscription_id, ...otherFields } = req.body;

    // Detect Model
    let account = await User.findById(id) || await Partner.findById(id);
    if (!account) return res.status(404).json({ success: false, message: 'User not found.' });

    const Model = account.role === 'Customer' || account.role === 'user' ? User : Partner;

    // Build update object
    const updateData = { ...otherFields };
    if (is_active !== undefined) updateData.is_active = is_active;
    if (subscription_id) updateData.active_subscription_id = subscription_id;

    // Handle session closing if deactivating
    if (is_active === false && account.is_active !== false) {
      updateData.token_version = (account.token_version || 0) + 1;
    }

    // Handle nested Profiles if applicable
    if (Model === Partner) {
      if (material_categories || delivery_radius_km) {
        if (material_categories) updateData['profile.supplier_profile.material_categories'] = material_categories;
        if (delivery_radius_km) updateData['profile.supplier_profile.delivery_radius_km'] = delivery_radius_km;
      }
      
      if (req.body.service_category_id) {
        updateData['profile.service_profile.category_id'] = req.body.service_category_id;
      }

      // Sync active_subscription_id specifically for Partners
      if (req.body.active_subscription_id) {
        updateData.active_subscription_id = req.body.active_subscription_id;
      }
    }

    const updated = await Model.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, message: 'Profile updated successfully.', data: updated });

  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ success: false, message: 'Error updating information.' });
  }
};

/**
 * @desc    Delete a user or partner (Hard Delete)
 * @route   DELETE /api/admin/users/:id
 * @access  Private (Super Admin Only)
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Detect Model and Remove
    const userResult = await User.findByIdAndDelete(id);
    const partnerResult = await Partner.findByIdAndDelete(id);

    if (!userResult && !partnerResult) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // 2. Cleanup (Optional but recommended: delete their listings)
    // For now, we'll just return success as requested
    res.status(200).json({ success: true, message: 'User account permanently deleted from database.' });

  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ success: false, message: 'Error during deletion process.' });
  }
};

/**
 * @desc    Get subscription history for a user
 * @route   GET /api/admin/users/:id/subscriptions
 * @access  Private (Super Admin Only)
 */
const getUserSubscriptionHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const history = await mongoose.model('Subscription').find({ partner_id: id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    console.error("Subscription history error:", error);
    res.status(500).json({ success: false, message: 'Error fetching history.' });
  }
};

/**
 * @desc    Get specific pending approval queues
 * @route   GET /api/admin/dashboard/pending/:type
 * @access  Private (Super Admin Only)
 */
const getPendingApprovals = async (req, res) => {
  try {
    const { type } = req.params;
    let listings = [];

    if (type === 'properties') {
      listings = await PropertyListing.find({ status: 'pending_approval' }).populate('partner_id', 'name phone').sort({ createdAt: -1 });
    } else if (type === 'others') {
      const [services, products] = await Promise.all([
        ServiceListing.find({ status: 'pending_approval' }).populate('partner_id', 'name phone'),
        SupplierListing.find({ status: 'pending_approval' }).populate('partner_id', 'name phone')
      ]);
      listings = [...services.map(s => ({...s._doc, category: 'service'})), ...products.map(p => ({...p._doc, category: 'product'}))];
    } else {
      return res.status(400).json({ success: false, message: 'Invalid queue type.' });
    }

    res.status(200).json({ success: true, count: listings.length, data: listings });
  } catch (error) {
    console.error("Pending approvals error:", error);
    res.status(500).json({ success: false, message: 'Error fetching approval queue.' });
  }
};

/**
 * @desc    Get all users (with filters)
 * @route   GET /api/admin/users
 * @access  Private (Super Admin Only)
 */
const getUsers = async (req, res) => {
  try {
    // 1. Fetch from all three major identity collections in parallel
    const [regularUsers, partners, allAdmins] = await Promise.all([
      User.find().sort({ createdAt: -1 }),
      Partner.find().sort({ createdAt: -1 }),
      AdminUser.find().sort({ createdAt: -1 })
    ]);

    // 2. Map and standardise the display roles for the frontend
    const standardizedUsers = [
      ...regularUsers.map(u => ({ 
        ...u.toObject(),
        displayRole: u.role === 'user' ? 'Customer' : u.role,
        source: 'User'
      })),
      ...partners.map(p => ({ 
        ...p.toObject(),
        displayRole: p.role || (p.partner_type === 'property_agent' ? 'Agent' : 
                                p.partner_type === 'supplier' || p.partner_type === 'mandi_seller' ? 'Supplier' : 
                                'Service Provider'),
        source: 'Partner'
      })),
      ...allAdmins.map(a => {
        const obj = a.toObject();
        const role = (obj.role || '').toLowerCase();
        return { 
          ...obj,
          displayRole: (role === 'admin' || role === 'superadmin' || role === 'super_admin') ? 'Admin' : obj.role,
          source: 'AdminUser'
        };
      })
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({ 
      success: true, 
      count: standardizedUsers.length, 
      data: standardizedUsers 
    });
  } catch (error) {
    console.error("Error fetching unified users:", error);
    res.status(500).json({ success: false, message: 'Error fetching unified users.' });
  }
};

/**
 * @desc    Get all listings (Properties, Services, Products)
 * @route   GET /api/admin/listings/:type
 * @access  Private (Super Admin Only)
 */
const getListings = async (req, res) => {
  try {
    const { type } = req.params;
    let listings;
    
    if (type === 'property') listings = await PropertyListing.find().populate('partner_id', 'name phone').sort({ createdAt: -1 });
    else if (type === 'service') listings = await ServiceListing.find().populate('partner_id', 'name phone').sort({ createdAt: -1 });
    else if (type === 'product') listings = await SupplierListing.find().populate('partner_id', 'name phone').sort({ createdAt: -1 });
    else return res.status(400).json({ success: false, message: 'Invalid listing type.' });

    res.status(200).json({ success: true, count: listings.length, data: listings });
  } catch (error) {
    console.error("Error fetching listings:", error);
    res.status(500).json({ success: false, message: 'Error fetching listings.' });
  }
};

/**
 * @desc    Get all leads (Enquiries)
 * @route   GET /api/admin/leads
 * @access  Private (Super Admin Only)
 */
const getLeads = async (req, res) => {
  try {
    const leads = await Enquiry.find()
      .populate('user_id', 'name phone email')
      .populate('partner_id', 'name phone')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: leads.length, data: leads });
  } catch (error) {
    console.error("Error fetching leads:", error);
    res.status(500).json({ success: false, message: 'Error fetching leads.' });
  }
};

/**
 * @desc    Get the current admin's own profile
 * @route   GET /api/admin/profile/me
 * @access  Private (Super Admin)
 */
const getAdminProfile = async (req, res) => {
  try {
    const adminId = req.user._id || req.user.id;
    const adminEmail = req.user.email;
    
    if (!adminId && !adminEmail) {
      return res.status(401).json({ success: false, message: 'Invalid session context. Please re-login.' });
    }

    // Robust lookup: Try by ID first, then by Email as fallback (helps if DB was reset)
    let admin = await AdminUser.findById(adminId).select('-password');
    if (!admin && adminEmail) {
      admin = await AdminUser.findOne({ email: adminEmail }).select('-password');
    }

    if (!admin) {
      return res.status(404).json({ success: false, message: `Admin account not found. (Email: ${adminEmail || 'Unknown'})` });
    }
    
    res.json({ success: true, data: admin });
  } catch (err) {
    console.error('getAdminProfile Error:', err);
    // Explicitly handle Mongoose CastError (invalid ID formats)
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Your session contains an invalid identity ID. Please logout and re-login.' });
    }
    res.status(500).json({ success: false, message: `Server error retrieving profile: ${err.message}` });
  }
};

/**
 * @desc    Update the admin's own profile (name, phone, address, city, state)
 * @route   PUT /api/admin/profile/update
 * @access  Private (Super Admin)
 */
const updateAdminProfile = async (req, res) => {
  try {
    const adminId = req.user._id || req.user.id;
    const adminEmail = req.user.email;
    
    if (!adminId && !adminEmail) {
      return res.status(401).json({ success: false, message: 'Invalid session context. Please re-login.' });
    }

    const { name, email, phone, address, city, state, profileImage } = req.body;
    
    // Robust lookup: Try by ID first, then by Email as fallback
    let admin = await AdminUser.findById(adminId);
    if (!admin && adminEmail) {
      admin = await AdminUser.findOne({ email: adminEmail });
    }

    if (!admin) return res.status(404).json({ success: false, message: 'Admin account not found.' });

    if (name) admin.name = name;
    if (email) {
      // Check if another admin already has this email
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
    console.error('updateAdminProfile Error:', err);
    res.status(500).json({ success: false, message: `Server error updating profile: ${err.message}` });
  }
};

/**
 * @desc    Change the admin's own password
 * @route   PUT /api/admin/profile/change-password
 * @access  Private (Super Admin)
 */
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

    admin.password = newPassword; // pre-save hook will hash it
    await admin.save();
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Get all active subscription plans
 * @route   GET /api/admin/subscriptions/plans
 * @access  Private (Super Admin Only)
 */
const getSubscriptionPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find().sort({ price: 1 });
    res.status(200).json({ success: true, count: plans.length, data: plans });
  } catch (error) {
    console.error("Error fetching plans:", error);
    res.status(500).json({ success: false, message: 'Error fetching subscription plans.' });
  }
};

/**
 * @desc    Get system categories (Service or Material)
 * @route   GET /api/admin/system/categories
 * @access  Private (Super Admin Only)
 */
const getSystemCategories = async (req, res) => {
  try {
    const { type } = req.query; // 'service' or 'material'
    const query = { is_active: true };
    if (type) query.type = type;

    const categories = await Category.find(query).sort({ name: 1 });
    res.status(200).json({ success: true, count: categories.length, data: categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ success: false, message: 'Error fetching categories.' });
  }
};

module.exports = {
  findNearestMandiSellers,
  assignMandiEnquiry,
  getDashboardStats,
  getUsers,
  getListings,
  getLeads,
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
  getUserDetail,
  createUser,
  updateUser,
  deleteUser,
  getUserSubscriptionHistory,
  getAdminActivities,
  getPendingApprovals,
  getSubscriptionPlans,
  getSystemCategories
};
