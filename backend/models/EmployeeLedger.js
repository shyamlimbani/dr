const mongoose = require('mongoose');

const employeeLedgerSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  employeeName: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, required: true, enum: ['Cash', 'Bank Transfer', 'UPI'] },
  notes: { type: String, default: '' },
  date: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('EmployeeLedger', employeeLedgerSchema);

