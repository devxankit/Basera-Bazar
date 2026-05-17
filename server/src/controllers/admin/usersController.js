const mongoose = require('mongoose');
const logger = require('../../utils/logger');
const { Partner } = require('../../models/Partner');
const { Enquiry } = require('../../models/Enquiry');
const { AdminUser } = require('../../models/Admin');
const { User } = require('../../models/User');
const { PropertyListing, ServiceListing, MandiListing } = require('../../models/Listing');
const { logActivity } = require('../../utils/activityLogger');
const { createNotification } = require('../../utils/notificationHelper');
const { grantFreeTrial } = require('../../utils/trialHelper');

const getUserDetail = async (req, res) => {
  try {
    const { id } = req.params;

    let account = await User.findById(id);
    let source = 'User';

    if (!account) { account = await Partner.findById(id); if (account) source = 'Partner'; }
    if (!account) { account = await AdminUser.findById(id); if (account) source = 'AdminUser'; }
    if (!account) return res.status(404).json({ success: false, message: 'User profile not found in database registry.' });

    const accountObj = account.toObject();

    if (source === 'User') {
      accountObj.displayRole = accountObj.role === 'user' ? 'Customer' : accountObj.role;
    } else if (source === 'Partner') {
      const roleMap = { 'property_agent': 'Agent', 'supplier': 'Supplier', 'mandi_seller': 'Seller', 'service_provider': 'Service Provider' };
      if (accountObj.roles && accountObj.roles.length > 0) {
        accountObj.displayRoles = [...new Set(accountObj.roles.map(r => roleMap[r]).filter(Boolean))];
      } else {
        const fallbackRole = accountObj.role || (accountObj.partner_type === 'property_agent' ? 'Agent' : accountObj.partner_type === 'supplier' ? 'Supplier' : accountObj.partner_type === 'mandi_seller' ? 'Seller' : 'Service Provider');
        accountObj.displayRoles = [fallbackRole];
      }
      accountObj.displayRole = accountObj.displayRoles.length === 1 ? accountObj.displayRoles[0] : accountObj.displayRoles.join(', ');
    } else if (source === 'AdminUser') {
      const role = (accountObj.role || '').toLowerCase();
      accountObj.displayRole = (role === 'admin' || role === 'superadmin' || role === 'super_admin') ? 'Admin' : accountObj.role;
    }
    accountObj.source = source;

    const [propertyCount, serviceCount, leadCount, activeSub] = await Promise.all([
      PropertyListing.countDocuments({ partner_id: id }),
      ServiceListing.countDocuments({ partner_id: id }),
      Enquiry.countDocuments({ $or: [{ user_id: id }, { partner_id: id }] }),
      mongoose.model('Subscription').findOne({ partner_id: id, status: { $in: ['active', 'trial'] } }).populate('plan_id').sort({ createdAt: -1 })
    ]);

    let calculatedSubscription = null;
    let effectiveSub = activeSub;

    if (!effectiveSub && !['Customer', 'Admin', 'super_admin'].includes(account.role)) {
      const defaultFreePlan = await mongoose.model('SubscriptionPlan').findOne({ $or: [{ name: /Free/i }, { price: 0 }] }).lean();
      effectiveSub = {
        plan_snapshot: defaultFreePlan ? { name: defaultFreePlan.name, price: defaultFreePlan.price, duration_days: defaultFreePlan.duration_days, listings_limit: defaultFreePlan.listings_limit, featured_listings_limit: defaultFreePlan.featured_listings_limit, leads_limit: defaultFreePlan.leads_limit } : { name: 'Free Trail', price: 0, duration_days: 30, listings_limit: 1, featured_listings_limit: 1, leads_limit: 50 },
        status: 'active', starts_at: account.createdAt, ends_at: null, is_virtual: true
      };
    }

    if (effectiveSub) {
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
        const [pUsed, sUsed, , fpUsed, fsUsed, eUsed] = await Promise.all([
          PropertyListing.countDocuments({ partner_id: id, createdAt: { $gte: startDate, $lte: endDate } }),
          ServiceListing.countDocuments({ partner_id: id, createdAt: { $gte: startDate, $lte: endDate } }),
          PropertyListing.countDocuments({ partner_id: id, is_featured: true, createdAt: { $gte: startDate, $lte: endDate } }),
          ServiceListing.countDocuments({ partner_id: id, is_featured: true, createdAt: { $gte: startDate, $lte: endDate } }),
          Enquiry.countDocuments({ partner_id: id, createdAt: { $gte: startDate, $lte: endDate } })
        ]);
        calculatedSubscription = { ...(effectiveSub.is_virtual ? effectiveSub : effectiveSub.toObject()) };
        calculatedSubscription.usage = { listings_created: pUsed + sUsed, featured_listings_used: fpUsed + fsUsed, enquiries_received_this_month: eUsed };
      } else {
        calculatedSubscription = effectiveSub.is_virtual ? { ...effectiveSub } : effectiveSub.toObject();
      }
    }

    const partnerProfileAlias = accountObj.partner_type ? {
      state: accountObj.state || '', city: accountObj.city || '', district: accountObj.district || '',
      address: accountObj.address || '', supplier_profile: accountObj.profile?.supplier_profile || {},
      service_profile: { service_category_id: accountObj.profile?.service_profile?.category_id || '' }
    } : null;

    const fullData = {
      ...accountObj,
      city: accountObj.city || accountObj.default_location?.city || 'N/A',
      state: accountObj.state || accountObj.default_location?.state || 'Bihar',
      district: accountObj.district || accountObj.default_location?.district || 'Muzaffarpur',
      address: accountObj.address || accountObj.default_location?.address || 'Muzaffarpur, Bihar',
      partner_profile: partnerProfileAlias,
      stats: { properties: propertyCount, services: serviceCount, leads: leadCount },
      active_subscription: calculatedSubscription
    };

    res.status(200).json({ success: true, data: fullData });
  } catch (error) {
    logger.error({ err: error }, "Error fetching user detail:");
    res.status(500).json({ success: false, message: 'Error fetching user profile.' });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, phone, role, password, partner_type, roles, image, business_logo } = req.body;

    if (!name || !phone || !role || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, phone, role, and password.' });
    }

    const phoneExists = await Promise.all([User.findOne({ phone }), Partner.findOne({ phone }), AdminUser.findOne({ phone })]);
    if (phoneExists.some(u => u)) return res.status(400).json({ success: false, message: 'Phone number already registered in the system.' });

    if (email) {
      const emailExists = await Promise.all([User.findOne({ email: email.toLowerCase() }), Partner.findOne({ email: email.toLowerCase() }), AdminUser.findOne({ email: email.toLowerCase() })]);
      if (emailExists.some(u => u)) return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    let newAccount;
    if (role === 'Customer' || role === 'user') {
      // Muzaffarpur, Bihar coordinates as default
      const defaultCoords = [85.3647, 26.1209];

      newAccount = await User.create({ 
        name, phone, email: email?.toLowerCase(), password, role: 'Customer', image,
        default_location: {
          type: 'Point',
          coordinates: defaultCoords,
          city: req.body.city || 'Muzaffarpur',
          state: req.body.state || 'Bihar',
          district: req.body.district || 'Muzaffarpur'
        }
      });
    } else if (role === 'Admin') {
      newAccount = await AdminUser.create({ name, phone, email: email?.toLowerCase(), password, role: 'Admin' });
    } else if (['Agent', 'Supplier', 'Service Provider', 'Mandi Seller'].includes(role)) {
      let pType = partner_type || 'service_provider';
      if (role === 'Agent') pType = 'property_agent';
      else if (role === 'Supplier') pType = 'supplier';
      else if (role === 'Service Provider') pType = 'service_provider';
      else if (role === 'Mandi Seller') pType = 'mandi_seller';

      const profile = {};
      if (role === 'Supplier') profile.supplier_profile = { material_categories: req.body.material_categories || [], delivery_radius_km: req.body.delivery_radius_km || 10 };
      else if (role === 'Service Provider') profile.service_profile = { category_id: req.body.service_category_id || null };
      else if (role === 'Mandi Seller') profile.mandi_profile = { business_name: req.body.business_name || '', business_logo: business_logo || '', business_description: req.body.business_description || '' };

      // Muzaffarpur, Bihar coordinates as default
      const defaultCoords = [85.3647, 26.1209];

      newAccount = await Partner.create({
        name, phone, email: email?.toLowerCase(), password, partner_type: pType,
        roles: (roles && roles.length > 0) ? roles : [pType], active_role: pType, role,
        state: req.body.state || 'Bihar',
        district: req.body.district || 'Muzaffarpur',
        city: req.body.city || 'Muzaffarpur',
        address: req.body.address || 'Muzaffarpur, Bihar',
        location: {
          type: 'Point',
          coordinates: defaultCoords
        },
        image, business_logo, active_subscription_id: req.body.active_subscription_id || req.body.subscription_id || null,
        profile, onboarding_status: 'approved',
        service_radius_km: req.body.service_radius_km || 100
      });

      // Grant free trial if no subscription was explicitly assigned
      if (!newAccount.active_subscription_id) {
        await grantFreeTrial(newAccount._id);
      }
    } else {
      return res.status(400).json({ success: false, message: 'Invalid role selection.' });
    }

    res.status(201).json({ success: true, message: 'User created successfully.', data: newAccount });

    const actorName = req.user?.name || 'Admin';
    await logActivity({ actor_name: actorName, actor_id: req.user?._id, action: 'created', entity_type: (role === 'Customer' || role === 'user') ? 'user' : 'partner', entity_name: name, entity_id: newAccount._id, description: `${actorName} created ${role} account: ${name} (${email || phone})` });
  } catch (error) {
    logger.error({ 
      err: error.message, 
      stack: error.stack,
      body: req.body 
    }, "Error creating user:");
    
    // Check if it's a validation error
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    
    res.status(500).json({ success: false, message: 'Error creating user.' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active, material_categories, delivery_radius_km, subscription_id, active_subscription_id, service_category_id, state, district, address, name, email, phone, business_name, business_description, roles, active_role, onboarding_status, rejection_reason, image, business_logo } = req.body;

    let account = await User.findById(id) || await Partner.findById(id);
    if (!account) return res.status(404).json({ success: false, message: 'User not found.' });

    const isPartnerModel = account.role !== 'Customer' && account.role !== 'user';
    const Model = isPartnerModel ? Partner : User;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email?.toLowerCase() || null;
    if (phone !== undefined) updateData.phone = phone;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (image !== undefined) updateData.image = image;
    if (business_logo !== undefined) updateData.business_logo = business_logo;

    if (is_active === false && account.is_active !== false) {
      updateData.token_version = (account.token_version || 0) + 1;
    }

    if (isPartnerModel) {
      if (roles !== undefined) updateData.roles = roles;
      if (active_role !== undefined) updateData.active_role = active_role;
      if (state !== undefined) updateData.state = state;
      if (district !== undefined) updateData.district = district;
      if (address !== undefined) updateData.address = address;
      if (onboarding_status !== undefined) {
        updateData.onboarding_status = onboarding_status;
        if (onboarding_status === 'approved') updateData['kyc.status'] = 'approved';
        else if (onboarding_status === 'rejected') updateData['kyc.status'] = 'rejected';
        else if (onboarding_status === 'pending_approval') updateData['kyc.status'] = 'pending';
        updateData['kyc.reviewed_at'] = new Date();
        updateData['kyc.reviewed_by'] = req.user.id;
      }
      // Grant free trial when a partner gets approved for the first time (fire-and-forget)
      if (onboarding_status === 'approved' && isPartnerModel) {
        grantFreeTrial(id).catch(() => {});
      }
      if (rejection_reason !== undefined) updateData['kyc.rejection_reason'] = rejection_reason;
      const subId = active_subscription_id || subscription_id;
      if (subId && subId !== '') updateData.active_subscription_id = subId;
      else if (subId === '') updateData.active_subscription_id = null;
      if (material_categories !== undefined) updateData['profile.supplier_profile.material_categories'] = material_categories;
      if (delivery_radius_km !== undefined && delivery_radius_km !== '') updateData['profile.supplier_profile.delivery_radius_km'] = Number(delivery_radius_km);
      if (service_category_id && service_category_id !== '') updateData['profile.service_profile.category_id'] = service_category_id;
      if (business_name !== undefined) updateData['profile.mandi_profile.business_name'] = business_name;
      if (business_description !== undefined) updateData['profile.mandi_profile.business_description'] = business_description;
      if (business_logo !== undefined) updateData['profile.mandi_profile.business_logo'] = business_logo;
    }

    const updated = await Model.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: false });

    if (is_active !== undefined && account.is_active !== is_active) {
      await createNotification(isPartnerModel ? 'partner' : 'user', id,
        is_active ? 'Account Activated! 🔓' : 'Account Deactivated 🔒',
        is_active ? 'Welcome back! Your account has been activated by the administrator. You can now access all platform features.' : 'Your account has been deactivated by the administrator. Please contact support for more information.',
        { type: 'account_status_change', is_active }
      );
    }

    res.status(200).json({ success: true, message: 'Profile updated successfully.', data: updated });

    const actorName = req.user?.name || 'Admin';
    await logActivity({ actor_name: actorName, actor_id: req.user?._id, action: 'updated', entity_type: account.role === 'Customer' || account.role === 'user' ? 'user' : 'partner', entity_name: account.name, entity_id: id, description: `${actorName} updated profile of ${account.name}` });
  } catch (error) {
    logger.error({ err: error }, "Error updating user:");
    res.status(500).json({ success: false, message: 'Error updating information.' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const userResult = await User.findByIdAndDelete(id);
    const partnerResult = await Partner.findByIdAndDelete(id);

    if (!userResult && !partnerResult) return res.status(404).json({ success: false, message: 'User not found.' });

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

    res.status(200).json({ success: true, message: 'User account permanently deleted from database.', listingsDeleted });

    const actorName = req.user?.name || 'Admin';
    await logActivity({ actor_name: actorName, actor_id: req.user?._id, action: 'deleted', entity_type: deletedType, entity_name: deletedName, entity_id: id, description: `${actorName} permanently deleted ${deletedType}: ${deletedName}` });
  } catch (error) {
    logger.error({ err: error }, "Error deleting user:");
    res.status(500).json({ success: false, message: 'Error during deletion process.' });
  }
};

const getUserSubscriptionHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const history = await mongoose.model('Subscription').find({ partner_id: id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    logger.error({ err: error }, "Subscription history error:");
    res.status(500).json({ success: false, message: 'Error fetching history.' });
  }
};

const getAllSubscriptions = async (req, res) => {
  try {
    const { plan, status, role, search } = req.query;
    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let s = search ? new RegExp(escapeRegex(search), 'i') : null;

    let uQuery = { role: { $in: ['Agent', 'Supplier', 'Service Provider'] } };
    if (role && role !== 'all') uQuery.role = role.replace(/([A-Z])/g, ' $1').trim();
    if (s) uQuery.$or = [{ name: s }, { email: s }, { phone: s }];
    const users = await mongoose.model('User').find(uQuery).lean();

    let pQuery = {};
    if (role && role !== 'all') {
      const mappedRole = role === 'ServiceProvider' ? 'service_provider' : role === 'Agent' ? 'property_agent' : role === 'Supplier' ? 'supplier' : role.toLowerCase();
      pQuery.$or = [{ partner_type: mappedRole }, { roles: mappedRole }];
    }
    if (s) pQuery.$or = [{ name: s }, { email: s }, { phone: s }];
    const legacyPartners = await mongoose.model('Partner').find(pQuery).lean();

    const partnerMap = new Map();
    users.forEach(u => partnerMap.set(u._id.toString(), { ...u, role: u.role, source: 'User' }));
    legacyPartners.forEach(p => { if (!partnerMap.has(p._id.toString())) partnerMap.set(p._id.toString(), { ...p, role: p.role || p.partner_type, source: 'Partner' }); });
    const allPartners = Array.from(partnerMap.values());

    const now = new Date();
    const finalData = [];
    const defaultFreePlan = await mongoose.model('SubscriptionPlan').findOne({ $or: [{ name: /Free/i }, { price: 0 }] }).lean();

    for (let partner of allPartners) {
      let activeSub = null;
      if (partner.active_subscription_id) activeSub = await mongoose.model('Subscription').findById(partner.active_subscription_id).lean();
      if (!activeSub) activeSub = await mongoose.model('Subscription').findOne({ partner_id: partner._id, status: { $in: ['active', 'trial', 'expired'] } }).sort({ createdAt: -1 }).lean();

      if (activeSub && activeSub.status === 'active' && activeSub.ends_at && new Date(activeSub.ends_at) < now) {
        activeSub.status = 'expired';
        await mongoose.model('Subscription').findByIdAndUpdate(activeSub._id, { status: 'expired' });
      }

      if (!activeSub) {
        activeSub = { _id: `VIRTUAL-FREE-${partner._id}`, partner_id: partner._id, plan_snapshot: defaultFreePlan ? { name: defaultFreePlan.name, price: defaultFreePlan.price, duration_days: defaultFreePlan.duration_days, listings_limit: defaultFreePlan.listings_limit, featured_listings_limit: defaultFreePlan.featured_listings_limit, leads_limit: defaultFreePlan.leads_limit } : { name: 'Free Tier', price: 0, duration_days: 30, listings_limit: 1, featured_listings_limit: 1, leads_limit: 50 }, status: 'active', starts_at: partner.createdAt, ends_at: null, is_virtual: true };
      }

      if (plan && plan !== 'all' && activeSub.plan_id && activeSub.plan_id.toString() !== plan) continue;
      if (status && status !== 'all' && activeSub.status !== status) continue;

      finalData.push({ ...activeSub, partner_id: partner, _id: activeSub._id });
    }

    res.status(200).json({ success: true, count: finalData.length, data: finalData });
  } catch (error) {
    logger.error({ err: error }, "Error fetching all subscriptions:");
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const createManualSubscription = async (req, res) => {
  try {
    const { partner_id, plan_id, starts_at, duration_days, amount_paid, listings_limit, featured_listings_limit, leads_limit, notes } = req.body;

    const plan = await mongoose.model('SubscriptionPlan').findById(plan_id);
    const subscription = await mongoose.model('Subscription').create({
      partner_id, plan_id,
      plan_snapshot: { name: plan?.name || 'Manual Adjustment', price: amount_paid !== undefined ? amount_paid : (plan?.price || 0), duration_days: duration_days || plan?.duration_days || 30, listings_limit: listings_limit !== undefined ? (listings_limit === -1 ? -1 : parseInt(listings_limit)) : (plan?.listings_limit || 0), featured_listings_limit: featured_listings_limit !== undefined ? (featured_listings_limit === -1 ? -1 : parseInt(featured_listings_limit)) : (plan?.featured_listings_limit || 0), leads_limit: leads_limit !== undefined ? (leads_limit === -1 ? -1 : parseInt(leads_limit)) : (plan?.leads_limit || 0) },
      status: 'active', starts_at: starts_at || new Date(),
      ends_at: new Date(new Date(starts_at || new Date()).getTime() + (duration_days || 30) * 24 * 60 * 60 * 1000),
      granted_by_admin: true, notes
    });

    const partner = await Partner.findByIdAndUpdate(partner_id, { active_subscription_id: subscription._id }, { new: true });
    res.status(201).json({ success: true, data: subscription, message: 'Subscription manual override successful.' });

    await logActivity({ actor_name: req.user?.name || 'Admin', actor_id: req.user?._id, action: 'created', entity_type: 'subscription', entity_name: partner?.name || 'Partner', entity_id: subscription._id, description: `${req.user?.name || 'Admin'} manually granted "${plan?.name || 'Manual'}" plan to ${partner?.name}` });
  } catch (error) {
    logger.error({ err: error }, "Manual subscription error:");
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 100));
    const skip = (page - 1) * limit;

    const [regularUsers, partners, allAdmins] = await Promise.all([
      User.find().sort({ createdAt: -1 }),
      Partner.find().sort({ createdAt: -1 }),
      AdminUser.find().sort({ createdAt: -1 })
    ]);

    const roleMap = { 'property_agent': 'Agent', 'supplier': 'Supplier', 'mandi_seller': 'Seller', 'service_provider': 'Service Provider' };
    const standardizedUsers = [
      ...regularUsers.map(u => ({ ...u.toObject(), displayRole: u.role === 'user' ? 'Customer' : u.role, source: 'User' })),
      ...partners.map(p => {
        let displayRoles = p.roles && p.roles.length > 0 ? [...new Set(p.roles.map(r => roleMap[r]).filter(Boolean))] : [p.role || (p.partner_type === 'property_agent' ? 'Agent' : p.partner_type === 'supplier' ? 'Supplier' : p.partner_type === 'mandi_seller' ? 'Seller' : 'Service Provider')];
        return { ...p.toObject(), displayRoles, displayRole: displayRoles.length === 1 ? displayRoles[0] : displayRoles.map(r => r.split(' ').map(w => w[0]).join('')).join(', '), source: 'Partner' };
      }),
      ...allAdmins.map(a => { const obj = a.toObject(); const role = (obj.role || '').toLowerCase(); return { ...obj, displayRole: (role === 'admin' || role === 'superadmin' || role === 'super_admin') ? 'Admin' : obj.role, source: 'AdminUser' }; })
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = standardizedUsers.length;
    const paginated = standardizedUsers.slice(skip, skip + limit);

    res.status(200).json({ success: true, count: paginated.length, total, page, totalPages: Math.ceil(total / limit), data: paginated });
  } catch (error) {
    logger.error({ err: error }, "Error fetching unified users:");
    res.status(500).json({ success: false, message: 'Error fetching unified users.' });
  }
};

module.exports = {
  getUserDetail,
  createUser,
  updateUser,
  deleteUser,
  getUserSubscriptionHistory,
  getAllSubscriptions,
  createManualSubscription,
  getUsers
};
