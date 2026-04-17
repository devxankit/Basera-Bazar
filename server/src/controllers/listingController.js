const { ServiceListing, PropertyListing, SupplierListing, MandiListing } = require('../models/Listing');
const mongoose = require('mongoose');

/**
 * Helper to build proximity aggregation pipeline
 * @param {Number} lat 
 * @param {Number} lng 
 * @param {String} userDistrict 
 * @param {String} userState 
 * @param {Number} radiusKm 
 */
const buildProximityPipeline = (lat, lng, userDistrict, userState, radiusKm = 300) => {
  return [
    {
      $geoNear: {
        near: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
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

    if (!lat || !lng) {
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

    if (!lat || !lng) {
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
    // Note: Partner must upload images to `/api/upload` *first* and then send the returned URLs here!
    const partnerId = req.user.id;
    const { title, description, property_type, listing_intent, pricing, location_lat, location_lng } = req.body;

    const newProperty = await PropertyListing.create({
      partner_id: partnerId,
      title,
      description,
      property_type,
      listing_intent,
      pricing,
      // Formatting into standard GeoJSON point
      location: {
        type: 'Point',
        coordinates: [parseFloat(location_lng), parseFloat(location_lat)]
      },
      status: 'pending_approval' // Forces Admin review before it shows up publicly
    });

    res.status(201).json({ success: true, message: 'Property submitted for Admin review.', data: newProperty });

  } catch (error) {
    console.error("Error creating property:", error);
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
    const { title, description, category, shortDescription, experience, details, image, images, location_text, location } = req.body;

    const newService = await ServiceListing.create({
      partner_id: partnerId,
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
    const listing = await ServiceListing.findById(id).populate('partner_id', 'name phone') ||
                    await PropertyListing.findById(id).populate('partner_id', 'name phone') ||
                    await SupplierListing.findById(id).populate('partner_id', 'name phone') ||
                    await MandiListing.findById(id);

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
    const { category, limit = 10, lat, lng, district, state } = req.query;
    let results = [];

    const hasLocation = lat && lng;
    const proximityRadius = 300;

    const fetchCategory = async (Model, modelName) => {
      if (hasLocation) {
        const pipeline = buildProximityPipeline(lat, lng, district, state, proximityRadius);
        pipeline.push({ $limit: parseInt(limit) });
        return await Model.aggregate(pipeline);
      } else {
        return await Model.find({ status: 'active' }).limit(parseInt(limit));
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
    console.error("Error in getAllListings:", error);
    res.status(500).json({ success: false, message: 'Server error fetching listings.' });
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

module.exports = {
  getNearbyServices,
  getMandiListings,
  createPropertyListing,
  createServiceListing,
  createSupplierListing,
  getListingById,
  getAllListings,
  getPublicBanners
};
