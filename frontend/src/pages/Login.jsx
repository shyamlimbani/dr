import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Phone, Mail, Sparkles, AlertCircle, Shield, Users } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [userType, setUserType] = useState('Admin'); // 'Admin' or 'Staff'
  const [loginId, setLoginId] = useState(''); // Email for Admin, Mobile for Staff
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loginId || !password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      setError('');
      setLoading(true);
      const loggedInUser = await login(loginId, password, userType);
      
      if (loggedInUser?.role === 'Admin') {
        navigate('/dashboard');
      } else {
        navigate('/employee-dashboard');
      }
    } catch (err) {
      setError(err || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const isStaff = userType === 'Staff';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 relative px-4 overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-teal-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md glass rounded-3xl border border-white/10 p-8 shadow-2xl z-10 relative">
        <div className="text-center mb-8">
          <div className="h-12 w-12 bg-gradient-to-tr from-teal-500 to-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/20">
            <Sparkles className="text-slate-900" size={24} />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Welcome Back
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            Select your account type to continue
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-950/30 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex gap-2 items-start leading-relaxed">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* User Type Selector */}
        <div className="flex bg-slate-800/50 p-1 rounded-xl mb-8 border border-slate-700/50">
          <button
            type="button"
            onClick={() => { setUserType('Admin'); setLoginId(''); setPassword(''); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${
              !isStaff 
                ? 'bg-slate-700 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield size={16} /> Admin
          </button>
          <button
            type="button"
            onClick={() => { setUserType('Staff'); setLoginId(''); setPassword(''); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${
              isStaff 
                ? 'bg-slate-700 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users size={16} /> Staff
          </button>
        </div>

        {/* LOGIN FORM */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
              {isStaff ? 'Mobile Number' : 'Email Address'}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                {isStaff ? <Phone size={16} /> : <Mail size={16} />}
              </span>
              <input
                type={isStaff ? 'tel' : 'email'}
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
                placeholder={isStaff ? 'e.g. 9825802454' : 'admin@vivid.com'}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <KeyRound size={16} />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-400 text-slate-900 rounded-xl font-bold hover:from-teal-400 hover:to-emerald-300 transition-all shadow-lg shadow-teal-500/25 disabled:opacity-50 flex items-center justify-center gap-2 mt-6"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
