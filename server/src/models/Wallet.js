const mongoose = require('mongoose');

const withdrawalRequestSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
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
    account_number: { type: String, required: true },
    ifsc_code: { type: String, required: true },
    bank_name: { type: String },
    account_holder_name: { type: String }
  },
  admin_note: { type: String },
  transaction_id: { type: String }, // Bank reference after settlement
  processed_at: { type: Date }
}, { timestamps: true });

// For backward compatibility if needed, but better to migrate
// For now, I'll add a virtual or just keep it simple.

module.exports = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);
