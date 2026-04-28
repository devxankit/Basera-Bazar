const mongoose = require('mongoose');
const { Partner } = require('../models/Partner');
const { Enquiry } = require('../models/Enquiry');
const { AuditLog, AdminUser } = require('../models/Admin');
const { User } = require('../models/User');
const { PropertyListing, ServiceListing, MandiListing } = require('../models/Listing');
const { Transaction, SubscriptionPlan } = require('../models/Finance');
const { Category, Banner, AppConfig } = require('../models/System');
const { ActivityLog, logActivity } = require('../utils/activityLogger');
const { createNotification } = require('../utils/notificationHelper');

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
      $or: [
        { roles: 'mandi_seller' },
        { partner_type: 'mandi_seller' }
      ],
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
      MandiListing.countDocuments({ status: 'active' }),
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
            ...pendingServices.map(s => ({ ...s.toObject(), type: 'Service' }))
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
    const { type, search } = req.query;

    const query = {};
    if (type && type !== 'enquiry') query.entity_type = type;
    if (search) query.description = { $regex: search, $options: 'i' };

    // Fetch audit log activities + recent enquiries in parallel
    const [auditActivities, recentEnquiries] = await Promise.all([
      ActivityLog.find(query).sort({ createdAt: -1 }).limit(limit),
      // Only include enquiries in the feed if no specific non-enquiry type is filtered
      (!type || type === 'enquiry')
        ? Enquiry.find(search ? { 'user_details.name': { $regex: search, $options: 'i' } } : {})
          .sort({ createdAt: -1 })
          .limit(limit)
          .lean()
        : Promise.resolve([])
    ]);

    // Normalize enquiries into the same shape as ActivityLog entries
    const enquiryActivities = recentEnquiries.map(enq => ({
      _id: enq._id,
      entity_type: 'enquiry',
      description: `New ${enq.enquiry_type} enquiry from ${enq.user_details?.name || 'a customer'}`,
      status: 'COMPLETED',
      createdAt: enq.createdAt,
      meta: { enquiry_type: enq.enquiry_type, user: enq.user_details }
    }));

    // Merge and sort all activities by date, then paginate
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
    console.error("Activities error:", error);
    res.status(500).json({ success: false, message: 'Error fetching activities.' });
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
    const [propertyCount, serviceCount, leadCount, activeSub] = await Promise.all([
      PropertyListing.countDocuments({ partner_id: id }),
      ServiceListing.countDocuments({ partner_id: id }),
      Enquiry.countDocuments({ $or: [{ user_id: id }, { partner_id: id }] }),
      mongoose.model('Subscription').findOne({ partner_id: id, status: { $in: ['active', 'trial'] } })
        .populate('plan_id')
        .sort({ createdAt: -1 })
    ]);

    let calculatedSubscription = null;
    let effectiveSub = activeSub;

    // Default Plan Fallback Logic for Partners
    if (!effectiveSub && !['Customer', 'Admin', 'super_admin'].includes(account.role)) {
      const defaultFreePlan = await mongoose.model('SubscriptionPlan').findOne({
        $or: [{ name: /Free/i }, { price: 0 }]
      }).lean();

      effectiveSub = {
        plan_snapshot: defaultFreePlan ? {
          name: defaultFreePlan.name,
          price: defaultFreePlan.price,
          duration_days: defaultFreePlan.duration_days,
          listings_limit: defaultFreePlan.listings_limit,
          featured_listings_limit: defaultFreePlan.featured_listings_limit,
          leads_limit: defaultFreePlan.leads_limit
        } : { name: 'Free Trail', price: 0, duration_days: 30, listings_limit: 1, featured_listings_limit: 1, leads_limit: 50 },
        status: 'active',
        starts_at: account.createdAt,
        ends_at: null,
        is_virtual: true
      };
    }

    if (effectiveSub) {
      // Check for Expiry
      const now = new Date();
      if (effectiveSub.status === 'active' && effectiveSub.ends_at && new Date(effectiveSub.ends_at) < now) {
        effectiveSub.status = 'expired';
        if (effectiveSub._id && !effectiveSub.is_virtual) {
          await mongoose.model('Subscription').findByIdAndUpdate(effectiveSub._id, { status: 'expired' });
        }
      }

      if (effectiveSub.status !== 'expired') {
        const startDate = effectiveSub.starts_at;
        const endDate = effectiveSub.ends_at || now;

        const [pUsed, sUsed, supUsed, fpUsed, fsUsed, eUsed] = await Promise.all([
          PropertyListing.countDocuments({ partner_id: id, createdAt: { $gte: startDate, $lte: endDate } }),
          ServiceListing.countDocuments({ partner_id: id, createdAt: { $gte: startDate, $lte: endDate } }),
          PropertyListing.countDocuments({ partner_id: id, is_featured: true, createdAt: { $gte: startDate, $lte: endDate } }),
          ServiceListing.countDocuments({ partner_id: id, is_featured: true, createdAt: { $gte: startDate, $lte: endDate } }),
          Enquiry.countDocuments({ partner_id: id, createdAt: { $gte: startDate, $lte: endDate } })
        ]);

        const totalListingsUsed = pUsed + sUsed;
        const totalFeaturedUsed = fpUsed + fsUsed;

        calculatedSubscription = { ...effectiveSub };
        if (!effectiveSub.is_virtual && typeof effectiveSub.toObject === 'function') {
          calculatedSubscription = effectiveSub.toObject();
        }

        calculatedSubscription.usage = {
          listings_created: totalListingsUsed,
          featured_listings_used: totalFeaturedUsed,
          enquiries_received_this_month: eUsed
        };
      } else {
        calculatedSubscription = effectiveSub.is_virtual ? { ...effectiveSub } : effectiveSub.toObject();
      }
    }

    // 3. Construct the response matching the UI needs
    const accountObj = account.toObject();
    const partnerProfileAlias = accountObj.partner_type ? {
      state: accountObj.state || '',
      city: accountObj.city || '',
      district: accountObj.district || '',
      address: accountObj.address || '',
      supplier_profile: accountObj.profile?.supplier_profile || {},
      service_profile: {
        service_category_id: accountObj.profile?.service_profile?.category_id || ''
      }
    } : null;

    const fullData = {
      ...accountObj,
      // NEW: Flattened location fields for direct UI access
      city: accountObj.city || accountObj.default_location?.city || 'N/A',
      state: accountObj.state || accountObj.default_location?.state || 'Bihar',
      district: accountObj.district || accountObj.default_location?.district || 'Muzaffarpur',
      address: accountObj.address || accountObj.default_location?.address || 'Muzaffarpur, Bihar',

      partner_profile: partnerProfileAlias,
      stats: {
        properties: propertyCount,
        services: serviceCount,
        leads: leadCount
      },
      active_subscription: calculatedSubscription
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
    const { name, email, phone, role, password, partner_type, image, business_logo } = req.body;

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
      newAccount = await User.create({ name, phone, email: email?.toLowerCase(), password, role: 'Customer', image });
    } else if (role === 'Admin') {
      newAccount = await AdminUser.create({ name, phone, email: email?.toLowerCase(), password, role: 'Admin' });
    } else if (['Agent', 'Supplier', 'Service Provider', 'Mandi Seller'].includes(role)) {
      // Map frontend roles to backend partner types
      let pType = partner_type || 'service_provider';
      if (role === 'Agent') pType = 'property_agent';
      else if (role === 'Supplier') pType = 'supplier';
      else if (role === 'Service Provider') pType = 'service_provider';
      else if (role === 'Mandi Seller') pType = 'mandi_seller';

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
      } else if (role === 'Mandi Seller') {
        profile.mandi_profile = {
          business_name: req.body.business_name || '',
          business_logo: business_logo || '',
          business_description: req.body.business_description || ''
        };
      }

      newAccount = await Partner.create({
        name, phone, email: email?.toLowerCase(), password,
        partner_type: pType,
        roles: [pType],
        active_role: pType,
        role,
        state: req.body.state,
        district: req.body.district,
        address: req.body.address,
        image,
        business_logo,
        active_subscription_id: req.body.active_subscription_id || req.body.subscription_id || null,
        profile,
        onboarding_status: 'approved'
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid role selection.' });
    }

    res.status(201).json({ success: true, message: 'User created successfully.', data: newAccount });

    // Log the activity
    const actorName = req.user?.name || 'Admin';
    await logActivity({
      actor_name: actorName,
      actor_id: req.user?._id,
      action: 'created',
      entity_type: (role === 'Customer' || role === 'user') ? 'user' : 'partner',
      entity_name: name,
      entity_id: newAccount._id,
      description: `${actorName} created ${role} account: ${name} (${email || phone})`
    });

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
    // Destructure all known fields so otherFields is clean
    const {
      is_active,
      role,
      material_categories,
      delivery_radius_km,
      subscription_id,
      active_subscription_id,
      service_category_id,
      state,
      district,
      address,
      name,
      email,
      phone,
      business_name,
      business_description,
      roles,
      active_role,
      onboarding_status,
      rejection_reason,
      image,
      business_logo
    } = req.body;

    // Detect Model
    let account = await User.findById(id) || await Partner.findById(id);
    if (!account) return res.status(404).json({ success: false, message: 'User not found.' });

    const isPartnerModel = account.role !== 'Customer' && account.role !== 'user';
    const Model = isPartnerModel ? Partner : User;

    // Build update object with only safe scalar fields
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email?.toLowerCase() || null;
    if (phone !== undefined) updateData.phone = phone;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (image !== undefined) updateData.image = image;
    if (business_logo !== undefined) updateData.business_logo = business_logo;

    // Handle session closing if deactivating
    if (is_active === false && account.is_active !== false) {
      updateData.token_version = (account.token_version || 0) + 1;
    }

    // Partner-specific fields
    if (isPartnerModel) {
      if (roles !== undefined) updateData.roles = roles;
      if (active_role !== undefined) updateData.active_role = active_role;
      if (state !== undefined) updateData.state = state;
      if (district !== undefined) updateData.district = district;
      if (address !== undefined) updateData.address = address;

      if (onboarding_status !== undefined) {
        updateData.onboarding_status = onboarding_status;
        // Map onboarding status to kyc status
        if (onboarding_status === 'approved') updateData['kyc.status'] = 'approved';
        else if (onboarding_status === 'rejected') updateData['kyc.status'] = 'rejected';
        else if (onboarding_status === 'pending_approval') updateData['kyc.status'] = 'pending';
        
        // Record review metadata
        updateData['kyc.reviewed_at'] = new Date();
        updateData['kyc.reviewed_by'] = req.user.id;
      }

      if (rejection_reason !== undefined) {
        updateData['kyc.rejection_reason'] = rejection_reason;
      }

      // Only set active_subscription_id if it's a non-empty valid value
      const subId = active_subscription_id || subscription_id;
      if (subId && subId !== '') {
        updateData.active_subscription_id = subId;
      } else if (subId === '') {
        updateData.active_subscription_id = null;
      }

      if (material_categories !== undefined) {
        updateData['profile.supplier_profile.material_categories'] = material_categories;
      }
      if (delivery_radius_km !== undefined && delivery_radius_km !== '') {
        updateData['profile.supplier_profile.delivery_radius_km'] = Number(delivery_radius_km);
      }
      if (service_category_id && service_category_id !== '') {
        updateData['profile.service_profile.category_id'] = service_category_id;
      }

      // Mandi Seller specific fields
      if (business_name !== undefined) {
        updateData['profile.mandi_profile.business_name'] = business_name;
      }
      if (business_description !== undefined) {
        updateData['profile.mandi_profile.business_description'] = business_description;
      }
      if (business_logo !== undefined) {
        updateData['profile.mandi_profile.business_logo'] = business_logo;
      }
    }

    const updated = await Model.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: false }
    );

    // NEW: Notify if account status changed
    if (is_active !== undefined && account.is_active !== is_active) {
      await createNotification(
        isPartnerModel ? 'partner' : 'user',
        id,
        is_active ? 'Account Activated! 🔓' : 'Account Deactivated 🔒',
        is_active
          ? 'Welcome back! Your account has been activated by the administrator. You can now access all platform features.'
          : 'Your account has been deactivated by the administrator. Please contact support for more information.',
        { type: 'account_status_change', is_active }
      );
    }

    res.status(200).json({ success: true, message: 'Profile updated successfully.', data: updated });

    // Log the activity
    const actorName = req.user?.name || 'Admin';
    await logActivity({
      actor_name: actorName,
      actor_id: req.user?._id,
      action: 'updated',
      entity_type: account.role === 'Customer' || account.role === 'user' ? 'user' : 'partner',
      entity_name: account.name,
      entity_id: id,
      description: `${actorName} updated profile of ${account.name}`
    });

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
    let listingsDeleted = 0;
    if (partnerResult || userResult) {
       const objectId = new mongoose.Types.ObjectId(id);
       const propResult = await PropertyListing.deleteMany({ partner_id: objectId });
       const servResult = await ServiceListing.deleteMany({ partner_id: objectId });
       const mandiResult = await MandiListing.deleteMany({ partner_id: objectId });
       
       listingsDeleted = (propResult?.deletedCount || 0) + (servResult?.deletedCount || 0) + (mandiResult?.deletedCount || 0);
    }

    const deletedName = userResult?.name || partnerResult?.name || 'Unknown';
    const deletedType = userResult ? 'user' : 'partner';

    res.status(200).json({ 
       success: true, 
       message: 'User account permanently deleted from database.',
       listingsDeleted
    });

    // Log the activity
    const actorName = req.user?.name || 'Admin';
    await logActivity({
      actor_name: actorName,
      actor_id: req.user?._id,
      action: 'deleted',
      entity_type: deletedType,
      entity_name: deletedName,
      entity_id: id,
      description: `${actorName} permanently deleted ${deletedType}: ${deletedName}`
    });

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
 * @desc    Get all subscriptions across the platform
 * @route   GET /api/admin/subscriptions
 * @access  Private (Super Admin Only)
 */
