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

  const openAddModal = () => {
    setEditingId(null);
    setClientName('');
    setMobileNumber('');
    setService('Photo Shoot');
    setAmount('');
    setBookingDate(new Date().toISOString().split('T')[0]);
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

  // Filtered bookings for the search/list view
  const filteredBookings = bookings.filter(b => {
    const term = searchQuery.toLowerCase();
    return (
      b.clientName.toLowerCase().includes(term) ||
      b.service.toLowerCase().includes(term) ||
      b.mobileNumber.includes(term) ||
      (b.notes || '').toLowerCase().includes(term)
    );
  });

  // Calculate Summary metrics
  const totalBookingsCount = bookings.length;
  const totalBookingsAmount = bookings.reduce((sum, b) => sum + (b.amount || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto px-4 md:px-0">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-teal-500 to-emerald-400 bg-clip-text text-transparent">
            Studio Bookings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Studio booking management only. Studio data is completely isolated.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-teal-500 hover:bg-teal-400 text-white font-bold px-5 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-teal-500/20 transition-all text-sm shrink-0"
        >
          <Plus size={18} /> Add Studio Booking
        </button>
      </div>

      {/* SUMMARY STATISTICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-teal-500"></div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Bookings</span>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white mt-2">
            {totalBookingsCount}
          </h2>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Amount</span>
          <h2 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            ₹{totalBookingsAmount.toLocaleString('en-IN')}
          </h2>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={18} className="absolute left-4 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search client, service or notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:border-teal-500 transition-colors"
          />
        </div>
      </div>

      {/* DATA TABLE VIEW */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-500 font-medium">No studio bookings found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider">Client Name</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider">Mobile Number</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider">Service</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider">Booking Date</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider text-right">Amount</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredBookings.map(b => (
                  <tr key={b._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                      {b.clientName}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-350">
                      {b.mobileNumber}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-black px-2 py-0.5 rounded bg-teal-500/10 text-teal-600 dark:bg-teal-400/15 dark:text-teal-350 tracking-wide">
                        {b.service}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-550">
                      {b.bookingDate}
                    </td>
                    <td className="px-6 py-4 font-black text-slate-800 dark:text-white text-right">
                      ₹{b.amount?.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 flex items-center justify-center gap-2">
                      <button 
                        onClick={() => openEditModal(b)}
                        className="p-2 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(b._id)}
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
