import React, { useState, useEffect } from 'react';
import apiClient, { getAssetUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { User, Calendar, CreditCard, Clock, CheckCircle, Smartphone, CalendarDays, Key } from 'lucide-react';

const EmployeePortal = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPortalData = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(`/employees/${user.id}`);
        setData(res.data);
      } catch (error) {
        console.error('Failed to fetch employee portal data', error);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) {
      fetchPortalData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center mt-20 text-slate-500">
        <p>Failed to load portal data. Please try again later.</p>
      </div>
    );
  }

  const { employee, events, paymentHistory, stats } = data;

  // Calculate earnings
  const totalEarnings = events.reduce((sum, ev) => sum + (ev.employeeCharge || 0), 0);
  const totalReceived = stats.totalPaymentsGiven || 0;
  const pendingAmount = totalEarnings - totalReceived;

  // Split events
  const today = new Date().toISOString().split('T')[0];
  const upcomingEvents = events.filter(ev => ev.eventDate >= today).sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));
  const completedEvents = events.filter(ev => ev.eventDate < today).sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate));

  return (
    <div className="animate-in fade-in duration-300 max-w-6xl mx-auto space-y-6 md:space-y-8 pb-12">
      
      {/* HEADER */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10">
          <h1 className="text-2xl md:text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight">
            Welcome, <span className="text-indigo-500">{employee.fullName}</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            Employee Portal
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Profile & Payments */}
        <div className="space-y-6">
          
          {/* PROFILE CARD */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              {employee.profilePhoto ? (
                <img src={getAssetUrl(employee.profilePhoto)} alt={employee.fullName} className="w-16 h-16 rounded-full object-cover shadow-inner ring-4 ring-indigo-50 dark:ring-indigo-950/50" />
              ) : (
                <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-2xl">
                  <User size={24} />
                </div>
              )}
              <div>
                <h2 className="font-bold text-slate-800 dark:text-white text-lg">My Profile</h2>
                <p className="text-xs text-slate-500">Personal Information</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                  <Key size={16} /> Employee ID
                </div>
                <span className="font-semibold text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg text-xs">
                  {employee.employeeId || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                  <Smartphone size={16} /> Mobile
                </div>
                <span className="font-medium text-slate-800 dark:text-white">{employee.mobileNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                  <CalendarDays size={16} /> Joining Date
                </div>
                <span className="font-medium text-slate-800 dark:text-white">{employee.joiningDate || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* EARNINGS CARD */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-xl">
                <CreditCard size={20} />
              </div>
              <h2 className="font-bold text-slate-800 dark:text-white">Earnings & Payments</h2>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Earnings</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white">₹{totalEarnings.toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Received</p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">₹{totalReceived.toLocaleString('en-IN')}</p>
              </div>
              <div className="col-span-2 bg-rose-50 dark:bg-rose-500/10 p-4 rounded-2xl border border-rose-100 dark:border-rose-500/20">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-bold text-rose-500 uppercase tracking-wider">Pending Amount</p>
                  <p className="text-2xl font-black text-rose-600 dark:text-rose-400">₹{pendingAmount.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>

            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3">Recent Payments</h3>
            {paymentHistory.length === 0 ? (
              <p className="text-sm text-slate-500 italic text-center py-4">No payments received yet.</p>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {paymentHistory.map((p, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-white">₹{p.amountGiven?.toLocaleString('en-IN')}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <CreditCard size={12} /> {p.paymentMethod || 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{p.paymentDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Events */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* EVENT STATS */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 text-center shadow-sm">
              <span className="block text-2xl font-black text-indigo-500 mb-1">{events.length}</span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Events</span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 text-center shadow-sm">
              <span className="block text-2xl font-black text-amber-500 mb-1">{upcomingEvents.length}</span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Upcoming</span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 text-center shadow-sm">
              <span className="block text-2xl font-black text-emerald-500 mb-1">{completedEvents.length}</span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Completed</span>
            </div>
          </div>

          {/* UPCOMING EVENTS */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-50 dark:bg-amber-500/10 text-amber-500 rounded-xl">
                <Clock size={20} />
              </div>
              <h2 className="font-bold text-slate-800 dark:text-white">Upcoming Events</h2>
            </div>
            
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-8 text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                No upcoming events assigned.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map(ev => (
                  <div key={ev._id} className="flex flex-col sm:flex-row justify-between sm:items-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 gap-3">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex flex-col items-center justify-center shrink-0">
                        <span className="text-xs font-bold uppercase">{new Date(ev.eventDate).toLocaleString('default', { month: 'short' })}</span>
                        <span className="text-lg font-black leading-none">{new Date(ev.eventDate).getDate()}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-white">{ev.eventType}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar size={14} /> {ev.eventDate}
                        </p>
                      </div>
                    </div>
                    <div className="sm:text-right bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-800 inline-block sm:block w-max sm:w-auto">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Charge</p>
                      <p className="text-base font-black text-slate-800 dark:text-white">₹{ev.employeeCharge?.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* COMPLETED EVENTS */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl">
                <CheckCircle size={20} />
              </div>
              <h2 className="font-bold text-slate-800 dark:text-white">Completed Events</h2>
            </div>
            
            {completedEvents.length === 0 ? (
              <div className="text-center py-8 text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                No completed events yet.
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {completedEvents.map(ev => (
                  <div key={ev._id} className="flex flex-col sm:flex-row justify-between sm:items-center p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors gap-3">
                    <div>
                      <h4 className="font-semibold text-slate-800 dark:text-white">{ev.eventType}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar size={14} /> {ev.eventDate}
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Charge</p>
                      <p className="text-sm font-black text-slate-700 dark:text-slate-300">₹{ev.employeeCharge?.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default EmployeePortal;
