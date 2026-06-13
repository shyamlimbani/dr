const mongoose = require('mongoose');

const studioBookingSchema = new mongoose.Schema({
  clientName: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  service: { type: String, required: true },
  amount: { type: Number, required: true },
  bookingDate: { type: String, required: true },
  notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('StudioBooking', studioBookingSchema);
