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
  status: {
    type: String,
    enum: ['new', 'viewed', 'contacted', 'closed', 'spam'],
    default: 'new'
  },
  listing_snapshot: {
    type: mongoose.Schema.Types.Mixed,
    default: {} // Denormalized state of listing at submission time
  }
}, { timestamps: true });

// Indexes
enquirySchema.index({ partner_id: 1, status: 1, createdAt: -1 }); // Partner Inbox
enquirySchema.index({ user_id: 1, createdAt: -1 }); // User History

module.exports = {
  Enquiry: mongoose.model('Enquiry', enquirySchema)
};
