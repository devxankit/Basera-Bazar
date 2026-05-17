const { ServiceListing, PropertyListing, MandiListing } = require('../models/Listing');
const logger = require('../utils/logger');
const { Category, SupplierCategory } = require('../models/System');
const { Subscription } = require('../models/Finance');
const { Partner } = require('../models/Partner');
const {
  checkListingLimit,
  checkFeaturedLimit,
  getMandiLimits,
  enforceMandiLimits
} = require('../utils/subscriptionUtils');
const invalidate = require('../utils/cacheInvalidator');

const mongoose = require('mongoose');

// Escape special regex metacharacters so user input can't cause ReDoS (H-1)
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');


/**
 * Sort listings by location priority:
 * 2 = same district, 1 = same state, 0 = other
 */
const sortByLocationPriority = (items, district, state) => {
  if (!district && !state) return items;
  return items.sort((a, b) => {
    const getScore = (item) => {
      // Support both Partner (top-level) and Listing (address sub-object) schemas
      const d = (item.address?.district || item.district || '').toLowerCase();
      const s = (item.address?.state || item.state || '').toLowerCase();
      
      const targetD = (district || '').toLowerCase();
      const targetS = (state || '').toLowerCase();

      if (targetD && d === targetD) return 2;
      if (targetS && s === targetS) return 1;
      return 0;
    };
    return getScore(b) - getScore(a);
  });
};

/**
 * @desc    Get nearby public Services
 * @route   GET /api/listings/services?lat=&lng=&radius=
 * @access  Public
 */
const getNearbyServices = async (req, res) => {
  try {
    const { district, state } = req.query;

    const query = { status: 'active' };

    // Apply location filter using district/state text matching
    if (district) {
      query['address.district'] = { $regex: new RegExp(escapeRegex(district), 'i') };
    } else if (state) {
      query['address.state'] = { $regex: new RegExp(escapeRegex(state), 'i') };
    }

    const services = await ServiceListing.find(query)
      .populate({ path: 'partner_id', select: 'name phone email role profile createdAt' })
      .sort({ createdAt: -1 })
      .limit(20);

    const sorted = sortByLocationPriority(services.map(s => s.toObject()), district, state);
    res.status(200).json({ success: true, count: sorted.length, data: sorted });

  } catch (error) {
    logger.error({ err: error }, "Error in getNearbyServices:")
    res.status(500).json({ success: false, message: 'Server error fetching services.' });
  }
};

/**
 * @desc    Get Mandi inventory (Hiding the seller identity)
 * @route   GET /api/listings/mandi
 * @access  Public
 */
const getMandiListings = async (req, res) => {
  try {
    const { category_id, partner_id, district, state } = req.query;
    const query = { deleted_at: null, status: 'active' };

    if (partner_id) {
      try {
        query.partner_id = new mongoose.Types.ObjectId(partner_id);
      } catch (e) { /* ignore invalid partner_id */ }
    }

    if (category_id) {
      try {
        const oid = new mongoose.Types.ObjectId(category_id);
        query.$or = [{ category_id: oid }, { subcategory_id: oid }];
      } catch (e) { /* ignore invalid category_id */ }
    }

    if (partner_id) {
      await enforceMandiLimits(partner_id);
    }

    // Apply location filter using district/state text matching
    if (!partner_id) { // Don't filter by location when viewing a specific partner's items
      if (district) {
        query['address.district'] = { $regex: new RegExp(escapeRegex(district), 'i') };
      } else if (state) {
        query['address.state'] = { $regex: new RegExp(escapeRegex(state), 'i') };
      }
    }


    const mandiItems = await MandiListing.find(query)
      .populate('category_id', 'name icon mandi_icon type')
      .sort({ createdAt: -1 });

    const sorted = sortByLocationPriority(mandiItems.map(m => m.toObject ? m.toObject() : m), district, state);
    res.status(200).json({ success: true, count: sorted.length, data: sorted });

  } catch (error) {
    logger.error({ err: error }, "Error in getMandiListings:")
    res.status(500).json({ success: false, message: 'Server error fetching mandi inventory.' });
  }
};


/**
 * @desc    Partner creates a Draft Property Listing
 * @route   POST /api/listings/properties
 * @access  Private (Partner Token Required)
 */
