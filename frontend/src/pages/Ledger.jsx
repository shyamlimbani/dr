import React, { useState, useEffect } from 'react';
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
  Calendar,
  Download,
  CreditCard
} from 'lucide-react';
import { useSettings } from '../services/SettingsContext';
import { generatePdf } from '../utils/pdfGenerator';

const Ledger = () => {
  const { settings } = useSettings();
  const [payments, setPayments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');

  // History Modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [activeHistory, setActiveHistory] = useState(null);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/ledger');
      setPayments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await apiClient.get('/employees');
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchEmployees();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setSelectedEmpId('');
    setTotalAmount('');
    setPaidAmount('');
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (payment) => {
    setEditingId(payment._id);
    setSelectedEmpId(payment.employeeId || '');
    setTotalAmount(payment.totalAmount);
    setPaidAmount(payment.paidAmount);
    setShowModal(true);
  };

  const openHistory = (payment) => {
    setActiveHistory(payment);
    setShowHistoryModal(true);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const emp = employees.find(e => e._id === selectedEmpId);
      
      const payload = {
        employeeId: selectedEmpId,
        employeeName: emp ? emp.fullName : 'Unknown Employee',
        mobileNumber: emp ? emp.mobileNumber : '0000000000',
        totalAmount: Number(totalAmount),
        paidAmount: Number(paidAmount) || 0
      };

      if (editingId) {
        await apiClient.put(`/ledger/${editingId}`, payload);
      } else {
        if (!emp) return alert('Please select an employee');
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

*Payment Update*

Total Amount: ₹${payment.totalAmount}
Paid Amount: ₹${payment.paidAmount}
Pending Amount: ₹${payment.pendingAmount}

Thank You.`;
    
    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/${payment.mobileNumber}?text=${encoded}`;
    window.open(url, '_blank');
  };

  const downloadPdf = async () => {
    try {
      setPdfLoading(true);
      await generatePdf('Payment_Report', filteredPayments, settings, 'download');
    } catch (error) {
      console.error('Download PDF error', error);
      alert('Failed to generate PDF report');
    } finally {
      setPdfLoading(false);
    }
  };

  const pendingAmountCalc = Math.max(0, (Number(totalAmount) || 0) - (Number(paidAmount) || 0));

  const filteredPayments = payments.filter(p => 
    (p.employeeName || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.mobileNumber || '').includes(search)
  );

  const totalEmpCount = new Set(payments.map(p => p.employeeName)).size;
  const globalTotalPaid = payments.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
  const globalTotalPending = payments.reduce((sum, p) => sum + (p.pendingAmount || 0), 0);

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
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Track and manage employee payments.</p>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Unique Employees Paid</span>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl">
                <User size={24} />
              </div>
              <span className="text-3xl font-black text-slate-800 dark:text-white">{totalEmpCount}</span>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-emerald-500/30 dark:border-emerald-500/20 rounded-3xl p-6 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full pointer-events-none"></div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Total Paid Amount</span>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
                <DollarSign size={24} />
              </div>
              <span className="text-3xl font-black text-emerald-500">₹{globalTotalPaid.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-orange-500/30 dark:border-orange-500/20 rounded-3xl p-6 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-bl-full pointer-events-none"></div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Total Pending Amount</span>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-500/10 text-orange-500 rounded-2xl">
                <DollarSign size={24} />
              </div>
              <span className="text-3xl font-black text-orange-500">₹{globalTotalPending.toLocaleString('en-IN')}</span>
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
                <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider text-right">Total Amount</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider text-right">Paid Amount</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider text-right">Pending Amount</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPayments.map(payment => (
                <tr key={payment._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">{payment.employeeName}</td>
                  <td className="px-6 py-4 text-slate-500">{payment.mobileNumber}</td>
                  <td className="px-6 py-4 font-bold text-slate-800 dark:text-white text-right">₹{payment.totalAmount?.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4 font-bold text-emerald-500 text-right">₹{payment.paidAmount?.toLocaleString('en-IN')}</td>
                  <td className={`px-6 py-4 font-black text-right ${payment.pendingAmount > 0 ? 'text-orange-500' : 'text-slate-300 dark:text-slate-600'}`}>₹{payment.pendingAmount?.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4 flex items-center justify-center gap-2">
                    <button onClick={() => openHistory(payment)} title="History" className="p-2 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                      <History size={16} />
                    </button>
                    <button onClick={() => openEditModal(payment)} title="Edit" className="p-2 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(payment._id)} title="Delete" className="p-2 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                    <button 
                      onClick={() => sendWhatsApp(payment)} 
                      title="Send WhatsApp Remainder" 
                      className="p-2 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 rounded-lg transition-colors"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARDS VIEW */}
        <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredPayments.map(payment => (
            <div key={payment._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:shadow-xl hover:border-indigo-500/30 transition-all group">
              
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-800 dark:text-white line-clamp-1">{payment.employeeName}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                      <Phone size={12} />
                      {payment.mobileNumber}
                    </div>
                  </div>
                  <div className="opacity-100 flex gap-1">
                    <button onClick={() => openEditModal(payment)} className="p-1.5 text-slate-400 hover:text-indigo-500 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(payment._id)} className="p-1.5 text-slate-400 hover:text-red-500 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm border-y border-slate-100 dark:border-slate-800 py-4">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
                    <p className="font-bold text-slate-800 dark:text-white">₹{payment.totalAmount}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Paid</span>
                    <p className="font-bold text-emerald-500">₹{payment.paidAmount}</p>
                  </div>
                  <div className="col-span-2 space-y-1 pt-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Pending</span>
                    <p className={`font-black text-lg ${payment.pendingAmount > 0 ? 'text-orange-500' : 'text-slate-300 dark:text-slate-600'}`}>
                      ₹{payment.pendingAmount}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-1">
                  <span className="flex items-center gap-1"><Calendar size={12}/> Updated: {new Date(payment.updatedAt || payment.createdAt).toLocaleDateString()}</span>
                  <button onClick={() => openHistory(payment)} className="flex items-center gap-1 text-indigo-500 hover:text-indigo-400 font-bold">
                    <History size={12}/> History
                  </button>
                </div>
              </div>

              <button 
                onClick={() => sendWhatsApp(payment)}
                className="mt-5 w-full py-2.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] font-bold rounded-xl flex items-center justify-center gap-2 text-sm transition-colors"
              >
                <div className="w-2 h-2 rounded-full bg-[#25D366]"></div>
                WhatsApp Update
              </button>

            </div>
          ))}
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
              
              {!editingId && (
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Employee Name</label>
                  <select 
                    required 
                    value={selectedEmpId} 
                    onChange={e => setSelectedEmpId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 appearance-none"
                  >
                    <option value="">-- Select Employee --</option>
                    {employees.map(emp => (
                      <option key={emp._id} value={emp._id}>{emp.fullName}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Total Amount (₹)</label>
                <input 
                  type="number" 
                  required 
                  value={totalAmount} 
                  onChange={e => setTotalAmount(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" 
                  placeholder="e.g. 5000" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Paid Amount (₹)</label>
                <input 
                  type="number" 
                  required 
                  value={paidAmount} 
                  onChange={e => setPaidAmount(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500" 
                  placeholder="e.g. 3000" 
                />
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 mt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Auto Calculated Pending</span>
                <span className={`text-2xl font-black ${pendingAmountCalc > 0 ? 'text-orange-500' : 'text-emerald-500'}`}>
                  ₹{pendingAmountCalc}
                </span>
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

      {/* HISTORY MODAL */}
      {showHistoryModal && activeHistory && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-lg">Payment History</h3>
                <p className="text-xs text-slate-500">{activeHistory.employeeName}</p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {!activeHistory.payments || activeHistory.payments.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-6">No historical records found.</p>
              ) : (
                <div className="space-y-4 pr-2">
                  {activeHistory.payments.map((ph, idx) => (
                    <div key={idx} className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 last:border-0 last:pb-0">
                      <div>
                        <span className="font-bold text-sm text-slate-800 dark:text-white block">{ph.notes || 'Payment'}</span>
                        <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Calendar size={10}/> {ph.date}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-emerald-500 text-sm block">+₹{ph.amount}</span>
                        <span className="text-[9px] text-slate-300 dark:text-slate-600 font-mono">#{ph.transactionId}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex shrink-0 bg-slate-50 dark:bg-slate-950">
              <button onClick={() => setShowHistoryModal(false)} className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold rounded-xl transition-colors text-sm">
                Close
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
    </div>
  );
};

export default Ledger;
