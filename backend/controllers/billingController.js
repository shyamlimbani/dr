const puppeteer = require('puppeteer');
const generateHtmlTemplate = require('../utils/pdfTemplate');
const db = require('../db/connection');
const { formatDate } = require('../utils/dateFormatter');

// =====================================
// BILLS CRUD
// =====================================
const getBills = async (req, res) => {
  try {
    const bills = await db.Bill.find().sort({ createdAt: -1 });
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const createBill = async (req, res) => {
  try {
    const count = await db.Bill.countDocuments();
    const billNumber = `INV-${String(count + 1).padStart(4, '0')}`;
    const bill = await db.Bill.create({ ...req.body, billNumber });
    res.status(201).json(bill);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateBill = async (req, res) => {
  try {
    const bill = await db.Bill.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!bill) return res.status(404).json({ message: 'Not found' });
    res.json(bill);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteBill = async (req, res) => {
  try {
    await db.Bill.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// =====================================
// QUOTATIONS CRUD
// =====================================
const getQuotations = async (req, res) => {
  try {
    const quotations = await db.Quotation.find().sort({ createdAt: -1 });
    res.json(quotations);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const createQuotation = async (req, res) => {
  try {
    const count = await db.Quotation.countDocuments();
    const quotationNumber = `QTN-${String(count + 1).padStart(4, '0')}`;
    const quotation = await db.Quotation.create({ ...req.body, quotationNumber });
    res.status(201).json(quotation);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateQuotation = async (req, res) => {
  try {
    const quotation = await db.Quotation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!quotation) return res.status(404).json({ message: 'Not found' });
    res.json(quotation);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteQuotation = async (req, res) => {
  try {
    await db.Quotation.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// =====================================
// PDF GENERATION (Shared)
// =====================================
const generatePdf = async (req, res, type) => {
  try {
    const { id } = req.params;
    let data, docNumber, docDateTitle, docNumberTitle;
    
    if (type === 'Bill') {
      data = await db.Bill.findById(id);
      if (!data) return res.status(404).json({ message: 'Bill not found' });
      docNumber = data.billNumber;
      docDateTitle = 'Bill Date';
      docNumberTitle = 'Bill No';
    } else {
      data = await db.Quotation.findById(id);
      if (!data) return res.status(404).json({ message: 'Quotation not found' });
      docNumber = data.quotationNumber;
      docDateTitle = 'Quotation Date';
      docNumberTitle = 'Quotation No';
    }

    let settings = await db.Settings.findOne();
    if (!settings) {
      settings = {
        studioName: 'Vivid Production & Events',
        ownerName: 'Owner Name',
        mobileNumber: '+91 98765 43210',
        email: 'contact@vividproductions.com',
        address: '102, Creative Studios Block, Phase 3, Mumbai, India',
        companyLogo: ''
      };
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

    const html = generateHtmlTemplate(type, data, settings);

    const browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
    });

    await browser.close();

    res.setHeader('Content-disposition', `attachment; filename=${type}_${docNumber}.pdf`);
    res.setHeader('Content-type', 'application/pdf');
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error('PDF error:', error);
    res.status(500).json({ message: 'Error generating PDF' });
  }
};

const generateBillPdf = (req, res) => generatePdf(req, res, 'Bill');
const generateQuotationPdf = (req, res) => generatePdf(req, res, 'Quotation');

const generateRevenuePdf = async (req, res) => {
  try {
    let settings = await db.Settings.findOne();
    if (!settings) {
      settings = {
        studioName: 'Vivid Production & Events',
        ownerName: 'Owner Name',
        mobileNumber: '+91 98765 43210',
        email: 'contact@vividproductions.com',
        address: '102, Creative Studios Block, Phase 3, Mumbai, India',
        companyLogo: ''
      };
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

    const bills = await db.Bill.find().sort({ createdAt: -1 });
    let totalRevenue = 0;
    
    let tableRows = '';
    bills.forEach((bill, index) => {
      const amount = bill.advanceReceived + (bill.grandTotal - bill.remainingAmount);
      totalRevenue += amount;
      const bgClass = index % 2 === 0 ? 'bg-white' : 'bg-slate-50';
      tableRows += `
        <tr class="${bgClass} border-b border-slate-100">
          <td class="py-3 px-4 text-slate-700">${bill.clientName}</td>
          <td class="py-3 px-4 text-slate-700">${bill.eventName}</td>
          <td class="py-3 px-4 text-slate-600">${formatDate(bill.billDate)}</td>
          <td class="py-3 px-4 text-right font-medium text-slate-800">&#8377;${amount.toLocaleString('en-IN')}</td>
        </tr>
      `;
    });

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Revenue Report</title>
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
            ${settings.logoData ? `<img src="${settings.logoData}" alt="Company Logo" class="max-h-16 max-w-[200px] object-contain mb-4"/>` : `<h1 class="poppins text-4xl font-extrabold tracking-tight text-teal-700 mb-1">${settings.studioName}</h1>`}
            <h2 class="poppins text-2xl font-bold text-slate-900 tracking-tight mb-1">REVENUE REPORT</h2>
            <p class="text-sm font-medium text-slate-500 tracking-widest uppercase">Generated: ${formatDate(new Date())}</p>
          </div>
          <div class="text-right">
            ${settings.logoData ? `<h2 class="poppins text-xl font-bold text-teal-700 mb-1">${settings.studioName}</h2>` : ''}
            <p class="text-sm text-slate-600">${settings.address}</p>
            <p class="text-sm text-slate-600 mt-1">
              <span class="font-medium">P:</span> ${settings.mobileNumber} <br/>
              <span class="font-medium">E:</span> ${settings.email}
            </p>
          </div>
        </div>

        <div class="w-full h-1 rounded-full bg-slate-100 mb-8 overflow-hidden">
          <div class="h-full w-1/3 bg-teal-700"></div>
        </div>

        <!-- TABLE -->
        <div class="rounded-2xl border border-slate-200 overflow-hidden mb-8 shadow-sm">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <th class="py-4 px-4">Client Name</th>
                <th class="py-4 px-4">Event Name</th>
                <th class="py-4 px-4">Date</th>
                <th class="py-4 px-4 text-right">Collected Amount</th>
              </tr>
            </thead>
            <tbody class="text-sm">
              ${tableRows || '<tr><td colspan="4" class="text-center py-4 text-slate-500">No revenue data found.</td></tr>'}
            </tbody>
          </table>
        </div>

        <!-- TOTALS SECTION -->
        <div class="flex justify-end mb-12">
          <div class="w-72">
            <div class="flex justify-between items-center py-2 mb-2">
              <span class="poppins font-bold text-slate-800">Total Revenue</span>
              <span class="poppins text-xl font-bold text-teal-700">&#8377;${totalRevenue.toLocaleString('en-IN')}</span>
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

    res.setHeader('Content-disposition', `attachment; filename=Revenue_Report.pdf`);
    res.setHeader('Content-type', 'application/pdf');
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error('PDF error:', error);
    res.status(500).json({ message: 'Error generating PDF' });
  }
};

module.exports = {
  getBills, createBill, updateBill, deleteBill, generateBillPdf, generateRevenuePdf,
  getQuotations, createQuotation, updateQuotation, deleteQuotation, generateQuotationPdf
};
