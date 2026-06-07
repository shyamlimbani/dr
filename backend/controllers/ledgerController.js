const db = require('../db/connection');
const puppeteer = require('puppeteer');

const getLedgers = async (req, res) => {
  try {
    const ledgers = await db.EmployeeLedger.find();
    // Sort by date or created descending
    ledgers.sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0));
    res.json(ledgers);
  } catch (error) {
    console.error('Get ledgers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createLedger = async (req, res) => {
  try {
    const { employeeId, employeeName, mobileNumber, amount, paymentMethod, notes, date } = req.body;
    
    if (!employeeName || !mobileNumber || amount === undefined || !paymentMethod) {
      return res.status(400).json({ message: 'Employee Name, Mobile Number, Amount, and Payment Method are required' });
    }

    const paymentDate = date || new Date().toISOString().split('T')[0];

    const ledger = await db.EmployeeLedger.create({
      employeeId: employeeId || 'custom',
      employeeName,
      mobileNumber,
      amount: Number(amount) || 0,
      paymentMethod,
      notes: notes || '',
      date: paymentDate
    });

    res.status(201).json(ledger);
  } catch (error) {
    console.error('Create ledger error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateLedger = async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeName, mobileNumber, amount, paymentMethod, notes, date } = req.body;

    const ledger = await db.EmployeeLedger.findById(id);
    if (!ledger) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    const updateData = {
      employeeName: employeeName || ledger.employeeName,
      mobileNumber: mobileNumber || ledger.mobileNumber,
      amount: amount !== undefined ? Number(amount) : ledger.amount,
      paymentMethod: paymentMethod || ledger.paymentMethod,
      notes: notes !== undefined ? notes : ledger.notes,
      date: date || ledger.date || new Date().toISOString().split('T')[0]
    };

    const updatedLedger = await db.EmployeeLedger.findByIdAndUpdate(id, updateData, { new: true });
    res.json(updatedLedger);
  } catch (error) {
    console.error('Update ledger error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteLedger = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.EmployeeLedger.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Payment record not found' });
    }
    res.json({ message: 'Payment record deleted successfully' });
  } catch (error) {
    console.error('Delete ledger error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const generateLedgerPdf = async (req, res) => {
  try {
    let settings = await db.Settings.findOne();
    if (!settings) {
      settings = { studioName: 'Vivid Production & Events', address: '', mobileNumber: '', email: '' };
    }
    
    if (settings.companyLogo) {
      try {
        const fs = require('fs');
        const path = require('path');
        const logoPath = path.join(__dirname, '..', settings.companyLogo);
        if (fs.existsSync(logoPath)) {
          const logoBuffer = fs.readFileSync(logoPath);
          const ext = path.extname(logoPath).replace('.', '');
          settings.logoData = `data:image/${ext};base64,${logoBuffer.toString('base64')}`;
        }
      } catch (err) {}
    }

    const ledgers = await db.EmployeeLedger.find();
    ledgers.sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0));

    let totalPaymentsGiven = 0;
    
    let tableRows = '';
    ledgers.forEach((l, index) => {
      totalPaymentsGiven += l.amount || 0;
      const bgClass = index % 2 === 0 ? 'bg-white' : 'bg-slate-50';

      // Format date to DD-MM-YYYY if it is YYYY-MM-DD
      let displayDate = l.date || '';
      if (displayDate.includes('-')) {
        const parts = displayDate.split('-');
        if (parts.length === 3 && parts[0].length === 4) {
          displayDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }

      tableRows += `
        <tr class="${bgClass} border-b border-slate-100">
          <td class="py-3 px-4 text-slate-700">${l.employeeName}</td>
          <td class="py-3 px-4 text-slate-650">${l.mobileNumber}</td>
          <td class="py-3 px-4 text-right text-slate-700 font-medium">&#8377;${(l.amount || 0).toLocaleString('en-IN')}</td>
          <td class="py-3 px-4 text-center text-slate-600">${l.paymentMethod || ''}</td>
          <td class="py-3 px-4 text-center text-slate-600">${displayDate}</td>
        </tr>
      `;
    });

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Employee Payment Report</title>
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
            ${settings.logoData ? `<img src="${settings.logoData}" alt="Company Logo" class="max-h-16 max-w-[200px] object-contain mb-4"/>` : `<h1 class="poppins text-4xl font-extrabold tracking-tight text-indigo-700 mb-1">${settings.studioName}</h1>`}
            <h2 class="poppins text-2xl font-bold text-slate-900 tracking-tight mb-1">EMPLOYEE PAYMENT REPORT</h2>
            <p class="text-sm font-medium text-slate-500 tracking-widest uppercase">Generated: ${new Date().toISOString().split('T')[0]}</p>
          </div>
          <div class="text-right">
            ${settings.logoData ? `<h2 class="poppins text-xl font-bold text-indigo-700 mb-1">${settings.studioName}</h2>` : ''}
            <p class="text-sm text-slate-600">${settings.address || ''}</p>
            <p class="text-sm text-slate-600 mt-1">
              <span class="font-medium">P:</span> ${settings.mobileNumber || ''} <br/>
              <span class="font-medium">E:</span> ${settings.email || ''}
            </p>
          </div>
        </div>

        <div class="w-full h-1 rounded-full bg-slate-100 mb-8 overflow-hidden">
          <div class="h-full w-1/3 bg-indigo-700"></div>
        </div>

        <!-- TABLE -->
        <div class="rounded-2xl border border-slate-200 overflow-hidden mb-8 shadow-sm">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <th class="py-4 px-4">Employee Name</th>
                <th class="py-4 px-4">Mobile</th>
                <th class="py-4 px-4 text-right">Payment Amount</th>
                <th class="py-4 px-4 text-center">Payment Method</th>
                <th class="py-4 px-4 text-center">Payment Date</th>
              </tr>
            </thead>
            <tbody class="text-sm">
              ${tableRows || '<tr><td colspan="5" class="text-center py-4 text-slate-500">No payment records found.</td></tr>'}
            </tbody>
          </table>
        </div>

        <!-- TOTALS SECTION -->
        <div class="flex justify-end mb-12">
          <div class="w-72">
            <div class="flex justify-between items-center py-2 text-sm text-slate-600">
              <span class="font-medium">Total Payments Given</span>
              <span class="font-bold text-indigo-650">&#8377;${totalPaymentsGiven.toLocaleString('en-IN')}</span>
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

    res.setHeader('Content-disposition', `attachment; filename=Payment_Report.pdf`);
    res.setHeader('Content-type', 'application/pdf');
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error('PDF error:', error);
    res.status(500).json({ message: 'Error generating PDF' });
  }
};

module.exports = {
  getLedgers,
  createLedger,
  updateLedger,
  deleteLedger,
  generateLedgerPdf
};
