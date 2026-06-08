import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Calendar as CalendarIcon, Phone, User, DollarSign, FileText, ChevronLeft, ChevronRight, X, Search } from 'lucide-react';
import apiClient from '../services/api';

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

const Studio = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [clientName, setClientName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [service, setService] = useState('Photo Shoot');
  const [amount, setAmount] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/studio');
      setBookings(res.data || []);
    } catch (err) {
      console.error('Error fetching studio bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  // Monthly Calendar Calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getDaysInMonth = (m, y) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (m, y) => new Date(y, m, 1).getDay();

  const numDays = getDaysInMonth(month, year);
  const firstDay = getFirstDayOfMonth(month, year);

  const prevMonthNumDays = getDaysInMonth(month - 1 < 0 ? 11 : month - 1, month - 1 < 0 ? year - 1 : year);

  const calendarDays = [];

  // Previous month padding days
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = new Date(month - 1 < 0 ? year - 1 : year, month - 1 < 0 ? 11 : month - 1, prevMonthNumDays - i);
    calendarDays.push({ date: d, isCurrentMonth: false });
  }

  // Current month days
  for (let i = 1; i <= numDays; i++) {
    const d = new Date(year, month, i);
    calendarDays.push({ date: d, isCurrentMonth: true });
  }

  // Next month padding days to make grid complete (multiple of 7)
  const remaining = 42 - calendarDays.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(month + 1 > 11 ? year + 1 : year, month + 1 > 11 ? 0 : month + 1, i);
    calendarDays.push({ date: d, isCurrentMonth: false });
  }

  const navigateMonth = (direction) => {
    if (direction === 'prev') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else {
      setCurrentDate(new Date(year, month + 1, 1));
    }
  };

  const handleDayClick = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    setSelectedDate(dateStr);
    openAddModal(dateStr);
  };

  const openAddModal = (dateStr = '') => {
    setEditingId(null);
    setClientName('');
    setMobileNumber('');
    setService('Photo Shoot');
    setAmount('');
    setBookingDate(dateStr || new Date().toISOString().split('T')[0]);
    setNotes('');
    setShowModal(true);
  };

  const openEditModal = (booking) => {
    setEditingId(booking._id);
    setClientName(booking.clientName);
    setMobileNumber(booking.mobileNumber);
    setService(booking.service);
    setAmount(booking.amount);
    setBookingDate(booking.bookingDate);
    setNotes(booking.notes || '');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      clientName,
      mobileNumber,
      service,
      amount: Number(amount),
      bookingDate,
      notes
    };

    try {
      if (editingId) {
        await apiClient.put(`/studio/${editingId}`, payload);
      } else {
        await apiClient.post('/studio', payload);
      }
      setShowModal(false);
      fetchBookings();
    } catch (err) {
      alert('Failed to save booking: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this studio booking?')) {
      try {
        await apiClient.delete(`/studio/${id}`);
        fetchBookings();
      } catch (err) {
        alert('Failed to delete booking');
      }
    }
  };

  // Get bookings for a specific calendar day
  const getBookingsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return bookings.filter(b => b.bookingDate === dateStr);
  };

  // Filtered bookings for the search/list view
  const filteredBookings = bookings.filter(b => {
    const term = searchQuery.toLowerCase();
    return (
      b.clientName.toLowerCase().includes(term) ||
      b.service.toLowerCase().includes(term) ||
      b.mobileNumber.includes(term)
    );
  });

  const formatMonthName = (m) => {
    return new Date(2000, m, 1).toLocaleString('default', { month: 'long' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto px-4 md:px-0">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-teal-500 to-emerald-400 bg-clip-text text-transparent">
            Studio Bookings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Isolated management of studio sessions, prints, and packages.
          </p>
        </div>
        <button
          onClick={() => openAddModal()}
          className="bg-teal-500 hover:bg-teal-400 text-white font-bold px-5 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-teal-500/20 transition-all text-sm shrink-0"
        >
          <Plus size={18} /> Add Studio Booking
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* CALENDAR VIEW */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col h-fit">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <CalendarIcon size={20} className="text-teal-500" />
              {formatMonthName(month)} {year}
            </h2>
            <div className="flex gap-2">
              <button 
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors text-slate-600 dark:text-slate-350"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors text-slate-600 dark:text-slate-350"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 uppercase mb-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((dayObj, index) => {
              const dayBookings = getBookingsForDate(dayObj.date);
              const isToday = new Date().toISOString().split('T')[0] === dayObj.date.toISOString().split('T')[0];
              
              return (
                <div
                  key={index}
                  onClick={() => handleDayClick(dayObj.date)}
                  className={`min-h-[85px] p-2 border border-slate-100 dark:border-slate-800/60 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex flex-col gap-1 relative ${
                    dayObj.isCurrentMonth ? 'bg-white dark:bg-slate-900/30' : 'bg-slate-50/50 dark:bg-slate-950/20 opacity-40'
                  } ${
                    isToday ? 'ring-2 ring-teal-500 ring-offset-2 dark:ring-offset-slate-950' : ''
                  }`}
                >
                  <span className={`text-xs font-extrabold block text-left ${dayObj.isCurrentMonth ? 'text-slate-800 dark:text-slate-300' : 'text-slate-400'}`}>
                    {dayObj.date.getDate()}
                  </span>
                  
                  {/* Bookings on this day */}
                  <div className="flex flex-col gap-0.5 mt-auto overflow-y-auto max-h-[50px] scrollbar-none">
                    {dayBookings.slice(0, 3).map((b, bIdx) => (
                      <span 
                        key={bIdx}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-600 dark:bg-teal-400/10 dark:text-teal-350 font-bold truncate block border border-teal-500/20"
                        title={`${b.clientName} - ${b.service}`}
                      >
                        {b.clientName}
                      </span>
                    ))}
                    {dayBookings.length > 3 && (
                      <span className="text-[8px] font-bold text-slate-400 block text-center mt-0.5">
                        +{dayBookings.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* BOOKINGS LIST VIEW */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col h-[600px]">
          <div className="flex justify-between items-center mb-6 shrink-0">
            <h2 className="text-lg font-bold text-slate-850 dark:text-white">All Bookings</h2>
            <div className="relative w-44">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-xl py-1.5 pl-9 pr-3 text-xs focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-teal-500"></div>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No bookings found.
              </div>
            ) : (
              filteredBookings.map((b) => (
                <div 
                  key={b._id}
                  className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl hover:border-slate-200 dark:hover:border-slate-750 transition-all flex justify-between items-start gap-3"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black px-2 py-0.5 rounded bg-teal-500/10 text-teal-600 dark:bg-teal-400/15 dark:text-teal-350 tracking-wide">
                        {b.service}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">
                        {new Date(b.bookingDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-slate-850 dark:text-white truncate">{b.clientName}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Phone size={12} /> {b.mobileNumber}
                    </p>
                    {b.notes && (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 italic truncate max-w-[200px]">
                        "{b.notes}"
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <span className="font-black text-slate-850 dark:text-white text-sm">
                      ₹{b.amount?.toLocaleString('en-IN')}
                    </span>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => openEditModal(b)}
                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button 
                        onClick={() => handleDelete(b._id)}
                        className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg text-rose-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* FORM MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-850 dark:text-white">
                {editingId ? 'Edit Studio Booking' : 'Add Studio Booking'}
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
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-teal-500"
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
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Service</label>
                    <select
                      value={service}
                      onChange={e => setService(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500"
                    >
                      {SERVICES_LIST.map((srv) => (
                        <option key={srv} value={srv}>{srv}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Amount (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-450 font-bold text-sm">₹</span>
                      <input 
                        required 
                        type="number" 
                        value={amount} 
                        onChange={e => setAmount(e.target.value)} 
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-8 pr-4 text-sm focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Booking Date</label>
                  <div className="relative">
                    <CalendarIcon size={16} className="absolute left-3 top-3 text-slate-400" />
                    <input 
                      required 
                      type="date" 
                      value={bookingDate} 
                      onChange={e => setBookingDate(e.target.value)} 
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Notes</label>
                  <textarea 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)} 
                    rows={3}
                    placeholder="Enter any session details or instructions..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500"
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
                  type="submit" 
                  className="flex-1 h-12 bg-teal-500 hover:bg-teal-400 text-white font-bold rounded-2xl shadow-lg shadow-teal-500/20 transition-all text-sm"
                >
                  {editingId ? 'Update Booking' : 'Save Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Studio;