const createPropertyListing = async (req, res) => {
  try {
    const partnerId = req.user.id;
    const partnerPhone = req.user.phone;
    const item = req.body;

    // 1. Check Subscription Limit
    const limitCheck = await checkListingLimit(partnerId);
    if (!limitCheck.allowed) {
      return res.status(403).json({ success: false, message: limitCheck.message });
    }

    const title = item.title || 'Untitled Property';
    const description = item.description || item.details?.description || '';
    
    // Map property type from frontend to lowercase enum
    let property_type = (item.propertyType || 'residential').toLowerCase();
    if (!['apartment', 'hostel_pg', 'office', 'plot', 'warehouse', 'residential', 'commercial', 'agricultural', 'industrial', 'house', 'villa'].includes(property_type)) {
      property_type = 'residential';
    }

    const listing_intent = (item.intention && item.intention.toLowerCase().includes('rent')) ? 'rent' : 'sell';

    const pricing = {
      amount: Number(item.price?.value || item.price || 0),
      currency: 'INR'
    };

    const locationLng = parseFloat(item.longitude || item.location?.coordinates?.[0]) || 0;
    const locationLat = parseFloat(item.latitude || item.location?.coordinates?.[1]) || 0;

    // Safely build details — map frontend field names to schema field names and normalize enums
    const rawDetails = item.details || {};

    // Normalize furnishing: 'Fully Furnished' -> 'fully-furnished'
    const furnishingMap = { 
      'fully furnished': 'fully-furnished', 'fully-furnished': 'fully-furnished',
      'semi furnished': 'semi-furnished', 'semi-furnished': 'semi-furnished',
      'unfurnished': 'unfurnished' 
    };
    const furnishing = furnishingMap[(rawDetails.furnishing || '').toLowerCase()] || 'unfurnished';

    // Normalize facing: 'East' -> 'east'
    const validFacing = ['north', 'south', 'east', 'west', 'no-preference'];
    const facing = validFacing.includes((rawDetails.facing || '').toLowerCase())
      ? (rawDetails.facing || '').toLowerCase() : 'no-preference';

    const safeDetails = {
      area: {
        value: Number(rawDetails.area || rawDetails.builtUpArea || 0) || undefined,
        unit: rawDetails.areaUnit || rawDetails.unit || 'sqft',
      },
      bhk: Number(rawDetails.bedrooms?.replace?.(/\D/g, '') || rawDetails.bhk || rawDetails.bedrooms) || undefined,
      bathrooms: Number(rawDetails.bathrooms) || undefined,
      washrooms: Number(rawDetails.washrooms) || undefined,
      furnishing,
      facing,
      floor_number: Number(rawDetails.floorNumber || rawDetails.floor_number) || undefined,
      total_floors: Number(rawDetails.totalFloors || rawDetails.total_floors) || undefined,
    };

    const newProperty = await PropertyListing.create({
      partner_id: partnerId,
      phone: partnerPhone, // Added for robust fallback
      title,
      description,
      property_type,
      listing_intent,
      pricing,
      category_id: (item.categoryId && item.categoryId.length === 24) ? item.categoryId : undefined,
      subcategory_id: (item.subcategoryId && item.subcategoryId.length === 24) ? item.subcategoryId : undefined,
      location: {
        type: 'Point',
        coordinates: [parseFloat(locationLng), parseFloat(locationLat)]
      },
      address: {
        district: item.district,
        state: item.state,
        full_address: item.completeAddress,
        pincode: item.pinCode
      },
      details: safeDetails,
      images: item.images || [],
      thumbnail: item.image || item.thumbnail, 
      emi_available: !!item.emiAvailable,
      emi_details: item.emiDetails || '',
      status: 'pending_approval'
    });

    await invalidate.publicListings();
    await invalidate.adminDashboard();
    res.status(201).json({ success: true, message: 'Property submitted for Admin review.', data: newProperty });

  } catch (error) {
    logger.error({ err: error.message }, "Error creating property:")
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({ success: false, message: `Validation failed: ${messages}` });
    }
    res.status(500).json({ success: false, message: 'Server error creating listing.' });
  }
};

/**
 * @desc    Partner creates a Draft Service Listing
 * @route   POST /api/listings/services
 * @access  Private (Partner Token Required)
 */
const createServiceListing = async (req, res) => {
  try {
    const partnerId = req.user.id;

    // 1. Check Subscription Limit
    const limitCheck = await checkListingLimit(partnerId);
    if (!limitCheck.allowed) {
      return res.status(403).json({ success: false, message: limitCheck.message });
    }

    const { 
      title, description, category, category_id, subcategory_id,
      shortDescription, detailedDescription, experience, details, 
      image, images, location_text, location, state, district, pincode,
      is_featured, video_link, service_radius_km, service_type,
      short_description, full_description, years_of_experience, thumbnail, portfolio_images, address
    } = req.body;

    // Find the category ID by name if category_id is not provided
    let final_category_id = category_id;
    if (!final_category_id && category) {
      const catObj = await Category.findOne({ 
        name: { $regex: new RegExp(`^${category}$`, 'i') },
        type: 'service' 
      });
      final_category_id = catObj?._id;
    }

    if (!final_category_id) {
       return res.status(400).json({ success: false, message: 'Top category is mandatory for service registration.' });
    }

    if (is_featured) {
      const sub = req.user.active_subscription_id;
      if (!sub) {
        return res.status(403).json({ success: false, message: 'You must have an active subscription to feature a listing.' });
      }
      
      const limit = sub.plan_snapshot?.featured_listings_limit || 0;
      const used = sub.usage?.featured_listings_used || 0;
      
      if (limit !== -1 && used >= limit) {
        return res.status(400).json({ success: false, message: `You have reached your featured listings limit of ${limit}. Please upgrade your plan.` });
      }
    }

    const newService = await ServiceListing.create({
      partner_id: partnerId,
      category_id: final_category_id,
      subcategory_id: subcategory_id || null,
      title,
      service_type: service_type || details?.serviceType,
      short_description: short_description || shortDescription || description?.slice(0, 200),
      full_description: full_description || detailedDescription || description,
      years_of_experience: years_of_experience || experience || details?.experience || 0,
      video_link,
      image: thumbnail || image,
      thumbnail: thumbnail || image,
      portfolio_images: portfolio_images || images || [],
      address: address || {
        state,
        district,
        full_address: location_text,
        pincode
      },
      location: location || { type: 'Point', coordinates: [0, 0] },
      service_radius_km: Number(service_radius_km) || 50, // Use provided radius or default to 50
      status: 'active',
      is_featured: !!is_featured
    });

    if (is_featured) {
      await Subscription.findByIdAndUpdate(req.user.active_subscription_id._id, {
        $inc: { 'usage.featured_listings_used': 1 }
      });
    }

    await invalidate.publicListings();
    await invalidate.adminDashboard();
    res.status(201).json({ success: true, message: 'Service listing created successfully.', data: newService });
  } catch (error) {
    logger.error({ err: error }, "Error creating service listing:")
    if (error.name === 'ValidationError') {
      logger.error({ err: error.errors }, "Validation Details:")
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed.', 
        error: Object.values(error.errors).map(e => e.message).join(', ') 
      });
    }
    res.status(500).json({ success: false, message: 'Server error creating service listing.' });
  }
};



