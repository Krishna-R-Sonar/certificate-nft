// backend/models/Certificate.js
const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  owner: { type: String, required: true, lowercase: true },
  metadataUri: { type: String, required: true },
  cid: { type: String, required: true },
  content: {
    studentName: { type: String, required: true },
    degree: { type: String, required: true },
    institution: { type: String, required: true },
    issueDate: { type: Date, required: true },
    imageUrl: { type: String, default: null }, // New field for image URL
  },
  referrals: [String],
  versions: [{ versionId: String, cid: String }],
});

module.exports = mongoose.model('Certificate', certificateSchema);