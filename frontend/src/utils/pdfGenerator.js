import { getAssetUrl } from '../services/api';

// Memory cache for compressed base64 logo
let cachedCompressedLogo = null;
let cachedLogoSrc = null;

/**
 * Downloads and compresses the studio logo to reduce PDF payload size.
 */
export const getCompressedLogo = (logoPath) => {
  if (!logoPath) return Promise.resolve(null);
  
  const logoUrl = getAssetUrl(logoPath);
  if (cachedCompressedLogo && cachedLogoSrc === logoUrl) {
    return Promise.resolve(cachedCompressedLogo);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxW = 240;
      const maxH = 80;
      let width = img.width;
      let height = img.height;

      // Scale keeping aspect ratio
      if (width > maxW) {
        height *= maxW / width;
        width = maxW;
      }
      if (height > maxH) {
        width *= maxH / height;
        height = maxH;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      try {
        // Compress as JPEG at 80% quality
        const compressed = canvas.toDataURL('image/jpeg', 0.8);
        cachedCompressedLogo = compressed;
        cachedLogoSrc = logoUrl;
        resolve(compressed);
      } catch (err) {
        console.error('Error compressing logo canvas:', err);
        resolve(logoUrl); // Fallback to raw URL if canvas tainted
      }
    };
    img.onerror = () => {
      resolve(null);
    };
    img.src = logoUrl;
  });
};

// ==========================================
// PDF TEMPLATES
// ==========================================