/**
 * @desc    Get Single Listing by ID (Any category)
 * @route   GET /api/listings/:id
 * @access  Public
 */
const getListingById = async (req, res) => {
  try {
    const { id } = req.params;

    // Search all collections for the ID
    // In a real high-traffic app, we might store a 'ListingLookup' index,
    // but for this MVP, we check the main types.
    const populateOptions = { path: 'partner_id', select: 'name phone email role default_location profile createdAt' };
    
    const listing = await ServiceListing.findById(id).populate(populateOptions) ||
                    await PropertyListing.findById(id).populate(populateOptions) ||
                    await MandiListing.findById(id).populate(populateOptions).populate('category_id').populate('subcategory_id');

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    // Handle both populated and unpopulated partner_id
    const listingOwnerId = listing.partner_id?._id || listing.partner_id;
    const isOwner = req.user && req.user.id.toString() === listingOwnerId?.toString();
    const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'super_admin' || req.user.role === 'SuperAdmin');

    // NEW: If listing is NOT active, it should only be viewable by owner, admin or superadmin
    if (listing.status !== 'active') {
       if (!isOwner && !isAdmin) {
         return res.status(403).json({ success: false, message: 'This listing is under review or inactive.' });
       }
    }

    // NEW: Record a view automatically if someone other than the owner is viewing it
    if (!isOwner) {
      if (!listing.stats) listing.stats = {};
      listing.stats.views = (listing.stats.views || 0) + 1;
      await listing.save({ validateBeforeSave: false }); // Bypass validation for speed and to avoid unrelated schema errors
    }

    res.status(200).json({ success: true, data: listing });
  } catch (error) {
    logger.error({ err: error }, "Error in getListingById:")
    res.status(500).json({ success: false, message: 'Server error fetching listing details.' });
  }
};

/**
 * @desc    Get All Listings (Optional Category Filter)
 * @route   GET /api/listings
 * @access  Public
 */
