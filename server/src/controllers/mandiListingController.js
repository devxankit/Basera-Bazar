const { MandiListing } = require('../models/Listing');
const { SupplierCategory, Category } = require('../models/System');
const { Partner } = require('../models/Partner');
const logger = require('../utils/logger');
const {
  checkListingLimit,
  getMandiLimits,
  enforceMandiLimits
} = require('../utils/subscriptionUtils');
const invalidate = require('../utils/cacheInvalidator');
const { escapeRegex, sortByLocationPriority, getDistanceInKm, sortByProximity } = require('../utils/listingUtils');
const mongoose = require('mongoose');

/**
 * @desc    Get Mandi inventory (Hiding the seller identity)
 * @route   GET /api/listings/mandi
 * @access  Public
 */
const getMandiListings = async (req, res) => {
  try {
    const { category_id, partner_id, district, state, lat, lng, searchRadius, radius } = req.query;
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

    // Apply location filter using district/state text matching or coordinates
    if (!partner_id) { // Don't filter by location when viewing a specific partner's items
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
    }

    let querySort = { createdAt: -1 };
    if (hasCoordinates && !partner_id) {
      querySort = {};
    }

    const mandiItems = await MandiListing.find(query)
      .populate('category_id', 'name icon mandi_icon type')
      .sort(querySort);

    const mapped = mandiItems.map(m => m.toObject ? m.toObject() : m);
    const sorted = (!partner_id && hasCoordinates)
      ? sortByProximity(mapped, latitude, longitude)
      : sortByLocationPriority(mapped, district, state);
    res.status(200).json({ success: true, count: sorted.length, data: sorted });

  } catch (error) {
    logger.error({ err: error }, "Error in getMandiListings:")
    res.status(500).json({ success: false, message: 'Server error fetching mandi inventory.' });
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

    const mandiCategoryId = material_id || req.body.category_id;
    if (!mandiCategoryId || String(mandiCategoryId).length !== 24) {
      return res.status(400).json({ success: false, message: 'Product category is required. Please select a material category before submitting.' });
    }
    const mandiCatExists = await SupplierCategory.exists({ _id: mandiCategoryId, is_active: { $ne: false } })
      .catch(() => null);
    if (!mandiCatExists) {
      const altExists = await Category.exists({ _id: mandiCategoryId, type: 'product', is_active: { $ne: false } });
      if (!altExists) {
        return res.status(400).json({ success: false, message: 'Selected product category is invalid or inactive.' });
      }
    }

    const newMandiItem = await MandiListing.create({
      partner_id: partnerId,
      category_id: mandiCategoryId,
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

module.exports = { getMandiListings, createMandiListing, createPartnerCategory, deletePartnerCategory };
