import React, { useState, useEffect } from 'react';
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
  ChevronLeft,
  ChevronRight,
  Camera,
  TrendingUp
} from 'lucide-react';
import { useSettings } from '../services/SettingsContext';
import { getAssetUrl } from '../services/api';

const Layout = () => {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();

  // Collapsed by default on tablet width
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        // Mobile layout: sidebar hidden
      } else if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const adminMenuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Events', path: '/events', icon: Calendar },
    { name: 'Payments', path: '/payments', icon: CreditCard },
    { name: 'Bill & Quotation', path: '/billing', icon: FileText },
    { name: 'Expenses', path: '/expenses', icon: Receipt },
    { name: 'Studio', path: '/studio', icon: Camera },
    { name: 'Revenue', path: '/revenue', icon: TrendingUp },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  const employeeMenuItems = [
    { name: 'My Dashboard', path: '/employee-dashboard', icon: LayoutDashboard },
  ];

  const menuItems = user?.role === 'Employee' ? employeeMenuItems : adminMenuItems;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      
      {/* SIDEBAR FOR TABLET & DESKTOP */}
      <aside 
        className={`hidden md:flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 h-screen transition-all duration-300 shrink-0 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
          {!sidebarCollapsed && (
            <Link to="/" className="flex items-center gap-2 truncate">
              {settings.companyLogo ? (
                <img src={getAssetUrl(settings.companyLogo)} alt="Logo" className="max-h-8 max-w-[120px] object-contain" />
              ) : (
                <span className="text-base font-black bg-gradient-to-r from-teal-500 to-emerald-400 bg-clip-text text-transparent uppercase tracking-wider truncate">
                  {settings.studioName || 'VIVID'}
                </span>
              )}
            </Link>
          )}
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg mx-auto text-slate-500 transition-colors"
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = item.path === '/' 
              ? location.pathname === '/' 
              : location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center rounded-xl text-sm font-semibold transition-all duration-150 ${
                  sidebarCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'
                } ${
                  isActive 
                    ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={sidebarCollapsed ? item.name : ''}
              >
                <Icon size={18} className="shrink-0" />
                {!sidebarCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={handleLogout}
            className={`flex items-center rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all duration-150 ${
              sidebarCollapsed ? 'justify-center p-3 w-full' : 'gap-3 px-4 py-3 w-full'
            }`}
            title={sidebarCollapsed ? 'Sign Out' : ''}
          >
            <LogOut size={18} className="shrink-0" />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden pb-20 md:pb-0">
        
        {/* TOP HEADER */}
        <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur sticky top-0 z-30 transition-colors duration-200">
          
          <div className="flex items-center gap-4 w-1/3">
            <h1 className="hidden md:block text-lg font-bold tracking-tight text-slate-800 dark:text-white truncate">
              {settings.studioName || 'Vivid Productions'}
            </h1>
          </div>

          {/* MOBILE ONLY CENTERED LOGO */}
          <div className="md:hidden absolute left-1/2 -translate-x-1/2 flex items-center justify-center text-center pointer-events-none w-1/3">
            {settings.companyLogo ? (
              <img src={getAssetUrl(settings.companyLogo)} alt="Logo" className="h-8 max-w-[120px] object-contain" />
            ) : (
              <span className="text-base font-black bg-gradient-to-r from-teal-500 to-emerald-400 bg-clip-text text-transparent uppercase tracking-wider truncate">
                {settings.studioName || 'Vivid'}
              </span>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 md:gap-4 w-1/3">
            <div className="h-9 w-9 bg-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md border border-white/20">
              {user?.name ? user.name.split(' ').map(n=>n[0]).join('') : 'AD'}
            </div>
          </div>
        </header>

        {/* MAIN ROUTE CONTENT */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* PREMIUM MOBILE BOTTOM NAVIGATION BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-safe shadow-2xl">
        <div className="flex h-16 w-full items-center justify-around">
          {menuItems.map((item) => {
            const isActive = item.path === '/' 
              ? location.pathname === '/' 
              : location.pathname.startsWith(item.path);
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.name} 
                to={item.path} 
                className={`flex flex-col items-center justify-center flex-1 h-full py-2 transition-all ${
                  isActive 
                    ? 'text-teal-500 dark:text-teal-400 font-bold' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <div className={`relative transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="text-[9px] mt-1 font-medium tracking-tighter">
                  {item.name === 'Bill & Quotation' ? 'Billing' : item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default Layout;