const getAllListings = async (req, res) => {
  try {
    let { category, limit = 20, district, state, is_featured, partner_id, q, category_id, subcategory_id, subCategory, type } = req.query;
    
    
    // SANITIZATION: Prevent "undefined" or "null" strings from breaking queries
    if (district === 'undefined' || district === 'null' || !district) district = null;
    if (state === 'undefined' || state === 'null' || !state) state = null;
    if (q === 'undefined' || q === 'null') q = null;
    if (partner_id === 'undefined' || partner_id === 'null') partner_id = null;
    
    // Ensure they are strings if they exist
    if (district && typeof district !== 'string') district = String(district);
    if (state && typeof state !== 'string') state = String(state);

    const hasLocation = !!(district || state);
    const searchQuery = q || req.query.search;

    const fetchCategory = async (Model, modelName) => {
      if (!Model || typeof Model.find !== 'function') {
        throw new Error(`Model ${modelName} is not correctly imported. This is likely a circular dependency issue.`);
      }
      // Base query: only active items/partners
      const query = modelName === 'Partner' 
        ? { onboarding_status: 'approved', is_active: true }
        : { status: 'active' };

      if (is_featured === 'true') query.is_featured = true;
      if (partner_id) query.partner_id = partner_id;
      
      // ── CATEGORY & SUBCATEGORY FILTERING ──
      if (category_id) query.category_id = category_id;
      if (subcategory_id) query.subcategory_id = subcategory_id;
      if (subCategory && modelName === 'ServiceListing') {
        // If subCategory name is provided, we can filter by service_type or similar if needed
        // For now, let's stick to IDs if available, but many frontend routes pass subCategory name
        query.service_type = { $regex: new RegExp(escapeRegex(subCategory), 'i') };
      }

      if (subCategory && modelName === 'PropertyListing') {
        // Filter by property_type (enum in model)
        // Robust matching: take the first part of the slug and match it against the enum
        const primaryKeyword = subCategory.split(/[-_]/)[0];
        query.property_type = { $regex: new RegExp(escapeRegex(primaryKeyword), 'i') };
      }
      
      // ── PROPERTY SPECIFIC FILTERING ──
      if (type && modelName === 'PropertyListing') {
         // Map 'forsale' -> 'sell', 'forrent' -> 'rent'
         const intent = type === 'forsale' ? 'sell' : (type === 'forrent' ? 'rent' : type);
         query.listing_intent = intent;
      }

      // Apply strict location filtering when location is provided
      if (hasLocation && !partner_id) {
        // Different models use different paths for district/state
        const pathPrefix = modelName === 'Partner' ? '' : 'address.';
        
        if (district) {
          query[`${pathPrefix}district`] = { $regex: new RegExp(escapeRegex(district), 'i') };
        } else if (state) {
          query[`${pathPrefix}state`] = { $regex: new RegExp(escapeRegex(state), 'i') };
        }
      }

      // ── TEXT SEARCH SUPPORT ──
      if (searchQuery) {
        const regex = { $regex: new RegExp(escapeRegex(searchQuery), 'i') };
        if (modelName === 'Partner') {
          query.$or = [
            { name: regex },
            { 'profile.supplier_profile.business_name': regex },
            { 'profile.mandi_profile.business_name': regex },
            { district: regex }
          ];
        } else {
          query.$or = [
            { title: regex },
            { description: regex },
            { short_description: regex },
            { full_description: regex },
            { 'address.district': regex },
            { material_name: regex }
          ];
        }
      }

      let sort = { createdAt: -1 };
      if (modelName === 'MandiListing' || category === 'mandi') {
        sort = { 'stats.enquiries': -1, 'stats.views': -1, createdAt: -1 };
      }


      const items = await Model.find(query)
        .populate({ path: 'partner_id', select: 'name phone email role default_location profile createdAt', strictPopulate: false })
        .populate({ path: 'category_id', strictPopulate: false })
        .populate({ path: 'subcategory_id', strictPopulate: false })
        .sort(sort)
        .limit(parseInt(limit));
      

      return items.map(i => {
        const doc = i.toObject ? i.toObject() : i;
        if (!doc.category) {
          if (modelName === 'PropertyListing') doc.category = 'property';
          else if (modelName === 'ServiceListing') doc.category = 'service';
          else if (modelName === 'MandiListing') doc.category = 'mandi';
          else if (modelName === 'Partner') doc.category = 'supplier';
        }
        return doc;
      });
    };

    let results = [];

    // If searching, we fetch from all categories by default unless one is specified
    const targetCategories = category && category !== 'all' ? [category] : ['property', 'service', 'mandi', 'supplier'];

    if (targetCategories.includes('property')) {
      const properties = await fetchCategory(PropertyListing, 'PropertyListing');
      results = [...results, ...properties];
    }
    if (targetCategories.includes('service')) {
      const services = await fetchCategory(ServiceListing, 'ServiceListing');
      results = [...results, ...services];
    }
    if (targetCategories.includes('mandi')) {
      const mandiItems = await fetchCategory(MandiListing, 'MandiListing');
      results = [...results, ...mandiItems];
    }
    if (targetCategories.includes('supplier')) {
      const suppliers = await fetchCategory(Partner, 'Partner');
      results = [...results, ...suppliers];
    }

    // Sort combined results by location priority
    const sorted = sortByLocationPriority(results, district, state);

    // Apply relevance ranking when a search query is present
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      sorted.sort((a, b) => {
        const score = (item) => {
          const title = (item.title || item.name || item.material_name || '').toLowerCase();
          const sd = (item.short_description || '').toLowerCase();
          const desc = (item.description || item.full_description || '').toLowerCase();
          return (title.includes(q) ? 10 : 0) + (sd.includes(q) ? 3 : 0) + (desc.includes(q) ? 1 : 0);
        };
        return score(b) - score(a);
      });
    }

    res.status(200).json({ success: true, count: sorted.length, data: sorted });
  } catch (error) {
    logger.error({ 
      err: error.message, 
      stack: error.stack,
      query: req.query,
      requestId: req.id 
    }, "CRITICAL: Error in getAllListings:");
    res.status(500).json({ success: false, message: 'Server error.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

/**
 * @desc    Get active banners for homepage
 * @route   GET /api/listings/banners
 * @access  Public
 */
const getPublicBanners = async (req, res) => {
  try {
    const { Banner } = require('../models/System');
    const banners = await Banner.find({ is_active: true }).sort({ priority: -1 });
    res.status(200).json({ success: true, count: banners.length, data: banners });
  } catch (error) {
    logger.error({ err: error }, "Error in getPublicBanners:")
    res.status(500).json({ success: false, message: 'Server error fetching banners.' });
  }
};

/**
 * @desc    Get public categories by type (property/service/supplier) with listing counts
 * @route   GET /api/listings/categories?type=property
 * @access  Public
 */
const getPublicCategories = async (req, res) => {
  try {
    let { type, parent_id, partner_id, district, state } = req.query;
    
    // SANITIZATION
    if (district && typeof district !== 'string') district = null;
    if (state && typeof state !== 'string') state = null;
    if (parent_id && typeof parent_id !== 'string') parent_id = undefined;

    let categories;
    if (type === 'supplier') {
      const supplierQuery = { is_active: { $ne: false } };
      if (parent_id !== undefined) {
        supplierQuery.parent_id = parent_id === 'null' ? null : parent_id;
      } else {
        supplierQuery.parent_id = null;
      }
      categories = await SupplierCategory.find(supplierQuery).sort({ name: 1 });
    } else {
      const query = { is_active: { $ne: false } };
      if (type) query.type = type;
      
      // Handle hierarchy
      if (parent_id !== undefined) {
        query.parent_id = parent_id === 'null' ? null : parent_id;
      } else {
        query.parent_id = null;
      }

      // Handle partner-specific categories
      if (partner_id) {
        query.$or = [
          { partner_id: null },
          { partner_id: partner_id }
        ];
      } else {
        query.partner_id = null;
      }
      categories = await Category.find(query).sort({ name: 1 });
    }

    // Count listings per category
    let ListingModel;
    if (type === 'property') ListingModel = PropertyListing;
    else if (type === 'service') ListingModel = ServiceListing;

    const hasLocation = !!(district || state);

    const categoriesWithCounts = await Promise.all(categories.map(async (cat) => {
      let count = 0;
      
      const applyLocationFilter = (q, modelType) => {
        if (!hasLocation) return q;
        const prefix = modelType === 'Partner' ? '' : 'address.';
        if (district) q[`${prefix}district`] = { $regex: new RegExp(escapeRegex(district), 'i') };
        else if (state) q[`${prefix}state`] = { $regex: new RegExp(escapeRegex(state), 'i') };
        return q;
      };

      if (ListingModel) {
        let countQuery = { 
          $or: [{ category_id: cat._id }, { subcategory_id: cat._id }], 
          status: 'active' 
        };

        if (type === 'property' && cat.slug) {
          const primaryKeyword = cat.slug.split(/[-_]/)[0];
          countQuery.$or.push({ property_type: { $regex: new RegExp(escapeRegex(primaryKeyword), 'i') } });
        }
        countQuery = applyLocationFilter(countQuery, 'Listing');
        count = await ListingModel.countDocuments(countQuery);
      } else if (type === 'supplier') {
        let countQuery = { 
          $and: [
            { $or: [{ roles: 'supplier' }, { partner_type: 'supplier' }] },
            { $or: [
                { 'profile.supplier_profile.material_categories': cat.name },
                { 'profile.supplier_profile.material_categories': String(cat._id) }
              ] 
            }
          ],
          onboarding_status: 'approved',
          is_active: true
        };
        countQuery = applyLocationFilter(countQuery, 'Partner');
        count = await Partner.countDocuments(countQuery);
      }
      return { ...cat.toObject(), listing_count: count };
    }));

    res.status(200).json({ success: true, count: categoriesWithCounts.length, data: categoriesWithCounts });
  } catch (error) {
    logger.error({ err: error }, "Error in getPublicCategories:")
    res.status(500).json({ success: false, message: 'Server error fetching categories.' });
  }
};

/**
 * @desc    Get listings owned by the authenticated partner
 * @route   GET /api/listings/my
 * @access  Private (Partner)
 */
const getMyListings = async (req, res) => {
  try {
    const partnerId = req.user.id;
    const partnerPhone = req.user.phone;
    
    // Fetch from all regular listing collections
    // FALLBACK: Also search by phone number in case the Admin assigned it using phone instead of ID
    const [properties, services, mandiItems] = await Promise.all([
      PropertyListing.find({ 
        $or: [
          { partner_id: partnerId },
          { phone: partnerPhone },
          { contact_phone: partnerPhone } 
        ]
      }).sort({ createdAt: -1 }),
      ServiceListing.find({ 
        $or: [
          { partner_id: partnerId },
          { phone: partnerPhone }
        ]
      }).sort({ createdAt: -1 }),
      MandiListing.find({ partner_id: partnerId }).sort({ createdAt: -1 })
    ]);

    // Flatten results and identify type
    // We map to match the frontend expectations where possible
    const combined = [
       ...properties.map(i => ({ ...(i.toObject ? i.toObject() : i), type: 'property' })),
       ...services.map(i => ({ ...(i.toObject ? i.toObject() : i), type: 'service' })),
       ...mandiItems.map(i => ({ ...(i.toObject ? i.toObject() : i), type: 'mandi_product' }))
    ];

    res.status(200).json({
      success: true,
      count: combined.length,
      data: combined
    });
  } catch (error) {
    logger.error({ err: error }, "Error in getMyListings:")
    res.status(500).json({ success: false, message: 'Server error fetching your listings.' });
  }
};

/**
 * @desc    Update a listing
 * @route   PUT /api/listings/:id
 * @access  Private (Owner Partner)
 */
const updateListing = async (req, res) => {
  try {
    const { id } = req.params;
    const partnerId = req.user.id;

    // Admins can update any listing, partners only their own
    const isAdmin = ['admin', 'super_admin', 'SuperAdmin', 'Admin'].includes(req.user.role);

    // Strip fields that partners must never be able to set directly
    const PARTNER_BLOCKED_FIELDS = ['status', 'partner_id', 'is_active', 'verified', 'views', 'featured_until', 'admin_notes', 'rejection_reason', 'approval_date'];
    const updateData = { ...req.body };
    if (!isAdmin) {
      for (const field of PARTNER_BLOCKED_FIELDS) {
        delete updateData[field];
      }
    }
    const filter = isAdmin ? { _id: id } : { _id: id, partner_id: partnerId };

    let listing = await PropertyListing.findOne(filter);
    let Model = PropertyListing;

    if (!listing) {
      listing = await ServiceListing.findOne(filter);
      Model = ServiceListing;
    }

    if (!listing) {
      listing = await MandiListing.findOne(filter);
      Model = MandiListing;
    }

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found or unauthorized' });
    }

    // Determine next status: Admins can set status directly, Partners follow review rules
    let nextStatus;
    if (isAdmin && updateData.status) {
      nextStatus = updateData.status;
    } else {
      // Logic for partners: properties need review, others are auto-approved
      nextStatus = Model === PropertyListing ? 'pending_approval' : 'active';
    }

    // Handle is_featured flag changes
    if (updateData.is_featured !== undefined && updateData.is_featured !== listing.is_featured) {
      const sub = req.user.active_subscription_id;
      if (updateData.is_featured === true) {
        if (!sub) {
          return res.status(403).json({ success: false, message: 'You must have an active subscription to feature a listing.' });
        }
        const limit = sub.plan_snapshot?.featured_listings_limit || 0;
        const used = sub.usage?.featured_listings_used || 0;
        
        if (limit !== -1 && used >= limit) {
          return res.status(400).json({ success: false, message: `You have reached your featured listings limit of ${limit}.` });
        }
        await Subscription.findByIdAndUpdate(sub._id, { $inc: { 'usage.featured_listings_used': 1 } });
      } else if (updateData.is_featured === false && listing.is_featured === true) {
        if (sub && sub.usage?.featured_listings_used > 0) {
          await Subscription.findByIdAndUpdate(sub._id, { $inc: { 'usage.featured_listings_used': -1 } });
        }
      }
    }

    // ── MANDI SPECIFIC MAPPING ──
    // Frontend sends 'stock', Backend schema uses 'stock_quantity'
    if (Model === MandiListing && updateData.stock !== undefined) {
      updateData.stock_quantity = Number(updateData.stock);
    }

    const updated = await Model.findByIdAndUpdate(
      id,
      { ...updateData, status: nextStatus },
      { new: true, runValidators: true }
    );

    const message = nextStatus === 'active' ? 'Listing updated successfully' : 'Listing updated and submitted for review';
    await invalidate.publicListings();
    await invalidate.adminDashboard();
    res.status(200).json({ success: true, message, data: updated });
  } catch (error) {
    logger.error({ err: error }, "Error updating listing:")
    res.status(500).json({ success: false, message: 'Server error updating listing' });
  }
};

/**
 * @desc    Delete a listing
 * @route   DELETE /api/listings/:id
 * @access  Private (Owner Partner)
 */
const deleteListing = async (req, res) => {
  try {
    const { id } = req.params;
    const partnerId = req.user.id;

    // Admins can delete any listing, partners only their own
    const isAdmin = ['admin', 'super_admin', 'SuperAdmin', 'Admin'].includes(req.user.role);
    const filter = isAdmin ? { _id: id } : { _id: id, partner_id: partnerId };

    const result = await Promise.all([
      PropertyListing.findOneAndDelete(filter),
      ServiceListing.findOneAndDelete(filter),
      MandiListing.findOneAndDelete(filter)
    ]);

    const deleted = result.find(r => r !== null);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    await invalidate.publicListings();
    await invalidate.adminDashboard();

    res.status(200).json({ success: true, message: 'Listing deleted successfully' });
  } catch (error) {
    logger.error({ err: error }, "Error deleting listing:")
    res.status(500).json({ success: false, message: 'Server error deleting listing' });
  }
};

/**
 * @desc    Partner creates a Mandi Listing
 * @route   POST /api/listings/mandi
 * @access  Private (Partner Token Required)
 */
const createMandiListing = async (req, res) => {
  try {
    const partnerId = req.user.id;

    // 1. Check Subscription Limit
    const limitCheck = await checkListingLimit(partnerId);
    if (!limitCheck.allowed) {
      return res.status(403).json({ success: false, message: limitCheck.message });
    }

    const { 
      title, 
      material_name, 
      material_id, // category_id from frontend
      grade_id,    // subcategory_id from frontend
      brand, 
      type_name,
      sub_type_name,
      brand_name,
      description, 
      thumbnail, 
      price,       // top-level from frontend
      unit,        // top-level from frontend
      stock,       // stock_quantity from frontend
      location, 
      state, 
      district, 
      pincode,
      is_featured 
    } = req.body;

    // ── SUBSCRIPTION CHECK ──
    const limits = await getMandiLimits(partnerId);
    
    // Check Listing Count Limit
    const activeCount = await MandiListing.countDocuments({ 
      partner_id: partnerId, 
      status: 'active',
      deleted_at: null 
    });

    if (limits.listings !== -1 && activeCount >= limits.listings) {
      return res.status(403).json({ 
        success: false, 
        message: `Limit reached! Your current plan (${limits.plan_name}) allows only ${limits.listings} active listing. Please upgrade to Pro for more.`,
        limit_reached: true
      });
    }

    // Check Featured Limit
    let finalFeatured = is_featured || false;
    if (finalFeatured && limits.featured !== -1) {
      const featuredCount = await MandiListing.countDocuments({
        partner_id: partnerId,
        is_featured: true,
        status: 'active',
        deleted_at: null
      });
      if (featuredCount >= limits.featured) {
        finalFeatured = false; // Silently disable or reject? I'll disable to allow creation.
      }
    }

    // ── POPULATE LOCATION FROM PARTNER IF MISSING ──
    let finalState = state;
    let finalDistrict = district;
    let finalPincode = pincode;
    let finalLocation = location;
    let finalAddress = req.body.location_text;

    if (!finalState || !finalDistrict) {
      const partner = await Partner.findById(partnerId);
      if (partner) {
        finalState = finalState || partner.state;
        finalDistrict = finalDistrict || partner.district;
        finalPincode = finalPincode || partner.pincode;
        finalAddress = finalAddress || partner.address;
        finalLocation = finalLocation || partner.location;
      }
    }

    const newMandiItem = await MandiListing.create({
      partner_id: partnerId,
      category_id: material_id || req.body.category_id,
      subcategory_id: grade_id || req.body.subcategory_id || null,
      brand,
      type_name: type_name || null,
      sub_type_name: sub_type_name || null,
      brand_name: brand_name || brand || null,
      title,
      material_name: material_name || "Material",
      description,
      thumbnail,
      pricing: {
        unit: unit || req.body.pricing?.unit || 'Piece',
        price_per_unit: Number(price || req.body.pricing?.price_per_unit || 0),
        effective_date: Date.now()
      },
      stock_quantity: Number(stock || req.body.stock_quantity || 0),
      address: {
        state: finalState,
        district: finalDistrict,
        full_address: finalAddress,
        pincode: finalPincode
      },
      location: finalLocation || { type: 'Point', coordinates: [0, 0] },
      status: 'active',
      is_featured: finalFeatured
    });

    await invalidate.publicListings();
    await invalidate.adminDashboard();
    res.status(201).json({ success: true, message: 'Material listed successfully.', data: newMandiItem });
  } catch (error) {
    logger.error({ err: error }, "Error creating Mandi listing:")
    res.status(500).json({ success: false, message: 'Server error creating mandi listing.' });
  }
};

/**
 * @desc    Partner creates a custom category/type
 * @route   POST /api/listings/categories
 * @access  Private (Partner)
 */
const createPartnerCategory = async (req, res) => {
  try {
    const { name, parent_id, type } = req.body;
    const partner_id = req.user.id;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    // Generate slug: lowercase, replace spaces with hyphens, remove special characters
    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;

    const newCategory = await Category.create({
      name,
      slug,
      parent_id: parent_id || null,
      type: type || 'supplier',
      partner_id,
      is_active: true
    });

    res.status(201).json({ success: true, data: newCategory });
  } catch (error) {
    logger.error({ err: error }, "Error creating partner category:")
    res.status(500).json({ success: false, message: 'Server error creating category.' });
  }
};

/**
 * @desc    Partner deletes their custom category
 * @route   DELETE /api/listings/categories/:id
 * @access  Private (Partner)
 */
const deletePartnerCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const partner_id = req.user.id;

    const category = await Category.findOne({ _id: id, partner_id });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found or unauthorized' });
    }

    await Category.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Category deleted' });
  } catch (error) {
    logger.error({ err: error }, "Error deleting partner category:")
    res.status(500).json({ success: false, message: 'Server error deleting category.' });
  }
};

