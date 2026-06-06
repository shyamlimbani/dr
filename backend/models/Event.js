const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  eventDate: { type: String, required: true },
  eventType: { type: String, required: true },
  eventLocation: { type: String, default: '' },
  employeeCharge: { type: Number, default: 0 },
  notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
