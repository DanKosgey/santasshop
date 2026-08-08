import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Cpu as Bot,
  ShieldCheck,
  Zap,
  Target,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Download,
  Terminal,
  Cpu,
  Activity,
  Lock,
  Clock,
  TrendingUp,
  Users,
  Gauge,
  Rocket,
  Award
} from 'lucide-react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui-components';
import { User } from '../types';
import MastercardPaymentForm from './MastercardPaymentForm';
import CardOTPVerification from './CardOTPVerification';
import { verifyOTPAndCompletePurchase } from '../services/mastercard-payment-service';
import { toast } from './toast';
import { supabase } from '../supabase/client';

interface TradingBotPurchasePageProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  onBack?: () => void;
}

type PurchaseStep = 'overview' | 'payment' | 'otp-verification' | 'confirmation';

const BOT_DETAILS = {
  name: 'Maichez Alpha-V5',
  price: 299.99,
  currency: 'USD',
  description: 'The world\'s first CRT-integrated MQL5 algorithm',
  tagline: 'Master institutional flow with surgical precision',
  image: '🤖',
  features: [
    { icon: Zap, title: '3ms Latency', description: 'High-frequency DMA execution' },
    { icon: Target, title: 'Asset Focus', description: 'NAS100 & Gold specialization' },
    { icon: ShieldCheck, title: 'Dynamic Shield', description: 'Auto-adjusting position sizing' },
    { icon: TrendingUp, title: 'CRT Integrated', description: 'Institutional-proven setup' },
    { icon: Gauge, title: 'Smart Risk', description: 'Zero Martingale strategy' },
    { icon: Clock, title: '24/7 Monitoring', description: 'Continuous market surveillance' }
  ],
  specifications: [
    { label: 'Base Currency Pairs', value: 'EURUSD, GBPUSD, AUDUSD' },
    { label: 'Metals Trading', value: 'XAUUSD (Gold) - Premium' },
    { label: 'Indices Trading', value: 'NAS100, US30, US500' },
    { label: 'Timeframes', value: '1H, 4H, Daily' },
    { label: 'Minimum Account Size', value: '$1000 USD' },
    { label: 'Update Frequency', value: 'Monthly algorithm updates' }
  ],
  benefits: [
    { title: 'Professional Grade', description: 'Built for serious traders who demand results' },
    { title: 'Education Included', description: 'Complete training on setup and optimization' },
    { title: 'Lifetime Support', description: '24/7 technical support from our team' },
    { title: 'Community Access', description: 'Join 1000+ successful traders worldwide' },
    { title: 'Monthly Updates', description: 'Continuous improvements and new features' },
    { title: 'Money-Back Guarantee', description: '30-day trial period, no questions asked' }
  ]
};

/**
 * Trading Bot Purchase Page
 * Multi-step checkout process with Mastercard payment and OTP verification
 */