const SellerAttribute = require('../models/SellerAttribute');

/**
 * @desc    Record interaction on a listing (view, enquiry, call, whatsapp_click)
 * @route   POST /api/listings/:id/interaction
 * @access  Public
 */
const recordListingInteraction = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body; // 'views', 'enquiries', 'calls', 'whatsapp_clicks'

    const validTypes = ['views', 'enquiries', 'calls', 'whatsapp_clicks'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid interaction type.' });
    }

    let Model = null;
    let listing = await ServiceListing.findById(id);
    if (listing) Model = ServiceListing;
    
    if (!Model) {
      listing = await PropertyListing.findById(id);
      if (listing) Model = PropertyListing;
    }

    if (!Model) {
      listing = await MandiListing.findById(id);
      if (listing) Model = MandiListing;
    }

    if (!Model) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    // Increment the specific stat
    const updateQuery = {};
    updateQuery[`stats.${type}`] = 1;

    await Model.findByIdAndUpdate(id, { $inc: updateQuery });

    res.status(200).json({ success: true, message: `Recorded ${type} successfully.` });
  } catch (error) {
    logger.error({ err: error }, "Error recording interaction:")
    res.status(500).json({ success: false, message: 'Server error recording interaction.' });
  }
};

// ============================================================================
// SELLER ATTRIBUTE ENDPOINTS (Types, Sub-Types, Brands)
// ============================================================================

