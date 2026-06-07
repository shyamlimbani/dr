import React, { useState, useEffect } from 'react';
import apiClient, { getAssetUrl } from '../services/api';
import { 
  Plus, 
  ArrowLeft, 
  Phone, 
  Calendar as CalendarIcon, 
  MapPin, 
  DollarSign, 
  X,
  Edit2,
  Trash2,
  Clock,
  CreditCard
} from 'lucide-react';

const Events = () => {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'profile'
  const [employees, setEmployees] = useState([]);
  const [activeEmployee, setActiveEmployee] = useState(null);
  const [employeeEvents, setEmployeeEvents] = useState([]);
  const [payments, setPayments] = useState([]);
  
  // Employee Modal
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [empName, setEmpName] = useState('');
  const [empMobile, setEmpMobile] = useState('');
  const [empPhoto, setEmpPhoto] = useState(null);

  // Event Modal & Editing
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [eventType, setEventType] = useState('Photography');
  const [eventLocation, setEventLocation] = useState('');
  const [employeeCharge, setEmployeeCharge] = useState('');
  const [eventNotes, setEventNotes] = useState('');

  const fetchEmployees = async () => {
    try {
      const res = await apiClient.get('/employees');
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await apiClient.get('/ledger');
      setPayments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchPayments();
  }, []);

  const handleEmpSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('fullName', empName);
      formData.append('mobileNumber', empMobile);
      formData.append('role', 'Staff'); // Default role
      if (empPhoto) {
        formData.append('profilePhoto', empPhoto);
      }

      await apiClient.post('/employees', formData);
      setShowEmpModal(false);
      setEmpName('');
      setEmpMobile('');
      setEmpPhoto(null);
      fetchEmployees();
    } catch (err) {
      alert('Error saving employee');
    }
  };

  const openProfile = async (emp) => {
    setActiveEmployee(emp);
    setViewMode('profile');
    fetchEmployeeEvents(emp._id);
    fetchPayments();
  };

  const fetchEmployeeEvents = async (empId) => {
    try {
      const res = await apiClient.get(`/events?employeeId=${empId}`);
      // Sort by date ascending to show chronological order
      const sorted = res.data.sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));
      setEmployeeEvents(sorted);
    } catch (err) {
      console.error(err);
    }
  };

  const openAddEventModal = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setEventType('Photography');
    setEventLocation('');
    setEmployeeCharge('');
    setEventNotes('');
    setEditingEventId(null);
    setShowEventModal(true);
  };

  const openEditModal = (ev) => {
    setEditingEventId(ev._id);
    setSelectedDate(new Date(ev.eventDate).toISOString().split('T')[0]);
    setEventType(ev.eventType);
    setEventLocation(ev.eventLocation);
    setEmployeeCharge(ev.employeeCharge);
    setEventNotes(ev.notes);
    setShowEventModal(true);
  };

  const handleDeleteEvent = async (id) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        await apiClient.delete(`/events/${id}`);
        fetchEmployeeEvents(activeEmployee._id);
      } catch (err) {
        alert('Error deleting event');
      }
    }
  };

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        employeeId: activeEmployee._id,
        eventDate: selectedDate,
        eventType,
        eventLocation,
        employeeCharge,
        notes: eventNotes
      };
      
      if (editingEventId) {
        await apiClient.put(`/events/${editingEventId}`, payload);
      } else {
        await apiClient.post('/events', payload);
      }
      setShowEventModal(false);
      setEditingEventId(null);
      fetchEmployeeEvents(activeEmployee._id);
    } catch (err) {
      alert('Error saving event assignment');
    }
  };

  const eventTypeOptions = ['Photography', 'Videography', 'Drone Shoot', 'Reels Shoot', 'Editing', 'Wedding', 'Other'];

  // Calculations for Summary Cards
  const employeeLedgers = payments.filter(p => p.employeeId === activeEmployee?._id);
  const totalPaymentsGiven = employeeLedgers.reduce((sum, p) => sum + (p.amountGiven || 0), 0);
  const totalEvents = employeeEvents.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* GRID MODE */}
      {viewMode === 'grid' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">Staff Management</h2>
            <button
              onClick={() => setShowEmpModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl shadow-md transition-colors"
            >
              <Plus size={18} />
              Add Employee
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {employees.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400">
                No employees found. Click "Add Employee" to get started.
              </div>
            ) : (
              employees.map(emp => (
                <div 
                  key={emp._id} 
                  onClick={() => openProfile(emp)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col items-center text-center cursor-pointer hover:shadow-xl hover:border-indigo-500/50 transition-all duration-300 group"
                >
                  {emp.profilePhoto ? (
                    <img src={getAssetUrl(emp.profilePhoto)} alt={emp.fullName} className="w-20 h-20 rounded-full object-cover shadow-inner mb-4 group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-550 flex items-center justify-center text-2xl font-bold mb-4 shadow-inner group-hover:scale-105 transition-transform">
                      {emp.fullName.charAt(0)}
                    </div>
                  )}
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white">{emp.fullName}</h3>
                  <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-2">
                    <Phone size={14} />
                    <span>{emp.mobileNumber}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* PROFILE MODE (Redesigned Unified Layout) */}
      {viewMode === 'profile' && activeEmployee && (
        <div className="space-y-8 animate-in fade-in duration-300 max-w-5xl mx-auto pb-12">
          {/* Back Button */}
          <button 
            onClick={() => setViewMode('grid')}
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Employees
          </button>

          {/* Employee Info Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-bl-full pointer-events-none"></div>
            <div className="flex items-center gap-6">
              {activeEmployee.profilePhoto ? (
                <img src={getAssetUrl(activeEmployee.profilePhoto)} alt={activeEmployee.fullName} className="w-24 h-24 rounded-full object-cover shadow-inner ring-4 ring-indigo-55 dark:ring-indigo-950/50" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-500 flex items-center justify-center text-4xl font-black shadow-inner">
                  {activeEmployee.fullName.charAt(0)}
                </div>
              )}
              <div>
                <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">{activeEmployee.fullName}</h2>
                <div className="flex items-center gap-2 text-slate-500 mt-2">
                  <Phone size={16} className="text-slate-400" />
                  <span className="font-semibold text-sm">{activeEmployee.mobileNumber}</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={openAddEventModal}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 transition-all text-sm group shrink-0"
            >
              <Plus size={18} className="group-hover:rotate-90 transition-transform duration-200" />
              Assign Event
            </button>
          </div>

          {/* Booking History Header & Content */}
          <div className="space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800/60 pb-3 flex justify-between items-end">
              <div>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Booking History</h3>
                <p className="text-sm text-slate-500 mt-1">Track employee assignments and payment history.</p>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Total Events */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="p-4 bg-indigo-500/10 text-indigo-500 rounded-2xl">
                  <CalendarIcon size={24} />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Total Events</span>
                  <span className="text-2xl font-black text-slate-800 dark:text-white mt-1 block">{totalEvents}</span>
                </div>
              </div>

              {/* Total Payments Given */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-2xl">
                  <CreditCard size={24} />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Total Payments Given</span>
                  <span className="text-2xl font-black text-emerald-500 mt-1 block">₹{totalPaymentsGiven.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Booking List */}
            <div className="space-y-4">
              {employeeEvents.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
                  <p className="text-slate-500 font-medium">No bookings found for this employee.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {employeeEvents.map((ev) => (
                    <div 
                      key={ev._id} 
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl flex flex-col justify-between gap-4 hover:shadow-lg hover:border-indigo-500/30 dark:hover:border-indigo-500/20 transition-all duration-300 group"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider rounded-lg">
                            {ev.eventType}
                          </span>
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mt-3">
                            <CalendarIcon size={14} className="text-slate-400" />
                            {new Date(ev.eventDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex gap-1 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                          <button 
                            onClick={() => openEditModal(ev)} 
                            title="Edit Booking"
                            className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800/80 transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteEvent(ev._id)} 
                            title="Delete Booking"
                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl border border-slate-100 dark:border-slate-800/80 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-end border-t border-slate-100 dark:border-slate-800/60 pt-4 mt-2">
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Location</span>
                          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                            <MapPin size={14} className="text-slate-400" />
                            {ev.eventLocation || 'Not Specified'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Charge</span>
                          <span className="text-xl font-black text-slate-800 dark:text-white">₹{ev.employeeCharge?.toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      {ev.notes && (
                        <div className="bg-slate-50 dark:bg-slate-950/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-900/60 text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <span className="font-bold text-slate-400 dark:text-slate-500 block mb-1">Notes:</span>
                          {ev.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showEmpModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-lg">Add Employee</h3>
              <button onClick={() => setShowEmpModal(false)} className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEmpSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Employee Name</label>
                <input required type="text" value={empName} onChange={e => setEmpName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="e.g. John Doe" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Mobile Number</label>
                <input required type="text" value={empMobile} onChange={e => setEmpMobile(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="+91 9876543210" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Profile Photo (Optional)</label>
                <input type="file" accept="image/*" onChange={e => setEmpPhoto(e.target.files[0])} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 dark:file:bg-indigo-500/10 dark:file:text-indigo-400 focus:outline-none" />
              </div>
            </form>
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex gap-3 shrink-0 bg-slate-50 dark:bg-slate-950">
              <button type="button" onClick={() => setShowEmpModal(false)} className="flex-1 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm">
                Cancel
              </button>
              <button type="submit" onClick={handleEmpSubmit} className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all text-sm">
                Save Employee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Assignment Modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-lg">{editingEventId ? 'Edit Booking' : 'Assign Event'}</h3>
              <button onClick={() => setShowEventModal(false)} className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEventSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Selected Date</label>
                <input type="date" required value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Event Type</label>
                <select value={eventType} onChange={e => setEventType(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                  {eventTypeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Event Location</label>
                <input type="text" value={eventLocation} onChange={e => setEventLocation(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="e.g. The Grand Hotel, City Center" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Employee Charge (₹)</label>
                <input type="number" required value={employeeCharge} onChange={e => setEmployeeCharge(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="e.g. 5000" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Notes</label>
                <textarea rows={3} value={eventNotes} onChange={e => setEventNotes(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="Any special instructions..."></textarea>
              </div>
            </form>
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex gap-3 shrink-0 bg-slate-50 dark:bg-slate-950">
              <button type="button" onClick={() => setShowEventModal(false)} className="flex-1 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm">
                Cancel
              </button>
              <button type="submit" onClick={handleEventSubmit} className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all text-sm">
                {editingEventId ? 'Update Booking' : 'Save Event'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Events;
