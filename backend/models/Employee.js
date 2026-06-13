const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  email: { type: String, default: '' },
  address: { type: String, default: '' },
  role: { type: String, default: 'Staff' },
  perDayCharge: { type: Number, default: 0 },
  joiningDate: { type: String },
  notes: { type: String, default: '' },
  profilePhoto: { type: String, default: '' },
  status: { type: String, default: 'Active' },
  employeeId: { type: String, unique: true, sparse: true },
  password: { type: String },
  loginAccess: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Employee', employeeSchema);
