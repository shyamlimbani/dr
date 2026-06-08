import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Phone, User, DollarSign, Calendar, FileText, CheckCircle, X, Download, AlertCircle, Search } from 'lucide-react';
import apiClient from '../services/api';

const Revenue = () => {
  const [revenues, setRevenues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [clientName, setClientName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [revenueDate, setRevenueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('Pending');

  useEffect(() => {
    fetchRevenues();
  }, []);

  const fetchRevenues = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await apiClient.get('/revenues', { params });
      setRevenues(res.data || []);
    } catch (err) {
      console.error('Error fetching revenues:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenues();
  }, [statusFilter]);

  const openAddModal = () => {
    setEditingId(null);
    setClientName('');
    setMobileNumber('');
    setTotalAmount('');
    setRevenueDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setStatus('Pending');
    setShowModal(true);
  };

  const openEditModal = (rev) => {
    setEditingId(rev._id);
    setClientName(rev.clientName);
    setMobileNumber(rev.mobileNumber);
    setTotalAmount(rev.totalAmount);
    setRevenueDate(rev.revenueDate);
    setNotes(rev.notes || '');
    setStatus(rev.status);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      clientName,
      mobileNumber,
      totalAmount: Number(totalAmount),
      revenueDate,
      notes,
      status
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

  const toggleStatus = async (rev) => {
    try {
      const nextStatus = rev.status === 'Paid' ? 'Pending' : 'Paid';
      await apiClient.put(`/revenues/${rev._id}`, { status: nextStatus });
      fetchRevenues();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const downloadPdf = async () => {
    try {
      setPdfLoading(true);
      const res = await apiClient.get('/revenues/pdf', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `revenue_report_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download PDF error:', error);
      alert('Failed to generate PDF report');
    } finally {
      setPdfLoading(false);
    }
  };

  // Summaries
  const totalRevenueSum = revenues.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
  const paidRevenueSum = revenues.reduce((sum, r) => r.status === 'Paid' ? sum + (r.totalAmount || 0) : sum, 0);
  const pendingRevenueSum = revenues.reduce((sum, r) => r.status === 'Pending' ? sum + (r.totalAmount || 0) : sum, 0);

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
          <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Revenue</span>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white mt-2">
            ₹{totalRevenueSum.toLocaleString('en-IN')}
          </h2>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Paid Revenue</span>
          <h2 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            ₹{paidRevenueSum.toLocaleString('en-IN')}
          </h2>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500"></div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Pending Revenue</span>
          <h2 className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-2">
            ₹{pendingRevenueSum.toLocaleString('en-IN')}
          </h2>
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
        
        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full sm:w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
          </select>
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
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider text-center">Status</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider text-right">Amount</th>
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
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => toggleStatus(rev)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                          rev.status === 'Paid'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-600 border-rose-500/20 hover:bg-rose-500/20'
                        }`}
                        title="Click to toggle status"
                      >
                        {rev.status === 'Paid' ? (
                          <>
                            <CheckCircle size={12} />
                            Paid
                          </>
                        ) : (
                          <>
                            <AlertCircle size={12} />
                            Pending
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-800 dark:text-white text-right">
                      ₹{rev.totalAmount?.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 flex items-center justify-center gap-2">
                      {rev.status === 'Pending' && (
                        <button
                          onClick={() => toggleStatus(rev)}
                          className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg text-xs font-bold transition-colors"
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Status</label>
                    <select
                      value={status}
                      onChange={e => setStatus(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                    </select>
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
                {status === 'Pending' && (
                  <button 
                    type="button"
                    onClick={() => {
                      setStatus('Paid');
                      setTimeout(() => {
                        document.getElementById('revenue-form-submit-btn').click();
                      }, 0);
                    }}
                    className="flex-1 h-12 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all text-sm animate-in fade-in"
                  >
                    Mark Paid
                  </button>
                )}
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

    </div>
  );
};

export default Revenue;
