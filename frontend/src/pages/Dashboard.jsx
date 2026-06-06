import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import { Calendar, Wallet, FileText, Receipt, Download } from 'lucide-react';
import { useSettings } from '../services/SettingsContext';
import { generatePdf } from '../utils/pdfGenerator';

const Dashboard = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [pdfLoading, setPdfLoading] = useState(false);

  const cards = [
    {
      title: 'Events',
      icon: Calendar,
      description: 'Manage employees, assign events, open employee profile, calendar scheduling.',
      path: '/events',
      color: 'from-blue-500 to-indigo-600',
      iconBg: 'bg-blue-500/20 text-blue-400'
    },
    {
      title: 'Payments',
      icon: Wallet,
      description: 'Manage employee payments, pending amounts, payment history and WhatsApp reminders.',
      path: '/payments',
      color: 'from-emerald-400 to-teal-500',
      iconBg: 'bg-teal-500/20 text-teal-400'
    },
    {
      title: 'Bill Generator',
      icon: FileText,
      description: 'Create invoices, generate PDFs, print and download bills.',
      path: '/billing',
      color: 'from-amber-400 to-orange-500',
      iconBg: 'bg-orange-500/20 text-orange-400'
    },
    {
      title: 'Expenses',
      icon: Receipt,
      description: 'Track expenses, add expense entries and monitor total expenses.',
      path: '/expenses',
      color: 'from-rose-400 to-red-500',
      iconBg: 'bg-rose-500/20 text-rose-400'
    }
  ];

  const downloadRevenuePdf = async () => {
    try {
      setPdfLoading(true);
      const res = await apiClient.get('/bills');
      const sortedBills = (res.data || []).sort((a, b) => new Date(b.billDate || b.createdAt) - new Date(a.billDate || a.createdAt));
      await generatePdf('Revenue_Report', sortedBills, settings, 'download');
    } catch (error) {
      console.error('Download PDF error', error);
      alert('Failed to generate revenue report');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center animate-in fade-in duration-500 relative py-12">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-teal-500/5 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[120px]"></div>
      </div>

      <div className="max-w-6xl w-full mx-auto space-y-12">
        <div className="text-center space-y-6">
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-800 dark:text-white">
              Welcome to <span className="bg-gradient-to-r from-teal-500 to-emerald-400 bg-clip-text text-transparent">Vivid Admin</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
              Select a module below to manage your operations, team rosters, and finances.
            </p>
          </div>
          
          <button 
            onClick={downloadRevenuePdf}
            className="inline-flex items-center justify-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 px-6 py-3 rounded-full font-bold transition-all shadow-sm text-sm"
          >
            <Download size={18} />
            Download Revenue Report
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 px-1.5 md:px-4">
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div 
                key={idx}
                onClick={() => navigate(card.path)}
                className="group relative bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10 overflow-hidden"
              >
                {/* Glow effect on hover */}
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${card.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                
                <div className="flex flex-col h-full gap-3 md:gap-6 relative z-10">
                  <div className={`w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center ${card.iconBg} shadow-inner transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                    <Icon className="w-5 h-5 md:w-8 md:h-8" strokeWidth={1.5} />
                  </div>
                  
                  <div className="space-y-1.5 md:space-y-3 flex-1">
                    <h2 className="text-sm md:text-xl lg:text-2xl font-bold text-slate-800 dark:text-white group-hover:text-teal-400 transition-colors">
                      {card.title}
                    </h2>
                    <p className="text-[11px] md:text-sm text-slate-500 dark:text-slate-400 leading-normal md:leading-relaxed line-clamp-3 md:line-clamp-none">
                      {card.description}
                    </p>
                  </div>

                  <div className="pt-2 md:pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between mt-auto">
                    <span className="hidden sm:inline font-semibold text-slate-800 dark:text-white text-xs md:text-sm">
                      Open {card.title}
                    </span>
                    <span className="sm:hidden font-semibold text-slate-800 dark:text-white text-[10px]">
                      Open
                    </span>
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-teal-500 group-hover:text-white transition-colors duration-300 shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 md:w-4 md:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14"></path>
                        <path d="m12 5 7 7-7 7"></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
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

export default Dashboard;
