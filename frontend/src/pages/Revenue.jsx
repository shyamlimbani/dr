import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit2, Phone, User, Calendar, X, Download, Search, Users, DollarSign, Activity } from 'lucide-react';
import apiClient from '../services/api';
import { useSettings } from '../services/SettingsContext';
import { generatePdf, getRevenueReportHtml, getCompressedLogo } from '../utils/pdfGenerator';

const Revenue = () => {
  const { settings } = useSettings();
  
  // PDF Preview Refs & State
  const revenueReportRef = useRef(null);
  const [previewData, setPreviewData] = useState(null);
  const [logoData, setLogoData] = useState(null);

  const [revenues, setRevenues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [clientName, setClientName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [pendingAmount, setPendingAmount] = useState('');
  const [revenueDate, setRevenueDate] = useState('');
  const [notes, setNotes] = useState('');

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
    if (previewData && revenueReportRef.current) {
      // Ensure the element has actual content before generating PDF
      const timer = setTimeout(async () => {
        try {
          const content = revenueReportRef.current.innerHTML;
          if (!content || content.trim() === '') {
             throw new Error('Container is empty');
          }
          const filename = `revenue_report_${new Date().toISOString().split('T')[0]}.pdf`;
          console.log('Rendering visible Revenue Report preview...');
          await generatePdf(revenueReportRef.current, filename, 'download');
        } catch (err) {
          console.error('PDF Action failed:', err);
          alert('PDF Generation failed: ' + err.message);
        } finally {
          setPreviewData(null); // Clean up / close preview
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [previewData]);

  useEffect(() => {
    fetchRevenues();
  }, []);

  const fetchRevenues = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/revenues');
      setRevenues(res.data || []);
    } catch (err) {
      console.error('Error fetching revenues:', err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setClientName('');
    setMobileNumber('');
    setTotalAmount('');
    setPendingAmount('');
    setRevenueDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setShowModal(true);
  };

  const openEditModal = (rev) => {
    setEditingId(rev._id);
    setClientName(rev.clientName);
    setMobileNumber(rev.mobileNumber);
    setTotalAmount(rev.totalAmount);
    setPendingAmount(rev.pendingAmount);
    setRevenueDate(rev.revenueDate);
    setNotes(rev.notes || '');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      clientName,
      mobileNumber,
      totalAmount: Number(totalAmount),
      pendingAmount: Number(pendingAmount),
      revenueDate,
      notes
    };

    try {
      if (editingId) {
        await apiClient.put(`/revenues/${editingId}`, payload);
      } else {
        await apiClient.post('/revenues', payload);
      }
      setShowModal(false);
      fetchRevenues();
    } catch (err) {
      alert('Failed to save revenue record: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this revenue record?')) {
      try {
        await apiClient.delete(`/revenues/${id}`);
        fetchRevenues();
      } catch (err) {
        alert('Failed to delete revenue record');
      }
    }
  };

  const handleMarkPaid = async (rev) => {
    try {
      await apiClient.put(`/revenues/${rev._id}`, { ...rev, pendingAmount: 0 });
      fetchRevenues();
    } catch (err) {
      alert('Failed to mark as paid');
    }
  };

  const downloadPdf = async () => {
    setPreviewData(filteredRevenues);
  };

  // Summaries
  const totalRevenueSum = revenues.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
  const pendingRevenueSum = revenues.reduce((sum, r) => sum + (r.pendingAmount || 0), 0);
  const totalClients = [...new Set(revenues.map(r => r.mobileNumber))].length;

  // Client Search filtering
  const filteredRevenues = revenues.filter(r => {
    const term = searchQuery.toLowerCase();
    return (
      r.clientName.toLowerCase().includes(term) ||
      r.mobileNumber.includes(term) ||
      (r.notes || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto px-4 md:px-0">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-teal-500 to-emerald-400 bg-clip-text text-transparent">
            Revenue Module
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manually log, track, and generate reports for studio sales and revenues.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={downloadPdf}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 border border-slate-200 dark:border-slate-700 font-bold px-4 py-3 rounded-2xl flex items-center gap-2 transition-all text-sm"
          >
            <Download size={18} /> Download Report
          </button>
          <button
            onClick={openAddModal}
            className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold px-5 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all text-sm"
          >
            <Plus size={18} /> Add Revenue Entry
          </button>
        </div>
      </div>

      {/* SUMMARY DASHBOARD CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Revenue</span>
              <h2 className="text-3xl font-black text-slate-800 dark:text-white mt-2">
                ₹{totalRevenueSum.toLocaleString('en-IN')}
              </h2>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl">
              <DollarSign size={24} className="text-indigo-500" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500"></div>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Pending Amount</span>
              <h2 className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-2">
                ₹{pendingRevenueSum.toLocaleString('en-IN')}
              </h2>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-500/10 rounded-2xl">
              <Activity size={24} className="text-rose-500" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Clients</span>
              <h2 className="text-3xl font-black text-slate-800 dark:text-white mt-2">
                {totalClients}
              </h2>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl">
              <Users size={24} className="text-emerald-500" />
            </div>
          </div>
        </div>
      </div>

      {/* FILTERS & SEARCH ROW */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={18} className="absolute left-4 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search client or notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* REVENUE HISTORY TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : filteredRevenues.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-500 font-medium">No revenue records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider">Client Name</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider">Mobile Number</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider">Date</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider text-right">Total Amount</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider text-right">Pending Amount</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRevenues.map(rev => (
                  <tr key={rev._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                      {rev.clientName}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-350">
                      {rev.mobileNumber}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {rev.revenueDate}
                    </td>
                    <td className="px-6 py-4 font-black text-slate-800 dark:text-white text-right">
                      ₹{rev.totalAmount?.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 font-bold text-rose-600 dark:text-rose-400 text-right">
                      ₹{rev.pendingAmount?.toLocaleString('en-IN') || 0}
                    </td>
                    <td className="px-6 py-4 flex items-center justify-center gap-2">
                      {rev.pendingAmount > 0 && (
                        <button 
                          onClick={() => handleMarkPaid(rev)}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-lg text-xs transition-colors"
                          title="Mark Paid"
                        >
                          Mark Paid
                        </button>
                      )}
                      <button 
                        onClick={() => openEditModal(rev)}
                        className="p-2 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(rev._id)}
                        className="p-2 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-850 dark:text-white">
                {editingId ? 'Edit Revenue Record' : 'Create Revenue Entry'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-850 dark:hover:text-white rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Client Name</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-3 text-slate-400" />
                      <input 
                        required 
                        type="text" 
                        value={clientName} 
                        onChange={e => setClientName(e.target.value)} 
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Mobile Number</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-3 text-slate-400" />
                      <input 
                        required 
                        type="text" 
                        value={mobileNumber} 
                        onChange={e => setMobileNumber(e.target.value)} 
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Total Amount (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-450 font-bold text-sm">₹</span>
                      <input 
                        required 
                        type="number" 
                        value={totalAmount} 
                        onChange={e => setTotalAmount(e.target.value)} 
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-8 pr-4 text-sm focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Pending Amount (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-450 font-bold text-sm">₹</span>
                      <input 
                        required 
                        type="number" 
                        value={pendingAmount} 
                        onChange={e => setPendingAmount(e.target.value)} 
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-8 pr-4 text-sm focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Revenue Date</label>
                    <div className="relative">
                      <Calendar size={16} className="absolute left-3 top-3 text-slate-400" />
                      <input 
                        required 
                        type="date" 
                        value={revenueDate} 
                        onChange={e => setRevenueDate(e.target.value)} 
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Notes</label>
                  <textarea 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)} 
                    rows={3}
                    placeholder="Enter notes or special remarks..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-105 dark:border-slate-800 flex gap-3 bg-slate-50 dark:bg-slate-950 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 h-12 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl font-bold text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button 
                  id="revenue-form-submit-btn"
                  type="submit" 
                  className="flex-1 h-12 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 transition-all text-sm"
                >
                  Save Revenue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pdfLoading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl flex flex-col items-center gap-4 border border-slate-100 dark:border-slate-800">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
            <p className="text-sm font-bold text-slate-800 dark:text-white">Generating PDF...</p>
          </div>
        </div>
      )}

      {/* VISIBLE PDF PREVIEW PORTAL (Rendered inside React DOM to ensure correct layouts/Tailwind compilation) */}
      {previewData && (
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
                  ref={revenueReportRef}
                  style={{ width: '180mm', boxSizing: 'border-box' }}
                  dangerouslySetInnerHTML={{ 
                    __html: getRevenueReportHtml(previewData, settings || {}, logoData)
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

export default Revenue;
