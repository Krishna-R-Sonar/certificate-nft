// backend/models/Referral.js
const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  referrerAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  referralCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Referral', referralSchema);