const getAllSubscriptions = async (req, res) => {
  try {
    const { plan, status, role, search } = req.query;

    const partnerRoles = ['Agent', 'Supplier', 'Service Provider', 'service_provider', 'property_agent', 'supplier', 'mandi_seller'];

    // Define search object for common fields
    let s = search ? new RegExp(search, 'i') : null;

    // 1. Fetch from Users collection
    let uQuery = {
      role: { $in: ['Agent', 'Supplier', 'Service Provider'] }
    };
    if (role && role !== 'all') {
      uQuery.role = role.replace(/([A-Z])/g, ' $1').trim();
    }
    if (s) {
      uQuery.$or = [{ name: s }, { email: s }, { phone: s }];
    }
    const users = await mongoose.model('User').find(uQuery).lean();

    // 2. Fetch from Partners collection
    let pQuery = {};
    if (role && role !== 'all') {
      const mappedRole = role === 'ServiceProvider' ? 'service_provider' :
        role === 'Agent' ? 'property_agent' :
          role === 'Supplier' ? 'supplier' : role.toLowerCase();
      pQuery.$or = [
        { partner_type: mappedRole },
        { roles: mappedRole }
      ];
    }
    if (s) {
      pQuery.$or = [{ name: s }, { email: s }, { phone: s }];
    }
    const legacyPartners = await mongoose.model('Partner').find(pQuery).lean();

    // 3. Unify and deduplicate
    const partnerMap = new Map();

    users.forEach(u => {
      partnerMap.set(u._id.toString(), {
        ...u,
        role: u.role,
        source: 'User'
      });
    });

    legacyPartners.forEach(p => {
      if (!partnerMap.has(p._id.toString())) {
        partnerMap.set(p._id.toString(), {
          ...p,
          role: p.role || p.partner_type,
          source: 'Partner'
        });
      }
    });

    const allPartners = Array.from(partnerMap.values());

    // 4. Enrich with Subscription data
    const now = new Date();
    const finalData = [];

    // Fetch the default Free Plan once to use as fallback
    const defaultFreePlan = await mongoose.model('SubscriptionPlan').findOne({
      $or: [{ name: /Free/i }, { price: 0 }]
    }).lean();

    for (let partner of allPartners) {
      let activeSub = null;

      if (partner.active_subscription_id) {
        activeSub = await mongoose.model('Subscription').findById(partner.active_subscription_id).lean();
      }

      if (!activeSub) {
        activeSub = await mongoose.model('Subscription').findOne({
          partner_id: partner._id,
          status: { $in: ['active', 'trial', 'expired'] }
        }).sort({ createdAt: -1 }).lean();
      }

      if (activeSub) {
        if (activeSub.status === 'active' && activeSub.ends_at && new Date(activeSub.ends_at) < now) {
          activeSub.status = 'expired';
          await mongoose.model('Subscription').findByIdAndUpdate(activeSub._id, { status: 'expired' });
        }
      }

      // If STILL no activeSub, create a VIRTUAL default one per user's logic
      if (!activeSub) {
        activeSub = {
          _id: `VIRTUAL-FREE-${partner._id}`,
          partner_id: partner._id,
          plan_snapshot: defaultFreePlan ? {
            name: defaultFreePlan.name,
            price: defaultFreePlan.price,
            duration_days: defaultFreePlan.duration_days,
            listings_limit: defaultFreePlan.listings_limit,
            featured_listings_limit: defaultFreePlan.featured_listings_limit,
            leads_limit: defaultFreePlan.leads_limit
          } : { name: 'Free Tier', price: 0, duration_days: 30, listings_limit: 1, featured_listings_limit: 1, leads_limit: 50 },
          status: 'active',
          starts_at: partner.createdAt,
          ends_at: null,
          is_virtual: true
        };
      }

      if (plan && plan !== 'all') {
        if (!activeSub || (activeSub.plan_id && activeSub.plan_id.toString() !== plan)) continue;
      }

      if (status && status !== 'all') {
        if (activeSub.status !== status) continue;
      }

      finalData.push({
        ...activeSub,
        partner_id: partner,
        _id: activeSub._id
      });
    }

    res.status(200).json({ success: true, count: finalData.length, data: finalData });
  } catch (error) {
    console.error("Error fetching all subscriptions:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Manually grant a subscription to a partner
 * @route   POST /api/admin/subscriptions
 * @access  Private (Super Admin Only)
 */
const createManualSubscription = async (req, res) => {
  try {
    const { partner_id, plan_id, starts_at, duration_days, amount_paid, listings_limit, featured_listings_limit, leads_limit, notes } = req.body;

    // 1. Get Plan snapshot or details
    const plan = await mongoose.model('SubscriptionPlan').findById(plan_id);

    // 2. Create the subscription doc
    const subscription = await mongoose.model('Subscription').create({
      partner_id,
      plan_id,
      plan_snapshot: {
        name: plan?.name || 'Manual Adjustment',
        price: amount_paid !== undefined ? amount_paid : (plan?.price || 0),
        duration_days: duration_days || plan?.duration_days || 30,
        listings_limit: listings_limit !== undefined ? (listings_limit === -1 ? -1 : parseInt(listings_limit)) : (plan?.listings_limit || 0),
        featured_listings_limit: featured_listings_limit !== undefined ? (featured_listings_limit === -1 ? -1 : parseInt(featured_listings_limit)) : (plan?.featured_listings_limit || 0),
        leads_limit: leads_limit !== undefined ? (leads_limit === -1 ? -1 : parseInt(leads_limit)) : (plan?.leads_limit || 0),
      },
      status: 'active',
      starts_at: starts_at || new Date(),
      ends_at: new Date(new Date(starts_at || new Date()).getTime() + (duration_days || 30) * 24 * 60 * 60 * 1000),
      granted_by_admin: true,
      notes
    });

    // 3. Update Partner's active subscription ID shortcut
    const partner = await Partner.findByIdAndUpdate(partner_id, {
      active_subscription_id: subscription._id
    }, { new: true });

    res.status(201).json({ success: true, data: subscription, message: 'Subscription manual override successful.' });

    // 4. Log the activity
    await logActivity({
      actor_name: req.user?.name || 'Admin',
      actor_id: req.user?._id,
      action: 'created',
      entity_type: 'subscription',
      entity_name: partner?.name || 'Partner',
      entity_id: subscription._id,
      description: `${req.user?.name || 'Admin'} manually granted "${plan?.name || 'Manual'}" plan to ${partner?.name}`
    });
  } catch (error) {
    console.error("Manual subscription error:", error);
    res.status(500).json({ success: false, message: error.message });
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
      listings = [...services.map(s => ({ ...s._doc, category: 'service' })), ...products.map(p => ({ ...p._doc, category: 'product' }))];
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
      ...partners.map(p => {
        let displayRoles = [];
        if (p.roles && p.roles.length > 0) {
          const roleMap = {
            'property_agent': 'Agent',
            'supplier': 'Supplier',
            'mandi_seller': 'Supplier', // Or 'Mandi Seller'
            'service_provider': 'Service Provider'
          };
          displayRoles = [...new Set(p.roles.map(r => roleMap[r]).filter(Boolean))];
        } else {
          const fallbackRole = p.role || (p.partner_type === 'property_agent' ? 'Agent' :
            p.partner_type === 'supplier' || p.partner_type === 'mandi_seller' ? 'Supplier' :
              'Service Provider');
          displayRoles = [fallbackRole];
        }

        return {
          ...p.toObject(),
          displayRoles,
          displayRole: displayRoles.length === 1 ? displayRoles[0] : displayRoles.map(r => r.split(' ').map(w => w[0]).join('')).join(', '),
          source: 'Partner'
        };
      }),
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
    require('fs').writeFileSync('/Users/ujjawalmahawar/Desktop/Appzeto/BaseraBazar/server/debug_route_listings.txt', `Hit getListings with type: ${req.params.type}`);
    const { type } = req.params;
    const { category, category_id, subcategory, listing_intent, status, state, district, price_range, search } = req.query;

    let query = {};
    if (category) query.category_id = category;
    if (category_id) query.category_id = category_id;
    if (subcategory) query.subcategory_id = subcategory;
    if (status) query.status = status;

    if (type === 'property') {
      if (listing_intent) query.listing_intent = listing_intent;
      if (state) query['address.state'] = state;
      if (district) query['address.district'] = district;

      if (price_range === '0-50L') query['pricing.amount'] = { $lt: 5000000 };
      else if (price_range === '50L-1C') query['pricing.amount'] = { $gte: 5000000, $lte: 10000000 };
      else if (price_range === '1C+') query['pricing.amount'] = { $gt: 10000000 };

      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { 'address.district': { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
    } else {
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
    }

    let listings;

    if (type === 'property') listings = await PropertyListing.find(query).populate('partner_id', 'name phone').sort({ createdAt: -1 });
    else if (type === 'service') listings = await ServiceListing.find(query).populate('partner_id', 'name phone').sort({ createdAt: -1 });
    else if (type === 'product') {
      // --- ONE TIME FORCE RESET ---
      const testRow = await SupplierListing.findOne({ title: 'Ultra-Strong Portland Cement (Fixed)' });
      if (!testRow) {
        await SupplierListing.deleteMany({}); // Wipe out the broken data completely.

        const Partner = require('../models/Partner').Partner;
        const { Category } = require('../models/System');

        let partner = await Partner.findOne({ role: { $regex: /supplier/i } });
        if (!partner) partner = await Partner.findOne();

        let category = await Category.findOne({ type: 'supplier', parent_id: null });
        if (!category) {
          category = await Category.create({
            name: 'Construction Materials',
            slug: 'construction-materials-' + Date.now(),
            type: 'supplier',
            description: 'Heavy duty construction materials.'
          });
        }

        if (partner && category) {
          await SupplierListing.insertMany([
            {
              partner_id: partner._id,
              title: 'Ultra-Strong Portland Cement (Fixed)',
              description: 'Premium quality cement for structural integrity.',
              category_id: category._id,
              pricing: { price_per_unit: 450, min_order_qty: 50 },
              location: { type: 'Point', coordinates: [77.2, 28.6] },
              delivery_radius_km: 150,
              status: 'active'
            }
          ]);
        }
      }
      // ------------------------------------

      listings = await SupplierListing.find(query)
        .populate('partner_id', 'name phone')
        .populate('category_id', 'name')
        .populate('subcategory_id', 'name')
        .populate('brand_id', 'name logo')
        .populate('pricing.unit_id', 'name abbreviation')
        .sort({ createdAt: -1 });
    }
    else return res.status(400).json({ success: false, message: 'Invalid listing type.' });

    require('fs').writeFileSync('/Users/ujjawalmahawar/Desktop/Appzeto/BaseraBazar/server/debug_listings.txt', `Type: ${type}, Count: ${listings.length}, Query: ${JSON.stringify(query)}`);

    res.status(200).json({ success: true, count: listings.length, data: listings });
  } catch (error) {
    console.error("Error fetching listings:", error);
    res.status(500).json({ success: false, message: 'Error fetching listings.' });
  }
};

/**
 * @desc    Get single listing detail
 * @route   GET /api/admin/listings/detail/:id
 * @access  Private (Super Admin Only)
 */
const getListingDetail = async (req, res) => {
  try {
    const { id } = req.params;

    // Check across all listing types
    let listing = await PropertyListing.findById(id).populate('partner_id', 'name phone email').populate('category_id subcategory_id');
    if (!listing) listing = await ServiceListing.findById(id).populate('partner_id', 'name phone email').populate('category_id');
    if (!listing) listing = await SupplierListing.findById(id).populate('partner_id', 'name phone email');

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    res.status(200).json({ success: true, data: listing });
  } catch (error) {
    console.error("Error fetching listing detail:", error);
    res.status(500).json({ success: false, message: 'Error fetching listing detail.' });
  }
};

/**
 * @desc    Update listing status with optional reason
 * @route   PATCH /api/admin/listings/:id/status
 * @access  Private (Super Admin Only)
 */
const updateListingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, status_reason } = req.body;

    if (!['pending_approval', 'active', 'sold_rented', 'inactive', 'suspended', 'rejected', 'deleted'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status transition.' });
    }

    // Identify and update
    let listing = await PropertyListing.findById(id) || await ServiceListing.findById(id) || await SupplierListing.findById(id);

    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found.' });

    listing.status = status;
    if (status_reason !== undefined) listing.status_reason = status_reason;
    if (status === 'deleted') listing.deleted_at = new Date();

    await listing.save();

    // NEW: Notify partner if approved
    if (status === 'active' && listing.partner_id) {
      await createNotification(
        'partner',
        listing.partner_id,
        'Listing Approved! 🎉',
        `Congratulations! Your listing "${listing.title}" has been approved and is now live on BaseraBazar.`,
        { listing_id: listing._id, type: 'listing_approval' }
      );
    } else if (status === 'rejected' && listing.partner_id) {
      await createNotification(
        'partner',
        listing.partner_id,
        'Listing Update',
        `Your listing "${listing.title}" requires changes. Reason: ${status_reason || 'Not specified'}.`,
        { listing_id: listing._id, type: 'listing_rejection' }
      );
    }

    res.status(200).json({ success: true, message: `Listing marked as ${status}`, data: listing });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ success: false, message: 'Error updating listing status.' });
  }
};

/**
 * @desc    Update listing details
 * @route   PUT /api/admin/listings/:id
 * @access  Private (Super Admin Only)
 */
const updateListing = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Detect Model and update
    let listing = await PropertyListing.findById(id);
    let Model = PropertyListing;

    if (!listing) {
      listing = await ServiceListing.findById(id);
      Model = ServiceListing;
    }
    if (!listing) {
      listing = await SupplierListing.findById(id);
      Model = SupplierListing;
    }

    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found.' });

    // Sanitize empty string IDs to prevent Mongoose CastErrors
    if (updateData.category_id === '') updateData.category_id = null;
    if (updateData.subcategory_id === '') updateData.subcategory_id = null;
    if (updateData.partner_id === '') updateData.partner_id = null;

    const updated = await Model.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });

    res.status(200).json({ success: true, message: 'Listing updated successfully.', data: updated });

    // Log the activity
    await logActivity({
      actor_name: req.user?.name || 'Admin',
      actor_id: req.user?._id,
      action: 'updated',
      entity_type: 'property',
      entity_name: listing.title,
      entity_id: id,
      description: `${req.user?.name || 'Admin'} updated property: ${listing.title}`
    });
  } catch (error) {
    console.error("Error updating listing:", error); console.log("PAYLOAD RECEIVED:", JSON.stringify(req.body, null, 2));
    res.status(500).json({ success: false, message: error.message || 'Error updating listing.' });
  }
};

