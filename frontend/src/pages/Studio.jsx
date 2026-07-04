import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit2, Calendar as CalendarIcon, Phone, User, DollarSign, FileText, X, Search, Camera, Filter, CreditCard, Activity } from 'lucide-react';
import apiClient from '../services/api';
import { getWhatsAppUrl } from '../utils/whatsapp';
import { formatDate } from '../utils/dateFormatter';
import { useSettings } from '../services/SettingsContext';
import { generatePdf, getStudioReportHtml, getStudioExpenseReportHtml, getCompressedLogo } from '../utils/pdfGenerator';

const SERVICES_LIST = [
  'Photo Shoot',
  'Reels',
  'Print',
  'Other',
  'Photo Frame',
  'Album',
  'Product Shoot',
  'Baby Package'
];

const EXPENSE_CATEGORIES = [
  'Electricity', 'Staff Salary', 'Tea & Snacks', 'Equipment', 
  'Maintenance', 'Cleaning', 'Internet', 'Fuel', 'Other'
];

const PAYMENT_METHODS = ['Cash', 'UPI', 'Bank'];

const Studio = () => {
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' | 'expenses'
  
  const [bookings, setBookings] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const { settings } = useSettings();
  const [pdfLoading, setPdfLoading] = useState(false);
  
  // Search & Filter
  const [bookingSearchQuery, setBookingSearchQuery] = useState('');
  
  const [expenseSearchQuery, setExpenseSearchQuery] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('All');
  const [expenseDateFilter, setExpenseDateFilter] = useState('All'); 
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  // Modal State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Booking Form State
  const [editingBookingId, setEditingBookingId] = useState(null);
  const [clientName, setClientName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [service, setService] = useState('Photo Shoot');
  const [bookingAmount, setBookingAmount] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');

  // Expense Form State
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [expensePaymentMethod, setExpensePaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseReceipt, setExpenseReceipt] = useState(null);
  const receiptInputRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, expensesRes] = await Promise.all([
        apiClient.get('/studio'),
        apiClient.get('/studio-expenses')
      ]);
      setBookings(bookingsRes.data || []);
      setExpenses(expensesRes.data || []);
    } catch (err) {
      console.error('Error fetching studio data:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- BOOKING LOGIC ---
  const openAddBookingModal = () => {
    setEditingBookingId(null);
    setClientName('');
    setMobileNumber('');
    setService('Photo Shoot');
    setBookingAmount('');
    setBookingDate(new Date().toISOString().split('T')[0]);
    setBookingNotes('');
    setShowBookingModal(true);
  };

  const openEditBookingModal = (b) => {
    setEditingBookingId(b._id);
    setClientName(b.clientName);
    setMobileNumber(b.mobileNumber);
    setService(b.service);
    setBookingAmount(b.amount);
    setBookingDate(b.bookingDate);
    setBookingNotes(b.notes || '');
    setShowBookingModal(true);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      clientName,
      mobileNumber,
      service,
      amount: Number(bookingAmount),
      bookingDate,
      notes: bookingNotes
    };

    try {
      if (editingBookingId) {
        await apiClient.put(`/studio/${editingBookingId}`, payload);
      } else {
        await apiClient.post('/studio', payload);
      }
      setShowBookingModal(false);
      fetchData();
    } catch (err) {
      alert('Failed to save booking: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteBooking = async (id) => {
    if (window.confirm('Are you sure you want to delete this studio booking?')) {
      try {
        await apiClient.delete(`/studio/${id}`);
        fetchData();
      } catch (err) {
        alert('Failed to delete booking');
      }
    }
  };

  // --- EXPENSE LOGIC ---
  const openAddExpenseModal = () => {
    setEditingExpenseId(null);
    setExpenseTitle('');
    setExpenseCategory(EXPENSE_CATEGORIES[0]);
    setExpenseAmount('');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setExpensePaymentMethod(PAYMENT_METHODS[0]);
    setExpenseDescription('');
    setExpenseReceipt(null);
    if (receiptInputRef.current) receiptInputRef.current.value = '';
    setShowExpenseModal(true);
  };

  const openEditExpenseModal = (e) => {
    setEditingExpenseId(e._id);
    setExpenseTitle(e.title);
    setExpenseCategory(e.category);
    setExpenseAmount(e.amount);
    setExpenseDate(e.date);
    setExpensePaymentMethod(e.paymentMethod);
    setExpenseDescription(e.description || '');
    setExpenseReceipt(null); // Keep existing unless changed
    if (receiptInputRef.current) receiptInputRef.current.value = '';
    setShowExpenseModal(true);
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', expenseTitle);
    formData.append('category', expenseCategory);
    formData.append('amount', Number(expenseAmount));
    formData.append('date', expenseDate);
    formData.append('paymentMethod', expensePaymentMethod);
    formData.append('description', expenseDescription);
    if (expenseReceipt) {
      formData.append('receipt', expenseReceipt);
    }

    try {
      if (editingExpenseId) {
        await apiClient.put(`/studio-expenses/${editingExpenseId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await apiClient.post('/studio-expenses', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setShowExpenseModal(false);
      fetchData();
    } catch (err) {
      alert('Failed to save expense: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteExpense = async (id) => {
    if (window.confirm('Are you sure you want to delete this studio expense?')) {
      try {
        await apiClient.delete(`/studio-expenses/${id}`);
        fetchData();
      } catch (err) {
        alert('Failed to delete expense');
      }
    }
  };

  // --- FILTERING ---
  const filteredBookings = bookings.filter(b => {
    const term = bookingSearchQuery.toLowerCase();
    return (
      b.clientName.toLowerCase().includes(term) ||
      b.service.toLowerCase().includes(term) ||
      b.mobileNumber.includes(term) ||
      (b.notes || '').toLowerCase().includes(term)
    );
  });

  const getFilteredExpenses = () => {
    let filtered = expenses;

    // Search
    if (expenseSearchQuery) {
      const term = expenseSearchQuery.toLowerCase();
      filtered = filtered.filter(e => 
        e.title.toLowerCase().includes(term) ||
        e.category.toLowerCase().includes(term) ||
        e.amount.toString().includes(term) ||
        (e.description || '').toLowerCase().includes(term)
      );
    }

    // Category
    if (expenseCategoryFilter !== 'All') {
      filtered = filtered.filter(e => e.category === expenseCategoryFilter);
    }

    // Date
    if (expenseDateFilter !== 'All') {
      const today = new Date();
      today.setHours(0,0,0,0);
      
      if (expenseDateFilter === 'Today') {
        filtered = filtered.filter(e => {
          const d = new Date(e.date);
          d.setHours(0,0,0,0);
          return d.getTime() === today.getTime();
        });
      } else if (expenseDateFilter === 'This Week') {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        filtered = filtered.filter(e => {
          const d = new Date(e.date);
          d.setHours(0,0,0,0);
          return d >= startOfWeek;
        });
      } else if (expenseDateFilter === 'This Month') {
        filtered = filtered.filter(e => {
          const d = new Date(e.date);
          return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
        });
      } else if (expenseDateFilter === 'Custom' && customStartDate && customEndDate) {
        const start = new Date(customStartDate);
        start.setHours(0,0,0,0);
        const end = new Date(customEndDate);
        end.setHours(23,59,59,999);
        filtered = filtered.filter(e => {
          const d = new Date(e.date);
          return d >= start && d <= end;
        });
      }
    }

    return filtered;
  };

  const filteredExpenses = getFilteredExpenses();

  // --- STATS ---
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;

  // --- PDF EXPORT ---
  const downloadPdf = async (type) => {
    try {
      setPdfLoading(true);
      let logo = null;
      if (settings?.logo) {
        logo = await getCompressedLogo(settings.logo);
      }
      
      let filename, htmlContent;
      if (type === 'bookings') {
        filename = `Studio_Bookings_Report_${formatDate(new Date())}.pdf`;
        htmlContent = getStudioReportHtml(filteredBookings, settings, logo);
      } else {
        filename = `Studio_Expenses_Report_${formatDate(new Date())}.pdf`;
        htmlContent = getStudioExpenseReportHtml(filteredExpenses, settings, logo);
      }
      
      await generatePdf(htmlContent, filename, 'download');
    } catch (err) {
      console.error('PDF Action failed:', err);
      alert('PDF Generation failed: ' + err.message);
    } finally {
      setPdfLoading(false);
    }
  };

  const getBookingWhatsAppMessage = (b) => {
    return `Hello ${b.clientName},\n\nYour Studio Booking has been confirmed.\n\nBooking Details:\nClient Name: ${b.clientName}\nMobile Number: ${b.mobileNumber}\nService: ${b.service}\nAmount: ₹${b.amount}\nBooking Date: ${formatDate(b.bookingDate)}\nNotes: ${b.notes || 'None'}\n\nThank you for choosing Dreams Video.`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto px-4 md:px-0">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-teal-500 to-emerald-400 bg-clip-text text-transparent">
            Studio Hub
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Studio management with isolated bookings and expenses.
          </p>
        </div>
      </div>

      {/* DASHBOARD CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Studio Revenue</span>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white mt-2">
            ₹{totalRevenue.toLocaleString('en-IN')}
          </h2>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500"></div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Studio Expenses</span>
          <h2 className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-2">
            ₹{totalExpenses.toLocaleString('en-IN')}
          </h2>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-1.5 h-full ${netProfit >= 0 ? 'bg-teal-500' : 'bg-rose-500'}`}></div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Net Profit</span>
          <h2 className={`text-3xl font-black mt-2 ${netProfit >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600 dark:text-rose-400'}`}>
            ₹{netProfit.toLocaleString('en-IN')}
          </h2>
        </div>
      </div>

      {/* TABS */}
      <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-2xl w-full sm:w-fit border border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${activeTab === 'bookings' ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          <div className="flex items-center justify-center gap-2">
            <Camera size={16} /> Bookings
          </div>
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${activeTab === 'expenses' ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          <div className="flex items-center justify-center gap-2">
            <CreditCard size={16} /> Expenses
          </div>
        </button>
      </div>

      {/* =========================================
          BOOKINGS TAB
      ========================================= */}
      {activeTab === 'bookings' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search size={18} className="absolute left-4 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search client, service or notes..."
                value={bookingSearchQuery}
                onChange={e => setBookingSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={() => downloadPdf('bookings')}
                disabled={pdfLoading}
                className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-700 text-white font-bold px-5 py-2.5 rounded-2xl flex justify-center items-center gap-2 shadow-lg transition-all text-sm disabled:opacity-50"
              >
                <FileText size={16} /> {pdfLoading ? 'Generating...' : 'Report PDF'}
              </button>
              <button
                onClick={openAddBookingModal}
                className="flex-1 sm:flex-none bg-teal-500 hover:bg-teal-400 text-white font-bold px-5 py-2.5 rounded-2xl flex justify-center items-center gap-2 shadow-lg shadow-teal-500/20 transition-all text-sm"
              >
                <Plus size={16} /> Add Booking
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div></div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-20 text-slate-500 font-medium">No studio bookings found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider">Client Name</th>
                      <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider">Mobile</th>
                      <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider">Service</th>
                      <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider">Date</th>
                      <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider text-right">Amount</th>
                      <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredBookings.map(b => (
                      <tr key={b._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">{b.clientName}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-350">{b.mobileNumber}</td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-black px-2 py-0.5 rounded bg-teal-500/10 text-teal-600 dark:bg-teal-400/15 dark:text-teal-350 tracking-wide">
                            {b.service}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-550">{formatDate(b.bookingDate)}</td>
                        <td className="px-6 py-4 font-black text-slate-800 dark:text-white text-right">₹{b.amount?.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4 flex items-center justify-end gap-2">
                          <button onClick={() => window.open(getWhatsAppUrl(b.mobileNumber, getBookingWhatsAppMessage(b)), '_blank')} className="px-3 py-1.5 flex items-center gap-1.5 text-xs font-bold bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 rounded-lg transition-colors" title="Send WhatsApp">
                            📱 Send WhatsApp
                          </button>
                          <button onClick={() => openEditBookingModal(b)} className="p-2 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"><Edit2 size={14} /></button>
                          <button onClick={() => handleDeleteBooking(b._id)} className="p-2 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 rounded-lg transition-colors"><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================
          EXPENSES TAB
      ========================================= */}
      {activeTab === 'expenses' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search size={18} className="absolute left-4 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search expense title, category..."
                value={expenseSearchQuery}
                onChange={e => setExpenseSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <select
                value={expenseCategoryFilter}
                onChange={e => setExpenseCategoryFilter(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-white focus:outline-none focus:border-rose-500"
              >
                <option value="All">All Categories</option>
                {EXPENSE_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select
                value={expenseDateFilter}
                onChange={e => setExpenseDateFilter(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-white focus:outline-none focus:border-rose-500"
              >
                <option value="All">All Time</option>
                <option value="Today">Today</option>
                <option value="This Week">This Week</option>
                <option value="This Month">This Month</option>
                <option value="Custom">Custom Range</option>
              </select>

              {expenseDateFilter === 'Custom' && (
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-1.5">
                  <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className="bg-transparent text-xs outline-none text-slate-700 dark:text-white" />
                  <span className="text-slate-400">to</span>
                  <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className="bg-transparent text-xs outline-none text-slate-700 dark:text-white" />
                </div>
              )}

              <button
                onClick={() => downloadPdf('expenses')}
                disabled={pdfLoading}
                className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-700 text-white font-bold px-5 py-2.5 rounded-2xl flex justify-center items-center gap-2 shadow-lg transition-all text-sm disabled:opacity-50"
              >
                <FileText size={16} /> {pdfLoading ? 'Generating...' : 'Report PDF'}
              </button>
              <button
                onClick={openAddExpenseModal}
                className="flex-1 sm:flex-none bg-rose-500 hover:bg-rose-400 text-white font-bold px-5 py-2.5 rounded-2xl flex justify-center items-center gap-2 shadow-lg shadow-rose-500/20 transition-all text-sm"
              >
                <Plus size={16} /> Add Expense
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-rose-500"></div></div>
            ) : filteredExpenses.length === 0 ? (
              <div className="text-center py-20 text-slate-500 font-medium">No studio expenses found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider">Date</th>
                      <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider">Title</th>
                      <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider">Category</th>
                      <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider">Payment</th>
                      <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider">Description</th>
                      <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider text-right">Amount</th>
                      <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider text-center">Attachment</th>
                      <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredExpenses.map(e => (
                      <tr key={e._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 text-slate-550">{formatDate(e.date)}</td>
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">{e.title}</td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-black px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:bg-rose-400/15 dark:text-rose-400 tracking-wide">
                            {e.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-350">{e.paymentMethod}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-350 truncate max-w-[200px]" title={e.description}>
                          {e.description || '-'}
                        </td>
                        <td className="px-6 py-4 font-black text-rose-600 dark:text-rose-400 text-right">₹{e.amount?.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4 text-center">
                          {e.receiptUrl ? (
                            <a href={`http://localhost:5000${e.receiptUrl}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-500 hover:underline">
                              View
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 flex items-center justify-center gap-2">
                          <button onClick={() => openEditExpenseModal(e)} className="p-2 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"><Edit2 size={14} /></button>
                          <button onClick={() => handleDeleteExpense(e._id)} className="p-2 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 rounded-lg transition-colors"><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================
          BOOKING MODAL 
      ========================================= */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-850 dark:text-white">
                {editingBookingId ? 'Edit Studio Booking' : 'Add Studio Booking'}
              </h3>
              <button onClick={() => setShowBookingModal(false)} className="p-1.5 text-slate-400 hover:text-slate-850 dark:hover:text-white rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleBookingSubmit}>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Client Name</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-3 text-slate-400" />
                      <input required type="text" value={clientName} onChange={e => setClientName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-teal-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Mobile Number</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-3 text-slate-400" />
                      <input required type="text" value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-teal-500" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Service</label>
                    <select value={service} onChange={e => setService(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500">
                      {SERVICES_LIST.map((srv) => <option key={srv} value={srv}>{srv}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Amount (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-450 font-bold text-sm">₹</span>
                      <input required type="number" value={bookingAmount} onChange={e => setBookingAmount(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-8 pr-4 text-sm focus:outline-none focus:border-teal-500" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Booking Date</label>
                  <div className="relative">
                    <CalendarIcon size={16} className="absolute left-3 top-3 text-slate-400" />
                    <input required type="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-teal-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Notes</label>
                  <textarea value={bookingNotes} onChange={e => setBookingNotes(e.target.value)} rows={3} placeholder="Enter details..." className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500" />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex gap-3 bg-slate-50 dark:bg-slate-950">
                <button type="button" onClick={() => setShowBookingModal(false)} className="flex-1 h-12 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl font-bold text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm">Cancel</button>
                <button type="submit" className="flex-1 h-12 bg-teal-500 hover:bg-teal-400 text-white font-bold rounded-2xl shadow-lg shadow-teal-500/20 transition-all text-sm">{editingBookingId ? 'Update Booking' : 'Save Booking'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================
          EXPENSE MODAL 
      ========================================= */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-850 dark:text-white">
                {editingExpenseId ? 'Edit Studio Expense' : 'Add Studio Expense'}
              </h3>
              <button onClick={() => setShowExpenseModal(false)} className="p-1.5 text-slate-400 hover:text-slate-850 dark:hover:text-white rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleExpenseSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Expense Title</label>
                  <input required type="text" value={expenseTitle} onChange={e => setExpenseTitle(e.target.value)} placeholder="e.g. Electricity Bill May" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-rose-500" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Category</label>
                    <select value={expenseCategory} onChange={e => setExpenseCategory(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-500">
                      {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Amount (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-450 font-bold text-sm">₹</span>
                      <input required type="number" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-8 pr-4 text-sm focus:outline-none focus:border-rose-500" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Expense Date</label>
                    <div className="relative">
                      <CalendarIcon size={16} className="absolute left-3 top-3 text-slate-400" />
                      <input required type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-rose-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Payment Method</label>
                    <select value={expensePaymentMethod} onChange={e => setExpensePaymentMethod(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-500">
                      {PAYMENT_METHODS.map(method => <option key={method} value={method}>{method}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Description (Optional)</label>
                  <textarea value={expenseDescription} onChange={e => setExpenseDescription(e.target.value)} rows={2} placeholder="Add any details..." className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-500" />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Attachment (Optional Image/Bill)</label>
                  <input type="file" ref={receiptInputRef} onChange={e => setExpenseReceipt(e.target.files[0])} accept="image/*,.pdf" className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 dark:file:bg-slate-800 dark:file:text-slate-300 dark:hover:file:bg-slate-700" />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex gap-3 bg-slate-50 dark:bg-slate-950">
                <button type="button" onClick={() => setShowExpenseModal(false)} className="flex-1 h-12 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl font-bold text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm">Cancel</button>
                <button type="submit" className="flex-1 h-12 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-2xl shadow-lg shadow-rose-500/20 transition-all text-sm">{editingExpenseId ? 'Update Expense' : 'Save Expense'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Studio;
