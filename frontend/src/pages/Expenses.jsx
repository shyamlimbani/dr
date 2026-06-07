import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../services/api';
import { 
  Receipt, 
  Plus, 
  Search, 
  X, 
  Trash2, 
  FileText,
  AlertCircle,
  Download
} from 'lucide-react';
import { useSettings } from '../services/SettingsContext';
import { generatePdf, getExpenseReportHtml, getCompressedLogo } from '../utils/pdfGenerator';

const Expenses = () => {
  const { settings } = useSettings();
  
  // PDF Preview Refs & State
  const expenseReportRef = useRef(null);
  const [previewData, setPreviewData] = useState(null);
  const [logoData, setLogoData] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Form States
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    expenseCategory: 'Office',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });
  const [formError, setFormError] = useState('');

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/expenses');
      setExpenses(res.data);
    } catch (err) {
      console.error('Error fetching expenses:', err.message);
    } finally {
      setLoading(false);
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
    if (previewData && expenseReportRef.current) {
      const timer = setTimeout(async () => {
        try {
          const filename = `expense_report_${new Date().toISOString().split('T')[0]}.pdf`;
          console.log('E2E Rendering visible Expense Report preview...');
          await generatePdf(expenseReportRef.current, filename, 'download');
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
    fetchExpenses();
  }, []);

  const handleOpenModal = () => {
    setFormData({
      expenseCategory: 'Office',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      description: ''
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.date || !formData.expenseCategory) {
      setFormError('Amount, Date, and Category are required');
      return;
    }

    try {
      await apiClient.post('/expenses', formData);
      setShowModal(false);
      fetchExpenses();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error saving expense');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await apiClient.delete(`/expenses/${id}`);
      fetchExpenses();
    } catch (err) {
      console.error('Error deleting expense:', err.message);
    }
  };

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = (exp.description || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory ? exp.expenseCategory === filterCategory : true;
    return matchesSearch && matchesCategory;
  });

  const downloadPdf = async () => {
    setPreviewData(filteredExpenses);
  };

  const totalFilteredAmount = filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight">Expense Tracker</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Manage company operational costs and keep track of daily outgoings.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={downloadPdf}
            className="flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl font-bold transition-all shadow-sm text-sm"
          >
            <Download size={18} />
            Export PDF
          </button>
          <button
            onClick={handleOpenModal}
            className="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-xl shadow-md text-sm transition-all"
          >
            <Plus size={18} />
            Log Expense
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-rose-500"
        >
          <option value="">All Categories</option>
          <option value="Office">Office</option>
          <option value="Event">Event</option>
          <option value="Marketing">Marketing</option>
          <option value="Logistics">Logistics</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Summary Card */}
      <div className="glass-card p-6 border-l-4 border-rose-500 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500">
            <Receipt size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total for Current View</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">₹{totalFilteredAmount.toLocaleString('en-IN')}</h3>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-rose-500"></div>
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-400">
          No expenses found matching the criteria
        </div>
      ) : (
        <>
        <div className="hidden md:block glass-card overflow-x-auto border-slate-200 dark:border-slate-900">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase">
              <tr>
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Category</th>
                <th className="p-4 font-semibold">Description</th>
                <th className="p-4 font-semibold">Amount (₹)</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredExpenses.map((exp) => (
                <tr key={exp._id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/20 transition-all">
                  <td className="p-4 font-medium text-slate-700 dark:text-slate-300">
                    {exp.date}
                  </td>
                  <td className="p-4">
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                      {exp.expenseCategory}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500 max-w-xs truncate" title={exp.description}>
                    {exp.description || '-'}
                  </td>
                  <td className="p-4 font-bold text-rose-500">₹{exp.amount.toLocaleString('en-IN')}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDelete(exp._id)}
                      className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                      title="Delete Expense"
                    >
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
          {filteredExpenses.map((exp) => (
            <div key={exp._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider block w-max">
                    {exp.expenseCategory}
                  </span>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{exp.date}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Amount</span>
                  <span className="font-black text-lg text-rose-500">₹{exp.amount.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <div className="flex justify-between items-end pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-500 max-w-[80%] line-clamp-2">
                  {exp.description || '-'}
                </p>
                <button
                  onClick={() => handleDelete(exp._id)}
                  className="w-12 h-12 flex items-center justify-center bg-rose-500/10 text-rose-600 rounded-xl shrink-0"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
        </>
      )}

      {/* EXPENSE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-base">Log New Expense</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Category</label>
                <select
                  value={formData.expenseCategory}
                  onChange={(e) => setFormData({...formData, expenseCategory: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500"
                >
                  <option value="Office">Office</option>
                  <option value="Event">Event</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Logistics">Logistics</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500"
                  placeholder="Enter expense amount"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Date</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500 min-h-[80px]"
                  placeholder="What was this expense for?"
                />
              </div>
            </form>
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 shrink-0 bg-slate-50 dark:bg-slate-950">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 h-12 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                className="flex-1 h-12 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-xl shadow-md text-sm shadow-rose-500/20 transition-all"
              >
                Save Expense
              </button>
            </div>
          </div>
        </div>
      )}
      {/* PDF Generation Loader Overlay */}
      {pdfLoading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl flex flex-col items-center gap-4 border border-slate-100 dark:border-slate-800">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-rose-500"></div>
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
                style={{ width: '210mm', minHeight: '297mm', padding: '15mm 15mm 30mm 15mm', boxSizing: 'border-box' }}
                className="bg-white text-slate-900 relative shadow-md"
              >
                <div
                  ref={expenseReportRef}
                  style={{ width: '180mm', boxSizing: 'border-box' }}
                  dangerouslySetInnerHTML={{ 
                    __html: getExpenseReportHtml(previewData, settings, logoData)
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

export default Expenses;
