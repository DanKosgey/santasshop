import React, { useState } from 'react';
import { Lock, TrendingUp, ArrowRight, Mail, AlertCircle, User, CheckCircle, RotateCcw } from 'lucide-react';
import { supabase } from '../supabase/client';
import { APP_MESSAGES } from '../lib/constants';

interface SignupPageProps {
  onBack: () => void;
  onSignupSuccess: () => void;
  onSwitchToLogin?: () => void;
}

const SignupPage: React.FC<SignupPageProps> = ({ onBack, onSignupSuccess, onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [subscriptionTier] = useState('free');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [userId, setUserId] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            subscription_tier: subscriptionTier
          },
          emailRedirectTo: undefined
        }
      });

      if (signupError) throw signupError;

      if (data.user) {
        setUserId(data.user.id);
        setShowVerification(true);
        setSuccessMessage('Account created! Please check your email for the verification code.');
        setResendCooldown(30);
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: verificationCode,
        type: 'signup'
      });

      if (verifyError) throw verifyError;

      if (data.user) {
        setSuccessMessage('Email verified successfully! Redirecting to your dashboard...');
        setTimeout(() => {
          onSignupSuccess();
        }, 2000);
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;

    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: undefined
        }
      });

      if (resendError) throw resendError;

      setSuccessMessage('Verification code resent! Please check your email.');
      setResendCooldown(30);
    } catch (err: any) {
      console.error('Resend error:', err);
      setError(err.message || 'Failed to resend verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (showVerification) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-blue-100/50 rounded-full blur-[140px]" />
        </div>

        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 relative z-10 shadow-card">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 mb-4 border border-emerald-200">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
              Verify Your Email
            </h1>
            <p className="text-slate-500 text-sm">Enter the 6-digit code sent to {email}</p>
          </div>

          <form onSubmit={handleVerifyCode} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Verification Code</label>
              <div className="relative">
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 focus:border-blue-500 focus:bg-white outline-none transition text-center text-xl font-bold tracking-widest tabular-nums"
                  placeholder="0 0 0 0 0 0"
                  required
                  maxLength={6}
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
              disabled={isLoading || verificationCode.length !== 6}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-base transition flex items-center justify-center gap-2 shadow-blue-glow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="animate-pulse">Verifying...</span>
              ) : (
                <>
                  Verify Email
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={handleResendCode}
              disabled={isLoading || resendCooldown > 0}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition flex items-center justify-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${resendCooldown > 0 ? 'animate-spin' : ''}`} />
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <button
              onClick={onBack}
              className="w-full text-slate-400 text-xs font-semibold hover:text-slate-700 transition"
              disabled={isLoading}
            >
              &larr; Back to Website
            </button>
          </div>
        </div>
      </div>
    );
  }

  const targetIntent = typeof window !== 'undefined' ? sessionStorage.getItem('maichez_target_intent') : null;
  const intentLabels: Record<string, string> = {
    'vip-signals': 'VIP Signals & Telegram Community',
    'account-management': 'Account Management & Prop Firm',
    'pool-trading': 'Pool Trading Investment',
    'bot-store': 'Automated Trading Bots',
    'dashboard': 'Trading Portal Hub'
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-blue-100/50 rounded-full blur-[140px]" />
      </div>

      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 relative z-10 shadow-card">
        {targetIntent && intentLabels[targetIntent] && (
          <div className="mb-6 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold text-center flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Destination: <span className="font-bold">{intentLabels[targetIntent]}</span>
          </div>
        )}

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 mb-4 border border-blue-100">
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            Create Account
          </h1>
          <p className="text-slate-500 text-sm">{APP_MESSAGES.signupCommunity}</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white outline-none transition text-sm font-medium"
                placeholder="John Doe"
                required
                disabled={isLoading}
              />
            </div>
          </div>

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
                minLength={6}
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

          <div className="space-y-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-base transition flex items-center justify-center gap-2 shadow-blue-glow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="animate-pulse">Creating Account...</span>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>

            {onSwitchToLogin && (
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="w-full py-3 rounded-xl font-bold text-sm bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition text-center"
                disabled={isLoading}
              >
                Already have an account? <span className="text-blue-600 underline">Log In</span>
              </button>
            )}
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100">
          <button
            onClick={onBack}
            className="w-full text-slate-400 text-xs font-semibold hover:text-slate-700 transition"
            disabled={isLoading}
          >
            &larr; Back to Website
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;