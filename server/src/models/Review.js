const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  partner_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner',
    required: true
  },
  order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  item_ratings: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },
      quality: { type: Number, min: 1, max: 5 },
      quantity: { type: Number, min: 1, max: 5 }
    }
  ],
  behavior_rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  comment: {
    type: String,
    trim: true
  }
}, { timestamps: true });

// Ensure one review per order per partner (seller)
reviewSchema.index({ user_id: 1, order_id: 1, partner_id: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
