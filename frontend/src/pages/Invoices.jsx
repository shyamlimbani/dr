import React, { useState, useEffect, useRef } from 'react';
import apiClient, { getBaseUrl, getAssetUrl } from '../services/api';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Printer,
  Download,
  Eye,
  X,
  FileText,
  FileSpreadsheet,
  Trash
} from 'lucide-react';
import { useSettings } from '../services/SettingsContext';
import { generatePdf, getBillHtml, getQuotationHtml, getCompressedLogo } from '../utils/pdfGenerator';

const Invoices = () => {
  const [activeTab, setActiveTab] = useState('bills'); // 'bills' | 'quotations'
  
  // PDF Preview Refs & State
  const quotationRef = useRef(null);
  const [previewItem, setPreviewItem] = useState(null);
  const [previewType, setPreviewType] = useState(''); // 'Bill' | 'Quotation'
  const [previewAction, setPreviewAction] = useState('download');
  const [logoData, setLogoData] = useState(null);
  
  // Global settings context
  const { settings } = useSettings();

  // Data State
  const [bills, setBills] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State (Shared mostly)
  const [clientName, setClientName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [billGenerateDate, setBillGenerateDate] = useState(new Date().toISOString().split('T')[0]);
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [discount, setDiscount] = useState(0);
  const [advanceReceived, setAdvanceReceived] = useState(0);
  const [notes, setNotes] = useState('');

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };
  
  // Dynamic Services Array (Used by Bills)
  const [services, setServices] = useState([
    { serviceName: '', quantity: 1, price: 0, total: 0 }
  ]);

  // Dynamic Sections Array (Used by Quotations)
  const [sections, setSections] = useState([
    { title: 'Day 01', items: [''] }
  ]);

  // Manual grand total state (Used by Quotations)
  const [manualGrandTotal, setManualGrandTotal] = useState('');

  // Compress company logo on settings load
  useEffect(() => {
    if (settings && settings.companyLogo) {
      getCompressedLogo(settings.companyLogo)
        .then(data => setLogoData(data))
        .catch(err => console.error('Error pre-compressing logo:', err));
    }
  }, [settings]);

  // Auto-generate PDF once preview element renders in active DOM
  useEffect(() => {
    if (previewItem && quotationRef.current) {
      const timer = setTimeout(async () => {
        try {
          // Ensure the element has actual content before generating PDF
          const content = quotationRef.current.innerHTML;
          if (!content || content.trim() === '') {
             throw new Error('Container is empty');
          }
          
          const docNumber = previewItem.billNumber || previewItem.quotationNumber || 'document';
          const filename = `${previewType.toLowerCase()}_${docNumber}.pdf`;
          
          console.log(`E2E Rendering visible ${previewType} preview for ${docNumber}...`);
          await generatePdf(quotationRef.current, filename, previewAction);
        } catch (err) {
          console.error('PDF Action failed:', err);
          alert('PDF Generation failed: ' + err.message);
        } finally {
          setPreviewItem(null); // Clean up / close preview
        }
      }, 500); // 500ms delay to ensure styles and font paint completely
      return () => clearTimeout(timer);
    }
  }, [previewItem]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'bills') {
        const res = await apiClient.get('/bills');
        setBills(res.data);
      } else {
        const res = await apiClient.get('/quotations');
        setQuotations(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setClientName('');
    setMobileNumber('');
    setBillGenerateDate(new Date().toISOString().split('T')[0]);
    setEventName('');
    setEventDate('');
    setEventLocation('');
    setDiscount(0);
    setAdvanceReceived(0);
    setNotes('');
    setServices([{ serviceName: '', quantity: 1, price: 0, total: 0 }]);
    if (activeTab === 'quotations') {
      setSections([
        { title: 'DAY 01', items: ['Regular Photography', 'Regular DSLR Videography', 'Candidate Photography', 'Candidate DSLR Video'] },
        { title: 'DAY 02', items: ['Regular Photography', 'Regular DSLR Videography', 'Candidate Photography', 'Candidate DSLR Video'] },
        { title: 'PRE WEDDING SHOOT', items: ['Candidate Photography', 'Cinematic Videography', 'Drone Video'] },
        { title: 'VIDEO OUTPUT', items: ['Full Video Editing', 'Wedding Highlight', 'Reels Editing', 'Pen Drive'] },
        { title: 'PHOTO OUTPUT', items: ['Album', 'Couple Frame', 'Raw Photos', 'Edited Photos'] }
      ]);
      setManualGrandTotal('');
    }
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingId(item._id);
    setClientName(item.clientName);
    setMobileNumber(item.mobileNumber);
    setBillGenerateDate(item.billGenerateDate || item.billDate || new Date().toISOString().split('T')[0]);
    setEventName(item.eventName);
    setEventDate(item.eventDate);
    setEventLocation(item.eventLocation || '');
    setDiscount(item.discount || 0);
    setAdvanceReceived(item.advanceReceived || 0);
    setNotes(item.notes || '');
    setServices(item.services && item.services.length > 0 ? item.services : [{ serviceName: '', quantity: 1, price: 0, total: 0 }]);
    if (activeTab === 'quotations') {
      setSections(item.sections && item.sections.length > 0 ? item.sections : []);
      setManualGrandTotal(item.grandTotal || '');
    }
    setShowModal(true);
  };

  // Service Handlers (Bills)
  const addServiceRow = () => {
    setServices([...services, { serviceName: '', quantity: 1, price: 0, total: 0 }]);
  };

  const removeServiceRow = (index) => {
    const updated = [...services];
    updated.splice(index, 1);
    setServices(updated);
  };

  const updateService = (index, field, value) => {
    const updated = [...services];
    updated[index][field] = value;
    if (field === 'quantity' || field === 'price') {
      updated[index].total = Number(updated[index].quantity) * Number(updated[index].price);
    }
    setServices(updated);
  };

  // Section Handlers (Quotations)
  const addSection = (title = 'New Section') => {
    setSections([...sections, { title, items: [''] }]);
  };

  const removeSection = (sectionIndex) => {
    const updated = [...sections];
    updated.splice(sectionIndex, 1);
    setSections(updated);
  };

  const updateSectionTitle = (sectionIndex, title) => {
    const updated = [...sections];
    updated[sectionIndex].title = title;
    setSections(updated);
  };

  const addSectionItem = (sectionIndex) => {
    const updated = [...sections];
    updated[sectionIndex].items.push('');
    setSections(updated);
  };

  const updateSectionItem = (sectionIndex, itemIndex, val) => {
    const updated = [...sections];
    updated[sectionIndex].items[itemIndex] = val;
    setSections(updated);
  };

  const removeSectionItem = (sectionIndex, itemIndex) => {
    const updated = [...sections];
    updated[sectionIndex].items.splice(itemIndex, 1);
    setSections(updated);
  };

  // Calculations
  const subtotal = services.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
  const grandTotal = activeTab === 'bills' ? Math.max(0, subtotal - Number(discount)) : Number(manualGrandTotal) || 0;
  const remainingAmount = Math.max(0, grandTotal - Number(advanceReceived));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = activeTab === 'bills' ? {
      clientName,
      mobileNumber,
      billGenerateDate,
      billDate: billGenerateDate,
      eventName,
      eventDate,
      eventLocation,
      services,
      subtotal,
      discount: Number(discount),
      grandTotal,
      advanceReceived: Number(advanceReceived),
      remainingAmount,
      notes
    } : {
      clientName,
      mobileNumber,
      eventName,
      eventDate,
      eventLocation,
      sections,
      grandTotal: Number(manualGrandTotal) || 0
    };

    try {
      if (activeTab === 'bills') {
        if (editingId) {
          await apiClient.put(`/bills/${editingId}`, payload);
        } else {
          await apiClient.post('/bills', payload);
        }
      } else {
        if (editingId) {
          await apiClient.put(`/quotations/${editingId}`, payload);
        } else {
          await apiClient.post('/quotations', { ...payload, quotationDate: new Date().toISOString().split('T')[0] });
        }
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Unknown error';
      alert(`Save Failed:\n${errorMsg}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        if (activeTab === 'bills') await apiClient.delete(`/bills/${id}`);
        else await apiClient.delete(`/quotations/${id}`);
        fetchData();
      } catch (err) {
        alert('Error deleting record');
      }
    }
  };

  const handlePdfAction = async (id, action) => {
    try {
      setPdfLoading(true);
      const item = activeTab === 'bills'
        ? bills.find(b => b._id === id)
        : quotations.find(q => q._id === id);

      if (!item) {
        alert('Document record not found locally');
        return;
      }

      const type = activeTab === 'bills' ? 'Bill' : 'Quotation';
      setPreviewType(type);
      setPreviewAction(action);
      setPreviewItem(item);
    } catch (err) {
      console.error('Error starting PDF action:', err);
      alert('Failed to initialize PDF preview.');
    } finally {
      setPdfLoading(false);
    }
  };

  const filteredData = (activeTab === 'bills' ? bills : quotations).filter(item => 
    (item.clientName || '').toLowerCase().includes(search.toLowerCase()) ||
    (item.billNumber || item.quotationNumber || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">
          Bill & Quotation
        </h2>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all text-sm"
        >
          <Plus size={18} />
          {activeTab === 'bills' ? 'Add New Bill' : 'Add New Quotation'}
        </button>
      </div>

      {/* TABS & SEARCH */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl flex flex-col sm:flex-row justify-between gap-4">
        
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('bills')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'bills' 
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <FileText size={16} />
            Bills
          </button>
          <button 
            onClick={() => setActiveTab('quotations')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'quotations' 
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <FileSpreadsheet size={16} />
            Quotations
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search size={18} className="absolute left-4 top-3 text-slate-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* HISTORY LIST */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-500 font-medium">No records found.</p>
          </div>
        ) : (
          <>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider">Number</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider">Client Name</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider">Date</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider text-right">Amount</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredData.map(item => (
                  <tr key={item._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-indigo-600 dark:text-indigo-400">
                      {item.billNumber || item.quotationNumber}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-white">
                      {item.clientName}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {item.billGenerateDate ? formatDate(item.billGenerateDate) : (item.billDate ? formatDate(item.billDate) : new Date(item.quotationDate).toLocaleDateString())}
                    </td>
                    <td className="px-6 py-4 font-black text-slate-800 dark:text-white text-right">
                      ₹{item.grandTotal?.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 flex items-center justify-center gap-2">
                      <button onClick={() => handlePdfAction(item._id, 'view')} title="View PDF" className="p-2 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 rounded-lg transition-colors">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => handlePdfAction(item._id, 'download')} title="Download PDF" className="p-2 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 rounded-lg transition-colors">
                        <Download size={16} />
                      </button>
                      <button onClick={() => handlePdfAction(item._id, 'print')} title="Print PDF" className="p-2 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                        <Printer size={16} />
                      </button>
                      <button onClick={() => openEditModal(item)} title="Edit" className="p-2 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(item._id)} title="Delete" className="p-2 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARDS VIEW */}
          <div className="md:hidden flex flex-col gap-4">
            {filteredData.map(item => (
              <div key={item._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-800 dark:text-white line-clamp-1">{item.clientName}</h3>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                      <span className="font-bold text-slate-400">{item.documentNumber || item.quotationNumber}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total</span>
                    <span className="font-black text-lg text-slate-800 dark:text-white">₹{item.grandTotal?.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Event</span>
                    <p className="font-medium line-clamp-1">{item.eventName}</p>
                  </div>
                  <div className="space-y-0.5 text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Date</span>
                    <p className="font-medium">
                      {item.billGenerateDate ? formatDate(item.billGenerateDate) : (item.billDate ? formatDate(item.billDate) : new Date(item.quotationDate).toLocaleDateString())}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex gap-2">
                    <button onClick={() => handlePdfAction(item._id, 'view')} className="w-12 h-12 flex items-center justify-center bg-blue-500/10 text-blue-600 rounded-xl hover:bg-blue-500/20 transition-colors">
                      <Eye size={18} />
                    </button>
                    <button onClick={() => handlePdfAction(item._id, 'download')} className="w-12 h-12 flex items-center justify-center bg-emerald-500/10 text-emerald-600 rounded-xl hover:bg-emerald-500/20 transition-colors">
                      <Download size={18} />
                    </button>
                    <button onClick={() => handlePdfAction(item._id, 'print')} className="w-12 h-12 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                      <Printer size={18} />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEditModal(item)} className="w-12 h-12 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(item._id)} className="w-12 h-12 flex items-center justify-center bg-rose-500/10 text-rose-600 rounded-xl hover:bg-rose-500/20 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      </div>

      {/* FORM MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-xl">
                {editingId ? `Edit ${activeTab === 'bills' ? 'Bill' : 'Quotation'}` : `Create ${activeTab === 'bills' ? 'Bill' : 'Quotation'}`}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>
                     <div className="p-6 overflow-y-auto flex-1">
              {activeTab === 'quotations' && (
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                  <div>
                    <span className="font-bold text-slate-400 block uppercase tracking-wider text-[10px] mb-1">Company Details (Auto Fetched)</span>
                    <h5 className="font-bold text-slate-800 dark:text-white text-sm">{settings.studioName || 'Studio Name'}</h5>
                    <p className="text-slate-500 mt-0.5">{settings.ownerName} • {settings.email} • {settings.mobileNumber}</p>
                  </div>
                  <div className="text-left sm:text-right max-w-xs">
                    <span className="font-bold text-slate-400 block uppercase tracking-wider text-[10px] mb-1">Address</span>
                    <p className="text-slate-500 mt-0.5">{settings.address || 'No Address Set'}</p>
                  </div>
                </div>
              )}

              <form id="docForm" onSubmit={handleSubmit} className="space-y-8">
                
                {/* Client & Event Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">Client Details</h4>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Client Name</label>
                      <input required type="text" value={clientName} onChange={e => setClientName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Mobile Number</label>
                      <input required type="text" value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
                    </div>
                    {activeTab === 'bills' && (
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Bill Generate Date</label>
                        <input required type="date" value={billGenerateDate} onChange={e => setBillGenerateDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">Event Details</h4>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Event Name</label>
                      <input required type="text" value={eventName} onChange={e => setEventName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500" placeholder="e.g. Rahul's Wedding" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">{activeTab === 'bills' ? 'Event Date' : 'Booking Date'}</label>
                      <input required type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Event Location</label>
                      <input type="text" value={eventLocation} onChange={e => setEventLocation(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
                    </div>
                  </div>
                </div>

                {/* Services Section for Bills */}
                {activeTab === 'bills' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-2">
                      <h4 className="font-bold text-slate-800 dark:text-white">Services</h4>
                      <button type="button" onClick={addServiceRow} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                        <Plus size={14} /> Add Row
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {services.map((srv, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                          <div className="flex-1 w-full">
                            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 sm:hidden">Service Name</label>
                            <input 
                              required 
                              type="text" 
                              placeholder="e.g. Photography, Drone Shoot"
                              value={srv.serviceName} 
                              onChange={e => updateService(idx, 'serviceName', e.target.value)} 
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" 
                            />
                          </div>
                          <div className="w-full sm:w-24">
                            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 sm:hidden">Qty</label>
                            <input 
                              required 
                              type="number" 
                              min="1"
                              value={srv.quantity} 
                              onChange={e => updateService(idx, 'quantity', e.target.value)} 
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-center" 
                            />
                          </div>
                          <div className="w-full sm:w-32">
                            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 sm:hidden">Price (₹)</label>
                            <input 
                              required 
                              type="number" 
                              value={srv.price} 
                              onChange={e => updateService(idx, 'price', e.target.value)} 
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" 
                            />
                          </div>
                          <div className="w-full sm:w-32 flex justify-between items-center bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg border border-transparent">
                            <span className="text-[10px] font-bold uppercase text-slate-400 sm:hidden">Total</span>
                            <span className="font-bold text-slate-800 dark:text-white">₹{srv.total}</span>
                          </div>
                          {services.length > 1 && (
                            <button type="button" onClick={() => removeServiceRow(idx)} className="p-2 text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors shrink-0">
                              <Trash size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quotation Content Builder */}
                {activeTab === 'quotations' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-2">
                      <h4 className="font-bold text-slate-800 dark:text-white">Quotation Content Builder</h4>
                      <button 
                        type="button" 
                        onClick={() => addSection('New Section')} 
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <Plus size={14} /> Add Section
                      </button>
                    </div>

                    <div className="space-y-6">
                      {sections.map((sec, secIdx) => (
                        <div key={secIdx} className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                          <div className="flex items-center justify-between gap-4">
                            <input 
                              required
                              type="text" 
                              placeholder="Section Title (e.g. DAY 01)"
                              value={sec.title} 
                              onChange={e => updateSectionTitle(secIdx, e.target.value)} 
                              className="font-bold text-slate-800 dark:text-white bg-transparent border-b border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:outline-none px-1 py-0.5 text-sm"
                            />
                            <button 
                              type="button" 
                              onClick={() => removeSection(secIdx)} 
                              className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1 font-semibold"
                            >
                              <Trash size={14} /> Remove Section
                            </button>
                          </div>

                          <div className="space-y-2 pl-4 border-l-2 border-indigo-100 dark:border-indigo-950">
                            {sec.items.map((item, itemIdx) => (
                              <div key={itemIdx} className="flex items-center gap-2">
                                <input 
                                  required
                                  type="text" 
                                  placeholder="e.g. Regular DSLR Videography"
                                  value={item} 
                                  onChange={e => updateSectionItem(secIdx, itemIdx, e.target.value)} 
                                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
                                />
                                {sec.items.length > 1 && (
                                  <button 
                                    type="button" 
                                    onClick={() => removeSectionItem(secIdx, itemIdx)} 
                                    className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                                  >
                                    <X size={14} />
                                  </button>
                                )}
                              </div>
                            ))}
                            <button 
                              type="button" 
                              onClick={() => addSectionItem(secIdx)} 
                              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 pt-1"
                            >
                              <Plus size={12} /> Add Item
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Totals & Notes Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 border-t border-slate-100 dark:border-slate-800 pt-6">
                  
                  {/* Left Side: Notes */}
                  <div className="space-y-4">
                    {activeTab === 'bills' && (
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Notes</label>
                        <textarea 
                          rows={4} 
                          value={notes} 
                          onChange={e => setNotes(e.target.value)} 
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" 
                          placeholder="Payment terms, special instructions, etc."
                        ></textarea>
                      </div>
                    )}
                  </div>

                  {/* Right Side: Calculations */}
                  {activeTab === 'bills' ? (
                    <div className="space-y-3 bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <div className="flex justify-between items-center text-sm font-semibold text-slate-600 dark:text-slate-400">
                        <span>Subtotal</span>
                        <span>₹{subtotal}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-semibold text-slate-600 dark:text-slate-400">
                        <span>Discount (₹)</span>
                        <input 
                          type="number" 
                          value={discount} 
                          onChange={e => setDiscount(e.target.value)} 
                          className="w-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-right focus:outline-none focus:border-indigo-500" 
                        />
                      </div>
                      <div className="flex justify-between items-center text-lg font-black text-slate-800 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                        <span>Grand Total</span>
                        <span>₹{grandTotal}</span>
                      </div>

                      <div className="flex justify-between items-center text-sm font-semibold text-slate-600 dark:text-slate-400 pt-4">
                        <span>Advance Received (₹)</span>
                        <input 
                          type="number" 
                          value={advanceReceived} 
                          onChange={e => setAdvanceReceived(e.target.value)} 
                          className="w-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-right focus:outline-none focus:border-indigo-500" 
                        />
                      </div>
                      <div className="flex justify-between items-center text-lg font-black text-orange-500 pt-2 border-t border-slate-200 dark:border-slate-800">
                        <span>Remaining Balance</span>
                        <span>₹{remainingAmount}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <div className="flex justify-between items-center text-lg font-black text-slate-800 dark:text-white">
                        <span>Grand Total Package Price (₹)</span>
                        <input 
                          required
                          type="number" 
                          value={manualGrandTotal} 
                          onChange={e => setManualGrandTotal(e.target.value)} 
                          className="w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-right font-black focus:outline-none focus:border-indigo-500 text-lg" 
                        />
                      </div>
                    </div>
                  )}

                </div>

              </form>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex gap-3 shrink-0 bg-slate-50 dark:bg-slate-950">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 h-12 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm">
                Cancel
              </button>
              <button type="submit" form="docForm" className="flex-1 h-12 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all text-sm">
                {editingId ? 'Update' : 'Save'} Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Generation Loader Overlay */}
      {pdfLoading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl flex flex-col items-center gap-4 border border-slate-100 dark:border-slate-800">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
            <p className="text-sm font-bold text-slate-800 dark:text-white">Generating PDF...</p>
          </div>
        </div>
      )}

      {/* VISIBLE PDF PREVIEW PORTAL (Rendered inside React DOM to ensure correct layouts/Tailwind compilation) */}
      {previewItem && (
        <div 
          id="pdf-preview-portal"
          className="fixed inset-0 z-50 flex flex-col items-center justify-start bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-4xl w-full flex flex-col items-center gap-4 my-8 animate-in zoom-in-95 duration-200">
            <div className="w-full flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <h4 className="font-bold text-lg text-slate-850 dark:text-white">Generating PDF (Visible Preview)...</h4>
              <span className="text-xs text-slate-400 font-medium">Please wait, compiling canvas layout...</span>
            </div>
            
            {/* The actual target element referenced for PDF capture */}
            <div className="w-full overflow-x-auto flex justify-center py-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div 
                style={{ width: '210mm', minHeight: '297mm', padding: '15mm 15mm 25mm 15mm', boxSizing: 'border-box' }}
                className="bg-white text-slate-900 relative shadow-md"
              >
                <div
                  ref={quotationRef}
                  style={{ width: '180mm', boxSizing: 'border-box' }}
                  dangerouslySetInnerHTML={{ 
                    __html: previewType === 'Bill' 
                      ? getBillHtml(previewItem, settings, logoData) 
                      : getQuotationHtml(previewItem, settings, logoData) 
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
