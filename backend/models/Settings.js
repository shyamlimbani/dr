const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  studioName: { type: String, default: 'Vivid Production & Events' },
  ownerName: { type: String, default: 'Owner Name' },
  mobileNumber: { type: String, default: '+91 98765 43210' },
  whatsappNumber: { type: String, default: '' },
  email: { type: String, default: 'contact@vividproductions.com' },
  address: { type: String, default: '102, Creative Studios Block, Phase 3, Mumbai, India' },
  gstNumber: { type: String, default: '' },
  websiteUrl: { type: String, default: '' },
  companyLogo: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
