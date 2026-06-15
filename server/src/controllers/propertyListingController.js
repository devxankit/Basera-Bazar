const { PropertyListing } = require('../models/Listing');
const logger = require('../utils/logger');
const { Category } = require('../models/System');
const { Partner } = require('../models/Partner');
const { checkListingLimit } = require('../utils/subscriptionUtils');
const invalidate = require('../utils/cacheInvalidator');

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

    // 1. Check Subscription Limit (scoped to the property_agent role)
    const limitCheck = await checkListingLimit(partnerId, 'property_agent');
    if (!limitCheck.allowed) {
      return res.status(403).json({ success: false, message: limitCheck.message });
    }

    // Require a valid category
    const rawCategoryId = item.categoryId || item.category_id;
    if (!rawCategoryId || String(rawCategoryId).length !== 24) {
      return res.status(400).json({ success: false, message: 'Property category is required. Please select a category before submitting.' });
    }
    const categoryExists = await Category.exists({ _id: rawCategoryId, type: 'property', is_active: { $ne: false } });
    if (!categoryExists) {
      return res.status(400).json({ success: false, message: 'Selected property category is invalid or inactive.' });
    }

    const title = item.title || 'Untitled Property';
    const description = item.description || item.details?.description || '';

    // Map property type from frontend to lowercase enum
    let property_type = 'residential';
    const typeStr = String(item.propertyType || item.property_type || '').toLowerCase();
    
    if (typeStr.includes('apartment') || typeStr.includes('flat')) {
      property_type = 'apartment';
    } else if (typeStr.includes('hostel') || typeStr.includes('pg')) {
      property_type = 'hostel_pg';
    } else if (typeStr.includes('office') || typeStr.includes('shop')) {
      property_type = 'office';
    } else if (typeStr.includes('plot') || typeStr.includes('land')) {
      property_type = 'plot';
    } else if (typeStr.includes('warehouse') || typeStr.includes('godown')) {
      property_type = 'warehouse';
    } else if (typeStr.includes('house')) {
      property_type = 'house';
    } else if (typeStr.includes('villa')) {
      property_type = 'villa';
    } else if (['commercial', 'agricultural', 'industrial', 'residential'].includes(typeStr)) {
      property_type = typeStr;
    }

    const listing_intent = (item.intention && item.intention.toLowerCase().includes('rent')) ? 'rent' : 'sell';

    const pricing = {
      amount: Number(item.price?.value || item.price || 0),
      currency: 'INR',
      negotiable: !!(item.price?.negotiable ?? item.negotiable),
    };

    const locationLng = parseFloat(item.longitude || item.location?.coordinates?.[0]) || 0;
    const locationLat = parseFloat(item.latitude || item.location?.coordinates?.[1]) || 0;

    // Fall back to partner's stored coordinates when property has no explicit GPS pin
    let finalCoords = [locationLng, locationLat];
    if (locationLng === 0 && locationLat === 0) {
      const partnerDoc = await Partner.findById(partnerId).select('location');
      if (partnerDoc?.location?.coordinates) finalCoords = partnerDoc.location.coordinates;
    }

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

    let areaUnit = rawDetails.areaUnit || rawDetails.unit || 'sqft';
    if (areaUnit === 'sq. ft.' || areaUnit === 'sq.ft') areaUnit = 'sqft';
    else if (areaUnit === 'sq. m.' || areaUnit === 'sq.m.' || areaUnit === 'sqmt') areaUnit = 'sqmt';

    const safeDetails = {
      area: {
        value: Number(rawDetails.area || rawDetails.builtUpArea || 0) || undefined,
        unit: areaUnit,
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
      category_id: rawCategoryId,
      subcategory_id: (item.subcategoryId && item.subcategoryId.length === 24) ? item.subcategoryId : undefined,
      location: {
        type: 'Point',
        coordinates: finalCoords
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
    await invalidate.partnerListings(partnerId);
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

module.exports = { createPropertyListing };