/**
 * @desc    Create a seller attribute (type, sub_type, or brand)
 * @route   POST /api/listings/seller-attributes
 * @access  Private (Partner)
 */
const createSellerAttribute = async (req, res) => {
  try {
    const partner_id = req.user.id;
    const { category_id, attribute_type, name, parent_attribute_id } = req.body;

    if (!category_id || !attribute_type || !name) {
      return res.status(400).json({ success: false, message: 'category_id, attribute_type, and name are required.' });
    }

    if (!['type', 'sub_type', 'brand'].includes(attribute_type)) {
      return res.status(400).json({ success: false, message: 'attribute_type must be type, sub_type, or brand.' });
    }

    // For sub_type, parent_attribute_id is required (points to a "type" attribute)
    if (attribute_type === 'sub_type' && !parent_attribute_id) {
      return res.status(400).json({ success: false, message: 'parent_attribute_id is required for sub_type.' });
    }

    // Manual duplicate check including parent_attribute_id
    const existingQuery = {
      partner_id,
      category_id,
      attribute_type,
      name: name.trim()
    };
    // For sub_types, same name under different parent types is allowed
    if (attribute_type === 'sub_type') {
      existingQuery.parent_attribute_id = parent_attribute_id;
    }
    const existing = await SellerAttribute.findOne(existingQuery);
    if (existing) {
      return res.status(409).json({ success: false, message: 'This attribute already exists for this category.' });
    }

    const attr = await SellerAttribute.create({
      partner_id,
      category_id,
      attribute_type,
      name: name.trim(),
      parent_attribute_id: parent_attribute_id || null
    });

    res.status(201).json({ success: true, data: attr });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'This attribute already exists for this category.' });
    }
    logger.error({ err: error }, "Error creating seller attribute:")
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Get seller's own attributes (for seller dashboard)
 * @route   GET /api/listings/seller-attributes/my?category_id=X
 * @access  Private (Partner)
 */
