const db = require('../db/connection');
const puppeteer = require('puppeteer');

const getExpenses = async (req, res) => {
  try {
    const { category, startDate, endDate, search } = req.query;
    const query = {};

    if (category) {
      query.expenseCategory = category;
    }

    let expenses = await db.Expense.find(query);

    // Date range filter
    if (startDate || endDate) {
      expenses = expenses.filter(exp => {
        const expDate = new Date(exp.date);
        if (startDate && expDate < new Date(startDate)) return false;
        if (endDate && expDate > new Date(endDate)) return false;
        return true;
      });
    }

    // Search query filter
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      expenses = expenses.filter(exp => 
        searchRegex.test(exp.description || '') ||
        searchRegex.test(exp.expenseCategory || '')
      );
    }

    // Sort by date descending
    expenses.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(expenses);
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createExpense = async (req, res) => {
  try {
    const { expenseCategory, amount, date, description } = req.body;

    if (!expenseCategory || !amount || !date) {
      return res.status(400).json({ message: 'Category, amount, and date are required' });
    }

    let receiptUrl = '';
    if (req.file) {
      receiptUrl = `/uploads/${req.file.filename}`;
    }

    const expense = await db.Expense.create({
      expenseCategory,
      amount: Number(amount),
      date,
      description: description || '',
      receiptUrl
    });

    res.status(201).json(expense);
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (req.file) {
      updateData.receiptUrl = `/uploads/${req.file.filename}`;
    }

    if (updateData.amount !== undefined) {
      updateData.amount = Number(updateData.amount);
    }

    const updated = await db.Expense.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) {
      return res.status(404).json({ message: 'Expense record not found' });
    }

    res.json(updated);
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.Expense.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Expense record not found' });
    }

    res.json({ message: 'Expense record deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const generateExpensePdf = async (req, res) => {
  try {
    let settings = await db.Settings.findOne();
    if (!settings) {
      settings = { studioName: 'Vivid Production & Events', address: '', mobileNumber: '', email: '' };
    }
    
    if (settings.companyLogo) {
      if (settings.companyLogo.startsWith('data:image')) {
        settings.logoData = settings.companyLogo;
      } else {
        try {
          const fs = require('fs');
          const path = require('path');
          const logoPath = path.join(__dirname, '..', settings.companyLogo);
          if (fs.existsSync(logoPath)) {
            const logoBuffer = fs.readFileSync(logoPath);
            const ext = path.extname(logoPath).replace('.', '');
            settings.logoData = `data:image/${ext};base64,${logoBuffer.toString('base64')}`;
          }
        } catch (err) {
          console.error('Error loading logo for PDF:', err);
        }
      }
    }

    const expenses = await db.Expense.find().sort({ date: -1 });
    let totalExpense = 0;
    
    let tableRows = '';
    expenses.forEach((exp, index) => {
      totalExpense += exp.amount;
      const bgClass = index % 2 === 0 ? 'bg-white' : 'bg-slate-50';
      tableRows += `
        <tr class="${bgClass} border-b border-slate-100">
          <td class="py-3 px-4 text-slate-700">${new Date(exp.date).toISOString().split('T')[0]}</td>
          <td class="py-3 px-4 text-slate-700">${exp.expenseCategory}</td>
          <td class="py-3 px-4 text-slate-600">${exp.description || '-'}</td>
          <td class="py-3 px-4 text-right font-medium text-slate-800">&#8377;${exp.amount.toLocaleString('en-IN')}</td>
        </tr>
      `;
    });

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Expense Report</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@500;600;700;800&display=swap" rel="stylesheet">
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        body { font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white; margin: 0; padding: 0; }
        .poppins { font-family: 'Poppins', sans-serif; }
        .a4-container { width: 210mm; min-height: 297mm; padding: 40px 50px; margin: 0 auto; box-sizing: border-box; position: relative; }
      </style>
    </head>
    <body>
      <div class="a4-container">
        <!-- HEADER -->
        <div class="flex justify-between items-start mb-8">
          <div>
            ${settings.logoData ? `<img src="${settings.logoData}" alt="Company Logo" class="max-h-16 max-w-[200px] object-contain mb-4"/>` : `<h1 class="poppins text-4xl font-extrabold tracking-tight text-rose-700 mb-1">${settings.studioName}</h1>`}
            <h2 class="poppins text-2xl font-bold text-slate-900 tracking-tight mb-1">EXPENSE REPORT</h2>
            <p class="text-sm font-medium text-slate-500 tracking-widest uppercase">Generated: ${new Date().toISOString().split('T')[0]}</p>
          </div>
          <div class="text-right">
            ${settings.logoData ? `<h2 class="poppins text-xl font-bold text-rose-700 mb-1">${settings.studioName}</h2>` : ''}
            <p class="text-sm text-slate-600">${settings.address}</p>
            <p class="text-sm text-slate-600 mt-1">
              <span class="font-medium">P:</span> ${settings.mobileNumber} <br/>
              <span class="font-medium">E:</span> ${settings.email}
            </p>
          </div>
        </div>

        <div class="w-full h-1 rounded-full bg-slate-100 mb-8 overflow-hidden">
          <div class="h-full w-1/3 bg-rose-700"></div>
        </div>

        <!-- TABLE -->
        <div class="rounded-2xl border border-slate-200 overflow-hidden mb-8 shadow-sm">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <th class="py-4 px-4">Date</th>
                <th class="py-4 px-4">Category</th>
                <th class="py-4 px-4">Notes</th>
                <th class="py-4 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody class="text-sm">
              ${tableRows || '<tr><td colspan="4" class="text-center py-4 text-slate-500">No expense data found.</td></tr>'}
            </tbody>
          </table>
        </div>

        <!-- TOTALS SECTION -->
        <div class="flex justify-end mb-12">
          <div class="w-72">
            <div class="flex justify-between items-center py-2 mb-2">
              <span class="poppins font-bold text-slate-800">Total Expenses</span>
              <span class="poppins text-xl font-bold text-rose-700">&#8377;${totalExpense.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

      </div>
    </body>
    </html>
    `;

    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    res.setHeader('Content-disposition', `attachment; filename=Expense_Report.pdf`);
    res.setHeader('Content-type', 'application/pdf');
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error('PDF error:', error);
    res.status(500).json({ message: 'Error generating PDF' });
  }
};

module.exports = {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  generateExpensePdf
};
