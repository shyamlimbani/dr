const db = require('../db/connection');
const puppeteer = require('puppeteer');

const getRevenues = async (req, res) => {
  try {
    const { status, startDate, endDate, search } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    let revenues = await db.Revenue.find(query);

    // Date range filter
    if (startDate || endDate) {
      revenues = revenues.filter(r => {
        const rDate = new Date(r.revenueDate);
        if (startDate && rDate < new Date(startDate)) return false;
        if (endDate && rDate > new Date(endDate)) return false;
        return true;
      });
    }

    // Search filter
    if (search) {
      const regex = new RegExp(search, 'i');
      revenues = revenues.filter(r => 
        regex.test(r.clientName || '') ||
        regex.test(r.mobileNumber || '') ||
        regex.test(r.notes || '')
      );
    }

    // Sort by revenueDate descending
    revenues.sort((a, b) => new Date(b.revenueDate) - new Date(a.revenueDate));

    res.json(revenues);
  } catch (error) {
    console.error('Get revenues error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createRevenue = async (req, res) => {
  try {
    const { clientName, mobileNumber, totalAmount, revenueDate, notes, status } = req.body;

    if (!clientName || !mobileNumber || totalAmount === undefined || !revenueDate) {
      return res.status(400).json({ message: 'Client Name, Mobile Number, Total Amount, and Revenue Date are required' });
    }

    const revenue = await db.Revenue.create({
      clientName,
      mobileNumber,
      totalAmount: Number(totalAmount),
      revenueDate,
      notes: notes || '',
      status: status || 'Pending'
    });

    res.status(201).json(revenue);
  } catch (error) {
    console.error('Create revenue error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateRevenue = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.totalAmount !== undefined) {
      updateData.totalAmount = Number(updateData.totalAmount);
    }

    const updated = await db.Revenue.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) {
      return res.status(404).json({ message: 'Revenue record not found' });
    }

    res.json(updated);
  } catch (error) {
    console.error('Update revenue error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteRevenue = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.Revenue.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Revenue record not found' });
    }

    res.json({ message: 'Revenue record deleted successfully' });
  } catch (error) {
    console.error('Delete revenue error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const generateRevenuePdf = async (req, res) => {
  console.log('[Backend Logs]: generateRevenuePdf controller entered');
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

    const revenues = await db.Revenue.find().sort({ revenueDate: -1 });
    let totalRevenue = 0;
    let paidRevenue = 0;
    let pendingRevenue = 0;
    
    let tableRows = '';
    revenues.forEach((rev, index) => {
      totalRevenue += rev.totalAmount;
      if (rev.status === 'Paid') {
        paidRevenue += rev.totalAmount;
      } else {
        pendingRevenue += rev.totalAmount;
      }
      const bgClass = index % 2 === 0 ? 'bg-white' : 'bg-slate-50';
      const statusBadge = rev.status === 'Paid' 
        ? `<span style="padding: 2px 8px; border-radius: 9999px; background-color: #d1fae5; color: #065f46; font-size: 10px; font-weight: bold;">PAID</span>`
        : `<span style="padding: 2px 8px; border-radius: 9999px; background-color: #fee2e2; color: #991b1b; font-size: 10px; font-weight: bold;">PENDING</span>`;

      tableRows += `
        <tr class="${bgClass} border-b border-slate-100">
          <td class="py-3 px-4 text-slate-700 font-medium">${rev.clientName}</td>
          <td class="py-3 px-4 text-slate-600">${rev.mobileNumber}</td>
          <td class="py-3 px-4 text-slate-600">${rev.revenueDate}</td>
          <td class="py-3 px-4 text-center">${statusBadge}</td>
          <td class="py-3 px-4 text-right font-medium text-slate-800">&#8377;${rev.totalAmount.toLocaleString('en-IN')}</td>
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
            <p class="text-sm font-medium text-slate-500 tracking-widest uppercase">Generated: ${new Date().toISOString().split('T')[0]}</p>
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
          <div class="h-full w-1/3 bg-teal-600"></div>
        </div>

        <!-- SUMMARY CARDS -->
        <div class="grid grid-cols-3 gap-4 mb-8">
          <div class="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span class="text-xs font-bold text-slate-400 uppercase">Total Revenue</span>
            <h3 class="text-lg font-black text-slate-800 mt-1">&#8377;${totalRevenue.toLocaleString('en-IN')}</h3>
          </div>
          <div class="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
            <span class="text-xs font-bold text-emerald-600/80 uppercase">Paid Revenue</span>
            <h3 class="text-lg font-black text-emerald-700 mt-1">&#8377;${paidRevenue.toLocaleString('en-IN')}</h3>
          </div>
          <div class="p-4 bg-rose-50/50 rounded-xl border border-rose-100">
            <span class="text-xs font-bold text-rose-600/80 uppercase">Pending Revenue</span>
            <h3 class="text-lg font-black text-rose-700 mt-1">&#8377;${pendingRevenue.toLocaleString('en-IN')}</h3>
          </div>
        </div>

        <!-- TABLE -->
        <div class="rounded-2xl border border-slate-200 overflow-hidden mb-8 shadow-sm">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <th class="py-4 px-4">Client Name</th>
                <th class="py-4 px-4">Mobile</th>
                <th class="py-4 px-4">Revenue Date</th>
                <th class="py-4 px-4 text-center">Status</th>
                <th class="py-4 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody class="text-sm">
              ${tableRows || '<tr><td colspan="5" class="text-center py-4 text-slate-500">No revenue data found.</td></tr>'}
            </tbody>
          </table>
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

    console.log('[Backend Logs]: PDF generated successfully');
    res.setHeader('Content-disposition', `attachment; filename=Revenue_Report.pdf`);
    res.setHeader('Content-type', 'application/pdf');
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error('[Backend Logs]: PDF error:', error);
    res.status(500).json({ message: 'Error generating PDF' });
  }
};

module.exports = {
  getRevenues,
  createRevenue,
  updateRevenue,
  deleteRevenue,
  generateRevenuePdf
};
