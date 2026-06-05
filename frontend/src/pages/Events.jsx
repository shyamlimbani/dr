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
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Edit2,
  Trash2,
  Clock
} from 'lucide-react';

const Events = () => {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'profile'
  const [employees, setEmployees] = useState([]);
  const [activeEmployee, setActiveEmployee] = useState(null);
  const [employeeEvents, setEmployeeEvents] = useState([]);
  
  // Employee Modal
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [empName, setEmpName] = useState('');
  const [empMobile, setEmpMobile] = useState('');
  const [empPhoto, setEmpPhoto] = useState(null);

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());

  // Event Modal & Editing
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventType, setEventType] = useState('Photography');
  const [eventLocation, setEventLocation] = useState('');
  const [employeeCharge, setEmployeeCharge] = useState('');
  const [eventNotes, setEventNotes] = useState('');

  // Booking History Filters
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingFilterType, setBookingFilterType] = useState('');
  const [bookingFilterMonth, setBookingFilterMonth] = useState('');

  const fetchEmployees = async () => {
    try {
      const res = await apiClient.get('/employees');
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEmployees();
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

  const handleDayClick = (day) => {
    if (!day) return;
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    setEventTime('');
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
    setEventTime(ev.eventTime || '');
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
        eventTime,
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

  // Calendar Helpers
  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayIndex = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const changeMonth = (offset) => {
    const nextDate = new Date(currentDate);
    nextDate.setMonth(currentDate.getMonth() + offset);
    setCurrentDate(nextDate);
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayIndex = getFirstDayIndex(currentDate);

  const prevMonthDays = [];
  const totalDaysPrevMonth = getDaysInMonth(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    prevMonthDays.push(totalDaysPrevMonth - i);
  }

  const currentMonthDays = [];
  for (let i = 1; i <= daysInMonth; i++) {
    currentMonthDays.push(i);
  }

  const gridCells = [...prevMonthDays.map(() => null), ...currentMonthDays];
  const nextMonthDaysToAdd = (Math.ceil(gridCells.length / 7) * 7) - gridCells.length;
  for (let i = 1; i <= nextMonthDaysToAdd; i++) {
    gridCells.push(null);
  }

  const getEventsForDay = (day) => {
    if (!day) return [];
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return employeeEvents.filter(ev => {
      const evDate = new Date(ev.eventDate).toISOString().split('T')[0];
      return evDate === dateStr;
    });
  };

  const eventTypeOptions = ['Photography', 'Videography', 'Drone Shoot', 'Reels Shoot', 'Editing', 'Wedding', 'Other'];

  // Bookings Filter Logic
  const filteredBookings = employeeEvents.filter(ev => {
    if (bookingSearch && 
        !ev.eventLocation?.toLowerCase().includes(bookingSearch.toLowerCase()) && 
        !ev.eventType?.toLowerCase().includes(bookingSearch.toLowerCase()) && 
        !ev.notes?.toLowerCase().includes(bookingSearch.toLowerCase())) {
      return false;
    }
    if (bookingFilterType && ev.eventType !== bookingFilterType) {
      return false;
    }
    if (bookingFilterMonth) {
      const evDatePrefix = new Date(ev.eventDate).toISOString().slice(0, 7); // 'YYYY-MM'
      if (evDatePrefix !== bookingFilterMonth) {
        return false;
      }
    }
    return true;
  });

  const totalEarnings = filteredBookings.reduce((sum, ev) => sum + (Number(ev.employeeCharge) || 0), 0);

  // Date Logic for Status
  const todayDateObj = new Date();
  const todayStr = todayDateObj.toISOString().split('T')[0];
  const todayDisplay = todayDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

  const getEventStatusColor = (dateStr) => {
    const evDateStr = new Date(dateStr).toISOString().split('T')[0];
    if (evDateStr === todayStr) return 'border-emerald-500'; // Today
    if (evDateStr > todayStr) return 'border-orange-500'; // Upcoming
    return 'border-slate-400 dark:border-slate-600'; // Completed
  };

  // Status Counters
  const todaysEvents = employeeEvents.filter(ev => new Date(ev.eventDate).toISOString().split('T')[0] === todayStr);
  const upcomingEvents = employeeEvents.filter(ev => new Date(ev.eventDate).toISOString().split('T')[0] > todayStr);

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
                    <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-500 flex items-center justify-center text-2xl font-bold mb-4 shadow-inner group-hover:scale-105 transition-transform">
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

      {/* PROFILE MODE (2-Column Layout) */}
      {viewMode === 'profile' && activeEmployee && (
        <div className="space-y-6">
          <button 
            onClick={() => setViewMode('grid')}
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Employees
          </button>

          <div className="flex flex-col lg:flex-row gap-6">
            
            {/* LEFT COLUMN: 60% */}
            <div className="w-full lg:w-[60%] space-y-6">
              
              {/* Profile Header */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex items-center gap-6 shadow-sm">
                {activeEmployee.profilePhoto ? (
                  <img src={getAssetUrl(activeEmployee.profilePhoto)} alt={activeEmployee.fullName} className="w-20 h-20 rounded-full object-cover shadow-inner" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-500 flex items-center justify-center text-3xl font-bold shadow-inner">
                    {activeEmployee.fullName.charAt(0)}
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">{activeEmployee.fullName}</h2>
                  <div className="flex items-center gap-2 text-slate-500 mt-1">
                    <Phone size={16} />
                    <span className="font-medium">{activeEmployee.mobileNumber}</span>
                  </div>
                </div>
              </div>

              {/* Today's Schedule */}
              <div className="bg-white dark:bg-slate-900 border border-emerald-500/30 dark:border-emerald-500/20 rounded-3xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full pointer-events-none"></div>
                
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white">Today's Schedule</h3>
                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
                      <CalendarIcon size={14} />
                      Today: {todayDisplay}
                    </p>
                  </div>
                </div>

                {todaysEvents.length === 0 ? (
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 text-center text-slate-400 text-sm font-medium">
                    No events assigned for today
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todaysEvents.map(ev => (
                      <div key={ev._id} className="bg-slate-50 dark:bg-slate-950 border-l-4 border-l-emerald-500 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded-md">
                            {ev.eventType}
                          </span>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                            {ev.eventTime && (
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                <Clock size={14} className="text-slate-400" />
                                {ev.eventTime}
                              </div>
                            )}
                            {ev.eventLocation && (
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                <MapPin size={14} className="text-slate-400" />
                                {ev.eventLocation}
                              </div>
                            )}
                          </div>
                          {ev.notes && (
                            <p className="text-xs text-slate-500 mt-2 line-clamp-2">{ev.notes}</p>
                          )}
                        </div>
                        <div className="shrink-0 text-left md:text-right">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Charge</span>
                          <span className="text-lg font-black text-slate-800 dark:text-white">₹{ev.employeeCharge}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Calendar View */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white capitalize">
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button onClick={() => changeMonth(-1)} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors">
                      <ChevronLeft size={20} />
                    </button>
                    <button onClick={() => changeMonth(1)} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors">
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2 text-center text-sm font-bold text-slate-400 mb-3">
                  <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {gridCells.map((day, idx) => {
                    const dayEvents = getEventsForDay(day);
                    
                    return (
                      <div 
                        key={idx}
                        onClick={() => day && handleDayClick(day)}
                        className={`min-h-[50px] lg:min-h-[80px] p-1.5 lg:p-2 rounded-xl lg:rounded-2xl border transition-all flex flex-col gap-1 ${
                          day 
                            ? 'bg-slate-50 hover:bg-indigo-50 dark:bg-slate-950/50 dark:hover:bg-indigo-500/10 border-slate-100 dark:border-slate-800 hover:border-indigo-500 cursor-pointer' 
                            : 'bg-transparent border-transparent opacity-0 cursor-default pointer-events-none'
                        }`}
                      >
                        <span className={`text-[10px] lg:text-xs font-bold ${day ? 'text-slate-600 dark:text-slate-300' : ''}`}>
                          {day}
                        </span>
                        
                        {/* Mobile event indicator dots */}
                        <div className="flex justify-center gap-0.5 mt-auto lg:hidden">
                          {dayEvents.length > 0 && (
                            <div className="flex gap-0.5">
                              {dayEvents.slice(0, 3).map(ev => {
                                const isToday = new Date(ev.eventDate).toISOString().split('T')[0] === todayStr;
                                return (
                                  <span key={ev._id} className={`w-1 lg:w-1.5 h-1 lg:h-1.5 rounded-full ${
                                    isToday ? 'bg-emerald-500' : 'bg-indigo-500'
                                  }`} />
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Desktop event badges */}
                        <div className="hidden lg:flex flex-col gap-1 overflow-y-auto w-full mt-1">
                          {dayEvents.map(ev => {
                            const isToday = new Date(ev.eventDate).toISOString().split('T')[0] === todayStr;
                            return (
                              <div key={ev._id} className={`text-[9px] font-bold px-1.5 py-0.5 rounded truncate ${
                                isToday ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                              }`}>
                                {ev.eventType}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: 40% (Booking History Panel) */}
            <div className="w-full lg:w-[40%] flex flex-col h-full space-y-6">
              
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col h-[calc(100vh-140px)]">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white">Booking History</h3>
                  
                  {/* Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 mb-4">
                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Today</span>
                      <span className="text-lg font-black text-emerald-500 mt-0.5 block">{todaysEvents.length}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Upcoming</span>
                      <span className="text-lg font-black text-orange-500 mt-0.5 block">{upcomingEvents.length}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Total</span>
                      <span className="text-lg font-black text-slate-800 dark:text-white mt-0.5 block">{employeeEvents.length}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Earnings</span>
                      <span className="text-sm font-black text-slate-800 dark:text-white mt-1 block">₹{totalEarnings}</span>
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="space-y-3">
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Search location, notes, type..." 
                        value={bookingSearch}
                        onChange={(e) => setBookingSearch(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Filter size={14} className="absolute left-3 top-2.5 text-slate-400" />
                        <select 
                          value={bookingFilterType}
                          onChange={(e) => setBookingFilterType(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-8 pr-2 text-xs focus:outline-none appearance-none"
                        >
                          <option value="">All Event Types</option>
                          {eventTypeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div className="relative flex-1">
                        <CalendarIcon size={14} className="absolute left-3 top-2.5 text-slate-400" />
                        <input 
                          type="month"
                          value={bookingFilterMonth}
                          onChange={(e) => setBookingFilterMonth(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-8 pr-2 text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Booking List - Scrollable */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                  {filteredBookings.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm">
                      No bookings found.
                    </div>
                  ) : (
                    filteredBookings.map((ev) => (
                      <div key={ev._id} className={`bg-slate-50 dark:bg-slate-950 border-l-4 ${getEventStatusColor(ev.eventDate)} border-y border-r border-y-slate-200 dark:border-y-slate-800 border-r-slate-200 dark:border-r-slate-800 p-4 rounded-2xl flex flex-col gap-2 relative group`}>
                        
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <span className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                              <CalendarIcon size={14} className="text-slate-400" />
                              {new Date(ev.eventDate).toLocaleDateString()}
                            </span>
                          </div>
                          
                          {/* Actions - Hover reveal */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <button onClick={() => openEditModal(ev)} className="p-1.5 text-slate-400 hover:text-indigo-500 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDeleteEvent(ev._id)} className="p-1.5 text-slate-400 hover:text-red-500 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mt-2">
                          <div>
                            <span className="text-slate-400 block mb-0.5">Type</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{ev.eventType}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block mb-0.5">Charge</span>
                            <span className="font-bold text-emerald-500">₹{ev.employeeCharge}</span>
                          </div>
                          {ev.eventTime && (
                            <div className="col-span-2">
                              <span className="text-slate-400 block mb-0.5">Time</span>
                              <span className="font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                <Clock size={12} />
                                {ev.eventTime}
                              </span>
                            </div>
                          )}
                          {ev.eventLocation && (
                            <div className="col-span-2">
                              <span className="text-slate-400 block mb-0.5">Location</span>
                              <span className="font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                <MapPin size={12} />
                                {ev.eventLocation}
                              </span>
                            </div>
                          )}
                          {ev.notes && (
                            <div className="col-span-2">
                              <span className="text-slate-400 block mb-0.5">Notes</span>
                              <p className="font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800/50 leading-relaxed">
                                {ev.notes}
                              </p>
                            </div>
                          )}
                        </div>

                      </div>
                    ))
                  )}
                </div>

              </div>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Selected Date</label>
                  <input type="date" required value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Event Time</label>
                  <input type="time" value={eventTime} onChange={e => setEventTime(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                </div>
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