const getBillHtml = (data, settings, logoData) => {
  const docNumber = data.billNumber || 'INV-0000';
  const docDate = data.billDate || new Date().toISOString().split('T')[0];
  const dueDate = data.eventDate || docDate;

  let statusBadge = '';
  if (data.remainingAmount <= 0) {
    statusBadge = '<span style="padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; background-color: #d1fae5; color: #065f46; border: 1px solid #a7f3d0;">PAID</span>';
  } else if (data.advanceReceived > 0) {
    statusBadge = '<span style="padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a;">PARTIAL</span>';
  } else {
    statusBadge = '<span style="padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; background-color: #fee2e2; color: #991b1b; border: 1px solid #fca5a5;">PENDING</span>';
  }

  let servicesHtml = '';
  (data.services || []).forEach((srv, index) => {
    const bgClass = index % 2 === 0 ? 'bg-white' : 'bg-slate-50';
    servicesHtml += `
      <tr class="${bgClass} border-b border-slate-100">
        <td class="py-3 px-4 text-slate-700 font-medium">${srv.serviceName}</td>
        <td class="py-3 px-4 text-center text-slate-600">${srv.quantity}</td>
        <td class="py-3 px-4 text-right text-slate-600">₹${(srv.price || 0).toLocaleString('en-IN')}</td>
        <td class="py-3 px-4 text-right font-semibold text-slate-800">₹${(srv.total || 0).toLocaleString('en-IN')}</td>
      </tr>
    `;
  });

  return `
    <div class="p-12 bg-white text-slate-900 font-sans" style="width: 210mm; min-height: 297mm; box-sizing: border-box; position: relative;">
      <!-- HEADER -->
      <div class="flex justify-between items-start mb-8">
        <div>
          ${logoData ? `<img src="${logoData}" alt="Company Logo" style="max-height: 56px; max-width: 200px; object-fit: contain; margin-bottom: 16px;"/>` : `<h1 class="text-3xl font-extrabold text-teal-700 tracking-tight mb-1">${settings.studioName}</h1>`}
          <h2 class="text-xl font-bold text-slate-900 tracking-tight mb-1">INVOICE</h2>
          <p class="text-xs font-semibold text-slate-500 tracking-wider uppercase">${docNumber}</p>
          <div class="mt-4">
            ${statusBadge}
          </div>
        </div>
        <div class="text-right">
          ${logoData ? `<h2 class="text-lg font-bold text-teal-700 mb-1">${settings.studioName}</h2>` : ''}
          <p class="text-xs text-slate-600 max-w-[240px] ml-auto leading-relaxed">${settings.address || ''}</p>
          <p class="text-xs text-slate-600 mt-2">
            <span class="font-semibold text-slate-400">P:</span> ${settings.mobileNumber || ''} <br/>
            ${settings.whatsappNumber ? `<span class="font-semibold text-slate-400">W:</span> ${settings.whatsappNumber} <br/>` : ''}
            <span class="font-semibold text-slate-400">E:</span> ${settings.email || ''} <br/>
            ${settings.gstNumber ? `<span class="font-semibold text-slate-400">GST:</span> ${settings.gstNumber}` : ''}
          </p>
        </div>
      </div>

      <div class="w-full h-1 rounded-full bg-slate-100 mb-8 overflow-hidden">
        <div class="h-full w-1/3" style="background-color: #0d9488;"></div>
      </div>

      <!-- INFO CARDS -->
      <div class="grid grid-cols-2 gap-6 mb-8">
        <!-- BILL TO -->
        <div class="p-5 rounded-2xl border border-slate-200 bg-white">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Bill To</p>
          <h3 class="text-base font-bold text-slate-800">${data.clientName}</h3>
          <p class="text-xs text-slate-600 mt-1">
            <span class="font-semibold text-slate-400">M:</span> ${data.mobileNumber}
          </p>
          ${data.email ? `<p class="text-xs text-slate-600 mt-0.5"><span class="font-semibold text-slate-400">E:</span> ${data.email}</p>` : ''}
        </div>

        <!-- EVENT & DATES -->
        <div class="p-5 rounded-2xl border border-slate-200 bg-teal-50/20">
          <p class="text-[10px] font-bold text-teal-750 uppercase tracking-wider mb-2" style="color: #0d9488;">Event Details</p>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span class="text-[10px] font-bold text-slate-400 uppercase block">Event Name</span>
              <span class="font-semibold text-slate-800">${data.eventName}</span>
            </div>
            <div>
              <span class="text-[10px] font-bold text-slate-400 uppercase block">Event Date</span>
              <span class="font-semibold text-slate-800">${data.eventDate}</span>
            </div>
            <div class="col-span-2">
              <span class="text-[10px] font-bold text-slate-400 uppercase block">Location</span>
              <span class="font-semibold text-slate-800">${data.eventLocation || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- DATES SUMMARY -->
      <div class="flex gap-12 mb-8 px-2 text-xs">
        <div>
          <p class="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Issue Date</p>
          <p class="font-semibold text-slate-800">${docDate}</p>
        </div>
        <div>
          <p class="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Due Date</p>
          <p class="font-semibold text-slate-800">${dueDate}</p>
        </div>
      </div>

      <!-- SERVICES TABLE -->
      <div class="rounded-2xl border border-slate-200 overflow-hidden mb-8">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
              <th class="py-3 px-4">Service Description</th>
              <th class="py-3 px-4 text-center">Qty</th>
              <th class="py-3 px-4 text-right">Rate</th>
              <th class="py-3 px-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${servicesHtml}
          </tbody>
        </table>
      </div>

      <!-- TOTALS SECTION -->
      <div class="flex justify-end mb-12">
        <div class="w-72 text-xs space-y-2">
          <div class="flex justify-between py-1 text-slate-600">
            <span>Subtotal</span>
            <span class="font-semibold text-slate-850">₹${(data.subtotal || 0).toLocaleString('en-IN')}</span>
          </div>
          ${data.discount > 0 ? `
          <div class="flex justify-between py-1 text-rose-500">
            <span>Discount</span>
            <span class="font-semibold">- ₹${(data.discount || 0).toLocaleString('en-IN')}</span>
          </div>` : ''}
          
          <div class="my-2 border-t border-slate-200"></div>
          
          <div class="flex justify-between items-center py-1 mb-1">
            <span class="font-bold text-slate-800">Grand Total</span>
            <span class="text-base font-bold text-teal-700" style="color: #0d9488;">₹${(data.grandTotal || 0).toLocaleString('en-IN')}</span>
          </div>

          <div class="flex justify-between py-1.5 text-slate-600 bg-slate-50 px-3 rounded-lg">
            <span>Advance Paid</span>
            <span class="font-semibold text-slate-800">₹${(data.advanceReceived || 0).toLocaleString('en-IN')}</span>
          </div>
          <div class="flex justify-between py-2 font-bold text-slate-800 bg-slate-100 px-3 rounded-lg">
            <span>Remaining Balance</span>
            <span class="${data.remainingAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}">₹${(data.remainingAmount || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      <!-- FOOTER -->
      <div class="mt-8 border-t border-slate-200 pt-8 flex justify-between items-end text-xs">
        <div>
          <p class="font-semibold text-slate-800 mb-1">Thank you for choosing our services!</p>
          <p class="text-[10px] text-slate-500">Payment is due within 15 days of issue.</p>
        </div>
        <div class="text-center w-48">
          <div class="border-b border-slate-300 pb-8 mb-2"></div>
          <p class="text-[10px] font-bold text-slate-500 uppercase">Authorized Signature</p>
          <p class="text-xs font-bold text-slate-800 mt-1">${settings.studioName}</p>
        </div>
      </div>
    </div>
  `;
};