/**
 * @desc    Permanently delete a listing
 * @route   DELETE /api/admin/listings/:id
 * @access  Private (Super Admin Only)
 */
const deleteListing = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await PropertyListing.findByIdAndDelete(id) ||
      await ServiceListing.findByIdAndDelete(id) ||
      await SupplierListing.findByIdAndDelete(id);

    if (!result) return res.status(404).json({ success: false, message: 'Listing not found.' });

    res.status(200).json({ success: true, message: 'Listing permanently removed from database.' });
  } catch (error) {
    console.error("Error deleting listing:", error);
    res.status(500).json({ success: false, message: 'Error during listing deletion.' });
  }
};

/**
 * @desc    Get all leads (Enquiries)
 * @route   GET /api/admin/leads
 * @access  Private (Super Admin Only)
 */
const getLeads = async (req, res) => {
  try {
    const {
      owner,
      role,
      type,
      readStatus,
      contactStatus,
      search,
      dateFrom,
      dateTo
    } = req.query;

    let query = {};

    // Basic filters
    if (type && type !== 'all') query.enquiry_type = type;
    if (readStatus === 'read') query.is_read = true;
    if (readStatus === 'unread') query.is_read = false;
    if (contactStatus && contactStatus !== 'all') query.contact_status = contactStatus;

    // Date range
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    // Fetch leads with population
    let leads = await Enquiry.find(query)
      .populate('user_id', 'name phone email createdAt')
      .populate('partner_id', 'name phone role profileImage')
      .sort({ createdAt: -1 });

    // Client-side filtering for complex search and nested fields
    if (role || search || owner) {
      const searchText = (search || '').toLowerCase();
      leads = leads.filter(lead => {
        const matchesRole = !role || role === 'all' || (lead.partner_id && (lead.partner_id.role === role || (role === 'ServiceProvider' && lead.partner_id.role === 'service_provider')));
        const matchesOwner = !owner || owner === 'all' || (lead.partner_id && lead.partner_id._id.toString() === owner);

        const matchesSearch = !search ||
          (lead.user_id && (
            (lead.user_id.name || '').toLowerCase().includes(searchText) ||
            (lead.user_id.email || '').toLowerCase().includes(searchText) ||
            (lead.user_id.phone || '').includes(searchText)
          )) ||
          (lead.listing_snapshot && lead.listing_snapshot.title && lead.listing_snapshot.title.toLowerCase().includes(searchText)) ||
          (lead._id.toString().includes(searchText));

        return matchesRole && matchesSearch && matchesOwner;
      });
    }

    // IMPORTANT: Capture raw user_ids BEFORE populate overwrites them with null (for deleted users).
    // We build a map of lead._id -> raw user_id ObjectId from a lean (un-populated) query.
    const rawLeadData = await Enquiry.find(query).select('user_id').lean();
    const rawUserIdMap = {};
    rawLeadData.forEach(r => { rawUserIdMap[r._id.toString()] = r.user_id; });

    // Add historical metrics for each lead using the reliable raw user_id
    const leadsWithMetrics = await Promise.all(leads.map(async (lead) => {
      const rawUserId = rawUserIdMap[lead._id.toString()];
      const total_user_inquiries = rawUserId
        ? await Enquiry.countDocuments({ user_id: rawUserId })
        : 0;
      return {
        ...lead.toObject(),
        total_user_inquiries
      };
    }));

    res.status(200).json({
      success: true,
      count: leads.length,
      data: leadsWithMetrics
    });
  } catch (error) {
    console.error("Error fetching leads:", error);
    res.status(500).json({ success: false, message: 'Error fetching leads.' });
  }
};

