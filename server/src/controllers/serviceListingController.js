const { ServiceListing } = require('../models/Listing');
const logger = require('../utils/logger');
const { Category } = require('../models/System');
const { Subscription } = require('../models/Finance');
const { checkListingLimit } = require('../utils/subscriptionUtils');
const invalidate = require('../utils/cacheInvalidator');
const { escapeRegex, sortByLocationPriority, getDistanceInKm, sortByProximity } = require('../utils/listingUtils');

/**
 * @desc    Get nearby public Services
 * @route   GET /api/listings/services?lat=&lng=&radius=
 * @access  Public
 */
const getNearbyServices = async (req, res) => {
  try {
    const { district, state, lat, lng, searchRadius, radius } = req.query;

    const query = { status: 'active' };

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const hasCoordinates = !isNaN(latitude) && !isNaN(longitude);

    let maxDistanceInMeters = 25 * 1000; // default 25km
    const radiusParam = searchRadius || radius;
    if (radiusParam) {
      const match = String(radiusParam).match(/^(\d+)(km|m)?$/i);
      if (match) {
        const val = parseInt(match[1], 10);
        const unit = match[2] ? match[2].toLowerCase() : 'km';
        maxDistanceInMeters = unit === 'm' ? val : val * 1000;
      }
    }

    // Apply location filtering: coordinates-based geo-spatial query if available, otherwise text-matching
    if (hasCoordinates) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: maxDistanceInMeters
        }
      };
    } else if (district) {
      query['address.district'] = { $regex: new RegExp(escapeRegex(district), 'i') };
    } else if (state) {
      query['address.state'] = { $regex: new RegExp(escapeRegex(state), 'i') };
    }

    let querySort = { createdAt: -1 };
    if (hasCoordinates) {
      // MongoDB doesn't allow sorting on other fields when using $near
      querySort = {};
    }

    const services = await ServiceListing.find(query)
      .populate({ path: 'partner_id', select: 'name phone email role profile createdAt' })
      .sort(querySort)
      .limit(20);

    const mapped = services.map(s => s.toObject ? s.toObject() : s);
    const sorted = hasCoordinates
      ? sortByProximity(mapped, latitude, longitude)
      : sortByLocationPriority(mapped, district, state);
    res.status(200).json({ success: true, count: sorted.length, data: sorted });

  } catch (error) {
    logger.error({ err: error }, "Error in getNearbyServices:")
    res.status(500).json({ success: false, message: 'Server error fetching services.' });
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
      return res.status(400).json({ success: false, message: 'Service category is required. Please select a category before submitting.' });
    }
    const svcCatExists = await Category.exists({ _id: final_category_id, type: 'service', is_active: { $ne: false } });
    if (!svcCatExists) {
      return res.status(400).json({ success: false, message: 'Selected service category is invalid or inactive.' });
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

module.exports = { getNearbyServices, createServiceListing };