const getQuotationHtml = (data, settings, logoData) => {
  const docNumber = data.quotationNumber || 'QTN-0000';
  const docDate = data.quotationDate || new Date().toISOString().split('T')[0];

  let sectionsHtml = '';
  (data.sections || []).forEach((sec) => {
    let itemsHtml = '';
    (sec.items || []).forEach((item) => {
      if (item.trim()) {
        itemsHtml += `
          <li class="flex items-start gap-2 text-slate-700 text-xs leading-relaxed">
            <span class="text-sky-500 font-bold shrink-0 text-sm leading-none">•</span>
            <span>${item}</span>
          </li>
        `;
      }
    });

    if (itemsHtml) {
      sectionsHtml += `
        <div class="mb-5 rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm" style="page-break-inside: avoid;">
          <div class="bg-slate-50 border-b border-slate-200 px-5 py-2.5">
            <h3 class="text-[10px] font-bold uppercase tracking-wider text-slate-800">${sec.title}</h3>
          </div>
          <div class="p-4">
            <ul class="space-y-1.5">
              ${itemsHtml}
            </ul>
          </div>
        </div>
      `;
    }
  });

  return `
    <div class="p-12 bg-white text-slate-900 font-sans" style="width: 210mm; min-height: 297mm; box-sizing: border-box; position: relative;">
      <!-- HEADER -->
      <div class="flex justify-between items-start mb-8">
        <div>
          ${logoData ? `<img src="${logoData}" alt="Company Logo" style="max-height: 56px; max-width: 200px; object-fit: contain; margin-bottom: 16px;"/>` : `<h1 class="text-3xl font-extrabold text-sky-700 tracking-tight mb-1">${settings.studioName}</h1>`}
          <h2 class="text-xl font-black text-slate-900 tracking-tight mb-1">QUOTATION</h2>
          <div class="mt-2 text-xs text-slate-500">
            <span class="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-0.5">Quotation Details</span>
            <span class="font-bold text-slate-700">No:</span> ${docNumber} <br/>
            <span class="font-bold text-slate-700">Date:</span> ${new Date(docDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        </div>
        <div class="text-right">
          ${logoData ? `<h2 class="text-lg font-bold text-sky-700 mb-1">${settings.studioName}</h2>` : ''}
          <p class="text-xs font-semibold text-slate-800">${settings.ownerName || ''}</p>
          <p class="text-xs text-slate-600 mt-1 max-w-[240px] ml-auto leading-relaxed">${settings.address || ''}</p>
          <p class="text-xs text-slate-600 mt-2">
            <span class="font-semibold text-slate-400">P:</span> ${settings.mobileNumber || ''} <br/>
            <span class="font-semibold text-slate-400">E:</span> ${settings.email || ''}
          </p>
        </div>
      </div>

      <div class="w-full h-1 rounded-full bg-slate-100 mb-8 overflow-hidden">
        <div class="h-full w-1/3" style="background-color: #0284c7;"></div>
      </div>

      <!-- CLIENT & EVENT INFO CARDS -->
      <div class="grid grid-cols-2 gap-6 mb-8 text-xs">
        <!-- CLIENT DETAILS -->
        <div class="p-5 rounded-2xl border border-slate-200 bg-white">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Client Details</p>
          <h3 class="text-base font-bold text-slate-800">${data.clientName}</h3>
          <p class="text-slate-600 mt-1">
            <span class="font-semibold text-slate-400">Mobile:</span> ${data.mobileNumber}
          </p>
        </div>

        <!-- EVENT DETAILS -->
        <div class="p-5 rounded-2xl border border-slate-200 bg-sky-50/20">
          <p class="text-[10px] font-bold text-sky-600 uppercase tracking-wider mb-2">Event Details</p>
          <div class="space-y-1">
            <p class="text-slate-700"><span class="font-bold text-slate-400">Event:</span> ${data.eventName}</p>
            <p class="text-slate-700"><span class="font-bold text-slate-400">Date:</span> ${new Date(data.eventDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            <p class="text-slate-700"><span class="font-bold text-slate-400">Location:</span> ${data.eventLocation || 'Not Specified'}</p>
          </div>
        </div>
      </div>

      <!-- SECTIONS CONTENT -->
      <div class="mb-8">
        ${sectionsHtml || '<p class="text-center text-slate-400 py-6 text-xs">No quotation contents specified.</p>'}
      </div>

      <!-- TOTAL PRICE & FOOTER -->
      <div class="mt-8" style="page-break-inside: avoid; break-inside: avoid;">
        <div class="flex justify-between items-center bg-sky-50/50 border border-sky-100 rounded-2xl p-5 mb-8 text-xs">
          <div>
            <span class="text-[10px] font-bold uppercase tracking-wider text-sky-600 block">Total Package Price</span>
            <span class="text-[9px] text-slate-400 mt-0.5 block">All inclusive price for the specified services.</span>
          </div>
          <div class="text-right">
            <span class="text-2xl font-black text-sky-600">₹${(data.grandTotal || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div class="flex justify-between items-end border-t border-slate-200 pt-8 mt-12 text-xs">
          <div>
            <p class="font-semibold text-slate-800 mb-0.5">Thank you for choosing our services!</p>
            <p class="text-[10px] text-slate-500">Terms & Conditions: Validity of this quotation is 30 days.</p>
          </div>
          <div class="text-center w-48">
            <div class="border-b border-slate-300 pb-8 mb-2"></div>
            <p class="text-[10px] font-bold text-slate-500 uppercase">Authorized Signature</p>
            <p class="text-xs font-bold text-slate-800 mt-0.5">${settings.studioName}</p>
          </div>
        </div>
      </div>
    </div>
  `;
};

