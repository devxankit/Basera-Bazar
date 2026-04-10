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
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  title: { type: String, required: true },
  description: { type: String },
  location: { type: pointSchema, required: true },
  service_radius_km: { type: Number, required: true },
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'suspended', 'deleted'],
    default: 'draft'
  },
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
  title: { type: String, required: true },
  description: { type: String },
  property_type: {
    type: String,
    enum: ['apartment', 'hostel_pg', 'office', 'plot', 'warehouse'],
    required: true
  },
  listing_intent: {
    type: String,
    enum: ['sell', 'rent', 'lease'],
    required: true
  },
  location: { type: pointSchema, required: true },
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
      unit: { type: String, enum: ['sqft', 'sqyrd', 'sqmt', 'acre'], default: 'sqft' }
    },
    bhk: { type: Number },
    bathrooms: { type: Number },
    furnishing: { type: String, enum: ['unfurnished', 'semi-furnished', 'fully-furnished'], default: 'unfurnished' },
    floor_number: { type: Number },
    total_floors: { type: Number },
    parking: { type: String, enum: ['none', 'covered', 'open'], default: 'none' },
    facing: { type: String, enum: ['north', 'south', 'east', 'west', 'no-preference'], default: 'no-preference' },
    possession: { type: String, enum: ['ready', 'under-construction'], default: 'ready' }
  },
  images: [{ type: String }],
  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'active', 'sold_rented', 'inactive', 'suspended', 'deleted'],
    default: 'draft'
  },
  deleted_at: { type: Date, default: null }
}, baseListingSchemaConfig);

const supplierListingSchema = new mongoose.Schema({
  partner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true },
  title: { type: String, required: true },
  description: { type: String },
  material_category: { type: String, required: true },
  pricing: {
    unit: { type: String, required: true },
    price_per_unit: { type: Number, required: true }, // Whole rupees
    min_order_qty: { type: Number, required: true },
    bulk_discount_available: { type: Boolean, default: false }
  },
  location: { type: pointSchema, required: true },
  delivery_radius_km: { type: Number, required: true },
  status: {
    type: String,
    enum: ['draft', 'active', 'out_of_stock', 'inactive', 'suspended', 'deleted'],
    default: 'draft'
  },
  deleted_at: { type: Date, default: null }
}, baseListingSchemaConfig);

const mandiListingSchema = new mongoose.Schema({
  partner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true }, // Backend only
  title: { type: String, required: true },
  material_name: { type: String, required: true },
  description: { type: String },
  pricing: {
    unit: { type: String, required: true },
    price_per_unit: { type: Number, required: true }, // Whole rupees
    effective_date: { type: Date, required: true }
  },
  availability_status: { type: Boolean, default: true },
  assigned_by: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'deleted'],
    default: 'active'
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

supplierListingSchema.index({ location: '2dsphere' });
supplierListingSchema.index({ status: 1, createdAt: -1 });
supplierListingSchema.index({ partner_id: 1, status: 1 });

mandiListingSchema.index({ 'pricing.effective_date': -1 });
mandiListingSchema.index({ status: 1, createdAt: -1 });

module.exports = {
  ServiceListing: mongoose.model('ServiceListing', serviceListingSchema),
  PropertyListing: mongoose.model('PropertyListing', propertyListingSchema),
  SupplierListing: mongoose.model('SupplierListing', supplierListingSchema),
  MandiListing: mongoose.model('MandiListing', mandiListingSchema)
};
