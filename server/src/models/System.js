const mongoose = require('mongoose');

const pointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    required: true,
    default: 'Point'
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: true
  }
}, { _id: false });

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  type: {
    type: String,
    enum: ['service', 'material', 'property', 'supplier', 'product'],
    required: true
  },
  parent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null }, // Hierarchy support
  description: { type: String }, // For marketplace SEO and internal notes
  icon: { type: String }, // For frontend display
  is_active: { type: Boolean, default: true }
}, { timestamps: true });

const brandSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  logo: { type: String },
  is_active: { type: Boolean, default: true }
}, { timestamps: true });

const unitSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // e.g., 'Kilogram', 'Piece', 'Square Feet'
  abbreviation: { type: String, required: true }, // e.g., 'kg', 'pc', 'sqft'
  is_active: { type: Boolean, default: true }
}, { timestamps: true });

const productNameSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  subcategory_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  brand_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },
  is_active: { type: Boolean, default: true }
}, { timestamps: true });

const bannerSchema = new mongoose.Schema({
  title: { type: String },
  image_url: { type: String, required: true },
  link_url: { type: String },
  position: { type: String, enum: ['home_top', 'home_middle', 'category_sidebar', 'popup'], default: 'home_top' },
  is_active: { type: Boolean, default: true },
  priority: { type: Number, default: 0 }
}, { timestamps: true });

const locationSchema = new mongoose.Schema({
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String },
  coordinates: { type: pointSchema, required: true },
  is_active: { type: Boolean, default: true }
}, { timestamps: true });
locationSchema.index({ coordinates: '2dsphere' });

const notificationSchema = new mongoose.Schema({
  recipient_type: { type: String, enum: ['user', 'partner', 'admin'], required: true },
  recipient_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed }, // Deep link payload
  is_read: { type: Boolean, default: false },
  created_at: {
    type: Date,
    default: Date.now,
    expires: 7776000 // 90 days TTL (in seconds)
  }
}); // No updatedAt needed

const appConfigSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  description: { type: String },
  updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' }
}, { timestamps: true });

module.exports = {
  Category: mongoose.model('Category', categorySchema),
  Brand: mongoose.model('Brand', brandSchema),
  Unit: mongoose.model('Unit', unitSchema),
  ProductName: mongoose.model('ProductName', productNameSchema),
  Banner: mongoose.model('Banner', bannerSchema),
  Location: mongoose.model('Location', locationSchema),
  Notification: mongoose.model('Notification', notificationSchema),
  AppConfig: mongoose.model('AppConfig', appConfigSchema)
};
