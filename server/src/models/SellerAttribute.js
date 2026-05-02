const mongoose = require('mongoose');

const sellerAttributeSchema = new mongoose.Schema({
  partner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  attribute_type: {
    type: String,
    enum: ['type', 'sub_type', 'brand'],
    required: true
  },
  name: { type: String, required: true, trim: true },
  parent_attribute_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SellerAttribute',
    default: null
  },
  is_active: { type: Boolean, default: true }
}, { timestamps: true });

// Compound index: ensures uniqueness per seller + category + type + parent + name
sellerAttributeSchema.index(
  { partner_id: 1, category_id: 1, attribute_type: 1, parent_attribute_id: 1, name: 1 },
  { unique: true }
);

// Query index for fast lookups
sellerAttributeSchema.index({ category_id: 1, attribute_type: 1, is_active: 1 });
sellerAttributeSchema.index({ partner_id: 1, category_id: 1, is_active: 1 });

const SellerAttribute = mongoose.model('SellerAttribute', sellerAttributeSchema);

// One-time: drop the old index that didn't include parent_attribute_id
SellerAttribute.collection.dropIndex('partner_id_1_category_id_1_attribute_type_1_name_1')
  .then(() => console.log('SellerAttribute: old index dropped, new index will be created'))
  .catch(() => {}); // already dropped or doesn't exist — ignore

module.exports = SellerAttribute;