const getPaymentReportHtml = (ledgers, settings, logoData) => {
  let totalPaid = 0;
  let totalPending = 0;

  let tableRows = '';
  ledgers.forEach((l, index) => {
    totalPaid += l.paidAmount || 0;
    totalPending += l.pendingAmount || 0;
    const bgClass = index % 2 === 0 ? 'bg-white' : 'bg-slate-50';
    tableRows += `
      <tr class="${bgClass} border-b border-slate-100">
        <td class="py-3 px-4 text-slate-700 font-medium">${l.employeeName}</td>
        <td class="py-3 px-4 text-slate-650">${l.mobileNumber}</td>
        <td class="py-3 px-4 text-right text-slate-650">₹${(l.totalAmount || 0).toLocaleString('en-IN')}</td>
        <td class="py-3 px-4 text-right text-emerald-600 font-semibold">₹${(l.paidAmount || 0).toLocaleString('en-IN')}</td>
        <td class="py-3 px-4 text-right text-rose-600 font-semibold">₹${(l.pendingAmount || 0).toLocaleString('en-IN')}</td>
      </tr>
    `;
  });

  return `
    <div class="p-12 bg-white text-slate-900 font-sans" style="width: 210mm; min-height: 297mm; box-sizing: border-box;">
      <!-- HEADER -->
      <div class="flex justify-between items-start mb-8">
        <div>
          ${logoData ? `<img src="${logoData}" alt="Company Logo" style="max-height: 56px; max-width: 200px; object-fit: contain; margin-bottom: 16px;"/>` : `<h1 class="text-3xl font-extrabold text-indigo-700 tracking-tight mb-1">${settings.studioName}</h1>`}
          <h2 class="text-xl font-bold text-slate-900 tracking-tight mb-1">EMPLOYEE PAYMENT REPORT</h2>
          <p class="text-xs font-semibold text-slate-500 tracking-wider">Generated: ${new Date().toISOString().split('T')[0]}</p>
        </div>
        <div class="text-right">
          ${logoData ? `<h2 class="text-lg font-bold text-indigo-700 mb-1">${settings.studioName}</h2>` : ''}
          <p class="text-xs text-slate-600 max-w-[240px] ml-auto leading-relaxed">${settings.address || ''}</p>
          <p class="text-xs text-slate-600 mt-2">
            <span class="font-semibold text-slate-400">P:</span> ${settings.mobileNumber || ''} <br/>
            <span class="font-semibold text-slate-400">E:</span> ${settings.email || ''}
          </p>
        </div>
      </div>

      <div class="w-full h-1 rounded-full bg-slate-100 mb-8 overflow-hidden">
        <div class="h-full w-1/3 bg-indigo-600"></div>
      </div>

      <!-- TABLE -->
      <div class="rounded-2xl border border-slate-200 overflow-hidden mb-8 shadow-sm">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
              <th class="py-4 px-4">Employee Name</th>
              <th class="py-4 px-4">Mobile</th>
              <th class="py-4 px-4 text-right">Total Amount</th>
              <th class="py-4 px-4 text-right">Paid</th>
              <th class="py-4 px-4 text-right">Pending</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows || '<tr><td colspan="5" class="text-center py-4 text-slate-500">No payment records found.</td></tr>'}
          </tbody>
        </table>
      </div>

      <!-- TOTALS SECTION -->
      <div class="flex justify-end mb-12 text-xs">
        <div class="w-72 space-y-1">
          <div class="flex justify-between items-center py-1 text-slate-600">
            <span class="font-medium">Total Paid Amount</span>
            <span class="font-bold text-emerald-600">₹${totalPaid.toLocaleString('en-IN')}</span>
          </div>
          <div class="flex justify-between items-center py-1 text-slate-600">
            <span class="font-medium">Total Pending Amount</span>
            <span class="font-bold text-rose-600">₹${totalPending.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  `;
};

