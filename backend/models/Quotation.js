const mongoose = require('mongoose');

const quotationSectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  items: [{ type: String }]
});

const quotationSchema = new mongoose.Schema({
  quotationNumber: { type: String, required: true, unique: true },
  quotationDate: { type: String, required: true },
  clientName: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  eventName: { type: String, required: true },
  eventDate: { type: String, required: true },
  sections: [quotationSectionSchema],
  grandTotal: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Quotation', quotationSchema);