const getMySellerAttributes = async (req, res) => {
  try {
    const partner_id = req.user.id;
    const { category_id } = req.query;

    const query = { partner_id, is_active: true };
    if (category_id) query.category_id = category_id;

    const attrs = await SellerAttribute.find(query)
      .populate('category_id', 'name')
      .populate('parent_attribute_id', 'name')
      .sort({ attribute_type: 1, name: 1 });

    res.status(200).json({ success: true, count: attrs.length, data: attrs });
  } catch (error) {
    logger.error({ err: error }, "Error fetching my seller attributes:")
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Public: get all unique attributes for a category (aggregated across sellers)
 * @route   GET /api/listings/seller-attributes?category_id=X
 * @access  Public
 */
const getSellerAttributes = async (req, res) => {
  try {
    const { category_id, partner_id, attribute_type } = req.query;

    if (!category_id) {
      return res.status(400).json({ success: false, message: 'category_id is required.' });
    }

    const query = { category_id, is_active: true };
    if (partner_id) query.partner_id = partner_id;
    if (attribute_type) query.attribute_type = attribute_type;

    const attrs = await SellerAttribute.find(query)
      .populate('parent_attribute_id', 'name')
      .sort({ attribute_type: 1, name: 1 });

    // Deduplicate by name + attribute_type for public view
    const uniqueMap = {};
    attrs.forEach(attr => {
      const key = `${attr.attribute_type}_${attr.name.toLowerCase()}${attr.parent_attribute_id ? '_' + attr.parent_attribute_id.name : ''}`;
      if (!uniqueMap[key]) {
        uniqueMap[key] = {
          _id: attr._id,
          name: attr.name,
          attribute_type: attr.attribute_type,
          parent_name: attr.parent_attribute_id?.name || null,
          parent_attribute_id: attr.parent_attribute_id?._id || null
        };
      }
    });

    res.status(200).json({ success: true, data: Object.values(uniqueMap) });
  } catch (error) {
    logger.error({ err: error }, "Error fetching seller attributes:")
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Delete a seller attribute
 * @route   DELETE /api/listings/seller-attributes/:id
 * @access  Private (Partner)
 */
const deleteSellerAttribute = async (req, res) => {
  try {
    const { id } = req.params;
    const partner_id = req.user.id;

    const attr = await SellerAttribute.findOne({ _id: id, partner_id });
    if (!attr) {
      return res.status(404).json({ success: false, message: 'Attribute not found or unauthorized.' });
    }

    // If deleting a type, also delete its sub-types
    if (attr.attribute_type === 'type') {
      await SellerAttribute.deleteMany({ parent_attribute_id: attr._id, partner_id });
    }

    await SellerAttribute.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: 'Attribute deleted.' });
  } catch (error) {
    logger.error({ err: error }, "Error deleting seller attribute:")
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Toggle featured status of a listing
 * @route   PATCH /api/listings/:id/featured
 * @access  Private (Partner)
 */
const toggleFeaturedListing = async (req, res) => {
  try {
    const partnerId = req.user.id;
    const { id } = req.params;
    
    // 1. Find the listing across models
    let listing = await PropertyListing.findById(id) || await ServiceListing.findById(id) || await MandiListing.findById(id);
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found' });

    // 2. Security Check
    if (!listing.partner_id || listing.partner_id.toString() !== partnerId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Determine target state: use body if provided, else toggle
    const targetState = req.body.is_featured !== undefined ? !!req.body.is_featured : !listing.is_featured;

    // 3. If turning ON, check limit
    if (targetState && !listing.is_featured) {
      const limitCheck = await checkFeaturedLimit(partnerId);
      if (!limitCheck.allowed) {
        return res.status(403).json({ success: false, message: limitCheck.message });
      }
    }

    // 4. Update
    listing.is_featured = targetState;
    await listing.save();

    res.status(200).json({ 
      success: true, 
      message: `Listing is now ${listing.is_featured ? 'featured' : 'not featured'}.`,
      data: listing 
    });

  } catch (error) {
    logger.error({ err: error }, "Error toggling featured status:")
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  getNearbyServices,
  getMandiListings,
  createPropertyListing,
  createServiceListing,
  createMandiListing,
  getListingById,
  getAllListings,
  getPublicBanners,
  getPublicCategories,
  getMyListings,
  updateListing,
  deleteListing,
  recordListingInteraction,
  createPartnerCategory,
  deletePartnerCategory,
  createSellerAttribute,
  getMySellerAttributes,
  getSellerAttributes,
  deleteSellerAttribute,
  toggleFeaturedListing
};

