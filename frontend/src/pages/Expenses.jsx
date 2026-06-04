import React, { useState, useEffect } from 'react';
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

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
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
    try {
      const response = await apiClient.get('/expenses/pdf', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Expense_Report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download PDF error', error);
      alert('Failed to download PDF report');
    }
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
                  className="p-2 bg-rose-500/10 text-rose-600 rounded-lg shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
        </>
      )}

      {/* EXPENSE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-base">Log New Expense</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-500"
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
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-500"
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
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-500 min-h-[80px]"
                  placeholder="What was this expense for?"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-xl shadow-md text-xs shadow-rose-500/20 transition-all"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
