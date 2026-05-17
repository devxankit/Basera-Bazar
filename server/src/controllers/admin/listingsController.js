const mongoose = require('mongoose');
const logger = require('../../utils/logger');
const { PropertyListing, ServiceListing, MandiListing } = require('../../models/Listing');
const { logActivity } = require('../../utils/activityLogger');
const { createNotification } = require('../../utils/notificationHelper');
const invalidate = require('../../utils/cacheInvalidator');
const pick = require('../../utils/pick');

const getListings = async (req, res) => {
  try {
    const { type } = req.params;
    const { category, category_id, subcategory, listing_intent, status, state, district, price_range, search } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

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
      if (search) query.$or = [{ title: { $regex: search, $options: 'i' } }, { 'address.district': { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }];
    } else {
      if (search) query.$or = [{ title: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }];
    }

    let listings, total = 0;

    if (type === 'property') {
      total = await PropertyListing.countDocuments(query);
      listings = await PropertyListing.find(query).populate('partner_id', 'name phone').sort({ createdAt: -1 }).skip(skip).limit(limit);
    } else if (type === 'service') {
      total = await ServiceListing.countDocuments(query);
      listings = await ServiceListing.find(query).populate('partner_id', 'name phone').sort({ createdAt: -1 }).skip(skip).limit(limit);
    } else if (type === 'product') {
      total = await MandiListing.countDocuments(query);
      listings = await MandiListing.find(query).populate('partner_id', 'name phone').populate('category_id', 'name').populate('subcategory_id', 'name').sort({ createdAt: -1 }).skip(skip).limit(limit);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid listing type.' });
    }

    res.status(200).json({ success: true, count: listings.length, total, page, totalPages: Math.ceil(total / limit), data: listings });
  } catch (error) {
    logger.error({ err: error }, "Error fetching listings:");
    res.status(500).json({ success: false, message: 'Error fetching listings.' });
  }
};

const getListingDetail = async (req, res) => {
  try {
    const { id } = req.params;
    let listing = await PropertyListing.findById(id).populate('partner_id', 'name phone email').populate('category_id subcategory_id');
    if (!listing) listing = await ServiceListing.findById(id).populate('partner_id', 'name phone email').populate('category_id');
    if (!listing) listing = await MandiListing.findById(id).populate('partner_id', 'name phone email');
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found.' });
    res.status(200).json({ success: true, data: listing });
  } catch (error) {
    logger.error({ err: error }, "Error fetching listing detail:");
    res.status(500).json({ success: false, message: 'Error fetching listing detail.' });
  }
};

const updateListingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, status_reason } = req.body;

    if (!['pending_approval', 'active', 'sold_rented', 'inactive', 'suspended', 'rejected', 'deleted'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status transition.' });
    }

    let Model = mongoose.model('PropertyListing');
    let listing = await Model.findById(id);
    if (!listing) { Model = mongoose.model('ServiceListing'); listing = await Model.findById(id); }
    if (!listing) { Model = mongoose.model('MandiListing'); listing = await Model.findById(id); }
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found.' });

    const updateFields = { status };
    if (status_reason !== undefined) updateFields.status_reason = status_reason;
    if (status === 'deleted') updateFields.deleted_at = new Date();

    listing = await Model.findByIdAndUpdate(id, { $set: updateFields }, { new: true });

    if (status === 'active' && listing.partner_id) {
      await createNotification('partner', listing.partner_id, 'Listing Approved! 🎉', `Congratulations! Your listing "${listing.title}" has been approved and is now live on BaseraBazar.`, { listing_id: listing._id, type: 'listing_approval' });
    } else if (status === 'rejected' && listing.partner_id) {
      await createNotification('partner', listing.partner_id, 'Listing Update', `Your listing "${listing.title}" requires changes. Reason: ${status_reason || 'Not specified'}.`, { listing_id: listing._id, type: 'listing_rejection' });
    }

    res.status(200).json({ success: true, message: `Listing marked as ${status}`, data: listing });
  } catch (error) {
    logger.error({ err: error }, "Error updating status:");
    res.status(500).json({ success: false, message: 'Error updating listing status.' });
  }
};

