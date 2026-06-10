import apiClient, { getAssetUrl, getBaseUrl } from '../services/api';
import { formatDate } from './dateFormatter';

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
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, img.width, img.height);

      try {
        // Render as lossless PNG to avoid compression artifacts
        const compressed = canvas.toDataURL('image/png');
        cachedCompressedLogo = compressed;
        cachedLogoSrc = logoUrl;
        resolve(compressed);
      } catch (err) {
        console.error('Error drawing logo canvas:', err);
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

export const getBillHtml = (data, settings, logoData) => {
  console.log('PDF Record Data (Bill):', data);
  const docNumber = data.billNumber || 'INV-0000';
  const docDate = formatDate(data.billGenerateDate || data.billDate || new Date());
  const dueDate = formatDate(data.eventDate || data.billGenerateDate || data.billDate || new Date());

  let statusBadge = '';
  if (data.remainingAmount <= 0) {
    statusBadge = '<span style="display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; background-color: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; line-height: 1;">PAID</span>';
  } else if (data.advanceReceived > 0) {
    statusBadge = '<span style="display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a; line-height: 1;">PARTIAL</span>';
  } else {
    statusBadge = '<span style="display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; background-color: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; line-height: 1;">PENDING</span>';
  }

  let servicesHtml = '';
  (data.services || []).forEach((srv, index) => {
    const bgClass = index % 2 === 0 ? 'bg-white' : 'bg-slate-50';
    servicesHtml += `
      <tr class="${bgClass} border-b border-slate-100" style="break-inside: avoid; page-break-inside: avoid;">
        <td class="py-3 px-4 text-slate-700 font-medium">${srv.serviceName}</td>
        <td class="py-3 px-4 text-center text-slate-600">${srv.quantity}</td>
        <td class="py-3 px-4 text-right text-slate-600">₹${(srv.price || 0).toLocaleString('en-IN')}</td>
        <td class="py-3 px-4 text-right font-semibold text-slate-800">₹${(srv.total || 0).toLocaleString('en-IN')}</td>
      </tr>
    `;
  });

  return `
    <div class="bg-white text-slate-900 font-sans" style="width: 100%; box-sizing: border-box; position: relative; padding-bottom: 30px;">
      <!-- HEADER -->
      <div class="flex justify-between items-start mb-4" style="break-inside: avoid; page-break-inside: avoid;">
        <div>
          ${logoData ? `<img src="${logoData}" alt="Company Logo" style="max-height: 56px; max-width: 200px; object-fit: contain; margin-bottom: 12px;"/>` : `<h1 class="text-3xl font-extrabold text-teal-700 tracking-tight mb-1">${settings.studioName}</h1>`}
          ${!logoData && settings.ownerName ? `<p class="text-xs font-bold text-slate-700 mb-2">Owner: ${settings.ownerName}</p>` : ''}
          <h2 class="text-xl font-bold text-slate-900 tracking-tight mb-1">INVOICE</h2>
          <p class="text-xs font-semibold text-slate-500 tracking-wider uppercase mb-1.5">${docNumber}</p>
          <div style="margin-top: 6px; display: inline-block;">
            ${statusBadge}
          </div>
        </div>
        <div class="text-right">
          ${logoData ? `<h2 class="text-lg font-bold text-teal-700 mb-0.5">${settings.studioName}</h2>` : ''}
          ${logoData && settings.ownerName ? `<p class="text-xs font-bold text-slate-750 mb-1">Owner: ${settings.ownerName}</p>` : ''}
          <p class="text-xs text-slate-600 max-w-[240px] ml-auto leading-relaxed mb-1">${settings.address || ''}</p>
          <p class="text-xs text-slate-600">
            <span class="font-semibold text-slate-400">P:</span> ${settings.mobileNumber || ''}
            ${settings.gstNumber ? `<br/><span class="font-semibold text-slate-400">GST:</span> ${settings.gstNumber}` : ''}
          </p>
        </div>
      </div>

      <div class="w-full h-1 rounded-full bg-slate-100 mb-4 overflow-hidden" style="break-inside: avoid; page-break-inside: avoid;">
        <div class="h-full w-1/3" style="background-color: #0d9488;"></div>
      </div>

      <!-- INFO CARDS -->
      <div class="grid grid-cols-2 gap-6 mb-4" style="break-inside: avoid; page-break-inside: avoid;">
        <!-- BILL TO -->
        <div class="p-4 rounded-2xl border border-slate-200 bg-white">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Bill To</p>
          <h3 class="text-base font-bold text-slate-800">${data.clientName}</h3>
          <p class="text-xs text-slate-600 mt-1">
            <span class="font-semibold text-slate-400">M:</span> ${data.mobileNumber}
          </p>
          <p class="text-xs text-slate-600 mt-1">
            <span class="font-semibold text-slate-400">Date:</span> ${formatDate(data.billGenerateDate || data.billDate)}
          </p>
        </div>

        <!-- EVENT & DATES -->
        <div class="p-4 rounded-2xl border border-slate-200 bg-teal-50/20">
          <p class="text-[10px] font-bold text-teal-750 uppercase tracking-wider mb-1" style="color: #0d9488;">Event Details</p>
          <div class="grid grid-cols-2 gap-1 text-xs">
            <div>
              <span class="text-[10px] font-bold text-slate-400 uppercase block">Event Name</span>
              <span class="font-semibold text-slate-800">${data.eventName}</span>
            </div>
            <div>
              <span class="text-[10px] font-bold text-slate-400 uppercase block">Event Date</span>
              <span class="font-semibold text-slate-800">${formatDate(data.eventDate)}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- DATES SUMMARY -->
      <div class="flex gap-12 mb-4 px-2 text-xs" style="break-inside: avoid; page-break-inside: avoid;">
        <div>
          <p class="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Issue Date</p>
          <p class="font-semibold text-slate-800">${docDate}</p>
        </div>
        <div>
          <p class="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Due Date</p>
          <p class="font-semibold text-slate-850">${dueDate}</p>
        </div>
      </div>

      <!-- SERVICES TABLE -->
      <div class="rounded-2xl border border-slate-200 overflow-hidden mb-4" style="break-inside: avoid; page-break-inside: avoid;">
        <table class="w-full text-left border-collapse text-xs">
          <thead style="display: table-header-group;">
            <tr class="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-semibold" style="break-inside: avoid; page-break-inside: avoid;">
              <th class="py-2.5 px-4">Service Description</th>
              <th class="py-2.5 px-4 text-center">Qty</th>
              <th class="py-2.5 px-4 text-right">Rate</th>
              <th class="py-2.5 px-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${servicesHtml}
          </tbody>
        </table>
      </div>

      <!-- TOTALS SECTION -->
      <div class="flex justify-end mb-4" style="break-inside: avoid; page-break-inside: avoid;">
        <div class="w-72 text-xs space-y-1.5">
          <div class="flex justify-between py-0.5 text-slate-600">
            <span>Subtotal</span>
            <span class="font-semibold text-slate-850">₹${(data.subtotal || 0).toLocaleString('en-IN')}</span>
          </div>
          ${data.discount > 0 ? `
          <div class="flex justify-between py-0.5 text-rose-500">
            <span>Discount</span>
            <span class="font-semibold">- ₹${(data.discount || 0).toLocaleString('en-IN')}</span>
          </div>` : ''}
          
          <div class="my-1.5 border-t border-slate-200"></div>
          
          <div class="flex justify-between items-center py-0.5 mb-0.5">
            <span class="font-bold text-slate-800">Grand Total</span>
            <span class="text-base font-bold text-teal-700" style="color: #0d9488;">₹${(data.grandTotal || 0).toLocaleString('en-IN')}</span>
          </div>

          <div class="flex justify-between py-1 text-slate-600 bg-slate-50 px-3 rounded-lg">
            <span>Advance Paid</span>
            <span class="font-semibold text-slate-800">₹${(data.advanceReceived || 0).toLocaleString('en-IN')}</span>
          </div>
          <div class="flex justify-between py-1.5 font-bold text-slate-800 bg-slate-100 px-3 rounded-lg">
            <span>Remaining Balance</span>
            <span class="${data.remainingAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}">₹${(data.remainingAmount || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      <!-- FOOTER -->
      <div class="mt-8 border-t border-slate-200 pt-4 flex justify-between items-start text-xs" style="break-inside: avoid; page-break-inside: avoid;">
        <div>
          <p class="font-semibold text-slate-800 mb-1">Thank you for choosing our services!</p>
          <p class="text-[10px] text-slate-500">Payment is due within 15 days of issue.</p>
        </div>
        <div class="text-center w-48">
          <div style="border-bottom: 1px solid #cbd5e1; margin-bottom: 8px;"></div>
          <p class="text-[10px] font-bold text-slate-500 uppercase">Authorized Signature</p>
          <p class="text-xs font-bold text-slate-800 mt-1">${settings.studioName}</p>
        </div>
      </div>
    </div>
  `;
};

export const getQuotationHtml = (data, settings, logoData) => {
  console.log('PDF Record Data (Quotation):', data);

  const daySections = [];
  let videoOutputSection = null;
  let photoOutputSection = null;

  (data.sections || []).forEach(sec => {
    const titleUpper = (sec.title || '').toUpperCase().trim();
    if (titleUpper === 'VIDEO OUTPUT') {
      videoOutputSection = sec;
    } else if (titleUpper === 'PHOTO OUTPUT') {
      photoOutputSection = sec;
    } else {
      daySections.push(sec);
    }
  });

  let daySectionsHtml = '';
  daySections.forEach(sec => {
    let itemsHtml = '';
    (sec.items || []).forEach(item => {
      if (item.trim()) {
        itemsHtml += `<li style="margin-bottom: 5px; font-size: 12px; color: #111111; list-style-type: square; margin-left: 16px;">${item}</li>`;
      }
    });
    
    if (itemsHtml) {
      daySectionsHtml += `
        <div style="border: 1px solid #000000; border-radius: 8px; margin-bottom: 15px; padding: 12px; background-color: #ffffff; break-inside: avoid; page-break-inside: avoid;">
          <h3 style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #000000; margin: 0 0 8px 0; border-bottom: 2px solid #000000; padding-bottom: 4px; display: inline-block;">
            ${sec.title}
          </h3>
          <ul style="margin: 0; padding: 0;">
            ${itemsHtml}
          </ul>
        </div>
      `;
    }
  });

  let outputsHtml = '';
  if (videoOutputSection || photoOutputSection) {
    let videoItemsHtml = '';
    if (videoOutputSection) {
      (videoOutputSection.items || []).forEach(item => {
        if (item.trim()) {
          videoItemsHtml += `<li style="margin-bottom: 4px; font-size: 11px; color: #111111; list-style-type: disc; margin-left: 12px;">${item}</li>`;
        }
      });
    }

    let photoItemsHtml = '';
    if (photoOutputSection) {
      (photoOutputSection.items || []).forEach(item => {
        if (item.trim()) {
          photoItemsHtml += `<li style="margin-bottom: 4px; font-size: 11px; color: #111111; list-style-type: disc; margin-left: 12px;">${item}</li>`;
        }
      });
    }

    outputsHtml = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 15px; margin-bottom: 15px; break-inside: avoid; page-break-inside: avoid;">
        <!-- VIDEO OUTPUT -->
        <div style="border: 1px solid #000000; border-radius: 8px; padding: 12px; background-color: #ffffff;">
          <h4 style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #000000; margin: 0 0 8px 0; border-bottom: 1px solid #000000; padding-bottom: 2px; display: inline-block;">
            ${videoOutputSection ? videoOutputSection.title : 'VIDEO OUTPUT'}
          </h4>
          <ul style="margin: 0; padding: 0;">
            ${videoItemsHtml || '<li style="font-style: italic; font-size: 11px; list-style: none;">No deliverables</li>'}
          </ul>
        </div>

        <!-- PHOTO OUTPUT -->
        <div style="border: 1px solid #000000; border-radius: 8px; padding: 12px; background-color: #ffffff;">
          <h4 style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #000000; margin: 0 0 8px 0; border-bottom: 1px solid #000000; padding-bottom: 2px; display: inline-block;">
            ${photoOutputSection ? photoOutputSection.title : 'PHOTO OUTPUT'}
          </h4>
          <ul style="margin: 0; padding: 0;">
            ${photoItemsHtml || '<li style="font-style: italic; font-size: 11px; list-style: none;">No deliverables</li>'}
          </ul>
        </div>
      </div>
    `;
  }

  const headerHtml = `
    <!-- HEADER -->
    <div style="border: 2px solid #000000; padding: 15px; margin-bottom: 15px; background-color: #ffffff; break-inside: avoid; page-break-inside: avoid; position: relative;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <!-- Left Side: Owner details -->
        <div style="font-size: 11px; line-height: 1.4; color: #000000;">
          <p style="margin: 0; font-weight: bold;">Owner: ${settings.ownerName || 'Owner Name'}</p>
          <p style="margin: 0;">Mobile: ${settings.mobileNumber || ''}</p>
        </div>

        <!-- Right Side: Company Logo / Studio Name -->
        <div style="text-align: right;">
          ${logoData ? `<img src="${logoData}" alt="Company Logo" style="max-height: 48px; max-width: 180px; object-fit: contain;"/>` : `<h2 style="font-size: 16px; font-weight: 800; letter-spacing: 1px; color: #000000; margin: 0;">${(settings.studioName || 'Studio Name').toUpperCase()}</h2>`}
        </div>
      </div>

      <!-- Center: Title and Address -->
      <div style="text-align: center; margin-top: 10px; border-top: 1px solid #000000; padding-top: 10px;">
        <h1 style="font-size: 20px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 4px 0; color: #000000;">
          QUOTATION RECEIPT
        </h1>
        <p style="font-size: 10px; color: #333333; margin: 0; max-width: 500px; margin-left: auto; margin-right: auto; line-height: 1.3;">
          ${settings.address || ''}
        </p>
      </div>
    </div>
  `;

  const clientInfoHtml = `
    <!-- CLIENT & EVENT INFO -->
    <div style="border: 1px solid #000000; padding: 12px; margin-bottom: 15px; background-color: #ffffff; font-size: 11px; break-inside: avoid; page-break-inside: avoid;">
      <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 12px;">
        <div>
          <table style="width: 100%; border-collapse: collapse; text-align: left;">
            <tr>
              <td style="padding: 2px 0; font-weight: bold; width: 90px; color: #000000;">Client Name:</td>
              <td style="padding: 2px 0; color: #333333;">${data.clientName}</td>
            </tr>
            <tr>
              <td style="padding: 2px 0; font-weight: bold; color: #000000;">Mobile:</td>
              <td style="padding: 2px 0; color: #333333;">${data.mobileNumber}</td>
            </tr>
            <tr>
              <td style="padding: 2px 0; font-weight: bold; color: #000000;">Event Name:</td>
              <td style="padding: 2px 0; color: #333333;">${data.eventName}</td>
            </tr>
          </table>
        </div>
        <div>
          <table style="width: 100%; border-collapse: collapse; text-align: left;">
            <tr>
              <td style="padding: 2px 0; font-weight: bold; width: 90px; color: #000000;">Quotation No:</td>
              <td style="padding: 2px 0; color: #333333; font-family: monospace; font-weight: bold;">${data.quotationNumber}</td>
            </tr>
            <tr>
              <td style="padding: 2px 0; font-weight: bold; color: #000000;">Date of Issue:</td>
              <td style="padding: 2px 0; color: #333333;">${formatDate(data.quotationDate)}</td>
            </tr>
            <tr>
              <td style="padding: 2px 0; font-weight: bold; color: #000000;">Booking Date:</td>
              <td style="padding: 2px 0; color: #333333;">${formatDate(data.eventDate)}</td>
            </tr>
          </table>
        </div>
      </div>
    </div>
  `;

  const totalAmountHtml = `
    <!-- TOTAL AMOUNT -->
    <div style="border: 2px solid #000000; padding: 15px; margin-top: 15px; margin-bottom: 20px; text-align: center; background-color: #fafafa; break-inside: avoid; page-break-inside: avoid;">
      <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #000000; display: block; margin-bottom: 4px;">
        Total Package Value
      </span>
      <span style="font-size: 28px; font-weight: 900; color: #000000; display: block; letter-spacing: 1px;">
        ₹${(data.grandTotal || 0).toLocaleString('en-IN')}/-
      </span>
    </div>
  `;

  const signatureHtml = `
    <!-- SIGNATURES & TERMS -->
    <div style="margin-top: 20px; font-size: 11px; break-inside: avoid; page-break-inside: avoid;">
      <p style="font-size: 10px; color: #666666; line-height: 1.4; margin: 0 0 20px 0; border-top: 1px dashed #000000; padding-top: 8px;">
        Terms: To lock the booking, a 50% reservation advance is required. Quotation validity is 30 days from issued date.
      </p>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 10px;">
        <div>
          <div style="border-bottom: 1px solid #000000; margin-bottom: 6px;"></div>
          <span style="font-weight: bold; color: #000000; display: block;">Client Acceptance Signature</span>
          <span style="font-size: 10px; color: #666666; display: block; margin-top: 2px;">Date: ____ / ____ / ________</span>
        </div>
        <div style="text-align: right;">
          <div style="border-bottom: 1px solid #000000; margin-bottom: 6px;"></div>
          <span style="font-weight: bold; color: #000000; display: block;">Authorized Studio Representative</span>
          <span style="font-size: 10px; color: #000000; display: block; margin-top: 2px;">For: ${settings.studioName}</span>
        </div>
      </div>
    </div>
  `;

  return `
    <div class="bg-white text-black font-sans" style="width: 100%; box-sizing: border-box; padding: 20px; border: 3px double #000000; padding-bottom: 40px; background-color: #ffffff;">
      ${headerHtml}
      ${clientInfoHtml}
      ${daySectionsHtml}
      ${outputsHtml}
      ${totalAmountHtml}
      ${signatureHtml}
    </div>
  `;
};

export const getPaymentReportHtml = (ledgers, settings, logoData) => {
  let totalPaymentsGiven = 0;

  let tableRows = '';
  ledgers.forEach((l, index) => {
    totalPaymentsGiven += l.amountGiven || 0;
    const bgClass = index % 2 === 0 ? 'bg-white' : 'bg-slate-50';

    const displayDate = formatDate(l.paymentDate);

    tableRows += `
      <tr class="${bgClass} border-b border-slate-100" style="break-inside: avoid; page-break-inside: avoid;">
        <td class="py-3 px-4 text-slate-700 font-medium">${l.employeeName}</td>
        <td class="py-3 px-4 text-slate-655">${l.mobileNumber}</td>
        <td class="py-3 px-4 text-right text-slate-700 font-semibold">₹${(l.amountGiven || 0).toLocaleString('en-IN')}</td>
        <td class="py-3 px-4 text-center text-slate-650">${l.paymentMethod || ''}</td>
        <td class="py-3 px-4 text-center text-slate-650">${displayDate}</td>
        <td class="py-3 px-4 text-slate-650">${l.notes || '-'}</td>
      </tr>
    `;
  });

  return `
    <div class="bg-white text-slate-900 font-sans" style="width: 100%; box-sizing: border-box; padding-bottom: 30px;">
      <!-- HEADER -->
      <div class="flex justify-between items-start mb-8" style="break-inside: avoid; page-break-inside: avoid;">
        <div>
          ${logoData ? `<img src="${logoData}" alt="Company Logo" style="max-height: 56px; max-width: 200px; object-fit: contain; margin-bottom: 16px;"/>` : `<h1 class="text-3xl font-extrabold text-indigo-700 tracking-tight mb-1">${settings.studioName}</h1>`}
          <h2 class="text-xl font-bold text-slate-900 tracking-tight mb-1">EMPLOYEE PAYMENT REPORT</h2>
          <p class="text-xs font-semibold text-slate-500 tracking-wider">Generated: ${formatDate(new Date())}</p>
        </div>
        <div class="text-right">
          ${logoData ? `<h2 class="text-lg font-bold text-indigo-700 mb-1">${settings.studioName}</h2>` : ''}
          <p class="text-xs text-slate-600 max-w-[240px] ml-auto leading-relaxed">${settings.address || ''}</p>
          <p class="text-xs text-slate-600 mt-2">
            <span class="font-semibold text-slate-400">P:</span> ${settings.mobileNumber || ''}
          </p>
        </div>
      </div>

      <div class="w-full h-1 rounded-full bg-slate-100 mb-8 overflow-hidden" style="break-inside: avoid; page-break-inside: avoid;">
        <div class="h-full w-1/3 bg-indigo-600"></div>
      </div>

      <!-- TABLE -->
      <div class="rounded-2xl border border-slate-200 overflow-hidden mb-8 shadow-sm" style="break-inside: avoid; page-break-inside: avoid;">
        <table class="w-full text-left border-collapse text-xs">
          <thead style="display: table-header-group;">
            <tr class="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-semibold" style="break-inside: avoid; page-break-inside: avoid;">
              <th class="py-4 px-4">Employee Name</th>
              <th class="py-4 px-4">Mobile</th>
              <th class="py-4 px-4 text-right">Amount Given</th>
              <th class="py-4 px-4 text-center">Payment Method</th>
              <th class="py-4 px-4 text-center">Payment Date</th>
              <th class="py-4 px-4">Notes</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows || '<tr><td colspan="6" class="text-center py-4 text-slate-500">No payment records found.</td></tr>'}
          </tbody>
        </table>
      </div>

      <!-- TOTALS SECTION -->
      <div class="flex justify-end mb-12 text-xs" style="break-inside: avoid; page-break-inside: avoid;">
        <div class="w-72 space-y-1">
          <div class="flex justify-between items-center py-1 text-slate-600">
            <span class="font-medium">Total Payments Given</span>
            <span class="font-bold text-indigo-600">₹${totalPaymentsGiven.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  `;
};

export const getExpenseReportHtml = (expenses, settings, logoData) => {
  let totalExpense = 0;

  let tableRows = '';
  expenses.forEach((exp, index) => {
    totalExpense += exp.amount || 0;
    const bgClass = index % 2 === 0 ? 'bg-white' : 'bg-slate-50';
    tableRows += `
      <tr class="${bgClass} border-b border-slate-100" style="break-inside: avoid; page-break-inside: avoid;">
        <td class="py-3 px-4 text-slate-700">${formatDate(exp.date)}</td>
        <td class="py-3 px-4 text-slate-700 font-medium">${exp.expenseCategory}</td>
        <td class="py-3 px-4 text-slate-655">${exp.description || '-'}</td>
        <td class="py-3 px-4 text-right font-semibold text-slate-800">₹${(exp.amount || 0).toLocaleString('en-IN')}</td>
      </tr>
    `;
  });

  return `
    <div class="bg-white text-slate-900 font-sans" style="width: 100%; box-sizing: border-box; padding-bottom: 30px;">
      <!-- HEADER -->
      <div class="flex justify-between items-start mb-8" style="break-inside: avoid; page-break-inside: avoid;">
        <div>
          ${logoData ? `<img src="${logoData}" alt="Company Logo" style="max-height: 56px; max-width: 200px; object-fit: contain; margin-bottom: 16px;"/>` : `<h1 class="text-3xl font-extrabold text-rose-700 tracking-tight mb-1">${settings.studioName}</h1>`}
          <h2 class="text-xl font-bold text-slate-900 tracking-tight mb-1">EXPENSE REPORT</h2>
          <p class="text-xs font-semibold text-slate-500 tracking-wider">Generated: ${formatDate(new Date())}</p>
        </div>
        <div class="text-right">
          ${logoData ? `<h2 class="text-lg font-bold text-rose-700 mb-1">${settings.studioName}</h2>` : ''}
          <p class="text-xs text-slate-600 max-w-[240px] ml-auto leading-relaxed">${settings.address || ''}</p>
          <p class="text-xs text-slate-600 mt-2">
            <span class="font-semibold text-slate-400">P:</span> ${settings.mobileNumber || ''}
          </p>
        </div>
      </div>

      <div class="w-full h-1 rounded-full bg-slate-100 mb-8 overflow-hidden" style="break-inside: avoid; page-break-inside: avoid;">
        <div class="h-full w-1/3 bg-rose-600"></div>
      </div>

      <!-- TABLE -->
      <div class="rounded-2xl border border-slate-200 overflow-hidden mb-8 shadow-sm" style="break-inside: avoid; page-break-inside: avoid;">
        <table class="w-full text-left border-collapse text-xs">
          <thead style="display: table-header-group;">
            <tr class="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-semibold" style="break-inside: avoid; page-break-inside: avoid;">
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
      <div class="flex justify-end mb-12 text-xs" style="break-inside: avoid; page-break-inside: avoid;">
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

export const getRevenueReportHtml = (revenues, settings, logoData) => {
  console.log('PDF Record Data (Revenue Report):', revenues);
  let totalRevenue = 0;
  let tableRows = '';
  revenues.forEach((rev, index) => {
    totalRevenue += (rev.totalAmount || 0);
    const bgClass = index % 2 === 0 ? 'bg-white' : 'bg-slate-50';
    
    const displayDate = formatDate(rev.revenueDate);

    tableRows += `
      <tr class="${bgClass} border-b border-slate-100" style="break-inside: avoid; page-break-inside: avoid;">
        <td class="py-3 px-4 text-slate-700 font-medium">${rev.clientName || '-'}</td>
        <td class="py-3 px-4 text-slate-650">${rev.mobileNumber || '-'}</td>
        <td class="py-3 px-4 text-slate-650">${displayDate}</td>
        <td class="py-3 px-4 text-right font-semibold text-slate-800">₹${(rev.totalAmount || 0).toLocaleString('en-IN')}</td>
        <td class="py-3 px-4 text-right font-semibold ${rev.pendingAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}">₹${(rev.pendingAmount || 0).toLocaleString('en-IN')}</td>
      </tr>
    `;
  });

  return `
    <div class="bg-white text-slate-900 font-sans" style="width: 100%; box-sizing: border-box; padding-bottom: 30px;">
      <!-- HEADER -->
      <div class="flex justify-between items-start mb-8" style="break-inside: avoid; page-break-inside: avoid;">
        <div>
          ${logoData ? `<img src="${logoData}" alt="Company Logo" style="max-height: 56px; max-width: 200px; object-fit: contain; margin-bottom: 16px;"/>` : `<h1 class="text-3xl font-extrabold text-teal-700 tracking-tight mb-1">${settings.studioName}</h1>`}
          <h2 class="text-xl font-bold text-slate-900 tracking-tight mb-1">REVENUE REPORT</h2>
          <p class="text-xs font-semibold text-slate-500 tracking-wider">Generated: ${formatDate(new Date())}</p>
        </div>
        <div class="text-right">
          ${logoData ? `<h2 class="text-lg font-bold text-teal-700 mb-1">${settings.studioName}</h2>` : ''}
          <p class="text-xs text-slate-600 max-w-[240px] ml-auto leading-relaxed">${settings.address || ''}</p>
          <p class="text-xs text-slate-600 mt-2">
            <span class="font-semibold text-slate-400">P:</span> ${settings.mobileNumber || ''}
          </p>
        </div>
      </div>

      <div class="w-full h-1 rounded-full bg-slate-100 mb-8 overflow-hidden" style="break-inside: avoid; page-break-inside: avoid;">
        <div class="h-full w-1/3 bg-teal-600"></div>
      </div>

      <!-- TABLE -->
      <div class="rounded-2xl border border-slate-200 overflow-hidden mb-8 shadow-sm" style="break-inside: avoid; page-break-inside: avoid;">
        <table class="w-full text-left border-collapse text-xs">
          <thead style="display: table-header-group;">
            <tr class="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-semibold" style="break-inside: avoid; page-break-inside: avoid;">
              <th class="py-4 px-4">Client Name</th>
              <th class="py-4 px-4">Mobile Number</th>
              <th class="py-4 px-4">Revenue Date</th>
              <th class="py-4 px-4 text-right">Total Amount</th>
              <th class="py-4 px-4 text-right">Pending Amount</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows || '<tr><td colspan="5" class="text-center py-4 text-slate-500">No revenue data found.</td></tr>'}
          </tbody>
        </table>
      </div>

      <!-- TOTALS SECTION -->
      <div class="flex justify-end mb-12 text-xs" style="break-inside: avoid; page-break-inside: avoid;">
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

export const getEmployeeMonthlyReportHtml = (data, settings, logoData) => {
  const { employee, reportMonth, stats, events, payments } = data;

  const now = new Date();
  const datePart = formatDate(now);
  const timePart = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const currentDate = `${datePart}, ${timePart}`;

  let eventRows = '';
  if (events && events.length > 0) {
    events.forEach((ev) => {
      eventRows += `
        <tr style="border-bottom: 1px solid #cbd5e1; break-inside: avoid; page-break-inside: avoid;">
          <td style="padding: 6px 10px; border-right: 1px solid #cbd5e1;">${formatDate(ev.eventDate)}</td>
          <td style="padding: 6px 10px; border-right: 1px solid #cbd5e1; font-weight: 600;">
            ${ev.eventType}
            ${ev.location ? `<br/><span style="font-size: 9px; font-weight: normal; color: #475569;">📍 ${ev.location}</span>` : ''}
            ${ev.notes ? `<br/><span style="font-size: 9px; font-weight: normal; color: #64748b; font-style: italic;">Note: ${ev.notes}</span>` : ''}
          </td>
          <td style="padding: 6px 10px; text-align: right; font-weight: 700;">₹${(ev.employeeCharge || 0).toLocaleString('en-IN')}</td>
        </tr>
      `;
    });
  }

  let paymentRows = '';
  if (payments && payments.length > 0) {
    payments.forEach((p) => {
      paymentRows += `
        <tr style="border-bottom: 1px solid #cbd5e1; break-inside: avoid; page-break-inside: avoid;">
          <td style="padding: 6px 10px; border-right: 1px solid #cbd5e1;">${formatDate(p.paymentDate)}</td>
          <td style="padding: 6px 10px; border-right: 1px solid #cbd5e1; text-align: right; font-weight: 700;">₹${(p.amountGiven || 0).toLocaleString('en-IN')}</td>
          <td style="padding: 6px 10px; text-align: center;">${p.paymentMethod || 'Cash'}</td>
        </tr>
      `;
    });
  }

  return `
    <div style="width: 100%; max-width: 190mm; margin: 0 auto; box-sizing: border-box; padding-bottom: 20px; background-color: #ffffff;">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        
        .report-container {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #000000;
          background-color: #ffffff;
          font-size: 11px;
          line-height: 1.4;
        }
        
        /* HEADER */
        .header-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 25px;
        }
        
        .header-left-col {
          width: 30%;
          vertical-align: middle;
        }
        
        .header-center-col {
          width: 40%;
          text-align: center;
          vertical-align: middle;
        }
        
        .header-right-col {
          width: 30%;
          text-align: right;
          vertical-align: middle;
          font-size: 10px;
          color: #334155;
          line-height: 1.4;
        }
        
        .company-title {
          margin: 0;
          font-size: 24px;
          font-weight: 800;
          color: #000000;
          letter-spacing: 1px;
          line-height: 1.2;
        }
        
        .report-subtitle {
          margin: 2px 0 0 0;
          font-size: 11px;
          font-weight: 700;
          color: #000000;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        /* EMPLOYEE DETAILS */
        .meta-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #cbd5e1;
          margin-bottom: 20px;
        }
        
        .meta-cell {
          padding: 8px 12px;
          border-right: 1px solid #cbd5e1;
          width: 33.33%;
          vertical-align: top;
        }
        
        .meta-label {
          font-size: 8px;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
          display: block;
        }
        
        .meta-value {
          font-size: 12px;
          font-weight: 700;
          color: #000000;
        }
        
        /* SUMMARY TABLE */
        .summary-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #cbd5e1;
          margin-bottom: 25px;
        }
        
        .summary-table th {
          background-color: #f8fafc;
          border-bottom: 1px solid #cbd5e1;
          padding: 8px 12px;
          font-weight: 700;
          text-align: left;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .summary-table td {
          padding: 8px 12px;
          color: #000000;
        }
        
        /* TRANSACTION TABLES */
        .section-title {
          font-size: 11px;
          font-weight: 800;
          color: #000000;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 20px 0 8px 0;
          border-bottom: 1px solid #000000;
          padding-bottom: 4px;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        
        .data-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #cbd5e1;
          margin-bottom: 20px;
        }
        
        .data-table th {
          background-color: #f8fafc;
          border-bottom: 1px solid #cbd5e1;
          padding: 6px 10px;
          font-weight: 700;
          text-align: left;
          font-size: 9px;
          text-transform: uppercase;
        }
        
        .data-table td {
          padding: 6px 10px;
          color: #000000;
        }
        
        /* FOOTER */
        .footer-table {
          width: 100%;
          border-collapse: collapse;
          border-top: 1px solid #cbd5e1;
          margin-top: 30px;
          padding-top: 10px;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        
        .footer-cell {
          font-size: 9px;
          color: #475569;
          padding-top: 10px;
        }
      </style>
      
      <div class="report-container">
        <!-- HEADER -->
        <table class="header-table">
          <tr>
            <td class="header-left-col">
              ${logoData ? `<img src="${logoData}" alt="Dreams Video Logo" style="max-height: 44px; max-width: 150px; object-fit: contain;"/>` : ''}
            </td>
            <td class="header-center-col">
              <h1 class="company-title">DREAMS VIDEO</h1>
              <div class="report-subtitle">Employee Monthly Report</div>
            </td>
            <td class="header-right-col">
              <div>${settings.address || ''}</div>
              <div style="margin-top: 2px; font-weight: 700;">Mobile: ${settings.mobileNumber || ''}</div>
            </td>
          </tr>
        </table>
        
        <!-- EMPLOYEE DETAILS -->
        <table class="meta-table">
          <tr>
            <td class="meta-cell">
              <span class="meta-label">Employee Name</span>
              <div class="meta-value">${employee.fullName}</div>
            </td>
            <td class="meta-cell">
              <span class="meta-label">Mobile Number</span>
              <div class="meta-value">${employee.mobileNumber}</div>
            </td>
            <td class="meta-cell" style="border-right: none;">
              <span class="meta-label">Report Month</span>
              <div class="meta-value">${reportMonth}</div>
            </td>
          </tr>
        </table>

        <!-- SUMMARY TABLE -->
        <table class="summary-table">
          <thead>
            <tr>
              <th style="border-right: 1px solid #cbd5e1;">Metric Description</th>
              <th style="text-align: right; width: 30%;">Amount / Count</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #cbd5e1;">
              <td style="border-right: 1px solid #cbd5e1;">Total Events</td>
              <td style="text-align: right; font-weight: 700;">${stats.totalEvents}</td>
            </tr>
            <tr style="border-bottom: 1px solid #cbd5e1;">
              <td style="border-right: 1px solid #cbd5e1;">Total Earnings</td>
              <td style="text-align: right; font-weight: 700;">₹${stats.totalEarnings.toLocaleString('en-IN')}</td>
            </tr>
            <tr style="border-bottom: 1px solid #cbd5e1;">
              <td style="border-right: 1px solid #cbd5e1;">Total Payments Given</td>
              <td style="text-align: right; font-weight: 700;">₹${stats.totalPaymentsGiven.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style="border-right: 1px solid #cbd5e1; font-weight: 700;">Pending Amount</td>
              <td style="text-align: right; font-weight: 700; color: #ef4444;">₹${stats.pendingAmount.toLocaleString('en-IN')}</td>
            </tr>
          </tbody>
        </table>

        <!-- EVENT HISTORY -->
        <div class="section-title">Event History</div>
        <table class="data-table">
          <thead>
            <tr style="border-bottom: 1px solid #cbd5e1;">
              <th style="border-right: 1px solid #cbd5e1; width: 30%;">Date</th>
              <th style="border-right: 1px solid #cbd5e1; width: 45%;">Event Type</th>
              <th style="text-align: right; width: 25%;">Charge</th>
            </tr>
          </thead>
          <tbody>
            ${eventRows || '<tr><td colspan="3" style="padding: 10px; text-align: center; color: #64748b; font-style: italic;">No events found for this month.</td></tr>'}
          </tbody>
        </table>

        <!-- PAYMENT HISTORY -->
        <div class="section-title">Payment History</div>
        <table class="data-table">
          <thead>
            <tr style="border-bottom: 1px solid #cbd5e1;">
              <th style="border-right: 1px solid #cbd5e1; width: 30%;">Date</th>
              <th style="border-right: 1px solid #cbd5e1; text-align: right; width: 35%;">Amount</th>
              <th style="text-align: center; width: 35%;">Payment Method</th>
            </tr>
          </thead>
          <tbody>
            ${paymentRows || '<tr><td colspan="3" style="padding: 10px; text-align: center; color: #64748b; font-style: italic;">No payments found for this month.</td></tr>'}
          </tbody>
        </table>

        <!-- FOOTER -->
        <table class="footer-table">
          <tr>
            <td class="footer-cell" style="text-align: left;">Dreams Video</td>
            <td class="footer-cell" style="text-align: right;">Generated On: ${currentDate}</td>
          </tr>
        </table>
      </div>
    </div>
  `;
};

// ==========================================
// CORE GENERATOR ENTRYPOINT
// ==========================================

export const generatePdf = async (contentOrElement, filename, action) => {
  let element = contentOrElement;
  let isTempElement = false;

  if (typeof contentOrElement === 'string') {
    element = document.createElement('div');
    element.style.position = 'fixed';
    element.style.left = '0';
    element.style.top = '0';
    element.style.width = '210mm'; // A4 width
    element.style.backgroundColor = '#ffffff';
    element.style.zIndex = '-9999'; // Rendered behind the active UI
    element.style.opacity = '0.01'; // Invisible but painted by browser
    element.style.pointerEvents = 'none';
    element.className = 'bg-white text-slate-900 font-sans';
    element.innerHTML = contentOrElement;
    document.body.appendChild(element);
    isTempElement = true;
  }

  if (!element) {
    throw new Error('PDF generation failed: Source element is null or undefined.');
  }

  // 1. Pre-flight HTML Content Audit
  const textContent = element.textContent || element.innerText || '';
  if (!textContent.trim() || textContent.length < 50) {
    if (isTempElement && element.parentNode) {
      element.parentNode.removeChild(element);
    }
    throw new Error(`PDF Content Audit Failed: HTML template has insufficient text content (${textContent.length} chars).`);
  }

  // 2. Asset Staging & Synchronization (Fonts, Images, Logo, Layout rendering)
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  const images = Array.from(element.getElementsByTagName('img'));
  const imagePromises = images.map((img) => {
    if (img.complete) return Promise.resolve();
    return new Promise((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve(); // Proceed even if some image fails to load
    });
  });
  await Promise.all(imagePromises);

  // 3. Verify display property and wait until the container has a non-zero rendered height
  const style = window.getComputedStyle(element);
  if (style.display === 'none') {
    if (isTempElement && element.parentNode) {
      element.parentNode.removeChild(element);
    }
    throw new Error('PDF generation failed: Source element has display:none and cannot be captured.');
  }

  const hasHeight = (el) => {
    return el.offsetHeight > 0 || el.scrollHeight > 0 || el.clientHeight > 0;
  };

  let heightRetry = 0;
  const maxHeightRetries = 20; // max ~500ms wait
  while (!hasHeight(element) && heightRetry < maxHeightRetries) {
    console.log(`PDF container height is 0 (attempt ${heightRetry + 1}). Waiting for layout render...`);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await new Promise((resolve) => setTimeout(resolve, 20));
    heightRetry++;
  }

  if (!hasHeight(element)) {
    if (isTempElement && element.parentNode) {
      element.parentNode.removeChild(element);
    }
    throw new Error(`PDF generation failed: Rendered element height is 0 (offsetHeight: ${element.offsetHeight}, scrollHeight: ${element.scrollHeight}, clientHeight: ${element.clientHeight}).`);
  }

  console.log('PDF Source Element:', element);
  console.log('HTML Content Length:', element.innerHTML.length);
  console.log('Rendered Text Count:', textContent.length);

  // Dynamically import html2pdf to code-split the bundle
  const html2pdf = (await import('html2pdf.js')).default;

  // Explicitly set scrollX and scrollY to 0 to capture from the top of the document,
  // preventing blank/cropped canvas issues when page is scrolled down.
  const actualHeight = element.scrollHeight;
  const actualWidth = element.scrollWidth;
  console.log('Actual content height:', actualHeight);
  console.log('Actual content width:', actualWidth);

  // Height calculations for audit
  const pdfPageHeightMm = 297; // A4 Portrait height
  const pdfPageWidthMm = 210;  // A4 Portrait width
  const marginTopMm = 15;
  const marginBottomMm = 25;
  const marginLeftMm = 15;
  const marginRightMm = 15;
  
  const printableWidthMm = pdfPageWidthMm - marginLeftMm - marginRightMm; // 180mm
  const printableHeightMm = pdfPageHeightMm - marginTopMm - marginBottomMm; // 257mm
  
  // Calculate scaling factor from element pixels to PDF mm
  const scaleFactorMmPerPx = printableWidthMm / (actualWidth || 680);
  const contentHeightMm = actualHeight * scaleFactorMmPerPx;
  
  // Remaining page space on the final page
  const pageCountEstimated = Math.ceil(contentHeightMm / printableHeightMm);
  const remainingPageSpaceMm = (pageCountEstimated * printableHeightMm) - contentHeightMm;
  
  // Find footer position in mm
  const footerElement = element.querySelector('.border-t') || element.lastElementChild;
  const footerPosPx = footerElement ? footerElement.offsetTop : 0;
  const footerPosMm = footerPosPx * scaleFactorMmPerPx;
  const canvasHeight = actualHeight + 10;

  console.log('PDF page height (mm):', pdfPageHeightMm);
  console.log('Printable area height (mm):', printableHeightMm);
  console.log('Content height scaled to PDF (mm):', contentHeightMm);
  console.log('Estimated PDF page count:', pageCountEstimated);
  console.log('Remaining page space (mm):', remainingPageSpaceMm);
  console.log('Footer element top offset (px):', footerPosPx);
  console.log('Footer position scaled to PDF (mm):', footerPosMm);
  console.log('Canvas height (px):', canvasHeight);

  const opt = {
    margin:       [15, 15, 15, 15], // 15mm Top, Bottom, Left, Right
    filename:     filename || 'report.pdf',
    image:        { type: 'jpeg', quality: 1.0 },
    html2canvas:  { 
      scale: 2, // scale 2 as requested
      useCORS: true, 
      backgroundColor: "#ffffff",
      logging: false, // logging false as requested
      scrollX: 0, 
      scrollY: 0
    },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak:    { mode: ['css', 'legacy'] }
  };

  const generateBlob = async () => {
    const worker = html2pdf().set(opt).from(element);
    const canvas = await worker.toCanvas().get('canvas');
    const width = canvas ? canvas.width : 0;
    const height = canvas ? canvas.height : 0;
    const blob = await worker.toPdf().outputPdf('blob');
    return { blob, width, height };
  };

  try {
    let result = await generateBlob();
    
    // Validation: Verify canvas width > 0, canvas height > 0, generated blob size > 10000 bytes
    if (result.width <= 0 || result.height <= 0 || !result.blob || result.blob.size < 10000) {
      console.warn(`PDF generation failed on first attempt (width: ${result.width}, height: ${result.height}, size: ${result.blob ? result.blob.size : 0} bytes). Retrying capture once...`);
      
      // Delay before retrying to let layouts paint complete
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      result = await generateBlob();
      
      if (result.width <= 0 || result.height <= 0 || !result.blob || result.blob.size < 10000) {
        throw new Error(`PDF generation failed: Download PDF is empty or blank (size: ${result.blob ? result.blob.size : 0} bytes).`);
      }
    }

    const blob = result.blob;

    if (action === 'download') {
      try {
        const blobToBase64 = (b) => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              if (typeof reader.result === 'string') {
                const base64data = reader.result.split(',')[1];
                resolve(base64data);
              } else {
                reject(new Error('FileReader result is not a string.'));
              }
            };
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(b);
          });
        };

        const base64 = await blobToBase64(blob);
        const response = await apiClient.post('/pdf/temp-upload', {
          pdfBase64: base64,
          filename: opt.filename
        });

        if (response.data && response.data.success && response.data.downloadId) {
          const downloadId = response.data.downloadId;
          const downloadUrl = `${getBaseUrl()}/pdf/temp-download/${downloadId}`;
          
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = opt.filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          return;
        } else {
          console.warn('Backend PDF upload response unsuccessful, falling back to local download.');
        }
      } catch (backendErr) {
        console.error('Backend PDF download integration failed, falling back to local download:', backendErr);
      }

      // Fallback: Local blob download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = opt.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);
    } else if (action === 'view') {
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } else if (action === 'print') {
      const blobUrl = URL.createObjectURL(blob);
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = blobUrl;
      document.body.appendChild(iframe);
      
      iframe.onload = () => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
          URL.revokeObjectURL(blobUrl);
        }, 1500);
      };
    }
  } catch (err) {
    console.error('PDF Generation failed:', err);
    throw err;
  } finally {
    if (isTempElement && element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
  }
};
