import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../services/api';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  History,
  X,
  User,
  Phone,
  DollarSign,
  Download,
  CreditCard
} from 'lucide-react';
import { useSettings } from '../services/SettingsContext';
import { generatePdf, getPaymentReportHtml, getCompressedLogo } from '../utils/pdfGenerator';
import { getWhatsAppUrl } from '../utils/whatsapp';
import { formatDate } from '../utils/dateFormatter';

const Ledger = () => {
  const { settings } = useSettings();
  
  // PDF Preview Refs & State
  const paymentReportRef = useRef(null);
  const [previewData, setPreviewData] = useState(null);
  const [logoData, setLogoData] = useState(null);
  const [payments, setPayments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Group row expansion state
  const [expandedEmployees, setExpandedEmployees] = useState({});

  const toggleExpand = (empKey) => {
    setExpandedEmployees(prev => ({
      ...prev,
      [empKey]: !prev[empKey]
    }));
  };

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [amountGiven, setAmountGiven] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [notes, setNotes] = useState('');
  const [paymentDate, setPaymentDate] = useState('');

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/ledger');
      setPayments(res.data);
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await apiClient.get('/employees');
      setEmployees(res.data);
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

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
    if (previewData && paymentReportRef.current) {
      setPdfLoading(true);
      const timer = setTimeout(async () => {
        try {
          const filename = `payment_report_${new Date().toISOString().split('T')[0]}.pdf`;
          console.log('E2E Rendering visible Payment Report preview...');
          await generatePdf(paymentReportRef.current, filename, 'download');
        } catch (err) {
          console.error('PDF Action failed:', err);
          alert('PDF Generation failed: ' + err.message);
        } finally {
          setPreviewData(null); // Clean up / close preview
          setPdfLoading(false);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [previewData]);

  useEffect(() => {
    fetchPayments();
    fetchEmployees();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setSelectedEmpId('');
    setMobileNumber('');
    setAmountGiven('');
    setPaymentMethod('UPI');
    setNotes('');
    setPaymentDate(new Date().toISOString().split('T')[0]); // Default to today
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (payment) => {
    setEditingId(payment._id);
    setSelectedEmpId(payment.employeeId || '');
    setMobileNumber(payment.mobileNumber || '');
    setAmountGiven(payment.amountGiven || '');
    setPaymentMethod(payment.paymentMethod || 'UPI');
    setNotes(payment.notes || '');
    setPaymentDate(payment.paymentDate || new Date().toISOString().split('T')[0]);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this payment record?')) {
      try {
        await apiClient.delete(`/ledger/${id}`);
        fetchPayments();
      } catch (err) {
        alert('Error deleting payment');
      }
    }
  };

  const handleEmployeeChange = (empId) => {
    setSelectedEmpId(empId);
    const emp = employees.find(e => e._id === empId);
    if (emp) {
      setMobileNumber(emp.mobileNumber);
    } else {
      setMobileNumber('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const emp = employees.find(e => e._id === selectedEmpId);
      
      const payload = {
        employeeId: selectedEmpId,
        employeeName: emp ? emp.fullName : 'Unknown Employee',
        mobileNumber: mobileNumber,
        amountGiven: Number(amountGiven) || 0,
        paymentMethod: paymentMethod,
        notes: notes,
        paymentDate: paymentDate || new Date().toISOString().split('T')[0]
      };

      if (editingId) {
        await apiClient.put(`/ledger/${editingId}`, payload);
      } else {
        if (!selectedEmpId) return alert('Please select an employee');
        await apiClient.post('/ledger', payload);
      }
      setShowModal(false);
      fetchPayments();
    } catch (err) {
      alert('Error saving payment record');
    }
  };

  const sendWhatsApp = (payment) => {
    const message = `Hello ${payment.employeeName},

A payment of ₹${payment.amountGiven} has been provided.

Payment Method: ${payment.paymentMethod}

Thank You.`;
    
    const url = getWhatsAppUrl(payment.mobileNumber, message);
    window.open(url, '_blank');
  };

  const downloadPdf = async () => {
    setPreviewData(filteredPayments);
  };



  const filteredPayments = payments.filter(p => 
    (p.employeeName || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.mobileNumber || '').includes(search)
  );

  // Group payments by employeeId (prefer unique key) or employeeName
  const groupedPayments = React.useMemo(() => {
    const groups = {};
    payments.forEach(p => {
      // Grouping key: prefer employeeId (excluding falsy/custom), fallback to employeeName
      const key = (p.employeeId && p.employeeId !== 'custom') ? p.employeeId : (p.employeeName || 'Unknown');
      
      if (!groups[key]) {
        groups[key] = {
          employeeId: p.employeeId,
          employeeName: p.employeeName || 'Unknown',
          mobileNumber: p.mobileNumber || '',
          totalGiven: 0,
          paymentsCount: 0,
          lastPaymentDate: null,
          history: []
        };
      }
      
      groups[key].totalGiven += (p.amountGiven || 0);
      groups[key].paymentsCount += 1;
      
      const pDate = p.paymentDate || p.createdAt || '';
      if (pDate) {
        if (!groups[key].lastPaymentDate || new Date(pDate) > new Date(groups[key].lastPaymentDate)) {
          groups[key].lastPaymentDate = pDate;
        }
      }
      groups[key].history.push(p);
    });
    
    // Sort each group's history by date descending
    Object.values(groups).forEach(g => {
      g.history.sort((a, b) => new Date(b.paymentDate || 0) - new Date(a.paymentDate || 0));
    });

    return Object.values(groups);
  }, [payments]);

  const filteredGroupedPayments = React.useMemo(() => {
    return groupedPayments.filter(g => 
      (g.employeeName || '').toLowerCase().includes(search.toLowerCase()) ||
      (g.mobileNumber || '').includes(search)
    );
  }, [groupedPayments, search]);

  const totalEmpCount = groupedPayments.length;
  const globalTotalPaymentsGiven = payments.reduce((sum, p) => sum + (p.amountGiven || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* HEADER & SUMMARY */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <CreditCard className="text-indigo-500" />
              Employee Payments
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Record money given to employees.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={downloadPdf}
              className="flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm text-sm"
            >
              <Download size={18} />
              Export PDF
            </button>
            <button 
              onClick={openAddModal}
              className="flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 text-sm"
            >
              <Plus size={18} />
              Add Payment
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Total Employees</span>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl">
                <User size={24} />
              </div>
              <span className="text-3xl font-black text-slate-800 dark:text-white">{totalEmpCount}</span>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-emerald-500/30 dark:border-emerald-500/20 rounded-3xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full pointer-events-none"></div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Total Payments Given</span>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
                <DollarSign size={24} />
              </div>
              <span className="text-3xl font-black text-emerald-500">₹{globalTotalPaymentsGiven.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* LIST CONTROLS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative w-full sm:w-96">
          <Search size={18} className="absolute left-4 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by employee name or mobile..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* PAYMENT CARDS GRID */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
          <p className="text-slate-500 font-medium">No payment records found.</p>
        </div>
      ) : (
        <>
        {/* DESKTOP TABLE VIEW */}
        <div className="hidden lg:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider">Employee Name</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider">Mobile Number</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider text-right">Total Given</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider text-center">Payments</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider text-center">Last Payment</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredGroupedPayments.map(group => {
                const empKey = group.employeeId || group.employeeName || 'unknown';
                const isExpanded = !!expandedEmployees[empKey];
                return (
                  <React.Fragment key={empKey}>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">{group.employeeName}</td>
                      <td className="px-6 py-4 text-slate-500">{group.mobileNumber}</td>
                      <td className="px-6 py-4 font-bold text-slate-800 dark:text-white text-right">₹{group.totalGiven?.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                          {group.paymentsCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-center">{formatDate(group.lastPaymentDate)}</td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => toggleExpand(empKey)}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white transition-all inline-flex items-center gap-1.5"
                        >
                          <History size={14} />
                          {isExpanded ? 'Hide History' : 'View Payment History'}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-slate-50/50 dark:bg-slate-900/40">
                        <td colSpan={6} className="px-8 py-4">
                          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-950 shadow-inner">
                            <table className="w-full text-xs text-left">
                              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 uppercase tracking-wider">
                                <tr>
                                  <th className="px-6 py-3 font-semibold">Payment Date</th>
                                  <th className="px-6 py-3 font-semibold text-right">Amount Given</th>
                                  <th className="px-6 py-3 font-semibold text-center">Payment Method</th>
                                  <th className="px-6 py-3 font-semibold">Notes</th>
                                  <th className="px-6 py-3 font-semibold text-center">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {group.history.map(payment => (
                                  <tr key={payment._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                                    <td className="px-6 py-3 text-slate-500">{formatDate(payment.paymentDate)}</td>
                                    <td className="px-6 py-3 font-bold text-slate-800 dark:text-white text-right">₹{payment.amountGiven?.toLocaleString('en-IN')}</td>
                                    <td className="px-6 py-3 text-center">
                                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                        {payment.paymentMethod}
                                      </span>
                                    </td>
                                    <td className="px-6 py-3 text-slate-500 max-w-xs truncate" title={payment.notes}>{payment.notes || '-'}</td>
                                    <td className="px-6 py-3 flex items-center justify-center gap-2">
                                      <button onClick={() => openEditModal(payment)} title="Edit" className="p-1.5 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                        <Edit2 size={12} />
                                      </button>
                                      <button onClick={() => handleDelete(payment._id)} title="Delete" className="p-1.5 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 rounded-lg transition-colors">
                                        <Trash2 size={12} />
                                      </button>
                                      <button 
                                        onClick={() => sendWhatsApp(payment)} 
                                        title="Send WhatsApp Update" 
                                        className="p-1.5 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 rounded-lg transition-colors"
                                      >
                                        <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                                        </svg>
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARDS VIEW */}
        <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredGroupedPayments.map(group => {
            const empKey = group.employeeId || group.employeeName || 'unknown';
            const isExpanded = !!expandedEmployees[empKey];
            return (
              <div key={empKey} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:shadow-xl transition-all group">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-extrabold text-lg text-slate-800 dark:text-white line-clamp-1">{group.employeeName}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <Phone size={12} />
                        Mobile: {group.mobileNumber}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm border-y border-slate-100 dark:border-slate-800 py-4">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Total Given</span>
                      <p className="font-bold text-slate-800 dark:text-white">₹{group.totalGiven?.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="space-y-1 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Payments</span>
                      <p className="font-semibold text-indigo-500">{group.paymentsCount}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Last Payment</span>
                      <p className="text-xs font-medium text-slate-550 dark:text-slate-400">{formatDate(group.lastPaymentDate)}</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => toggleExpand(empKey)}
                    className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm transition-colors"
                  >
                    <History size={16} />
                    {isExpanded ? 'Hide Payment History' : 'View Payment History'}
                  </button>

                  {isExpanded && (
                    <div className="space-y-3 pt-2 max-h-60 overflow-y-auto pr-1">
                      {group.history.map(ph => (
                        <div key={ph._id} className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80 text-xs space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500">{formatDate(ph.paymentDate)}</span>
                            <span className="font-bold text-emerald-500">₹{ph.amountGiven?.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-slate-400">Method: {ph.paymentMethod}</span>
                            {ph.notes && <span className="text-slate-450 dark:text-slate-400 italic">Note: {ph.notes}</span>}
                          </div>
                          <div className="flex justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-900">
                            <button onClick={() => openEditModal(ph)} className="text-indigo-500 hover:text-indigo-400 font-semibold text-[11px]">Edit</button>
                            <span className="text-slate-300">|</span>
                            <button onClick={() => handleDelete(ph._id)} className="text-rose-500 hover:text-rose-400 font-semibold text-[11px]">Delete</button>
                            <span className="text-slate-300">|</span>
                            <button onClick={() => sendWhatsApp(ph)} className="text-emerald-500 hover:text-emerald-400 font-semibold text-[11px]">WhatsApp</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        </>
      )}

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-lg">{editingId ? 'Edit Payment' : 'Add Payment'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Employee Name</label>
                <select 
                  required 
                  disabled={!!editingId}
                  value={selectedEmpId} 
                  onChange={e => handleEmployeeChange(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 appearance-none disabled:opacity-60"
                >
                  <option value="">-- Select Employee --</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.fullName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Mobile Number</label>
                <input 
                  type="text" 
                  required 
                  value={mobileNumber} 
                  onChange={e => setMobileNumber(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" 
                  placeholder="e.g. 9876543210" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Amount Given (₹)</label>
                <input 
                  type="number" 
                  required 
                  value={amountGiven} 
                  onChange={e => setAmountGiven(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" 
                  placeholder="e.g. 5000" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Payment Method</label>
                <select 
                  required 
                  value={paymentMethod} 
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 appearance-none"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Payment Date</label>
                <input 
                  type="date" 
                  required 
                  value={paymentDate} 
                  onChange={e => setPaymentDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Notes (Optional)</label>
                <textarea 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" 
                  placeholder="Optional payment notes..."
                  rows={3}
                />
              </div>
            </form>
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex gap-3 shrink-0 bg-slate-50 dark:bg-slate-950">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm">
                Cancel
              </button>
              <button type="submit" onClick={handleSubmit} className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all text-sm">
                Save Payment
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
                  ref={paymentReportRef}
                  style={{ width: '180mm', boxSizing: 'border-box' }}
                  dangerouslySetInnerHTML={{ 
                    __html: getPaymentReportHtml(previewData, settings, logoData)
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

export default Ledger;
