const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  serviceName: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  price: { type: Number, required: true },
  total: { type: Number, required: true }
});

const billSchema = new mongoose.Schema({
  billNumber: { type: String, required: true, unique: true },
  billDate: { type: String, required: true },
  clientName: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  billGenerateDate: { type: String, required: true },
  eventName: { type: String, required: true },
  eventDate: { type: String, required: true },
  eventLocation: { type: String, default: '' },
  services: [serviceSchema],
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  advanceReceived: { type: Number, default: 0 },
  remainingAmount: { type: Number, required: true },
  notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Bill', billSchema);
