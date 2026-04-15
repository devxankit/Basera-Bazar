const { ServiceListing, PropertyListing, SupplierListing, MandiListing } = require('../models/Listing');

/**
 * @desc    Get nearby public Services
 * @route   GET /api/listings/services?lat=&lng=&radius=
 * @access  Public
 */
const getNearbyServices = async (req, res) => {
  try {
    // 1. Grab parameters from the URL query string
    // e.g., /api/listings/services?lat=26.123&lng=85.39&radius=50
    const { lat, lng, radius = 50 } = req.query; // default radius 50km

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Please provide valid latitude and longitude.' });
    }

    // 2. Perform a native MongoDB Geospatial Query!
    // This looks for all active service listings where the 2D sphere location is near the coordinates
    // $maxDistance takes meters, so we multiply radius (km) by 1000.
    const services = await ServiceListing.find({
      status: 'active',
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)] // MongoDB needs Longitude first!
          },
          $maxDistance: parseFloat(radius) * 1000 
        }
      }
    }).populate('partner_id', 'name phone profile.service_profile.avg_rating'); // Only populate public partner stats

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
    // Fetch active Mandi listings, but project OUT the partner_id by placing a minus sign.
    // This ensures end-users cannot bypass the platform and contact sellers directly!
    const mandiItems = await MandiListing.find({ status: 'active' }).select('-partner_id');

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
    const { category, limit = 10 } = req.query;
    let results = [];

    const query = { status: 'active' };

    if (!category || category === 'property') {
      const properties = await PropertyListing.find(query).limit(parseInt(limit));
      results = [...results, ...properties];
    }

    if (!category || category === 'service') {
      const services = await ServiceListing.find(query).limit(parseInt(limit));
      results = [...results, ...services];
    }

    if (!category || category === 'supplier') {
      const suppliers = await SupplierListing.find(query).limit(parseInt(limit));
      results = [...results, ...suppliers];
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
  getListingById,
  getAllListings,
  getPublicBanners
};
