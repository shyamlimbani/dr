import React, { useState } from 'react';
import { useNavigate, useLocation, Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, 
  CreditCard, 
  FileText, 
  Receipt,
  LayoutDashboard,
  Settings as SettingsIcon,
  LogOut, 
  Menu, 
  X
} from 'lucide-react';
import { useSettings } from '../services/SettingsContext';
import { getAssetUrl } from '../services/api';

const Layout = () => {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Events', path: '/events', icon: Calendar },
    { name: 'Payments', path: '/payments', icon: CreditCard },
    { name: 'Billing', path: '/billing', icon: FileText },
    { name: 'Expenses', path: '/expenses', icon: Receipt },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {/* SIDEBAR FOR DESKTOP */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 h-screen transition-colors duration-200">
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800">
          <Link to="/" className="flex items-center gap-2">
            {settings.companyLogo ? (
              <img src={getAssetUrl(settings.companyLogo)} alt="Logo" className="max-h-8 max-w-[150px] object-contain" />
            ) : (
              <span className="text-xl font-extrabold bg-gradient-to-r from-teal-500 to-emerald-400 bg-clip-text text-transparent">
                {settings.studioName || 'VIVID ADMIN'}
              </span>
            )}
          </Link>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  isActive 
                    ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all duration-150"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden pb-20 lg:pb-0">
        
        {/* TOP HEADER */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-8 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur sticky top-0 z-30 transition-colors duration-200 relative">
          
          <div className="flex items-center gap-4 w-1/3">
            <h1 className="hidden lg:block text-xl font-bold tracking-tight text-slate-800 dark:text-white">
              {settings.studioName || 'Vivid Productions'}
            </h1>
          </div>

          {/* MOBILE ONLY CENTERED LOGO */}
          <div className="lg:hidden absolute left-1/2 -translate-x-1/2 flex flex-col items-center justify-center h-full pointer-events-none w-1/3 text-center">
            {settings.companyLogo ? (
              <img src={getAssetUrl(settings.companyLogo)} alt="Logo" className="h-7 object-contain" />
            ) : (
              <div className="w-7 h-7 bg-teal-500 rounded-full flex items-center justify-center text-white font-bold text-xs">V</div>
            )}
            <span className="text-[10px] font-extrabold text-slate-800 dark:text-slate-200 mt-0.5 uppercase tracking-wider truncate w-full text-center">
              {settings.studioName || 'Vivid'}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 lg:gap-4 w-1/3">
            <div className="h-9 w-9 bg-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md border border-white/20">
              {user?.name ? user.name.split(' ').map(n=>n[0]).join('') : 'AD'}
            </div>
          </div>
        </header>

        {/* MAIN ROUTE CONTENT */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div className="lg:hidden fixed bottom-0 w-full z-50">
        <div className="nav-notch-bg rounded-t-[24px] pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
          <div className="flex relative h-16 w-full mx-auto">
            
            {/* Sliding Active Indicator */}
            {(() => {
              const mobileMenuItems = [
                { name: 'Dashboard', path: '/', icon: LayoutDashboard },
                { name: 'Events', path: '/events', icon: Calendar },
                { name: 'Payments', path: '/payments', icon: CreditCard },
                { name: 'Bills', path: '/billing', icon: FileText },
                { name: 'Expenses', path: '/expenses', icon: Receipt },
                { name: 'Settings', path: '/settings', icon: SettingsIcon },
              ];
              
              const getActiveIndex = () => {
                const exactMatch = mobileMenuItems.findIndex(i => location.pathname === i.path);
                if (exactMatch >= 0) return exactMatch;
                const startsWithMatch = mobileMenuItems.findIndex(i => i.path !== '/' && location.pathname.startsWith(i.path));
                if (startsWithMatch >= 0) return startsWithMatch;
                return 0; // Default to Dashboard
              };
              
              const validIndex = getActiveIndex();
              
              return (
                <div 
                  className="absolute top-0 h-full w-1/6 flex justify-center pointer-events-none transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(${validIndex * 100}%)` }}
                >
                  <div className="nav-indicator"></div>
                </div>
              );
            })()}
            
            {/* Navigation Items */}
            {[
                { name: 'Dashboard', path: '/', icon: LayoutDashboard },
                { name: 'Events', path: '/events', icon: Calendar },
                { name: 'Payments', path: '/payments', icon: CreditCard },
                { name: 'Bills', path: '/billing', icon: FileText },
                { name: 'Expenses', path: '/expenses', icon: Receipt },
                { name: 'Settings', path: '/settings', icon: SettingsIcon },
            ].map((item, index) => {
              const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
              const Icon = item.icon;
              
              return (
                <Link 
                  key={item.name} 
                  to={item.path} 
                  className="relative flex flex-col items-center justify-center w-1/6 h-full z-10 pt-2"
                >
                  {/* Icon */}
                  <div className={`relative transition-all duration-500 ease-in-out ${isActive ? '-translate-y-6 text-white' : 'text-slate-500 hover:text-slate-400'}`}>
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  
                  {/* Label */}
                  <span className={`absolute bottom-2 left-1/2 -translate-x-1/2 w-full text-center text-[9px] sm:text-[10px] font-bold transition-all duration-500 ease-in-out ${isActive ? 'text-teal-400 translate-y-0 opacity-100' : 'text-slate-500 translate-y-2 opacity-0'} tracking-tighter sm:tracking-normal`}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Layout;