const getExpenseReportHtml = (expenses, settings, logoData) => {
  let totalExpense = 0;

  let tableRows = '';
  expenses.forEach((exp, index) => {
    totalExpense += exp.amount || 0;
    const bgClass = index % 2 === 0 ? 'bg-white' : 'bg-slate-50';
    tableRows += `
      <tr class="${bgClass} border-b border-slate-100">
        <td class="py-3 px-4 text-slate-700">${new Date(exp.date).toISOString().split('T')[0]}</td>
        <td class="py-3 px-4 text-slate-700 font-medium">${exp.expenseCategory}</td>
        <td class="py-3 px-4 text-slate-650">${exp.description || '-'}</td>
        <td class="py-3 px-4 text-right font-semibold text-slate-800">₹${(exp.amount || 0).toLocaleString('en-IN')}</td>
      </tr>
    `;
  });

  return `
    <div class="p-12 bg-white text-slate-900 font-sans" style="width: 210mm; min-height: 297mm; box-sizing: border-box;">
      <!-- HEADER -->
      <div class="flex justify-between items-start mb-8">
        <div>
          ${logoData ? `<img src="${logoData}" alt="Company Logo" style="max-height: 56px; max-width: 200px; object-fit: contain; margin-bottom: 16px;"/>` : `<h1 class="text-3xl font-extrabold text-rose-700 tracking-tight mb-1">${settings.studioName}</h1>`}
          <h2 class="text-xl font-bold text-slate-900 tracking-tight mb-1">EXPENSE REPORT</h2>
          <p class="text-xs font-semibold text-slate-500 tracking-wider">Generated: ${new Date().toISOString().split('T')[0]}</p>
        </div>
        <div class="text-right">
          ${logoData ? `<h2 class="text-lg font-bold text-rose-700 mb-1">${settings.studioName}</h2>` : ''}
          <p class="text-xs text-slate-600 max-w-[240px] ml-auto leading-relaxed">${settings.address || ''}</p>
          <p class="text-xs text-slate-600 mt-2">
            <span class="font-semibold text-slate-400">P:</span> ${settings.mobileNumber || ''} <br/>
            <span class="font-semibold text-slate-400">E:</span> ${settings.email || ''}
          </p>
        </div>
      </div>

      <div class="w-full h-1 rounded-full bg-slate-100 mb-8 overflow-hidden">
        <div class="h-full w-1/3 bg-rose-600"></div>
      </div>

      <!-- TABLE -->
      <div class="rounded-2xl border border-slate-200 overflow-hidden mb-8 shadow-sm">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
              <th class="py-4 px-4">Date</th>
              <th class="py-4 px-4">Category</th>
              <th class="py-4 px-4">Notes</th>
              <th class="py-4 px-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows || '<tr><td colspan="4" class="text-center py-4 text-slate-500">No expense data found.</td></tr>'}
          </tbody>
        </table>
      </div>

      <!-- TOTALS SECTION -->
      <div class="flex justify-end mb-12 text-xs">
        <div class="w-72">
          <div class="flex justify-between items-center py-1 mb-1 border-t border-slate-100 pt-2">
            <span class="font-bold text-slate-800">Total Expenses</span>
            <span class="text-base font-bold text-rose-700">₹${totalExpense.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  `;
};

