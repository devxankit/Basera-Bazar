const mongoose = require('mongoose');

const withdrawalRequestSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'user_type' },
  user_type: {
    type: String,
    enum: ['Partner', 'Executive'],
    required: true,
    default: 'Partner'
  },
  amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  bank_details: {
    account_number: {
      type: String, required: true,
      validate: { validator: v => /^\d{9,18}$/.test(v), message: 'Account number must be 9–18 digits.' }
    },
    ifsc_code: {
      type: String, required: true,
      validate: { validator: v => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(v), message: 'Invalid IFSC code format.' }
    },
    bank_name: { type: String },
    account_holder_name: { type: String }
  },
  admin_note: { type: String },
  transaction_id: { type: String }, // Bank reference after settlement
  processed_at: { type: Date }
}, { timestamps: true });

withdrawalRequestSchema.index({ user_id: 1, createdAt: -1 });
withdrawalRequestSchema.index({ status: 1, createdAt: -1 });
withdrawalRequestSchema.index({ user_type: 1, status: 1 });

module.exports = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);
