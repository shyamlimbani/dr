const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  expenseCategory: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: String, required: true },
  description: { type: String, default: '' },
  receiptUrl: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
