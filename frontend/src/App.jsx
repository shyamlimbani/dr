import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider } from './services/SettingsContext';
import Layout from './components/Layout';

// Lazy loaded Pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/Login'));
const Events = lazy(() => import('./pages/Events'));
const Ledger = lazy(() => import('./pages/Ledger'));
const Invoices = lazy(() => import('./pages/Invoices'));
const Expenses = lazy(() => import('./pages/Expenses'));
const Settings = lazy(() => import('./pages/Settings'));
const Studio = lazy(() => import('./pages/Studio'));
const Revenue = lazy(() => import('./pages/Revenue'));

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl max-w-md w-full border border-rose-100 dark:border-rose-900/30">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Something went wrong</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {this.state.error?.message || "An unexpected error occurred while loading the application."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 px-4 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Global Loading Fallback UI
const PageLoader = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center">
    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
    <p className="text-sm font-medium text-slate-500 animate-pulse">Loading module...</p>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-500"></div>
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SettingsProvider>
          <ThemeProvider>
            <Router>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  
                  <Route path="/" element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }>
                    <Route index element={<Dashboard />} />
                    <Route path="events" element={<Events />} />
                    <Route path="payments" element={<Ledger />} />
                    <Route path="billing" element={<Invoices />} />
                    <Route path="expenses" element={<Expenses />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="studio" element={<Studio />} />
                    <Route path="revenue" element={<Revenue />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Route>
                </Routes>
              </Suspense>
            </Router>
          </ThemeProvider>
        </SettingsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
