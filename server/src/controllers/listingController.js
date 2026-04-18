const { ServiceListing, PropertyListing, SupplierListing, MandiListing } = require('../models/Listing');
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
        maxDistance: parseFloat(radiusKm) * 1000,
        query: { status: 'active' },
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
      const services = await ServiceListing.find({ status: 'active' }).limit(20);
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
    const { lat, lng, district, state, radius = 300 } = req.query;

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      const mandiItems = await MandiListing.find({ status: 'active' }).select('-partner_id');
      return res.status(200).json({ success: true, count: mandiItems.length, data: mandiItems });
    }

    const pipeline = buildProximityPipeline(lat, lng, district, state, radius);
    pipeline.push({ $project: { partner_id: 0 } }); // Hide seller identity

    const mandiItems = await MandiListing.aggregate(pipeline);

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
    const { title, description, category, shortDescription, experience, details, image, images, location_text, location } = req.body;

    const newService = await ServiceListing.create({
      partner_id: partnerId,
      phone: partnerPhone, // Added for robust fallback
      title,
      description: description || shortDescription,
      category,
      experience,
      details,
      image,
      images,
      location_text,
      location: location || { type: 'Point', coordinates: [0, 0] },
      status: 'pending_approval'
    });

    res.status(201).json({ success: true, message: 'Service submitted for Admin review.', data: newService });
  } catch (error) {
    console.error("Error creating service:", error);
    res.status(500).json({ success: false, message: 'Server error creating service listing.' });
  }
};

/**
 * @desc    Partner creates a Draft Supplier Listing
 * @route   POST /api/listings/suppliers
 * @access  Private (Partner Token Required)
 */
const createSupplierListing = async (req, res) => {
  try {
    const partnerId = req.user.id;
    const { title, description, category, details, image, images, location_text, location } = req.body;

    const newSupplier = await SupplierListing.create({
      partner_id: partnerId,
      title,
      description,
      category,
      details,
      image,
      images,
      location_text,
      location: location || { type: 'Point', coordinates: [0, 0] },
      status: 'pending_approval'
    });

    res.status(201).json({ success: true, message: 'Supplier/Product submitted for Admin review.', data: newSupplier });
  } catch (error) {
    console.error("Error creating supplier listing:", error);
    res.status(500).json({ success: false, message: 'Server error creating supplier listing.' });
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
    const populateOptions = { path: 'partner_id', select: 'name phone email role default_location profile' };
    
    const listing = await ServiceListing.findById(id).populate(populateOptions) ||
                    await PropertyListing.findById(id).populate(populateOptions) ||
                    await SupplierListing.findById(id).populate(populateOptions) ||
                    await MandiListing.findById(id).populate(populateOptions);

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    // NEW: If listing is NOT active, it should only be viewable by owner or admin
    if (listing.status !== 'active') {
       // We can check if there's a user in req from 'protect' (if we make this route optionally protected)
       // For now, let's keep it simple: Public can ONLY see 'active'
       return res.status(403).json({ success: false, message: 'This listing is under review or inactive.' });
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
    const { category, limit = 10, lat, lng, district, state, is_featured } = req.query;
    let results = [];

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const hasLocation = !isNaN(latitude) && !isNaN(longitude);
    const proximityRadius = 300;

    const fetchCategory = async (Model, modelName) => {
      if (hasLocation) {
        const pipeline = buildProximityPipeline(latitude, longitude, district, state, proximityRadius);
        if (is_featured === 'true') {
          pipeline.push({ $match: { is_featured: true } });
        }
        pipeline.push({ $limit: parseInt(limit) });
        return await Model.aggregate(pipeline);
      } else {
        const query = { status: 'active' };
        if (is_featured === 'true') {
          query.is_featured = true;
        }
        return await Model.find(query).limit(parseInt(limit));
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

    if (!category || category === 'supplier') {
      const suppliers = await fetchCategory(SupplierListing, 'SupplierListing');
      results = [...results, ...suppliers];
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
    const { Category } = require('../models/System');
    const { type, parent_id } = req.query;
    
    const query = { is_active: true };
    if (type) query.type = type;
    if (parent_id) {
      query.parent_id = parent_id;
    } else {
      query.parent_id = null; // Default to top-level if no parent_id is specified
    }

    const categories = await Category.find(query).sort({ name: 1 });

    // Count listings per category
    let ListingModel;
    if (type === 'property') ListingModel = PropertyListing;
    else if (type === 'service') ListingModel = ServiceListing;
    else if (type === 'supplier') ListingModel = SupplierListing;

    const categoriesWithCounts = await Promise.all(categories.map(async (cat) => {
      let count = 0;
      if (ListingModel) {
        count = await ListingModel.countDocuments({
          $or: [{ category_id: cat._id }, { subcategory_id: cat._id }],
          status: 'active'
        });
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
    const [properties, services, suppliers, mandiItems] = await Promise.all([
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
      SupplierListing.find({ partner_id: partnerId }).sort({ createdAt: -1 }),
      MandiListing.find({ partner_id: partnerId }).sort({ createdAt: -1 })
    ]);

    // Flatten results and identify type
    // We map to match the frontend expectations where possible
    const combined = [
       ...properties.map(i => ({ ...(i.toObject ? i.toObject() : i), type: 'property' })),
       ...services.map(i => ({ ...(i.toObject ? i.toObject() : i), type: 'service' })),
       ...suppliers.map(i => ({ ...(i.toObject ? i.toObject() : i), type: 'product' })),
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

module.exports = {
  getNearbyServices,
  getMandiListings,
  createPropertyListing,
  createServiceListing,
  createSupplierListing,
  getListingById,
  getAllListings,
  getPublicBanners,
  getPublicCategories,
  getMyListings
};
