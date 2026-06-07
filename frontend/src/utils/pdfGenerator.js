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
  const docDate = data.billGenerateDate || data.billDate || new Date().toISOString().split('T')[0];
  const dueDate = data.eventDate || docDate;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

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
          <p class="text-xs text-slate-600 mt-1">
            <span class="font-semibold text-slate-400">Date:</span> ${formatDate(data.billGenerateDate || data.billDate)}
          </p>
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
          <li style="display: flex; align-items: flex-start; gap: 8px; font-size: 11px; color: #475569; margin-bottom: 6px;">
            <span style="color: #b45309; font-weight: bold; font-size: 12px; line-height: 1;">✓</span>
            <span>${item}</span>
          </li>
        `;
      }
    });

    if (itemsHtml) {
      sectionsHtml += `
        <div style="border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; overflow: hidden; break-inside: avoid; page-break-inside: avoid;">
          <div style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 12px 20px;">
            <h3 style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #0f172a; margin: 0;">${sec.title}</h3>
          </div>
          <div style="padding: 20px;">
            <ul style="margin: 0; padding: 0; list-style: none;">
              ${itemsHtml}
            </ul>
          </div>
        </div>
      `;
    }
  });

  const coverPageHtml = `
    <!-- PAGE 1: COVER -->
    <div class="page-break animate-in fade-in duration-500" style="width: 210mm; height: 297mm; padding: 60px; box-sizing: border-box; background-color: #0b0f19; color: white; display: flex; flex-direction: column; justify-content: space-between; position: relative; font-family: 'Poppins', sans-serif; page-break-after: always;">
      <!-- Subtle luxury border overlay -->
      <div style="position: absolute; inset: 20px; border: 1px solid rgba(217, 119, 6, 0.15); pointer-events: none;"></div>
      
      <!-- Top Section -->
      <div class="flex justify-between items-center relative z-10">
        <div>
          ${logoData ? `<img src="${logoData}" alt="Company Logo" style="max-height: 48px; max-width: 180px; object-fit: contain; filter: brightness(0) invert(1);"/>` : `<h2 style="font-size: 20px; font-weight: 800; letter-spacing: 2px; color: #d97706; margin: 0;">${settings.studioName.toUpperCase()}</h2>`}
        </div>
        <div style="text-align: right;">
          <p style="font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: rgba(255, 255, 255, 0.4); margin: 0;">Exclusive Proposal</p>
          <p style="font-size: 11px; font-weight: 700; color: #d97706; margin: 2px 0 0 0;">${docNumber}</p>
        </div>
      </div>

      <!-- Middle/Title Section -->
      <div class="my-auto relative z-10" style="padding-top: 40px; padding-bottom: 40px;">
        <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 3px; color: #d97706; display: block; margin-bottom: 16px;">Fine Art Photography & Film</span>
        <h1 style="font-family: 'Georgia', serif; font-size: 38px; font-weight: 400; line-height: 1.25; margin: 0 0 24px 0; letter-spacing: -0.5px;">
          Capturing the <br/>
          <span style="font-style: italic; color: #d97706;">Art of Your Story</span>
        </h1>
        <div style="width: 60px; height: 2px; background-color: #d97706; margin-bottom: 32px;"></div>
        
        <p style="font-size: 13px; color: rgba(255, 255, 255, 0.6); max-width: 420px; leading-relaxed: 1.7; margin: 0;">
          A bespoke visual services proposal customized for your upcoming event, balancing raw candid emotion with timeless editorial elegance.
        </p>
      </div>

      <!-- Bottom Metadata Section -->
      <div class="grid grid-cols-2 gap-8 relative z-10 border-t border-white/10 pt-8" style="font-size: 11px;">
        <div>
          <span style="color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">Prepared For</span>
          <span style="font-size: 14px; font-weight: 700; color: white; display: block;">${data.clientName}</span>
          <span style="color: rgba(255,255,255,0.6); display: block; margin-top: 2px;">${data.mobileNumber}</span>
        </div>
        <div style="text-align: right;">
          <span style="color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">Event Details</span>
          <span style="font-size: 13px; font-weight: 700; color: white; display: block;">${data.eventName}</span>
          <span style="color: rgba(255,255,255,0.6); display: block; margin-top: 2px;">
            ${new Date(data.eventDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
            ${data.eventLocation ? ` • ${data.eventLocation}` : ''}
          </span>
        </div>
      </div>
    </div>
  `;

  const page2Html = `
    <!-- PAGE 2: ABOUT US & PHILOSOPHY -->
    <div class="page-break" style="width: 210mm; height: 297mm; padding: 60px; box-sizing: border-box; background-color: #ffffff; color: #1e293b; display: flex; flex-direction: column; justify-content: space-between; font-family: 'Poppins', sans-serif; page-break-after: always;">
      
      <!-- Top Nav -->
      <div class="flex justify-between items-center" style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 1px solid #f1f5f9; padding-bottom: 16px;">
        <span style="color: #64748b;">01 / Vision & Offerings</span>
        <span style="color: #b45309;">${settings.studioName}</span>
      </div>

      <!-- Body Section -->
      <div style="margin-top: 40px; margin-bottom: auto; display: flex; flex-direction: column; gap: 40px;">
        <div style="max-width: 580px;">
          <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #b45309; display: block; margin-bottom: 12px;">Our Philosophy</span>
          <h2 style="font-family: 'Georgia', serif; font-size: 26px; font-weight: 400; line-height: 1.35; margin: 0 0 16px 0; color: #0f172a;">
            Crafting visual stories that stand the test of time.
          </h2>
          <p style="font-size: 12px; color: #475569; line-height: 1.7; margin: 0;">
            Our mission is simple: to capture your most significant moments in their truest and most aesthetic light. We blend classic editorial portraiture with raw, candid photojournalism and cinematic storytelling, ensuring that every frame we capture remains a family heirloom.
          </p>
        </div>

        <!-- Editorial Grid representing Portfolio Categories -->
        <div>
          <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #b45309; display: block; margin-bottom: 16px;">Core Expertise</span>
          <div class="grid grid-cols-2 gap-4">
            
            <div style="border: 1px solid #f1f5f9; padding: 20px; border-radius: 16px; background-color: #fafafa;">
              <div style="width: 8px; height: 8px; border-radius: 50%; background-color: #b45309; margin-bottom: 12px;"></div>
              <h4 style="font-size: 13px; font-weight: 700; color: #0f172a; margin: 0 0 6px 0;">Fine-Art Photography</h4>
              <p style="font-size: 11px; color: #64748b; margin: 0; line-height: 1.6;">Luminous editorial portraiture, capturing the depth of emotions, gestures, and details with cinematic lighting.</p>
            </div>

            <div style="border: 1px solid #f1f5f9; padding: 20px; border-radius: 16px; background-color: #fafafa;">
              <div style="width: 8px; height: 8px; border-radius: 50%; background-color: #b45309; margin-bottom: 12px;"></div>
              <h4 style="font-size: 13px; font-weight: 700; color: #0f172a; margin: 0 0 6px 0;">4K Cinematography</h4>
              <p style="font-size: 11px; color: #64748b; margin: 0; line-height: 1.6;">High-definition wedding films, reels, highlights, and cinematic sound designs tailored for digital screens and theater scopes.</p>
            </div>

            <div style="border: 1px solid #f1f5f9; padding: 20px; border-radius: 16px; background-color: #fafafa;">
              <div style="width: 8px; height: 8px; border-radius: 50%; background-color: #b45309; margin-bottom: 12px;"></div>
              <h4 style="font-size: 13px; font-weight: 700; color: #0f172a; margin: 0 0 6px 0;">Pre-Wedding Editorial</h4>
              <p style="font-size: 11px; color: #64748b; margin: 0; line-height: 1.6;">Stylized editorial concepts, multi-location coverage, aerial drone filming, and bespoke style consulting.</p>
            </div>

            <div style="border: 1px solid #f1f5f9; padding: 20px; border-radius: 16px; background-color: #fafafa;">
              <div style="width: 8px; height: 8px; border-radius: 50%; background-color: #b45309; margin-bottom: 12px;"></div>
              <h4 style="font-size: 13px; font-weight: 700; color: #0f172a; margin: 0 0 6px 0;">High-End Post Production</h4>
              <p style="font-size: 11px; color: #64748b; margin: 0; line-height: 1.6;">Bespoke color grading, professional retouching, signature layouts, and premium physical leather-bound albums.</p>
            </div>

          </div>
        </div>
      </div>

      <!-- Page Footer -->
      <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; font-size: 9px; color: #94a3b8; text-align: right;">
        Creative Proposal • Confidential Information
      </div>
    </div>
  `;

  const page3Html = `
    <!-- PAGE 3: BESPOKE PACKAGE SUMMARY -->
    <div class="page-break" style="width: 210mm; height: 297mm; padding: 60px; box-sizing: border-box; background-color: #ffffff; color: #1e293b; display: flex; flex-direction: column; justify-content: space-between; font-family: 'Poppins', sans-serif; page-break-after: always;">
      
      <!-- Top Nav -->
      <div class="flex justify-between items-center" style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 1px solid #f1f5f9; padding-bottom: 16px;">
        <span style="color: #64748b;">02 / Customized Package</span>
        <span style="color: #b45309;">Prepared For: ${data.clientName}</span>
      </div>

      <!-- Dynamic Sections Grid -->
      <div style="margin-top: 30px; margin-bottom: auto; display: flex; flex-direction: column; gap: 20px;">
        <div>
          <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #b45309; display: block; margin-bottom: 6px;">Your Visual Roster</span>
          <h2 style="font-family: 'Georgia', serif; font-size: 22px; font-weight: 400; margin: 0 0 10px 0; color: #0f172a;">Custom Package Inclusions</h2>
          <p style="font-size: 11px; color: #64748b; margin: 0;">Each service group has been designed to align with your personal vision and event itinerary.</p>
        </div>

        <div class="grid grid-cols-2 gap-4" style="align-items: start;">
          ${sectionsHtml || '<div class="col-span-2 text-center py-12 text-slate-400 text-xs">No customized service sections created.</div>'}
        </div>
      </div>

      <!-- Page Footer -->
      <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; font-size: 9px; color: #94a3b8; text-align: right;">
        Custom Inclusions Summary • Section 02
      </div>
    </div>
  `;

  const page4Html = `
    <!-- PAGE 4: INVESTMENT & TERMS -->
    <div style="width: 210mm; height: 297mm; padding: 60px; box-sizing: border-box; background-color: #ffffff; color: #1e293b; display: flex; flex-direction: column; justify-content: space-between; font-family: 'Poppins', sans-serif;">
      
      <!-- Top Nav -->
      <div class="flex justify-between items-center" style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 1px solid #f1f5f9; padding-bottom: 16px;">
        <span style="color: #64748b;">03 / Pricing & Engagement</span>
        <span style="color: #b45309;">Investment Summary</span>
      </div>

      <!-- Content -->
      <div style="margin-top: 30px; margin-bottom: auto; display: flex; flex-direction: column; gap: 32px;">
        
        <!-- Timeline Section -->
        <div>
          <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #b45309; display: block; margin-bottom: 12px;">The Creative Journey</span>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; border-left: 0;">
            
            <div style="position: relative; padding-top: 8px;">
              <span style="font-family: 'Georgia', serif; font-size: 24px; font-weight: 700; color: rgba(180, 83, 9, 0.15); display: block; line-height: 1;">01</span>
              <span style="font-size: 11px; font-weight: 700; color: #0f172a; display: block; margin-top: 4px;">Consultation</span>
              <span style="font-size: 10px; color: #64748b; display: block; margin-top: 2px;">Conceptualizing style preferences.</span>
            </div>

            <div style="position: relative; padding-top: 8px;">
              <span style="font-family: 'Georgia', serif; font-size: 24px; font-weight: 700; color: rgba(180, 83, 9, 0.15); display: block; line-height: 1;">02</span>
              <span style="font-size: 11px; font-weight: 700; color: #0f172a; display: block; margin-top: 4px;">Production</span>
              <span style="font-size: 10px; color: #64748b; display: block; margin-top: 2px;">Candid and fine-art shooting.</span>
            </div>

            <div style="position: relative; padding-top: 8px;">
              <span style="font-family: 'Georgia', serif; font-size: 24px; font-weight: 700; color: rgba(180, 83, 9, 0.15); display: block; line-height: 1;">03</span>
              <span style="font-size: 11px; font-weight: 700; color: #0f172a; display: block; margin-top: 4px;">Curation</span>
              <span style="font-size: 10px; color: #64748b; display: block; margin-top: 2px;">Color grading & professional retouching.</span>
            </div>

            <div style="position: relative; padding-top: 8px;">
              <span style="font-family: 'Georgia', serif; font-size: 24px; font-weight: 700; color: rgba(180, 83, 9, 0.15); display: block; line-height: 1;">04</span>
              <span style="font-size: 11px; font-weight: 700; color: #0f172a; display: block; margin-top: 4px;">Delivery</span>
              <span style="font-size: 10px; color: #64748b; display: block; margin-top: 2px;">Online portal and custom hand-made album.</span>
            </div>

          </div>
        </div>

        <!-- Testimonial Block -->
        <div style="border-left: 2px solid #b45309; padding: 4px 0 4px 20px; background-color: #fffbeb;">
          <p style="font-family: 'Georgia', serif; font-style: italic; font-size: 12px; color: #b45309; margin: 0 0 6px 0; line-height: 1.6;">
            "An absolute dream to work with. They captured the light, the energy, and the quiet intimate details in a way that felt completely natural and cinematic. Timeless."
          </p>
          <span style="font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #78350f;">— ARJUN & MEERA, WEDDING PORTFOLIO</span>
        </div>

        <!-- Grand Total Block Card -->
        <div style="border: 2px solid #b45309; border-radius: 20px; padding: 24px 30px; display: flex; justify-content: space-between; align-items: center; background-color: #fafafa; box-shadow: 0 4px 12px rgba(180, 83, 9, 0.05);">
          <div>
            <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #b45309; display: block;">Total Package Investment</span>
            <span style="font-size: 9px; color: #94a3b8; display: block; margin-top: 2px;">Inclusive of all crew, equipment, conceptual consulting, and post production.</span>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 30px; font-weight: 900; color: #b45309; display: block; line-height: 1;">₹${(data.grandTotal || 0).toLocaleString('en-IN')}</span>
            <span style="font-size: 9px; color: #64748b; display: block; margin-top: 4px;">All inclusive package rate</span>
          </div>
        </div>

      </div>

      <!-- Signatures & Footer -->
      <div style="margin-top: 40px;">
        <p style="font-size: 10px; color: #94a3b8; line-height: 1.5; margin: 0 0 32px 0;">
          Terms: To lock the booking, a 50% reservation advance is required. Quotation validity is 30 days from issued date.
        </p>

        <div class="grid grid-cols-2 gap-12" style="font-size: 11px;">
          <div>
            <div style="border-bottom: 1px solid #cbd5e1; padding-bottom: 24px; margin-bottom: 8px;"></div>
            <span style="font-weight: 700; color: #0f172a; display: block;">Client Acceptance Signature</span>
            <span style="font-size: 10px; color: #64748b; display: block; margin-top: 2px;">Date: ____ / ____ / ________</span>
          </div>
          <div>
            <div style="border-bottom: 1px solid #cbd5e1; padding-bottom: 24px; margin-bottom: 8px;"></div>
            <span style="font-weight: 700; color: #0f172a; display: block;">Authorized Studio Representative</span>
            <span style="font-size: 10px; color: #b45309; display: block; margin-top: 2px;">${settings.studioName}</span>
          </div>
        </div>
      </div>

    </div>
  `;

  return `${coverPageHtml}${page2Html}${page3Html}${page4Html}`;
};

const getPaymentReportHtml = (ledgers, settings, logoData) => {
  let totalPaymentsGiven = 0;

  let tableRows = '';
  ledgers.forEach((l, index) => {
    totalPaymentsGiven += l.amountGiven || 0;
    const bgClass = index % 2 === 0 ? 'bg-white' : 'bg-slate-50';

    // Format date to DD-MM-YYYY if it is YYYY-MM-DD
    let displayDate = l.paymentDate || '';
    if (displayDate.includes('-')) {
      const parts = displayDate.split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        displayDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }

    tableRows += `
      <tr class="${bgClass} border-b border-slate-100">
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
      <div class="flex justify-end mb-12 text-xs">
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

  // Create fixed positioned container underneath everything (z-index: -9999)
  // html2canvas requires the element to be in the DOM and visible (not display: none or offscreen coordinates)
  // to correctly render bounding boxes and calculate stylesheet formatting.
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '0';
  container.style.top = '0';
  container.style.width = '210mm';
  container.style.zIndex = '-9999';
  container.style.backgroundColor = 'white';
  container.innerHTML = html;
  document.body.appendChild(container);

  // Wait 150ms for the browser to perform layout, paint, and apply active Tailwind styles
  await new Promise((resolve) => setTimeout(resolve, 150));

  const opt = {
    margin:       0,
    filename:     `${type.toLowerCase()}_report.pdf`,
    image:        { type: 'jpeg', quality: 0.95 },
    html2canvas:  { scale: 2, useCORS: true, logging: false },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak:    { mode: ['css', 'legacy'] }
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
