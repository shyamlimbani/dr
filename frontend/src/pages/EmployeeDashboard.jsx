import React, { useState, useEffect, useRef } from 'react';
import apiClient, { getAssetUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../services/SettingsContext';
import { generatePdf, getEmployeeMonthlyReportHtml, getCompressedLogo } from '../utils/pdfGenerator';
import { 
  Phone, 
  Calendar as CalendarIcon, 
  DollarSign, 
  Clock,
  CreditCard,
  User,
  Smartphone,
  CalendarDays,
  Key
} from 'lucide-react';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const { settings } = useSettings();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // PDF Preview Refs & State
  const pdfPreviewRef = useRef(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfLogoData, setPdfLogoData] = useState(null);

  // Month & Year Filter
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchPortalData = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(`/employees/${user.id}`);
        // res.data contains { employee, events, paymentHistory, stats }
        // Events might need to be sorted chronologically
        if (res.data && res.data.events) {
          res.data.events = res.data.events.sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));
        }
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

  // Trigger PDF Generation
  useEffect(() => {
    const generate = async () => {
      if (pdfLoading && pdfPreviewRef.current && data) {
        try {
          const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' });
          const filename = `my_monthly_report_${data.employee.fullName.replace(/[^a-zA-Z0-9]/g, '_')}_${monthName}_${selectedYear}.pdf`;
          await generatePdf(pdfPreviewRef.current, filename, 'download');
        } catch (err) {
          console.error('PDF Action failed:', err);
          alert('PDF Generation failed: ' + err.message);
        } finally {
          setPdfLoading(false);
        }
      }
    };
    generate();
  }, [pdfLoading, data, selectedMonth, selectedYear]);

  const downloadMonthlyPdf = async () => {
    if (settings?.logo) {
      const compressed = await getCompressedLogo(settings.logo);
      setPdfLogoData(compressed);
    }
    setPdfLoading(true);
  };

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
        <p>Failed to load dashboard data. Please try again later.</p>
      </div>
    );
  }

  const { employee, events, paymentHistory } = data;

  // Filter for selected month/year
  const filteredEvents = events.filter(ev => {
    if (!ev.eventDate) return false;
    const d = new Date(ev.eventDate);
    return (d.getMonth() + 1) === Number(selectedMonth) && d.getFullYear() === Number(selectedYear);
  });
  
  const filteredPayments = paymentHistory.filter(p => {
    if (!p.paymentDate) return false;
    const d = new Date(p.paymentDate);
    return (d.getMonth() + 1) === Number(selectedMonth) && d.getFullYear() === Number(selectedYear);
  });

  // Calculations for Summary Cards
  const totalPaymentsGiven = filteredPayments.reduce((sum, p) => sum + (p.amountGiven || 0), 0);
  const totalEvents = filteredEvents.length;
  const totalEarnings = filteredEvents.reduce((sum, ev) => sum + (Number(ev.employeeCharge) || 0), 0);
  const pendingAmount = totalEarnings - totalPaymentsGiven;

  return (
    <div className="animate-in fade-in duration-300 max-w-5xl mx-auto space-y-8 pb-12">
      
      {/* Employee Info Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-bl-full pointer-events-none"></div>
        <div className="flex items-center gap-6">
          {employee.profilePhoto ? (
            <img src={getAssetUrl(employee.profilePhoto)} alt={employee.fullName} className="w-24 h-24 rounded-full object-cover shadow-inner ring-4 ring-indigo-50 dark:ring-indigo-950/50" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-500 flex items-center justify-center text-4xl font-black shadow-inner">
              {employee.fullName.charAt(0)}
            </div>
          )}
          <div>
            <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Welcome, {employee.fullName}</h2>
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Phone size={14} className="text-slate-400" />
                <span className="font-semibold text-sm">{employee.mobileNumber}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <Key size={14} className="text-slate-400" />
                <span className="font-semibold text-sm">ID: {employee.employeeId || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Performance Header & Content */}
      <div className="space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800/60 pb-3 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Monthly Performance</h3>
            <p className="text-sm text-slate-500 mt-1">Track your assignments and payment history by month.</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}</option>
              ))}
            </select>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              {[...Array(10)].map((_, i) => {
                const yr = new Date().getFullYear() - 5 + i;
                return <option key={yr} value={yr}>{yr}</option>
              })}
            </select>
            <button
              onClick={downloadMonthlyPdf}
              disabled={pdfLoading}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl shadow-md transition-colors text-sm disabled:opacity-50"
            >
              {pdfLoading ? 'Generating...' : 'Download Report'}
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-4 bg-indigo-500/10 text-indigo-500 rounded-2xl">
              <CalendarIcon size={24} />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Total Events</span>
              <span className="text-2xl font-black text-slate-800 dark:text-white mt-1 block">{totalEvents}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-4 bg-blue-500/10 text-blue-500 rounded-2xl">
              <DollarSign size={24} />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Total Earnings</span>
              <span className="text-2xl font-black text-blue-500 mt-1 block">₹{totalEarnings.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-2xl">
              <CreditCard size={24} />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Total Received</span>
              <span className="text-2xl font-black text-emerald-500 mt-1 block">₹{totalPaymentsGiven.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-4 bg-amber-500/10 text-amber-500 rounded-2xl">
              <Clock size={24} />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Pending Amount</span>
              <span className="text-2xl font-black text-amber-500 mt-1 block">₹{pendingAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Event History List */}
        <div className="space-y-4">
          <h4 className="font-bold text-lg text-slate-800 dark:text-white">Event History</h4>
          {filteredEvents.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
              <p className="text-slate-500 font-medium">No bookings found for the selected month.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredEvents.map((ev) => (
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
                  </div>

                  <div className="flex justify-between items-end border-t border-slate-100 dark:border-slate-800/60 pt-4 mt-2">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Charge</span>
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

        {/* Payment History List */}
        <div className="space-y-4 mt-8">
          <h4 className="font-bold text-lg text-slate-800 dark:text-white">Payment History</h4>
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
              <p className="text-slate-500 font-medium">No payments received for the selected month.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPayments.map((p) => (
                <div 
                  key={p._id} 
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl flex flex-col justify-between gap-4 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider rounded-lg">
                        {p.paymentMethod || 'Payment'}
                      </span>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mt-3">
                        <CalendarIcon size={14} className="text-slate-400" />
                        {new Date(p.paymentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">Amount Received</span>
                      <span className="text-xl font-black text-emerald-500 block">₹{p.amountGiven?.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* PDF Generation Portal */}
      {pdfLoading && data && (
        <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
          <div ref={pdfPreviewRef} style={{ width: '800px', backgroundColor: '#fff', padding: '20px' }}>
            <div dangerouslySetInnerHTML={{ 
              __html: getEmployeeMonthlyReportHtml({
                employee: employee,
                reportMonth: `${new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' })} ${selectedYear}`,
                stats: { totalEvents, totalEarnings, totalPaymentsGiven, pendingAmount },
                events: filteredEvents,
                payments: filteredPayments
              }, settings, pdfLogoData)
            }} />
          </div>
        </div>
      )}

    </div>
  );
};

export default EmployeeDashboard;
