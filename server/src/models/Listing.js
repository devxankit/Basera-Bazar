const mongoose = require('mongoose');

const pointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    required: true,
    default: 'Point'
  },
  coordinates: {
    type: [Number],
    required: true
  }
}, { _id: false });

const baseListingSchemaConfig = {
  timestamps: true
};

const serviceListingSchema = new mongoose.Schema({
  partner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  subcategory_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  title: { type: String, required: true },
  service_type: { type: String }, // e.g., Consultation, Repair, Maintenance
  years_of_experience: { type: Number },
  short_description: { type: String },
  full_description: { type: String },
  video_link: { type: String },
  location: { type: pointSchema, required: true },
  address: {
    state: { type: String },
    district: { type: String },
    full_address: { type: String },
    pincode: { type: String }
  },
  thumbnail: { type: String },
  portfolio_images: [{ type: String }],
  service_radius_km: { type: Number, required: true },
  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'active', 'inactive', 'suspended', 'rejected', 'deleted'],
    default: 'draft'
  },
  status_reason: { type: String },
  is_featured: { type: Boolean, default: false },
  stats: {
    views: { type: Number, default: 0 },
    enquiries: { type: Number, default: 0 },
    calls: { type: Number, default: 0 },
    whatsapp_clicks: { type: Number, default: 0 }
  },
  deleted_at: { type: Date, default: null }
}, baseListingSchemaConfig);

const propertyListingSchema = new mongoose.Schema({
  partner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  subcategory_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  title: { type: String, required: true },
  description: { type: String },
  phone: { type: String },
  contact_phone: { type: String },
  property_type: {
    type: String,
    enum: ['apartment', 'hostel_pg', 'office', 'plot', 'warehouse', 'residential', 'commercial', 'agricultural', 'industrial', 'house', 'villa'],
    required: true
  },
  listing_intent: {
    type: String,
    enum: ['sell', 'rent', 'lease'],
    required: true
  },
  location: { type: pointSchema, required: true },
  address: {
    state: { type: String },
    district: { type: String },
    full_address: { type: String },
    pincode: { type: String }
  },
  pricing: {
    amount: { type: Number, required: true }, // Whole rupees
    currency: { type: String, default: 'INR' },
    negotiable: { type: Boolean, default: false },
    deposit: { type: Number },
    maintenance: { type: Number }
  },
  details: {
    area: { 
      value: { type: Number },
      unit: { type: String, enum: ['sqft', 'sqyrd', 'sqmt', 'acre', 'sq. ft.', 'sq. m.', 'dismil', 'gaj', 'bigha', 'katha', 'Sqft', 'Sq. Ft.', 'Gaj', 'Dismil', 'Acre', 'Bigha', 'Katha', 'sq. ft.'], default: 'sqft' },
      super_built_up_area: { type: Number },
      carpet_area: { type: Number }
    },
    bhk: { type: Number },
    bathrooms: { type: Number },
    washrooms: { type: Number },
    furnishing: { type: String, enum: ['unfurnished', 'semi-furnished', 'fully-furnished', 'Unfurnished', 'Semi Furnished', 'Fully Furnished'], default: 'unfurnished' },
    floor_number: { type: Number },
    total_floors: { type: Number },
    parking: { type: String, enum: ['none', 'covered', 'open'], default: 'none' },
    facing: { type: String, enum: ['north', 'south', 'east', 'west', 'no-preference'], default: 'no-preference' },
    possession: { type: String, enum: ['ready', 'under-construction'], default: 'ready' }
  },
  images: [{ type: String }],
  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'active', 'sold_rented', 'inactive', 'suspended', 'rejected', 'deleted'],
    default: 'draft'
  },
  status_reason: { type: String },
  is_featured: { type: Boolean, default: false },
  stats: {
    views: { type: Number, default: 0 },
    enquiries: { type: Number, default: 0 },
    calls: { type: Number, default: 0 },
    whatsapp_clicks: { type: Number, default: 0 }
  },
  deleted_at: { type: Date, default: null }
}, baseListingSchemaConfig);

const mandiListingSchema = new mongoose.Schema({
  partner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  subcategory_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  title: { type: String, required: true }, // e.g., "Premium Red Bricks"
  material_name: { type: String, required: true }, // e.g., "Bricks"
  description: { type: String },
  brand: { type: String },
  thumbnail: { type: String },
  pricing: {
    unit: { type: String, required: true },
    price_per_unit: { type: Number, required: true },
    effective_date: { type: Date, required: true, default: Date.now }
  },
  location: { type: pointSchema, required: true },
  service_radius_km: { type: Number, required: true, default: 300 }, // Default 300km for mandi
  stock_quantity: { type: Number, default: 0, min: 0 },
  availability_status: { type: Boolean, default: true },
  status: {
    type: String,
    enum: ['pending_approval', 'active', 'inactive', 'suspended', 'rejected', 'deleted'],
    default: 'pending_approval'
  },
  stats: {
    views: { type: Number, default: 0 },
    enquiries: { type: Number, default: 0 },
    calls: { type: Number, default: 0 },
    whatsapp_clicks: { type: Number, default: 0 }
  },
  deleted_at: { type: Date, default: null }
}, baseListingSchemaConfig);

// Indexes
serviceListingSchema.index({ location: '2dsphere' });
serviceListingSchema.index({ status: 1, createdAt: -1 });
serviceListingSchema.index({ partner_id: 1, status: 1 });

propertyListingSchema.index({ location: '2dsphere' });
propertyListingSchema.index({ status: 1, createdAt: -1 });
propertyListingSchema.index({ partner_id: 1, status: 1 });

mandiListingSchema.index({ location: '2dsphere' });
mandiListingSchema.index({ 'pricing.effective_date': -1 });
mandiListingSchema.index({ status: 1, createdAt: -1 });

module.exports = {
  ServiceListing: mongoose.model('ServiceListing', serviceListingSchema),
  PropertyListing: mongoose.model('PropertyListing', propertyListingSchema),
  MandiListing: mongoose.model('MandiListing', mandiListingSchema)
};
