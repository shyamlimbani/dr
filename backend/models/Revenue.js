const mongoose = require('mongoose');

const revenueSchema = new mongoose.Schema({
  clientName: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  pendingAmount: { type: Number, required: true },
  revenueDate: { type: String, required: true },
  notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Revenue', revenueSchema);
