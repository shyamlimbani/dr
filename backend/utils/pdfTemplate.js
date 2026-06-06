const generateHtmlTemplate = (type, data, settings) => {
  const isBill = type === 'Bill';
  
  if (isBill) {
    const docNumber = data.billNumber;
    const docDate = data.billDate;
    const dueDate = data.eventDate || docDate; // Default due date to event date

    let status = 'Pending';
    let statusBadge = '';
    
    if (data.remainingAmount <= 0) {
      status = 'Paid';
      statusBadge = '<span class="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">PAID</span>';
    } else if (data.advanceReceived > 0) {
      status = 'Partial';
      statusBadge = '<span class="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">PARTIAL</span>';
    } else {
      statusBadge = '<span class="px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 border border-rose-200">PENDING</span>';
    }

    const primaryColor = '#0f766e'; // Teal for Bill
    const bgAccent = 'bg-teal-50';
    const textAccent = 'text-teal-700';

    let servicesHtml = '';
    (data.services || []).forEach((srv, index) => {
      const bgClass = index % 2 === 0 ? 'bg-white' : 'bg-slate-50';
      servicesHtml += `
        <tr class="${bgClass} border-b border-slate-100">
          <td class="py-3 px-4 text-slate-700">${srv.serviceName}</td>
          <td class="py-3 px-4 text-center text-slate-600">${srv.quantity}</td>
          <td class="py-3 px-4 text-right text-slate-600">&#8377;${srv.price.toLocaleString('en-IN')}</td>
          <td class="py-3 px-4 text-right font-medium text-slate-800">&#8377;${srv.total.toLocaleString('en-IN')}</td>
        </tr>
      `;
    });

    return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>${type} - ${docNumber}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@500;600;700;800&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      body { 
        font-family: 'Inter', sans-serif; 
        -webkit-print-color-adjust: exact; 
        print-color-adjust: exact; 
        background-color: white; 
        margin: 0;
        padding: 0;
      }
      .poppins { font-family: 'Poppins', sans-serif; }
      .a4-container {
        width: 210mm;
        min-height: 297mm;
        padding: 40px 50px;
        margin: 0 auto;
        box-sizing: border-box;
        position: relative;
      }
      .theme-text { color: ${primaryColor}; }
      .theme-border { border-color: ${primaryColor}; }
      .theme-bg { background-color: ${primaryColor}; }
    </style>
  </head>
  <body>
    <div class="a4-container">
      
      <!-- HEADER -->
      <div class="flex justify-between items-start mb-8">
        <div>
          ${settings.logoData ? `<img src="${settings.logoData}" alt="Company Logo" class="max-h-16 max-w-[200px] object-contain mb-4"/>` : `<h1 class="poppins text-4xl font-extrabold tracking-tight theme-text mb-1">${settings.studioName}</h1>`}
          <h2 class="poppins text-2xl font-bold text-slate-900 tracking-tight mb-1">${type.toUpperCase()}</h2>
          <p class="text-sm font-medium text-slate-500 tracking-widest uppercase">${docNumber}</p>
          <div class="mt-4">
            ${statusBadge}
          </div>
        </div>
        <div class="text-right">
          ${settings.logoData ? `<h2 class="poppins text-xl font-bold theme-text mb-1">${settings.studioName}</h2>` : ''}
          <p class="text-sm text-slate-600">${settings.address}</p>
          <p class="text-sm text-slate-600 mt-1">
            <span class="font-medium">P:</span> ${settings.mobileNumber} <br/>
            ${settings.whatsappNumber ? `<span class="font-medium">W:</span> ${settings.whatsappNumber} <br/>` : ''}
            <span class="font-medium">E:</span> ${settings.email} <br/>
            ${settings.websiteUrl ? `<span class="font-medium">W:</span> ${settings.websiteUrl} <br/>` : ''}
            ${settings.gstNumber ? `<span class="font-medium">GST:</span> ${settings.gstNumber}` : ''}
          </p>
        </div>
      </div>

      <div class="w-full h-1 rounded-full bg-slate-100 mb-8 overflow-hidden">
        <div class="h-full w-1/3 theme-bg"></div>
      </div>

      <!-- INFO CARDS -->
      <div class="grid grid-cols-2 gap-6 mb-8">
        
        <!-- BILL TO -->
        <div class="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Bill To</p>
          <h3 class="poppins text-lg font-bold text-slate-800">${data.clientName}</h3>
          <p class="text-sm text-slate-600 mt-1 flex items-center gap-2">
            <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
            ${data.mobileNumber}
          </p>
          ${data.email ? `<p class="text-sm text-slate-600 mt-1 flex items-center gap-2">
            <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
            ${data.email}
          </p>` : ''}
        </div>

        <!-- EVENT & DATES -->
        <div class="p-5 rounded-2xl border border-slate-200 ${bgAccent} shadow-sm">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-xs font-semibold ${textAccent} opacity-80 uppercase tracking-wider mb-1">Event Name</p>
              <p class="text-sm font-semibold text-slate-800">${data.eventName}</p>
            </div>
            <div>
              <p class="text-xs font-semibold ${textAccent} opacity-80 uppercase tracking-wider mb-1">Event Date</p>
              <p class="text-sm font-semibold text-slate-800">${data.eventDate}</p>
            </div>
            <div class="col-span-2">
              <p class="text-xs font-semibold ${textAccent} opacity-80 uppercase tracking-wider mb-1">Location</p>
              <p class="text-sm font-semibold text-slate-800 flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                ${data.eventLocation || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- DATES SUMMARY -->
      <div class="flex gap-12 mb-8 px-2">
        <div>
          <p class="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Issue Date</p>
          <p class="font-semibold text-slate-800">${docDate}</p>
        </div>
        <div>
          <p class="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Due Date</p>
          <p class="font-semibold text-slate-800">${dueDate}</p>
        </div>
      </div>

      <!-- SERVICES TABLE -->
      <div class="rounded-2xl border border-slate-200 overflow-hidden mb-8 shadow-sm">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
              <th class="py-4 px-4">Service Description</th>
              <th class="py-4 px-4 text-center">Qty</th>
              <th class="py-4 px-4 text-right">Rate</th>
              <th class="py-4 px-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody class="text-sm">
            ${servicesHtml}
          </tbody>
        </table>
      </div>

      <!-- TOTALS SECTION -->
      <div class="flex justify-end mb-12">
        <div class="w-72">
          <div class="flex justify-between py-2 text-sm text-slate-600">
            <span>Subtotal</span>
            <span class="font-medium text-slate-800">&#8377;${data.subtotal.toLocaleString('en-IN')}</span>
          </div>
          ${data.discount > 0 ? `
          <div class="flex justify-between py-2 text-sm text-rose-500">
            <span>Discount</span>
            <span class="font-medium">- &#8377;${data.discount.toLocaleString('en-IN')}</span>
          </div>` : ''}
          
          <div class="my-3 border-t border-slate-200"></div>
          
          <div class="flex justify-between items-center py-2 mb-2">
            <span class="poppins font-bold text-slate-800">Grand Total</span>
            <span class="poppins text-xl font-bold theme-text">&#8377;${data.grandTotal.toLocaleString('en-IN')}</span>
          </div>

          <div class="flex justify-between py-2 text-sm text-slate-600 bg-slate-50 px-3 rounded-lg mt-2">
            <span>Advance Paid</span>
            <span class="font-medium text-slate-800">&#8377;${(data.advanceReceived || 0).toLocaleString('en-IN')}</span>
          </div>
          <div class="flex justify-between py-3 text-sm font-bold text-slate-800 bg-slate-100 px-3 rounded-lg mt-2">
            <span>Remaining Balance</span>
            <span class="${data.remainingAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}">&#8377;${(data.remainingAmount || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      <!-- FOOTER -->
      <div class="absolute bottom-[40px] left-[50px] right-[50px]">
        ${data.notes ? `
        <div class="mb-8 p-4 rounded-xl bg-slate-50 border border-slate-100">
          <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Notes</p>
          <p class="text-sm text-slate-700">${data.notes}</p>
        </div>` : ''}

        <div class="flex justify-between items-end border-t border-slate-200 pt-8">
          <div>
            <p class="poppins font-semibold text-slate-800 mb-1">Thank you for choosing our services!</p>
            <p class="text-xs text-slate-500">Payment is due within 15 days of issue.</p>
          </div>
          <div class="text-center w-48">
            <div class="border-b-2 border-slate-300 pb-8 mb-2"></div>
            <p class="text-xs font-semibold text-slate-500 uppercase">Authorized Signature</p>
            <p class="text-sm font-bold text-slate-800 mt-1">${settings.studioName}</p>
          </div>
        </div>
      </div>

    </div>
  </body>
  </html>
    `;
  } else {
    // REDESIGNED QUOTATION TEMPLATE
    const docNumber = data.quotationNumber;
    const docDate = data.quotationDate;

    let sectionsHtml = '';
    (data.sections || []).forEach((sec) => {
      let itemsHtml = '';
      (sec.items || []).forEach((item) => {
        if (item.trim()) {
          itemsHtml += `
            <li class="flex items-start gap-3 text-slate-700 text-[13px] leading-relaxed">
              <span class="text-sky-500 font-bold shrink-0 text-base leading-none">•</span>
              <span>${item}</span>
            </li>
          `;
        }
      });

      if (itemsHtml) {
        sectionsHtml += `
          <div class="mb-6 rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm page-break-inside-avoid">
            <div class="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
              <h3 class="poppins text-xs font-extrabold uppercase tracking-wider text-slate-800">${sec.title}</h3>
            </div>
            <div class="p-5">
              <ul class="space-y-2.5">
                ${itemsHtml}
              </ul>
            </div>
          </div>
        `;
      }
    });

    return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Quotation - ${docNumber}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@500;600;700;800&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      body { 
        font-family: 'Inter', sans-serif; 
        -webkit-print-color-adjust: exact; 
        print-color-adjust: exact; 
        background-color: white; 
        margin: 0;
        padding: 0;
      }
      .poppins { font-family: 'Poppins', sans-serif; }
      .a4-container {
        width: 210mm;
        min-height: 297mm;
        padding: 40px 50px;
        margin: 0 auto;
        box-sizing: border-box;
        position: relative;
      }
      .page-break-inside-avoid {
        page-break-inside: avoid;
      }
    </style>
  </head>
  <body>
    <div class="a4-container">
      
      <!-- HEADER -->
      <div class="flex justify-between items-start mb-8">
        <div>
          ${settings.logoData ? `<img src="${settings.logoData}" alt="Company Logo" class="max-h-16 max-w-[200px] object-contain mb-4"/>` : `<h1 class="poppins text-4xl font-extrabold tracking-tight text-sky-700 mb-1">${settings.studioName}</h1>`}
          <h2 class="poppins text-2xl font-black text-slate-900 tracking-tight mb-1">QUOTATION</h2>
          <div class="mt-2 text-xs text-slate-500">
            <span class="font-bold text-slate-400 block uppercase tracking-wider text-[10px] mb-1">Quotation Details</span>
            <span class="font-bold text-slate-700">No:</span> ${docNumber} <br/>
            <span class="font-bold text-slate-700">Date:</span> ${new Date(docDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        </div>
        <div class="text-right">
          ${settings.logoData ? `<h2 class="poppins text-xl font-bold text-sky-700 mb-1">${settings.studioName}</h2>` : ''}
          <p class="text-sm font-semibold text-slate-800">${settings.ownerName || ''}</p>
          <p class="text-sm text-slate-600 mt-1">${settings.address}</p>
          <p class="text-sm text-slate-600 mt-1.5">
            <span class="font-semibold text-slate-400">P:</span> ${settings.mobileNumber} <br/>
            <span class="font-semibold text-slate-400">E:</span> ${settings.email}
          </p>
        </div>
      </div>

      <div class="w-full h-1 rounded-full bg-slate-100 mb-8 overflow-hidden">
        <div class="h-full w-1/3 bg-sky-600"></div>
      </div>

      <!-- CLIENT & EVENT INFO CARDS -->
      <div class="grid grid-cols-2 gap-6 mb-8">
        
        <!-- CLIENT DETAILS -->
        <div class="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Client Details</p>
          <h3 class="poppins text-lg font-bold text-slate-800">${data.clientName}</h3>
          <p class="text-sm text-slate-600 mt-2 flex items-center gap-2">
            <span class="font-medium text-slate-400">Mobile:</span>
            ${data.mobileNumber}
          </p>
        </div>

        <!-- EVENT DETAILS -->
        <div class="p-5 rounded-2xl border border-slate-200 bg-sky-50/50 shadow-sm">
          <p class="text-xs font-bold text-sky-600/80 uppercase tracking-wider mb-3">Event Details</p>
          <div class="space-y-1.5 text-sm">
            <p class="text-slate-700"><span class="font-bold text-slate-400">Event:</span> ${data.eventName}</p>
            <p class="text-slate-700"><span class="font-bold text-slate-400">Date:</span> ${new Date(data.eventDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            <p class="text-slate-700"><span class="font-bold text-slate-400">Location:</span> ${data.eventLocation || 'Not Specified'}</p>
          </div>
        </div>
      </div>

      <!-- SECTIONS CONTENT -->
      <div class="mb-8">
        ${sectionsHtml || '<p class="text-center text-slate-400 py-6">No quotation contents specified.</p>'}
      </div>

      <!-- TOTAL PRICE & FOOTER -->
      <div class="mt-8 page-break-inside-avoid">
        
        <div class="flex justify-between items-center bg-sky-50 border border-sky-100 rounded-2xl p-6 mb-8">
          <div>
            <span class="poppins text-xs font-bold uppercase tracking-wider text-sky-600 block">Total Package Price</span>
            <span class="text-[10px] text-slate-400 mt-0.5 block">All inclusive price for the specified services.</span>
          </div>
          <div class="text-right">
            <span class="poppins text-3xl font-black text-sky-600">&#8377;${data.grandTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div class="flex justify-between items-end border-t border-slate-200 pt-8 mt-12">
          <div>
            <p class="poppins font-semibold text-slate-800 mb-1">Thank you for choosing our services!</p>
            <p class="text-xs text-slate-500">Terms & Conditions: Validity of this quotation is 30 days.</p>
          </div>
          <div class="text-center w-48">
            <div class="border-b-2 border-slate-300 pb-8 mb-2"></div>
            <p class="text-xs font-semibold text-slate-500 uppercase">Authorized Signature</p>
            <p class="text-sm font-bold text-slate-800 mt-1">${settings.studioName}</p>
          </div>
        </div>

      </div>

    </div>
  </body>
  </html>
    `;
  }
};

module.exports = generateHtmlTemplate;
