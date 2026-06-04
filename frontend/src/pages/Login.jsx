import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Mail, Sparkles, User, AlertCircle, Info } from 'lucide-react';
import apiClient from '../services/api';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password flow states
  const [forgotMode, setForgotMode] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1 = request pin, 2 = reset password
  const [pin, setPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [debugPin, setDebugPin] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPin = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    try {
      setError('');
      setLoading(true);
      const res = await apiClient.post('/auth/forgot-password', { email });
      setInfoMessage(res.data.message);
      if (res.data.debugPin) {
        setDebugPin(res.data.debugPin); // capture debug pin locally for visual convenience
      }
      setResetStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Error requesting reset pin.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!pin || !newPassword) {
      setError('Please enter both the PIN and your new password.');
      return;
    }
    try {
      setError('');
      setLoading(true);
      await apiClient.post('/auth/reset-password', { email, pin, newPassword });
      setInfoMessage('Password reset successful. You can now login.');
      setForgotMode(false);
      setResetStep(1);
      setPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error resetting password.');
    } finally {
      setLoading(false);
    }
  };

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
            {!forgotMode ? 'Welcome Back' : 'Recover Account'}
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            {!forgotMode 
              ? 'Sign in to access your event management portal' 
              : 'Enter your registered email to request a security reset PIN'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-950/30 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex gap-2 items-start leading-relaxed">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {infoMessage && (
          <div className="mb-6 p-4 bg-teal-950/30 border border-teal-500/30 text-teal-300 rounded-xl text-xs flex gap-2 items-start leading-relaxed">
            <Info size={16} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>{infoMessage}</span>
              {debugPin && (
                <div className="mt-2 font-bold p-1 bg-teal-900/40 rounded text-center">
                  DEMO OTP PIN: {debugPin}
                </div>
              )}
            </div>
          </div>
        )}

        {/* LOGIN FORM */}
        {!forgotMode ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
                  placeholder="admin@vivid.com"
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

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setForgotMode(true);
                  setError('');
                  setInfoMessage('');
                }}
                className="text-xs font-semibold text-teal-400 hover:text-teal-300 hover:underline bg-transparent border-none outline-none"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-400 text-slate-900 rounded-xl font-bold hover:from-teal-400 hover:to-emerald-300 transition-all shadow-lg shadow-teal-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        ) : (
          /* FORGOT PASSWORD FORM */
          <div className="space-y-5">
            {resetStep === 1 ? (
              <form onSubmit={handleRequestPin} className="space-y-5">
                <div>
                  <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                      <Mail size={16} />
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
                      placeholder="admin@vivid.com"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-teal-500 text-slate-900 rounded-xl font-bold hover:bg-teal-400 transition-all disabled:opacity-50"
                >
                  {loading ? 'Sending PIN...' : 'Request Reset PIN'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                    6-Digit PIN
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                      <KeyRound size={16} />
                    </span>
                    <input
                      type="text"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all text-center tracking-widest font-bold"
                      placeholder="XXXXXX"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                      <KeyRound size={16} />
                    </span>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-emerald-500 text-slate-900 rounded-xl font-bold hover:bg-emerald-400 transition-all disabled:opacity-50"
                >
                  {loading ? 'Resetting...' : 'Update Password'}
                </button>
              </form>
            )}

            <button
              onClick={() => {
                setForgotMode(false);
                setError('');
                setInfoMessage('');
                setResetStep(1);
              }}
              className="w-full py-3 border border-slate-700 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-800/50 transition-all"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
