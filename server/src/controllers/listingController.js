const { ServiceListing, PropertyListing, MandiListing } = require('../models/Listing');
const { Category } = require('../models/System');
const { Subscription } = require('../models/Finance');
const { Partner } = require('../models/Partner');

const mongoose = require('mongoose');

/**
 * Helper to build proximity aggregation pipeline
 */
const buildProximityPipeline = (lat, lng, userDistrict, userState, radiusKm = 300) => {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);

  // Robust check for valid coordinates
  if (isNaN(latitude) || isNaN(longitude)) {
     throw new Error("Invalid coordinates provided for proximity search.");
  }

  return [
    {
      $geoNear: {
        near: { type: "Point", coordinates: [longitude, latitude] },
        distanceField: "distance",
        maxDistance: (process.env.NODE_ENV === 'development' ? 20000 : parseFloat(radiusKm)) * 1000,
        query: process.env.NODE_ENV === 'development' 
          ? { status: { $in: ['active', 'pending_approval', 'draft'] } }
          : { status: 'active' },
        spherical: true
      }
    },
    {
      $addFields: {
        priorityScore: {
          $cond: {
            if: { $eq: ["$address.district", userDistrict] },
            then: 2,
            else: {
              $cond: {
                if: { $eq: ["$address.state", userState] },
                then: 1,
                else: 0
              }
            }
          }
        }
      }
    },
    {
      $sort: { priorityScore: -1, distance: 1 }
    }
  ];
};

/**
 * @desc    Get nearby public Services
 * @route   GET /api/listings/services?lat=&lng=&radius=
 * @access  Public
 */