const getLeadById = async (req, res) => {
  try {
    // IMPORTANT: First fetch the raw document to capture the user_id ObjectId
    // BEFORE populate runs. If the user account was deleted, populate returns null
    // which breaks countDocuments (it returns 0 instead of the real count).
    const rawLead = await Enquiry.findById(req.params.id).lean();
    if (!rawLead) return res.status(404).json({ success: false, message: 'Lead not found' });

    // Capture the raw user_id ObjectId — this is always reliable
    const rawUserId = rawLead.user_id;

    // Now fetch the full populated lead for the response
    const lead = await Enquiry.findById(req.params.id)
      .populate('user_id', 'name phone email createdAt')
      .populate('partner_id', 'name phone role email profileImage createdAt')
      .populate('mandi_assignment.assigned_to_partner_id', 'name phone role profileImage');

    // Automatically mark as read when viewing details
    if (!lead.is_read) {
      lead.is_read = true;
      lead.status = 'read';
      await lead.save();
    }

    // Use the captured rawUserId (never null) for accurate counting
    const totalCount = await Enquiry.countDocuments({ user_id: rawUserId });

    res.status(200).json({
      success: true,
      data: lead,
      metrics: {
        totalInquiries: totalCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateLeadStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_read, contact_status } = req.body;

    const update = {};
    if (is_read !== undefined) {
      update.is_read = is_read;
      update.status = is_read ? 'read' : 'new';
    }
    if (contact_status !== undefined) {
      update.contact_status = contact_status;
      if (contact_status === 'contacted') update.status = 'contacted';
    }

    const lead = await Enquiry.findByIdAndUpdate(id, update, { new: true });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    res.status(200).json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSubscriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    let subscription;

    if (id.startsWith('VIRTUAL-FREE-')) {
      const partnerId = id.replace('VIRTUAL-FREE-', '');
      const partner = await mongoose.model('User').findById(partnerId).lean();

      if (!partner) return res.status(404).json({ success: false, message: 'Partner not found for virtual subscription' });

      // Fetch default free plan
      const defaultFreePlan = await mongoose.model('SubscriptionPlan').findOne({
        $or: [{ name: /Free/i }, { price: 0 }]
      }).lean();

      subscription = {
        _id: id,
        partner_id: partner,
        plan_snapshot: defaultFreePlan ? {
          name: defaultFreePlan.name,
          price: defaultFreePlan.price,
          duration_days: defaultFreePlan.duration_days,
          listings_limit: defaultFreePlan.listings_limit,
          featured_listings_limit: defaultFreePlan.featured_listings_limit,
          leads_limit: defaultFreePlan.leads_limit
        } : { name: 'Free Tier', price: 0, duration_days: 30, listings_limit: 1, featured_listings_limit: 1, leads_limit: 50 },
        status: 'active',
        starts_at: partner.createdAt,
        ends_at: new Date(new Date(partner.createdAt).getTime() + (30 * 24 * 60 * 60 * 1000)), // Default 30 days window for stats
        is_virtual: true
      };
    } else {
      subscription = await mongoose.model('Subscription').findById(id)
        .populate('partner_id', 'name email phone partner_type role profileImage address state district createdAt')
        .populate('plan_id');

      if (subscription) {
        subscription = subscription.toObject();
      }
    }

    if (!subscription) return res.status(404).json({ success: false, message: 'Subscription not found' });

    // 1. Check for Expiry and update status dynamically (for real records)
    const now = new Date();
    if (!subscription.is_virtual && subscription.status === 'active' && subscription.ends_at && new Date(subscription.ends_at) < now) {
      subscription.status = 'expired';
      await mongoose.model('Subscription').findByIdAndUpdate(subscription._id, { status: 'expired' });
    }

    // 2. Fetch REAL-TIME Usage Statistics
    const partnerId = subscription.partner_id?._id || subscription.partner_id;
    const startDate = subscription.starts_at;
    const endDate = subscription.ends_at || now;

    const [propertyCount, serviceCount, supplierCount, featuredPropertyCount, featuredServiceCount, enquiryCount] = await Promise.all([
      PropertyListing.countDocuments({ partner_id: partnerId, createdAt: { $gte: startDate, $lte: endDate } }),
      ServiceListing.countDocuments({ partner_id: partnerId, createdAt: { $gte: startDate, $lte: endDate } }),
      SupplierListing.countDocuments({ partner_id: partnerId, createdAt: { $gte: startDate, $lte: endDate } }),
      PropertyListing.countDocuments({ partner_id: partnerId, is_featured: true, createdAt: { $gte: startDate, $lte: endDate } }),
      ServiceListing.countDocuments({ partner_id: partnerId, is_featured: true, createdAt: { $gte: startDate, $lte: endDate } }),
      Enquiry.countDocuments({ partner_id: partnerId, createdAt: { $gte: startDate, $lte: endDate } })
    ]);

    const totalListingsUsed = propertyCount + serviceCount + supplierCount;
    const totalFeaturedUsed = featuredPropertyCount + featuredServiceCount;

    const usageData = {
      listings_created: totalListingsUsed,
      featured_listings_used: totalFeaturedUsed,
      enquiries_received_this_month: enquiryCount,
      usage_reset_at: subscription.usage?.usage_reset_at || new Date(new Date(startDate).getTime() + (30 * 24 * 60 * 60 * 1000))
    };

    // Update the subscription document's usage field to stay in sync (only for real records)
    if (!subscription.is_virtual) {
      await mongoose.model('Subscription').findByIdAndUpdate(subscription._id, {
        $set: { usage: usageData, status: subscription.status }
      });
    }

    subscription.usage = usageData;

    // 3. Fetch associated transaction if any (only for real records)
    let transaction = null;
    if (!subscription.is_virtual) {
      transaction = await mongoose.model('Transaction').findOne({
        reference_id: subscription._id,
        type: 'subscription_payment'
      }).populate('razorpay_order_id');
    }

    res.status(200).json({
      success: true,
      data: subscription,
      transaction: transaction || null
    });
  } catch (error) {
    console.error("getSubscriptionById error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteLead = async (req, res) => {
  try {
    const lead = await Enquiry.findByIdAndDelete(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.status(200).json({ success: true, message: 'Lead removed from database' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
 * @desc    Create a new subscription plan
 * @route   POST /api/admin/subscriptions/plans
 * @access  Private (Super Admin Only)
 */
const createSubscriptionPlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.create({
      ...req.body,
      created_by: req.user?._id
    });
    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    console.error("Error creating plan:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update a subscription plan
 * @route   PUT /api/admin/subscriptions/plans/:id
 * @access  Private (Super Admin Only)
 */
const updateSubscriptionPlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    console.error("Error updating plan:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete/Deactivate a subscription plan
 * @route   DELETE /api/admin/subscriptions/plans/:id
 * @access  Private (Super Admin Only)
 */
const deleteSubscriptionPlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    res.status(200).json({ success: true, message: 'Subscription plan eliminated.' });
  } catch (error) {
    console.error("Error deleting plan:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get system categories with listing counts
 * @route   GET /api/admin/system/  * @access  Private (Super Admin Only)
 */
const getSystemCategories = async (req, res) => {
  try {
    require('fs').writeFileSync('/Users/ujjawalmahawar/Desktop/Appzeto/BaseraBazar/server/debug_route_categories.txt', `Hit getSystemCategories with type: ${req.query.type}`);
    const { type, parent_id, include_inactive } = req.query;

    // Only filter for active if not explicitly requested by admin
    const query = include_inactive === 'true' ? {} : { is_active: true };

    if (type) query.type = type;
    if (parent_id !== undefined) query.parent_id = parent_id === 'null' ? null : parent_id;

    let categories = await Category.find(query).populate('parent_id').sort({ name: 1 });

    // --- ADVANCED AUTO-MERGE & SANITIZATION ---
    // This ensures that "brick", "Bricks", "brick supplier" all become "brick"
    // and their listings are merged.
    const { MandiListing, SupplierListing } = require('../models/Listing');
    const { Partner } = require('../models/Partner');

    const nameMap = {}; // cleanName -> MasterCategory
    const mergedCategories = [];

    for (let cat of categories) {
      // 1. Basic Cleaning (lower, trim, remove " supplier")
      let cleanName = cat.name.toLowerCase().replace(/\s*supplier[s]?\s*/gi, '').trim();

      // 2. Singular/Plural Unification (e.g., "bricks" -> "brick")
      // Simple rule: if it ends in 's', and it's not 'glass' or 'gas', strip the 's'
      if (cleanName.endsWith('s') && cleanName.length > 3 && !['glass', 'gas', 'brass'].includes(cleanName)) {
        cleanName = cleanName.slice(0, -1);
      }

      if (!nameMap[cleanName]) {
        // First time seeing this name, it's the Master
        if (cat.name !== cleanName) {
          cat.name = cleanName;
          cat.slug = cleanName.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
          await cat.save();
        }
        nameMap[cleanName] = cat;
        mergedCategories.push(cat);
      } else {
        // Duplicate found! 
        const master = nameMap[cleanName];
        console.log(`[MERGE] Merging duplicate category "${cat.name}" (${cat._id}) into "${master.name}" (${master._id})`);

        // 1. Update MandiListings & Scrub Mock Prices
        // If a listing has a mock value (like 7500 or 62000), deactivate it
        const mockPrices = [7500, 62000, 420, 4500];
        await MandiListing.updateMany(
          { category_id: cat._id },
          { category_id: master._id }
        );

        // Aggressively deactivate any listing that looks like seed data
        await MandiListing.updateMany(
          {
            $or: [
              { 'pricing.price_per_unit': { $in: mockPrices } },
              { material_name: /Bricks|Saria|Aggregate|Sand/i }
            ]
          },
          { status: 'inactive' }
        );

        // 2. Update Partner Supplier Profiles
        await Partner.updateMany(
          { 'profile.supplier_profile.material_categories': cat._id },
          { $set: { 'profile.supplier_profile.material_categories.$[elem]': master._id } },
          { arrayFilters: [{ 'elem': cat._id }] }
        );

        // 3. Deactivate the duplicate
        cat.is_active = false;
        cat.name = `${cat.name} (Merged)`;
        await cat.save();
      }
    }
    categories = mergedCategories;
    // --- END AUTO-MERGE ---

    const processedCategories = await Promise.all(categories.map(async (cat) => {
      const catObj = cat.toObject();

      if (type === 'product' || cat.type === 'product' || type === 'supplier') {
        // 1. Count unique Mandi Sellers
        const mandiSellers = await MandiListing.distinct('partner_id', {
          category_id: cat._id,
          status: 'active'
        });
        catObj.mandi_count = mandiSellers.length;

        // 2. Count unique Bulk Suppliers (Partners with this category in profile)
        const bulkSuppliers = await Partner.countDocuments({
          'profile.supplier_profile.categories': cat._id,
          isActive: true
        });
        catObj.supplier_count = bulkSuppliers;

        // Combined for legacy UI support
        catObj.count = catObj.mandi_count + catObj.supplier_count;
      } else {
        // Legacy count for properties/services
        let ListingModel;
        if (cat.type === 'property') ListingModel = require('../models/Listing').PropertyListing;
        else if (cat.type === 'service') ListingModel = require('../models/Listing').ServiceListing;

        if (ListingModel) {
          catObj.count = await ListingModel.countDocuments({
            $or: [{ category_id: cat._id }, { subcategory_id: cat._id }],
            status: 'active'
          });
        }
      }

      return catObj;
    }));

    require('fs').writeFileSync('/Users/ujjawalmahawar/Desktop/Appzeto/BaseraBazar/server/debug_cat_end.txt', `Processed ${processedCategories.length}`);
    res.status(200).json({ success: true, count: processedCategories.length, data: processedCategories });
  } catch (error) {
    console.error('getSystemCategories ERROR:', error);
    require('fs').writeFileSync('/Users/ujjawalmahawar/Desktop/Appzeto/BaseraBazar/server/debug_cat_error.txt', error.stack || error.toString());
    res.status(500).json({ success: false, message: 'Error fetching categories.' });
  }
};

const sanitizeCategoryName = (name) => {
  if (!name) return name;
  return name.replace(/\s*supplier[s]?\s*/gi, '').trim();
};

const createCategory = async (req, res) => {
  try {
    let { name, type, parent_id, icon, mandi_icon } = req.body;
    name = sanitizeCategoryName(name);
    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

    const category = await Category.create({ name, slug, type, parent_id: parent_id || null, icon, mandi_icon });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    if (req.body.name) {
      req.body.name = sanitizeCategoryName(req.body.name);
    }
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Safety Check: Check for active listings in this category or subcategory
    const [propertyCount, serviceCount, supplierCount] = await Promise.all([
      PropertyListing.countDocuments({ $or: [{ category_id: id }, { subcategory_id: id }] }),
      ServiceListing.countDocuments({ $or: [{ category_id: id }, { subcategory_id: id }] }),
      SupplierListing.countDocuments({ $or: [{ category_id: id }, { subcategory_id: id }] })
    ]);

    const totalListings = propertyCount + serviceCount + supplierCount;

    if (totalListings > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It contains ${totalListings} active listings. Please delete or move those listings first.`
      });
    }

    // 2. Perform deletion
    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Category not found.' });

    res.status(200).json({ success: true, message: 'Category permanently removed from database' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCategoryDetail = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).populate('parent_id');
    const subcategories = await Category.find({ parent_id: req.params.id, is_active: true });

    // Count listings in this category
    const propertyCount = await PropertyListing.countDocuments({ category_id: req.params.id });

    res.status(200).json({
      success: true,
      data: {
        ...category.toObject(),
        subcategories,
        stats: {
          properties: propertyCount
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



// BANNERS
const getBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ priority: -1 });
    res.status(200).json({ success: true, data: banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getBannerById = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
    res.status(200).json({ success: true, data: banner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createBanner = async (req, res) => {
  try {
    const banner = await Banner.create(req.body);
    res.status(201).json({ success: true, data: banner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
    res.status(200).json({ success: true, data: banner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
    res.status(200).json({ success: true, message: 'Banner deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// REPORTS
const getSubscriptionReport = async (req, res) => {
  try {
    // Basic aggregation for report
    const report = await Transaction.aggregate([
      { $match: { status: 'success' } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          revenue: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUserReport = async (req, res) => {
  try {
    const report = await User.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    ADMIN ONLY: Create specialized property listing
 * @route   POST /api/admin/listings/property
 */
const createPropertyListing = async (req, res) => {
  try {
    const {
      title, description, property_type, listing_intent, partner_id,
      category_id, subcategory_id, images, thumbnail, is_featured,
      status, location, address, pricing, details
    } = req.body;

    const newProperty = await PropertyListing.create({
      partner_id: partner_id || null,
      title,
      description: description || '',
      property_type: property_type || 'apartment',
      listing_intent: listing_intent || 'sell',
      category_id: category_id || null,
      subcategory_id: subcategory_id || null,
      images: images || [],
      thumbnail: thumbnail || (images && images.length > 0 ? images[0] : ''),
      is_featured: is_featured || false,
      status: status || 'active',
      location: location || { type: 'Point', coordinates: [77.1025, 28.7041] },
      address: address || {},
      pricing: pricing || {},
      details: details || {}
    });

    res.status(201).json({ success: true, message: 'Property entry finalized in marketplace registry.', data: newProperty });
    // Log the activity
    await logActivity({
      actor_name: req.user?.name || 'Admin',
      actor_id: req.user?._id,
      action: 'created',
      entity_type: 'property',
      entity_name: newProperty.title,
      entity_id: newProperty._id,
      description: `${req.user?.name || 'Admin'} listed new property: ${newProperty.title}`
    });
  } catch (error) {
    console.error("Admin Property Creation Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    ADMIN ONLY: Create specialized service listing
 * @route   POST /api/admin/listings/service
 */
const createServiceListing = async (req, res) => {
  try {
    const {
      title, short_description, full_description, partner_id,
      category_id, subcategory_id, service_type, years_of_experience,
      thumbnail, portfolio_images, video_link,
      status, location, address, service_radius_km, is_featured
    } = req.body;

    if (!category_id) {
       return res.status(400).json({ success: false, message: 'Top category is mandatory for service registry entry.' });
    }

    const newService = await ServiceListing.create({
      partner_id: partner_id || null,
      title,
      short_description: short_description || '',
      full_description: full_description || '',
      service_type: service_type || '',
      years_of_experience: years_of_experience || 0,
      category_id: category_id || null,
      subcategory_id: subcategory_id || null,
      thumbnail: thumbnail || '',
      portfolio_images: portfolio_images || [],
      video_link: video_link || '',
      is_featured: is_featured || false,
      status: status || 'active',
      location: location || { type: 'Point', coordinates: [77.1025, 28.7041] },
      address: address || {},
      service_radius_km: service_radius_km || 10
    });

    res.status(201).json({ success: true, message: 'Service entry finalized in marketplace registry.', data: newService });

    // Log the activity
    await logActivity({
      actor_name: req.user?.name || 'Admin',
      actor_id: req.user?._id,
      action: 'created',
      entity_type: 'service',
      entity_name: newService.title,
      entity_id: newService._id,
      description: `${req.user?.name || 'Admin'} listed new service: ${newService.title}`
    });
  } catch (error) {
    console.error("Admin Service Creation Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateSubscriptionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'expired', 'cancelled', 'trial'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const subscription = await mongoose.model('Subscription').findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    res.status(200).json({ success: true, data: subscription, message: `Subscription ${status} successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Mandi Marketplace Global Settings
 */
const getMandiSettings = async (req, res) => {
  try {
    const tokenAmount = await AppConfig.findOne({ key: 'mandi_token_amount' });
    const commissionRate = await AppConfig.findOne({ key: 'mandi_commission_rate' });

    res.status(200).json({
      success: true,
      data: {
        token_amount: tokenAmount ? tokenAmount.value : 500, // Default 500
        commission_rate: commissionRate ? commissionRate.value : 10 // Default 10%
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching Mandi settings.' });
  }
};

const updateMandiSettings = async (req, res) => {
  try {
    const { token_amount, commission_rate } = req.body;

    if (token_amount !== undefined) {
      await AppConfig.findOneAndUpdate(
        { key: 'mandi_token_amount' },
        { value: Number(token_amount), description: 'Non-refundable booking fee for Mandi items' },
        { upsert: true, new: true }
      );
    }

    if (commission_rate !== undefined) {
      await AppConfig.findOneAndUpdate(
        { key: 'mandi_commission_rate' },
        { value: Number(commission_rate), description: 'Global commission rate for Mandi Marketplace' },
        { upsert: true, new: true }
      );
    }

    res.status(200).json({ success: true, message: 'Mandi settings updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating Mandi settings.' });
  }
};

/**
 * @desc    Approve or Reject a partner role upgrade request
 * @route   POST /api/admin/partners/role-request-action
 * @access  Private (Super Admin Only)
 */
const processRoleRequest = async (req, res) => {
  try {
    const { partnerId, role, action, rejectionReason } = req.body;
    const adminId = req.user.id;

    if (!partnerId || !role || !action) {
      return res.status(400).json({ success: false, message: 'Please provide partnerId, role, and action.' });
    }

    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found.' });
    }

    // Find the request in the array
    const requestIndex = partner.role_requests.findIndex(r => r.role === role && r.status === 'pending');
    if (requestIndex === -1) {
      return res.status(404).json({ success: false, message: 'Pending request for this role not found.' });
    }

    if (action === 'approve') {
      // 1. Add role to roles array if not already there
      if (!partner.roles.includes(role)) {
        partner.roles.push(role);
      }
      
      // 2. Update status to approved
      partner.role_requests[requestIndex].status = 'approved';
      partner.role_requests[requestIndex].reviewed_at = new Date();
      partner.role_requests[requestIndex].reviewed_by = adminId;

      // 3. Optional: Set active_role to the newly approved role
      partner.active_role = role;

      await partner.save();

      // Create Notification
      await createNotification(
        'partner',
        partnerId,
        'Role Upgrade Approved! 🎉',
        `Congratulations! Your request for the ${role.replace('_', ' ')} role has been approved. You can now access new features.`,
        { type: 'role_upgrade_approved', role }
      );

      // Log Activity
      await logActivity({
        actor_name: req.user.name,
        actor_id: adminId,
        action: 'approved',
        entity_type: 'partner_role',
        entity_name: partner.name,
        entity_id: partnerId,
        description: `Approved ${role} role for ${partner.name}`
      });

    } else if (action === 'reject') {
      // Update status to rejected
      partner.role_requests[requestIndex].status = 'rejected';
      partner.role_requests[requestIndex].reviewed_at = new Date();
      partner.role_requests[requestIndex].reviewed_by = adminId;
      partner.role_requests[requestIndex].rejection_reason = rejectionReason || 'Documents were not accepted.';

      await partner.save();

      // Create Notification
      await createNotification(
        'partner',
        partnerId,
        'Role Upgrade Rejected',
        `Your request for the ${role.replace('_', ' ')} role was not approved. Reason: ${rejectionReason || 'Documents were not accepted.'}`,
        { type: 'role_upgrade_rejected', role, reason: rejectionReason }
      );

      // Log Activity
      await logActivity({
        actor_name: req.user.name,
        actor_id: adminId,
        action: 'rejected',
        entity_type: 'partner_role',
        entity_name: partner.name,
        entity_id: partnerId,
        description: `Rejected ${role} role for ${partner.name}. Reason: ${rejectionReason || 'N/A'}`
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action. Use approve or reject.' });
    }

    res.status(200).json({
      success: true,
      message: `Role request ${action}ed successfully.`
    });

  } catch (error) {
    console.error("Process role request error:", error);
    res.status(500).json({ success: false, message: 'Server error processing role request.' });
  }
};

/**
 * @desc    Get all partner role upgrade requests
 * @route   GET /api/admin/partners/role-requests
 * @access  Private (Super Admin Only)
 */
const getRoleRequests = async (req, res) => {
  try {
    const partnersWithRequests = await Partner.find({
      'role_requests.0': { $exists: true }
    }).select('name phone email role_requests').sort({ 'role_requests.submitted_at': -1 });

    const roleRequests = [];
    partnersWithRequests.forEach(partner => {
      partner.role_requests.forEach(req => {
        roleRequests.push({
          ...req.toObject(),
          partnerId: partner._id,
          partnerName: partner.name,
          partnerPhone: partner.phone,
          partnerEmail: partner.email
        });
      });
    });

    // Sort by submission date
    roleRequests.sort((a, b) => new Date(b.submitted_at || b.requested_at) - new Date(a.submitted_at || a.requested_at));

    res.status(200).json({
      success: true,
      count: roleRequests.length,
      data: roleRequests
    });
  } catch (error) {
    console.error("Get role requests error:", error);
    res.status(500).json({ success: false, message: 'Error fetching role requests.' });
  }
};

module.exports = {
  findNearestMandiSellers,
  assignMandiEnquiry,
  getDashboardStats,
  getUsers,
  getListings,
  getLeads,
  getLeadById,
  updateLeadStatus,
  deleteLead,
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
  getUserDetail,
  createUser,
  updateUser,
  deleteUser,
  getUserSubscriptionHistory,
  getAllSubscriptions,
  createManualSubscription,
  getAdminActivities,
  getPendingApprovals,
  getSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  getSystemCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryDetail,
  getListingDetail,
  updateListingStatus,
  updateListing,
  deleteListing,

  getBanners,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
  getSubscriptionReport,
  getUserReport,
  createPropertyListing,
  createServiceListing,
  getSubscriptionById,
  updateSubscriptionStatus,
  getMandiSettings,
  updateMandiSettings,
  processRoleRequest,
  getRoleRequests
};
