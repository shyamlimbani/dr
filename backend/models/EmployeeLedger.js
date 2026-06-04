const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  date: { type: String, required: true },
  notes: { type: String, default: '' },
  transactionId: { type: String }
});

const employeeLedgerSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  employeeName: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  pendingAmount: { type: Number, required: true },
  payments: [paymentSchema]
}, { timestamps: true });

module.exports = mongoose.model('EmployeeLedger', employeeLedgerSchema);