const updateListing = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = pick(req.body, [
      'title', 'description', 'price', 'rent', 'deposit', 'area', 'area_unit',
      'bedrooms', 'bathrooms', 'furnishing', 'property_type', 'listing_type',
      'availability', 'status', 'approval_status', 'is_active', 'is_featured',
      'category_id', 'subcategory_id', 'partner_id',
      'images', 'videos', 'documents',
      'location', 'address', 'city', 'state', 'pincode', 'coordinates',
      'amenities', 'features', 'specifications', 'tags',
      'contact_name', 'contact_phone', 'contact_email',
      'unit', 'quantity', 'min_order_qty', 'brand', 'sku',
      'rejection_reason', 'admin_notes'
    ]);

    let listing = await PropertyListing.findById(id);
    let Model = PropertyListing;
    if (!listing) { listing = await ServiceListing.findById(id); Model = ServiceListing; }
    if (!listing) { listing = await MandiListing.findById(id); Model = MandiListing; }
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found.' });

    if (updateData.category_id === '') updateData.category_id = null;
    if (updateData.subcategory_id === '') updateData.subcategory_id = null;
    if (updateData.partner_id === '') updateData.partner_id = null;

    const updated = await Model.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });
    res.status(200).json({ success: true, message: 'Listing updated successfully.', data: updated });

    await logActivity({ actor_name: req.user?.name || 'Admin', actor_id: req.user?._id, action: 'updated', entity_type: 'property', entity_name: listing.title, entity_id: id, description: `${req.user?.name || 'Admin'} updated property: ${listing.title}` });
  } catch (error) {
    logger.error({ err: error }, "Error updating listing:");
    res.status(500).json({ success: false, message: 'Error updating listing.' });
  }
};

const deleteListing = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await PropertyListing.findByIdAndDelete(id) || await ServiceListing.findByIdAndDelete(id) || await MandiListing.findByIdAndDelete(id);
    if (!result) return res.status(404).json({ success: false, message: 'Listing not found.' });
    await invalidate.publicListings();
    await invalidate.adminDashboard();
    res.status(200).json({ success: true, message: 'Listing permanently removed from database.' });
  } catch (error) {
    logger.error({ err: error }, "Error deleting listing:");
    res.status(500).json({ success: false, message: 'Error during listing deletion.' });
  }
};

const createPropertyListing = async (req, res) => {
  try {
    const { title, description, property_type, listing_intent, partner_id, category_id, subcategory_id, images, thumbnail, is_featured, status, location, address, pricing, details, emi_available, emi_details } = req.body;

    const newProperty = await PropertyListing.create({
      partner_id: partner_id || null, title, description: description || '',
      property_type: property_type || 'apartment', listing_intent: listing_intent || 'sell',
      category_id: category_id || null, subcategory_id: subcategory_id || null,
      images: images || [], thumbnail: thumbnail || (images && images.length > 0 ? images[0] : ''),
      is_featured: is_featured || false, status: status || 'active',
      location: location || { type: 'Point', coordinates: [77.1025, 28.7041] },
      address: address || {}, pricing: pricing || {}, details: details || {},
      emi_available: emi_available || false, emi_details: emi_details || ''
    });

    await invalidate.publicListings();
    await invalidate.adminDashboard();
    res.status(201).json({ success: true, message: 'Property entry finalized in marketplace registry.', data: newProperty });
    await logActivity({ actor_name: req.user?.name || 'Admin', actor_id: req.user?._id, action: 'created', entity_type: 'property', entity_name: newProperty.title, entity_id: newProperty._id, description: `${req.user?.name || 'Admin'} listed new property: ${newProperty.title}` });
  } catch (error) {
    logger.error({ err: error }, "Admin Property Creation Error:");
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const createServiceListing = async (req, res) => {
  try {
    const { title, short_description, full_description, partner_id, category_id, subcategory_id, service_type, years_of_experience, thumbnail, portfolio_images, video_link, status, location, address, service_radius_km, is_featured } = req.body;

    if (!category_id) return res.status(400).json({ success: false, message: 'Top category is mandatory for service registry entry.' });

    const newService = await ServiceListing.create({
      partner_id: partner_id || null, title, short_description: short_description || '', full_description: full_description || '',
      service_type: service_type || '', years_of_experience: years_of_experience || 0,
      category_id: category_id || null, subcategory_id: subcategory_id || null,
      thumbnail: thumbnail || '', portfolio_images: portfolio_images || [], video_link: video_link || '',
      is_featured: is_featured || false, status: status || 'active',
      location: location || { type: 'Point', coordinates: [77.1025, 28.7041] },
      address: address || {}, service_radius_km: service_radius_km || 10
    });

    await invalidate.publicListings();
    await invalidate.adminDashboard();
    res.status(201).json({ success: true, message: 'Service entry finalized in marketplace registry.', data: newService });
    await logActivity({ actor_name: req.user?.name || 'Admin', actor_id: req.user?._id, action: 'created', entity_type: 'service', entity_name: newService.title, entity_id: newService._id, description: `${req.user?.name || 'Admin'} listed new service: ${newService.title}` });
  } catch (error) {
    logger.error({ err: error }, "Admin Service Creation Error:");
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  getListings,
  getListingDetail,
  updateListingStatus,
  updateListing,
  deleteListing,
  createPropertyListing,
  createServiceListing
};
