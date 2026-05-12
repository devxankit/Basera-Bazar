const mongoose = require('mongoose');

const dailyTaskSchema = new mongoose.Schema({
  date: {
    type: String,         // 'YYYY-MM-DD' e.g. '2026-05-12'
    required: true,
    unique: true,
    index: true
  },
  target_count: {
    type: Number,
    required: true,
    min: 1
  },
  task_type: {
    type: String,
    enum: ['onboard_partners'],
    default: 'onboard_partners'
  },
  description: {
    type: String,
    default: ''
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('DailyTask', dailyTaskSchema);
