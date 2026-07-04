const mongoose = require('mongoose');

const studioExpenseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: String, required: true },
  paymentMethod: { type: String, required: true },
  description: { type: String, default: '' },
  receiptUrl: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('StudioExpense', studioExpenseSchema);
