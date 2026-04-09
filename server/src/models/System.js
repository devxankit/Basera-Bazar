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
    enum: ['service', 'material'],
    required: true
  },
  parent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null }, // Hierarchy support
  is_active: { type: Boolean, default: true }
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
  Location: mongoose.model('Location', locationSchema),
  Notification: mongoose.model('Notification', notificationSchema),
  AppConfig: mongoose.model('AppConfig', appConfigSchema)
};