const getRevenueReportHtml = (bills, settings, logoData) => {
  let totalRevenue = 0;

  let tableRows = '';
  bills.forEach((bill, index) => {
    const amount = (bill.advanceReceived || 0) + ((bill.grandTotal || 0) - (bill.remainingAmount || 0));
    totalRevenue += amount;
    const bgClass = index % 2 === 0 ? 'bg-white' : 'bg-slate-50';
    tableRows += `
      <tr class="${bgClass} border-b border-slate-100">
        <td class="py-3 px-4 text-slate-700 font-medium">${bill.clientName}</td>
        <td class="py-3 px-4 text-slate-700">${bill.eventName}</td>
        <td class="py-3 px-4 text-slate-650">${bill.billDate}</td>
        <td class="py-3 px-4 text-right font-semibold text-slate-800">₹${amount.toLocaleString('en-IN')}</td>
      </tr>
    `;
  });

  return `
    <div class="p-12 bg-white text-slate-900 font-sans" style="width: 210mm; min-height: 297mm; box-sizing: border-box;">
      <!-- HEADER -->
      <div class="flex justify-between items-start mb-8">
        <div>
          ${logoData ? `<img src="${logoData}" alt="Company Logo" style="max-height: 56px; max-width: 200px; object-fit: contain; margin-bottom: 16px;"/>` : `<h1 class="text-3xl font-extrabold text-teal-700 tracking-tight mb-1">${settings.studioName}</h1>`}
          <h2 class="text-xl font-bold text-slate-900 tracking-tight mb-1">REVENUE REPORT</h2>
          <p class="text-xs font-semibold text-slate-500 tracking-wider">Generated: ${new Date().toISOString().split('T')[0]}</p>
        </div>
        <div class="text-right">
          ${logoData ? `<h2 class="text-lg font-bold text-teal-700 mb-1">${settings.studioName}</h2>` : ''}
          <p class="text-xs text-slate-600 max-w-[240px] ml-auto leading-relaxed">${settings.address || ''}</p>
          <p class="text-xs text-slate-600 mt-2">
            <span class="font-semibold text-slate-400">P:</span> ${settings.mobileNumber || ''} <br/>
            <span class="font-semibold text-slate-400">E:</span> ${settings.email || ''}
          </p>
        </div>
      </div>

      <div class="w-full h-1 rounded-full bg-slate-100 mb-8 overflow-hidden">
        <div class="h-full w-1/3 bg-teal-600"></div>
      </div>

      <!-- TABLE -->
      <div class="rounded-2xl border border-slate-200 overflow-hidden mb-8 shadow-sm">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
              <th class="py-4 px-4">Client Name</th>
              <th class="py-4 px-4">Event Name</th>
              <th class="py-4 px-4">Date</th>
              <th class="py-4 px-4 text-right">Collected Amount</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows || '<tr><td colspan="4" class="text-center py-4 text-slate-500">No revenue data found.</td></tr>'}
          </tbody>
        </table>
      </div>

      <!-- TOTALS SECTION -->
      <div class="flex justify-end mb-12 text-xs">
        <div class="w-72">
          <div class="flex justify-between items-center py-1 mb-1 border-t border-slate-100 pt-2">
            <span class="font-bold text-slate-800">Total Revenue</span>
            <span class="text-base font-bold text-teal-700">₹${totalRevenue.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  `;
};

