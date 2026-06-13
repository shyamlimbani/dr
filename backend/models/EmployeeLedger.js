const mongoose = require('mongoose');

const employeeLedgerSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  employeeName: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  amountGiven: { type: Number, required: true },
  paymentMethod: { type: String, required: true, enum: ['Cash', 'UPI', 'Bank Transfer'] },
  notes: { type: String, default: '' },
  paymentDate: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('EmployeeLedger', employeeLedgerSchema);

