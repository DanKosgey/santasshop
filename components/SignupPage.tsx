import React, { useState } from 'react';
import { Lock, TrendingUp, ArrowRight, Mail, AlertCircle, User, CheckCircle, RotateCcw } from 'lucide-react';
import { supabase } from '../supabase/client';
import { APP_MESSAGES } from '../lib/constants';

interface SignupPageProps {
  onBack: () => void;
  onSignupSuccess: () => void;
}

const SignupPage: React.FC<SignupPageProps> = ({ onBack, onSignupSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [subscriptionTier, setSubscriptionTier] = useState('free');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [userId, setUserId] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Handle resend cooldown timer
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
      // Sign up the user with email confirmation disabled initially
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            subscription_tier: subscriptionTier
          },
          emailRedirectTo: undefined // Don't use redirect links
        }
      });

      if (signupError) throw signupError;

      if (data.user) {
        setUserId(data.user.id);
        setShowVerification(true);
        setSuccessMessage('Account created! Please check your email for the verification code.');
        setResendCooldown(30); // 30-second cooldown for resend
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
      // Verify the OTP code
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: verificationCode,
        type: 'signup'
      });

      if (verifyError) throw verifyError;

      if (data.user) {
        setSuccessMessage('Email verified successfully! Redirecting to your dashboard...');
        // Call the success callback after a short delay
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
      // Resend the OTP code
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: undefined
        }
      });

      if (resendError) throw resendError;

      setSuccessMessage('Verification code resent! Please check your email.');
      setResendCooldown(30); // Reset cooldown
    } catch (err: any) {
      console.error('Resend error:', err);
      setError(err.message || 'Failed to resend verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (showVerification) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden font-sans">
        {/* Ambient Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-trade-neon/5 rounded-full blur-[150px]" />
          <div className="absolute top-1/2 left-1/2 w-full h-full bg-blue-900/10 rounded-full blur-[150px]" />
        </div>

        <div className="w-full max-w-md bg-trade-dark border border-gray-800 rounded-3xl p-8 relative z-10 shadow-2xl shadow-black/50">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-800 mb-6 border border-gray-700">
              <CheckCircle className="h-8 w-8 text-trade-neon" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight mb-2">
              Verify Your Email
            </h1>
            <p className="text-gray-400">Enter the 6-digit code sent to {email}</p>
          </div>

          <form onSubmit={handleVerifyCode} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Verification Code</label>
              <div className="relative">
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full bg-black/50 border border-gray-700 rounded-xl py-4 px-4 text-white focus:border-trade-neon focus:ring-1 focus:ring-trade-neon outline-none transition text-center text-2xl tracking-widest"
                  placeholder="0 0 0 0 0 0"
                  required
                  maxLength={6}
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm font-medium text-center bg-red-500/10 py-3 rounded-lg border border-red-500/20 flex items-center justify-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {successMessage && (
              <div className="text-green-500 text-sm font-medium text-center bg-green-500/10 py-3 rounded-lg border border-green-500/20">
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || verificationCode.length !== 6}
              className="w-full bg-trade-neon hover:bg-green-400 text-black font-black py-4 rounded-xl text-lg transition transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-trade-neon/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
              className="text-sm text-gray-400 hover:text-white transition flex items-center justify-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className={`h-4 w-4 ${resendCooldown > 0 ? 'animate-spin' : ''}`} />
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-800">
            <button
              onClick={onBack}
              className="w-full text-gray-500 text-sm hover:text-white transition"
              disabled={isLoading}
            >
              &larr; Back to Website
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Ambient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-trade-neon/5 rounded-full blur-[150px]" />
        <div className="absolute top-1/2 left-1/2 w-full h-full bg-blue-900/10 rounded-full blur-[150px]" />
      </div>

      <div className="w-full max-w-md bg-trade-dark border border-gray-800 rounded-3xl p-8 relative z-10 shadow-2xl shadow-black/50">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-800 mb-6 border border-gray-700">
            <TrendingUp className="h-8 w-8 text-trade-neon" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">
            Create Account
          </h1>
          <p className="text-gray-400">{APP_MESSAGES.signupCommunity}</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-black/50 border border-gray-700 rounded-xl py-4 pl-12 pr-4 text-white focus:border-trade-neon focus:ring-1 focus:ring-trade-neon outline-none transition"
                placeholder="John Doe"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/50 border border-gray-700 rounded-xl py-4 pl-12 pr-4 text-white focus:border-trade-neon focus:ring-1 focus:ring-trade-neon outline-none transition"
                placeholder="name@example.com"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/50 border border-gray-700 rounded-xl py-4 pl-12 pr-4 text-white focus:border-trade-neon focus:ring-1 focus:ring-trade-neon outline-none transition"
                placeholder="••••••••"
                required
                minLength={6}
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Subscription Tier</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'free', label: 'Free' },
                { value: 'foundation', label: 'Foundation' },
                { value: 'professional', label: 'Professional' },
                { value: 'elite', label: 'Elite' }
              ].map((tier) => (
                <button
                  key={tier.value}
                  type="button"
                  onClick={() => setSubscriptionTier(tier.value)}
                  className={`py-4 rounded-xl font-bold transition-all ${subscriptionTier === tier.value
                      ? 'bg-trade-neon text-black shadow-lg shadow-trade-neon/30'
                      : 'bg-gray-800 text-white border border-gray-700 hover:border-trade-neon'
                    }`}
                  disabled={isLoading}
                >
                  <div className="text-sm">{tier.label}</div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm font-medium text-center bg-red-500/10 py-3 rounded-lg border border-red-500/20 flex items-center justify-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {successMessage && (
            <div className="text-green-500 text-sm font-medium text-center bg-green-500/10 py-3 rounded-lg border border-green-500/20">
              {successMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-trade-neon hover:bg-green-400 text-black font-black py-4 rounded-xl text-lg transition transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-trade-neon/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <span className="animate-pulse">Processing...</span>
            ) : (
              <>
                Create Account
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-800">
          <button
            onClick={onBack}
            className="w-full text-gray-500 text-sm hover:text-white transition"
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