export default function TradingBotPurchasePage({
  user,
  onUpdateUser,
  onBack
}: TradingBotPurchasePageProps) {
  const [currentStep, setCurrentStep] = useState<PurchaseStep>('overview');
  const [paymentData, setPaymentData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Handle payment initiation
  const handlePaymentInitiated = (transactionData: any) => {
    setPaymentData(transactionData);
    setCurrentStep('otp-verification');
  };

  // Handle OTP verification
  const handleOTPVerified = async (otpCode: string) => {
    try {
      setLoading(true);

      if (!paymentData || !paymentData.transactionId) {
        throw new Error('Transaction data is missing');
      }

      const response = await verifyOTPAndCompletePurchase(
        paymentData.transactionId,
        otpCode,
        user.id,
        BOT_DETAILS.name
      );

      if (response.success) {
        // Update user's bot purchase status in database
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            bot_purchase_status: 'completed',
            bot_access: true,
            bot_purchase_date: new Date().toISOString()
          })
          .eq('id', user.id);

        if (updateError) throw updateError;

        // Update local user state
        onUpdateUser({
          ...user,
          botPurchaseStatus: 'completed',
          botAccess: true
        });

        toast({
          title: 'Purchase Successful!',
          description: `Your ${BOT_DETAILS.name} is now active. Check your email for download instructions.`,
          variant: 'default'
        });

        setCurrentStep('confirmation');
      } else {
        throw new Error(response.message || 'Failed to verify OTP');
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      toast({
        title: 'Verification Failed',
        description: error.message || 'Failed to verify OTP. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Render different steps
  const renderStep = () => {
    switch (currentStep) {
      case 'payment':
        return (
          <div className="space-y-4">
            <MastercardPaymentForm
              amount={BOT_DETAILS.price}
              currency={BOT_DETAILS.currency}
              botName={BOT_DETAILS.name}
              userName={user.name}
              userEmail={user.email}
              userId={user.id}
              onPaymentInitiated={handlePaymentInitiated}
              onBack={() => setCurrentStep('overview')}
            />
          </div>
        );

      case 'otp-verification':
        return (
          <div className="flex justify-center">
            <CardOTPVerification
              onVerified={handleOTPVerified}
              onBack={() => setCurrentStep('payment')}
              onResend={() => {
                toast({
                  title: 'OTP Resent',
                  description: 'A new verification code has been sent to your phone.',
                  variant: 'default'
                });
              }}
              cardLastFour={paymentData?.cardLastFour || '****'}
              processing={loading}
            />
          </div>
        );

      case 'confirmation':
        return <PurchaseConfirmationStep bot={BOT_DETAILS} user={user} />;

      default:
        // Overview Step
        return (
          <div className="space-y-12">
            {/* Hero Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/5 p-8 md:p-16 shadow-2xl"
            >
              <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-brand-primary/10 blur-[120px]" />
              <div className="absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-blue-600/5 blur-[120px]" />

              <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                <div className="flex-1 space-y-6">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="inline-flex items-center gap-2 rounded-full bg-brand-primary/10 px-4 py-2 text-sm font-bold text-brand-primary border border-brand-primary/20"
                  >
                    <Zap className="h-4 w-4" />
                    ALGORITHMIC SUPREMACY
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-4xl md:text-6xl font-black tracking-tighter leading-tight text-white"
                  >
                    {BOT_DETAILS.name}
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-lg text-slate-300 max-w-lg font-medium"
                  >
                    {BOT_DETAILS.description}
                  </motion.p>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-base text-slate-400"
                  >
                    {BOT_DETAILS.tagline}
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-baseline gap-3 pt-4"
                  >
                    <span className="text-5xl font-black text-white">
                      {BOT_DETAILS.currency} {BOT_DETAILS.price.toFixed(2)}
                    </span>
                    <span className="text-slate-400 text-base">One-time payment</span>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="md:w-1/3 flex justify-center relative group"
                >
                  <div className="absolute inset-0 bg-brand-primary/30 blur-[80px] rounded-full group-hover:bg-brand-primary/40 transition-all duration-700" />
                  <div className="relative bg-slate-800/80 backdrop-blur-2xl p-12 rounded-[3rem] border border-white/10 shadow-2xl">
                    <Bot className="h-32 w-32 text-brand-primary drop-shadow-[0_0_20px_rgba(0,255,148,0.4)]" />
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Features Grid */}
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-white">Key Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {BOT_DETAILS.features.map((feature, idx) => {
                  const Icon = feature.icon;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="group bg-slate-900/50 backdrop-blur rounded-xl border border-white/5 p-6 hover:border-brand-primary/30 transition-all duration-300"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-brand-primary/10 rounded-lg border border-brand-primary/20 group-hover:border-brand-primary/40 transition-all">
                          <Icon className="h-5 w-5 text-brand-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-sm">{feature.title}</h3>
                          <p className="text-xs text-slate-400 mt-1">{feature.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Specifications */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-900/50 border-white/5">
                <CardHeader>
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <Terminal className="h-5 w-5 text-brand-primary" />
                    Technical Specs
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {BOT_DETAILS.specifications.map((spec, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-700/50 last:border-0">
                      <span className="text-sm text-slate-400">{spec.label}</span>
                      <span className="text-sm font-semibold text-brand-primary">{spec.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-white/5">
                <CardHeader>
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <Award className="h-5 w-5 text-brand-primary" />
                    What's Included
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    'Ready-to-use MQL5 algorithm',
                    'Installation guide & documentation',
                    'Lifetime updates',
                    'Email technical support',
                    'Community access',
                    '30-day money-back guarantee'
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="h-4 w-4 text-brand-primary flex-shrink-0 mt-1" />
                      <span className="text-sm text-slate-300">{item}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Benefits */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">Why Choose Maichez?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {BOT_DETAILS.benefits.map((benefit, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-slate-900/50 backdrop-blur rounded-xl border border-white/5 p-6 hover:border-brand-primary/30 transition-all"
                  >
                    <h3 className="font-bold text-white mb-2">{benefit.title}</h3>
                    <p className="text-sm text-slate-400">{benefit.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 pt-8"
            >
              {onBack && (
                <Button
                  onClick={onBack}
                  variant="outline"
                  className="flex-1 h-12 text-base"
                >
                  Go Back
                </Button>
              )}
              <Button
                onClick={() => setCurrentStep('payment')}
                className="flex-1 h-12 text-base bg-brand-primary hover:bg-brand-primary/90 text-slate-900 font-bold"
              >
                Proceed to Payment
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </motion.div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="h-1 w-8 bg-brand-primary rounded-full" />
            <span className="text-sm font-bold text-brand-primary tracking-widest uppercase">
              {currentStep === 'overview' && 'Trading Bot Store'}
              {currentStep === 'payment' && 'Payment Details'}
              {currentStep === 'otp-verification' && 'Verify Purchase'}
              {currentStep === 'confirmation' && 'Purchase Complete'}
            </span>
          </div>
        </motion.div>

        {/* Content */}
        {renderStep()}
      </div>
    </div>
  );
}

/**
 * Purchase Confirmation Component
 */
function PurchaseConfirmationStep({ bot, user }: { bot: any; user: User }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8"
    >
      <div className="text-center space-y-4">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.6, repeat: 1 }}
          className="inline-flex justify-center"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-brand-primary/30 blur-xl rounded-full" />
            <div className="relative bg-brand-primary/20 p-6 rounded-full border-2 border-brand-primary">
              <CheckCircle2 className="h-16 w-16 text-brand-primary" />
            </div>
          </div>
        </motion.div>

        <div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-2">
            Purchase Successful!
          </h1>
          <p className="text-lg text-slate-400">
            Your {bot.name} is now active
          </p>
        </div>
      </div>

      <Card className="bg-slate-900/50 border-brand-primary/30">
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-sm text-slate-400">Customer Name</p>
              <p className="text-lg font-bold text-white">{user.name}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-slate-400">Email</p>
              <p className="text-lg font-bold text-white">{user.email}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-slate-400">Bot</p>
              <p className="text-lg font-bold text-white">{bot.name}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-slate-400">Amount</p>
              <p className="text-lg font-bold text-green-500">{bot.currency} {bot.price.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3 bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Activity className="h-5 w-5 text-blue-400 flex-shrink-0 mt-1" />
          <div className="space-y-2">
            <p className="font-bold text-white">What Happens Next?</p>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>✓ Download link has been sent to your email</li>
              <li>✓ Installation guide and documentation included</li>
              <li>✓ You now have full access to the bot</li>
              <li>✓ Join our community for setup support</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-2 bg-green-500/10 border border-green-500/20 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Lock className="h-5 w-5 text-green-400 flex-shrink-0 mt-1" />
          <div>
            <p className="font-bold text-white">30-Day Money-Back Guarantee</p>
            <p className="text-sm text-slate-300 mt-1">
              Not satisfied? Get a full refund within 30 days, no questions asked.
            </p>
          </div>
        </div>
      </div>

      <Button
        className="w-full h-12 text-base bg-brand-primary hover:bg-brand-primary/90 text-slate-900 font-bold"
        onClick={() => window.location.href = '/dashboard'}
      >
        Go to Dashboard
        <ArrowRight className="h-5 w-5 ml-2" />
      </Button>
    </motion.div>
  );
}
