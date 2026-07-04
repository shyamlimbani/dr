const db = require('../db/connection');
const fs = require('fs');
const path = require('path');

const getExpenses = async (req, res) => {
  try {
    const expenses = await db.StudioExpense.find().sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createExpense = async (req, res) => {
  try {
    const receiptUrl = req.file ? `/uploads/${req.file.filename}` : '';
    const expenseData = { ...req.body, receiptUrl };
    const newExpense = await db.StudioExpense.create(expenseData);
    res.status(201).json(newExpense);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const updateExpense = async (req, res) => {
  try {
    const existingExpense = await db.StudioExpense.findById(req.params.id);
    if (!existingExpense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    let receiptUrl = existingExpense.receiptUrl;
    if (req.file) {
      receiptUrl = `/uploads/${req.file.filename}`;
      // Optional: Delete old receipt file here if needed
      if (existingExpense.receiptUrl) {
        const oldPath = path.join(__dirname, '..', existingExpense.receiptUrl);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
    }

    const expenseData = { ...req.body, receiptUrl };
    const updatedExpense = await db.StudioExpense.findByIdAndUpdate(req.params.id, expenseData, { new: true });
    res.json(updatedExpense);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const deleteExpense = async (req, res) => {
  try {
    const expense = await db.StudioExpense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    if (expense.receiptUrl) {
      const filePath = path.join(__dirname, '..', expense.receiptUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await db.StudioExpense.findByIdAndDelete(req.params.id);
    res.json({ message: 'Expense deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense
};
