import React, { useState } from 'react';
import { Lock, TrendingUp, ArrowRight, Mail, AlertCircle, Key } from 'lucide-react';
import { supabase } from '../supabase/client';
import { APP_MESSAGES } from '../lib/constants';

interface LoginPageProps {
  onBack: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPasswordLogin, setShowPasswordLogin] = useState(true);
  const [otpCode, setOtpCode] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingOtp(true);
    setError('');
    setSuccessMessage('');

    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: undefined,
        }
      });

      if (otpError) throw otpError;
      
      setOtpSent(true);
      setSuccessMessage('Verification code sent! Please check your email.');
    } catch (err: any) {
      console.error('OTP send error:', err);
      setError(err.message || 'Failed to send verification code');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'email'
      });

      if (verifyError) throw verifyError;
    } catch (err: any) {
      console.error('OTP verification error:', err);
      setError(err.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLoginMethod = () => {
    setShowPasswordLogin(!showPasswordLogin);
    setError('');
    setSuccessMessage('');
    setOtpCode('');
    setOtpSent(false);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Subtle Gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-blue-100/50 rounded-full blur-[140px]" />
      </div>

      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 relative z-10 shadow-card">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 mb-4 border border-blue-100">
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            {showPasswordLogin ? 'Welcome Back' : 'Passwordless Login'}
          </h1>
          <p className="text-slate-500 text-sm">
            {showPasswordLogin 
              ? APP_MESSAGES.loginTerminal 
              : 'Enter your email to receive a login code'}
          </p>
        </div>

        {showPasswordLogin ? (
          <form onSubmit={handlePasswordLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white outline-none transition text-sm font-medium"
                  placeholder="name@example.com"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white outline-none transition text-sm font-medium"
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-xs font-semibold text-center bg-red-50 py-3 rounded-lg border border-red-200 flex items-center justify-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {successMessage && (
              <div className="text-emerald-700 text-xs font-semibold text-center bg-emerald-50 py-3 rounded-lg border border-emerald-200">
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-base transition flex items-center justify-center gap-2 shadow-blue-glow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="animate-pulse">Processing...</span>
              ) : (
                <>
                  Login to Portal
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={toggleLoginMethod}
                className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition"
                disabled={isLoading}
              >
                Use passwordless login instead
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white outline-none transition text-sm font-medium"
                  placeholder="name@example.com"
                  required
                  disabled={isLoading || isSendingOtp || otpSent}
                />
              </div>
            </div>

            {otpSent && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Verification Code</label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 focus:border-blue-500 focus:bg-white outline-none transition text-center text-xl font-bold tracking-widest tabular-nums"
                    placeholder="0 0 0 0 0 0"
                    required
                    maxLength={6}
                    disabled={isLoading}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2 text-center">
                  Enter the 6-digit code sent to your email
                </p>
              </div>
            )}

            {error && (
              <div className="text-red-600 text-xs font-semibold text-center bg-red-50 py-3 rounded-lg border border-red-200 flex items-center justify-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {successMessage && (
              <div className="text-emerald-700 text-xs font-semibold text-center bg-emerald-50 py-3 rounded-lg border border-emerald-200">
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || isSendingOtp || (otpSent && otpCode.length !== 6)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-base transition flex items-center justify-center gap-2 shadow-blue-glow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading || isSendingOtp ? (
                <span className="animate-pulse">
                  {isSendingOtp ? 'Sending Code...' : 'Verifying...'}
                </span>
              ) : (
                <>
                  {otpSent ? 'Verify Code' : 'Send Login Code'}
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={otpSent ? () => {
                  setOtpSent(false);
                  setOtpCode('');
                  setError('');
                  setSuccessMessage('');
                } : toggleLoginMethod}
                className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition"
                disabled={isLoading || isSendingOtp}
              >
                {otpSent ? '← Back to Email' : 'Use password login instead'}
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100">
          <button 
            onClick={onBack} 
            className="w-full text-slate-400 text-xs font-semibold hover:text-slate-700 transition"
            disabled={isLoading || isSendingOtp}
          >
            &larr; Back to Website
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;