const getNearbyServices = async (req, res) => {
  try {
    const { lat, lng, district, state, radius = 300 } = req.query;

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      // Fallback to basic find if no location provided
      const query = process.env.NODE_ENV === 'development' 
        ? { status: { $in: ['active', 'pending_approval'] } }
        : { status: 'active' };
      const services = await ServiceListing.find(query).limit(20);
      return res.status(200).json({ success: true, count: services.length, data: services });
    }

    const pipeline = buildProximityPipeline(lat, lng, district, state, radius);
    
    // Add population for partner data in aggregation
    pipeline.push({
      $lookup: {
        from: 'partners',
        localField: 'partner_id',
        foreignField: '_id',
        as: 'partner_id'
      }
    });
    pipeline.push({ $unwind: '$partner_id' });
    pipeline.push({
      $project: {
        'partner_id.password': 0,
        'partner_id.kyc': 0
      }
    });

    const services = await ServiceListing.aggregate(pipeline);

    res.status(200).json({ success: true, count: services.length, data: services });

  } catch (error) {
    console.error("Error in getNearbyServices:", error);
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
    const { category_id } = req.query;
    const query = { deleted_at: null };
    if (process.env.NODE_ENV === 'development') {
      // In dev, show almost everything to help debugging
      query.status = { $in: ['active', 'pending_approval', 'draft'] };
    } else {
      query.status = 'active';
    }
    if (category_id) {
      try {
        const oid = new mongoose.Types.ObjectId(category_id);
        query.$or = [
          { category_id: oid },
          { subcategory_id: oid }
        ];
      } catch (e) {
        // invalid ObjectId — ignore category filter
      }
    }

    const mandiItems = await MandiListing.find(query)
      .populate('category_id', 'name icon mandi_icon type')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: mandiItems.length, data: mandiItems });

  } catch (error) {
    console.error("Error in getMandiListings:", error);
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
      status: 'pending_approval'
    });

    res.status(201).json({ success: true, message: 'Property submitted for Admin review.', data: newProperty });

  } catch (error) {
    console.error("Error creating property:", error.message);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({ success: false, message: `Validation failed: ${messages}` });
    }
    res.status(500).json({ success: false, message: error.message || 'Server error creating listing.' });
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
    const partnerPhone = req.user.phone;
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

    res.status(201).json({ success: true, message: 'Service listing created successfully.', data: newService });
  } catch (error) {
    console.error("Error creating service listing:", error);
    if (error.name === 'ValidationError') {
      console.error("Validation Details:", error.errors);
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed.', 
        error: Object.values(error.errors).map(e => e.message).join(', ') 
      });
    }
    res.status(500).json({ success: false, message: 'Server error creating service listing.', error: error.message });
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
                    await MandiListing.findById(id).populate(populateOptions);

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
    console.error("Error in getListingById:", error);
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
    const { category, limit = 10, lat, lng, district, state, is_featured, partner_id } = req.query;
    let results = [];

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const hasLocation = !isNaN(latitude) && !isNaN(longitude);
    const proximityRadius = 300;

    const fetchCategory = async (Model, modelName) => {
      const query = { status: 'active' };
      if (is_featured === 'true') {
        query.is_featured = true;
      }
      if (partner_id) {
        query.partner_id = partner_id;
      }

      if (hasLocation && process.env.NODE_ENV !== 'development') {
        const pipeline = buildProximityPipeline(latitude, longitude, district, state, proximityRadius);
        // Add the extra filters to the aggregation pipeline
        const matchStage = { $match: query };
        pipeline.splice(1, 0, matchStage); // Insert after $geoNear

        // Add population for partner data in aggregation
        pipeline.push({
          $lookup: {
            from: 'partners',
            localField: 'partner_id',
            foreignField: '_id',
            as: 'partner_id'
          }
        });
        pipeline.push({ $unwind: { path: '$partner_id', preserveNullAndEmptyArrays: true } });
        pipeline.push({
          $lookup: {
            from: 'categories',
            localField: 'category_id',
            foreignField: '_id',
            as: 'category_id'
          }
        });
        pipeline.push({ $unwind: { path: '$category_id', preserveNullAndEmptyArrays: true } });

        pipeline.push({
          $lookup: {
            from: 'categories',
            localField: 'subcategory_id',
            foreignField: '_id',
            as: 'subcategory_id'
          }
        });
        pipeline.push({ $unwind: { path: '$subcategory_id', preserveNullAndEmptyArrays: true } });

        pipeline.push({
          $project: {
            'partner_id.password': 0,
            'partner_id.kyc': 0
          }
        });

        if (limit) pipeline.push({ $limit: parseInt(limit) });
        return await Model.aggregate(pipeline);
      } else {
        return await Model.find(query)
          .populate({ path: 'partner_id', select: 'name phone email role default_location profile createdAt' })
          .populate('category_id')
          .populate('subcategory_id')
          .limit(parseInt(limit));
      }
    };

    if (!category || category === 'property') {
      const properties = await fetchCategory(PropertyListing, 'PropertyListing');
      results = [...results, ...properties];
    }

    if (!category || category === 'service') {
      const services = await fetchCategory(ServiceListing, 'ServiceListing');
      results = [...results, ...services];
    }

    if (!category || category === 'mandi') {
      const mandiItems = await fetchCategory(MandiListing, 'MandiListing');
      results = [...results, ...mandiItems];
    }



    // Sort combined results by distance if location was provided
    if (hasLocation) {
      results.sort((a, b) => (a.priorityScore === b.priorityScore) ? (a.distance - b.distance) : (b.priorityScore - a.priorityScore));
    }

    res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    console.error("CRITICAL: Error in getAllListings:", error.message);
    console.error("Stack:", error.stack);
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
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
    console.error("Error in getPublicBanners:", error);
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
    const { type, parent_id } = req.query;
    
    const query = { is_active: true };
    if (type) query.type = type;
    if (parent_id) {
      query.parent_id = parent_id;
    } else if (type !== 'product' && type !== 'material' && type !== 'supplier') {
      // For non-mandi types, default to top-level categories only
      // For mandi (product/material), return ALL categories regardless of hierarchy
      query.parent_id = null;
    }

    const categories = await Category.find(query).sort({ name: 1 });

    // Count listings per category
    let ListingModel;
    if (type === 'property') ListingModel = PropertyListing;
    else if (type === 'service') ListingModel = ServiceListing;

    const categoriesWithCounts = await Promise.all(categories.map(async (cat) => {
      let count = 0;
      if (ListingModel) {
        const countQuery = process.env.NODE_ENV === 'development'
          ? { $or: [{ category_id: cat._id }, { subcategory_id: cat._id }], status: { $in: ['active', 'pending_approval'] } }
          : { $or: [{ category_id: cat._id }, { subcategory_id: cat._id }], status: 'active' };
        
        count = await ListingModel.countDocuments(countQuery);
      } else if (type === 'supplier') {
        const countQuery = process.env.NODE_ENV === 'development'
          ? { 
              $or: [{ roles: 'supplier' }, { partner_type: 'supplier' }],
              'profile.supplier_profile.material_categories': cat.name,
              onboarding_status: { $in: ['approved', 'pending_approval', 'incomplete'] }
            }
          : { 
              $or: [{ roles: 'supplier' }, { partner_type: 'supplier' }],
              'profile.supplier_profile.material_categories': cat.name,
              onboarding_status: 'approved',
              is_active: true
            };
        count = await Partner.countDocuments(countQuery);
      }
      return { ...cat.toObject(), listing_count: count };
    }));

    res.status(200).json({ success: true, count: categoriesWithCounts.length, data: categoriesWithCounts });
  } catch (error) {
    console.error("Error in getPublicCategories:", error);
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
    console.error("Error in getMyListings:", error);
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
    const updateData = req.body;

    // Admins can update any listing, partners only their own
    const isAdmin = ['admin', 'super_admin', 'SuperAdmin', 'Admin'].includes(req.user.role);
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

    const updated = await Model.findByIdAndUpdate(
      id,
      { ...updateData, status: nextStatus },
      { new: true, runValidators: true }
    );

    const message = nextStatus === 'active' ? 'Listing updated successfully' : 'Listing updated and submitted for review';
    res.status(200).json({ success: true, message, data: updated });
  } catch (error) {
    console.error("Error updating listing:", error);
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

    res.status(200).json({ success: true, message: 'Listing deleted successfully' });
  } catch (error) {
    console.error("Error deleting listing:", error);
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
    const { title, material_name, category_id, subcategory_id, brand, description, thumbnail, pricing, stock_quantity, location, state, district, pincode } = req.body;

    const newMandiItem = await MandiListing.create({
      partner_id: partnerId,
      category_id,
      subcategory_id,
      brand,
      title,
      material_name,
      description,
      thumbnail,
      pricing: {
        unit: pricing?.unit || 'Piece',
        price_per_unit: Number(pricing?.price_per_unit || 0),
        effective_date: Date.now()
      },
      stock_quantity: Number(stock_quantity || 0),
      address: {
        state,
        district,
        full_address: req.body.location_text,
        pincode
      },
      location: location || { type: 'Point', coordinates: [0, 0] },
      status: 'pending_approval'
    });

    res.status(201).json({ success: true, message: 'Material listed successfully. Pending approval.', data: newMandiItem });
  } catch (error) {
    console.error("Error creating Mandi listing:", error);
    res.status(500).json({ success: false, message: 'Server error creating mandi listing.', error: error.message });
  }
};

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
    console.error("Error recording interaction:", error);
    res.status(500).json({ success: false, message: 'Server error recording interaction.' });
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
  recordListingInteraction
};
