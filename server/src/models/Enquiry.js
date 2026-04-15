const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
  enquiry_type: {
    type: String,
    enum: ['service', 'property', 'supplier', 'mandi'],
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  listing_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    // Polymorphic ref - could be ServiceListing, PropertyListing, etc.
  },
  partner_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner',
    default: null // Null initially for Mandi
  },
  mandi_assignment: {
    assigned_to_partner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner' },
    assigned_by: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
    fulfillment_status: { 
      type: String, 
      enum: ['pending_assignment', 'assigned', 'in_progress', 'fulfilled', 'cancelled']
    }
  },
  content: {
    type: String,
    default: ""
  },
  status: {
    type: String,
    enum: ['new', 'read', 'contacted', 'closed', 'spam'],
    default: 'new'
  },
  contact_status: {
    type: String,
    enum: ['not_contacted', 'contacted'],
    default: 'not_contacted'
  },
  is_read: {
    type: Boolean,
    default: false
  },
  listing_snapshot: {
    type: mongoose.Schema.Types.Mixed,
    default: {} 
  }
}, { timestamps: true });

// Indexes
enquirySchema.index({ partner_id: 1, status: 1, createdAt: -1 }); // Partner Inbox
enquirySchema.index({ user_id: 1, createdAt: -1 }); // User History

module.exports = {
  Enquiry: mongoose.model('Enquiry', enquirySchema)
};