// ==========================================
// CORE GENERATOR ENTRYPOINT
// ==========================================

export const generatePdf = async (type, data, settings, action) => {
  // Dynamically import html2pdf to code-split the bundle
  const html2pdf = (await import('html2pdf.js')).default;

  // Compress Logo asynchronously (caches base64 in memory)
  const logoData = await getCompressedLogo(settings.companyLogo);
  
  let html = '';
  if (type === 'Bill') {
    html = getBillHtml(data, settings, logoData);
  } else if (type === 'Quotation') {
    html = getQuotationHtml(data, settings, logoData);
  } else if (type === 'Payment_Report') {
    html = getPaymentReportHtml(data, settings, logoData);
  } else if (type === 'Expense_Report') {
    html = getExpenseReportHtml(data, settings, logoData);
  } else if (type === 'Revenue_Report') {
    html = getRevenueReportHtml(data, settings, logoData);
  }

  // Create absolute positioned hidden container
  const container = document.createElement('div');
  container.className = 'absolute -left-[9999px] -top-[9999px] bg-white';
  container.innerHTML = html;
  document.body.appendChild(container);

  const opt = {
    margin:       0,
    filename:     `${type.toLowerCase()}_report.pdf`,
    image:        { type: 'jpeg', quality: 0.95 },
    html2canvas:  { scale: 2, useCORS: true, logging: false },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  try {
    if (action === 'download') {
      await html2pdf().set(opt).from(container).save();
    } else if (action === 'view') {
      const pdf = await html2pdf().set(opt).from(container).toPdf().get('pdf');
      const blob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } else if (action === 'print') {
      const pdf = await html2pdf().set(opt).from(container).toPdf().get('pdf');
      const blob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = blobUrl;
      document.body.appendChild(iframe);
      
      iframe.onload = () => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        // Clean up delay
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1500);
      };
    }
  } catch (err) {
    console.error('PDF Generation failed:', err);
    throw err;
  } finally {
    document.body.removeChild(container);
  }
};
