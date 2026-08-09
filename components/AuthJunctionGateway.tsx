import React from 'react';
import { Send, TrendingUp, Users, ArrowRight, ArrowLeft, Sparkles, CheckCircle2, ShieldCheck, Lock, UserPlus } from 'lucide-react';

export type GatewayTarget = 'vip-signals' | 'pool-trading' | 'account-management' | 'dashboard' | 'bot-store';

interface AuthJunctionGatewayProps {
  onSelectOption: (target: GatewayTarget, mode: 'login' | 'signup') => void;
  onBackToLanding: () => void;
}

export const AuthJunctionGateway: React.FC<AuthJunctionGatewayProps> = ({
  onSelectOption,
  onBackToLanding
}) => {
  const options = [
    {
      id: 'vip-signals' as GatewayTarget,
      number: '01',
      title: 'VIP Signals & Telegram',
      subtitle: 'Real-time Institutional Trading Signals',
      badge: 'Most Popular',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: Send,
      accentGradient: 'from-emerald-500 to-teal-600',
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      description: 'Get real-time institutional forex signals, daily chart breakdowns, and direct VIP Telegram channel access.',
      highlights: ['90%+ Historical Signal Accuracy', 'Instant Telegram & Push Alerts', '1-on-1 Trading Guidance'],
      ctaText: 'VIP Signals',
      accentColor: '#10B981'
    },
    {
      id: 'pool-trading' as GatewayTarget,
      number: '02',
      title: 'Pool Trading Investment',
      subtitle: 'Automated Managed Yield Pools',
      badge: 'Passive Income',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: TrendingUp,
      accentGradient: 'from-blue-500 to-indigo-600',
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
      description: 'Deposit funds into expert-managed liquidity pools and earn steady compound yields from algorithmic execution.',
      highlights: ['Transparent Yield Tracking', 'Flexible Capital Withdrawal', 'Institutional Staking Pools'],
      ctaText: 'Pool Trading',
      accentColor: '#3B82F6'
    },
    {
      id: 'account-management' as GatewayTarget,
      number: '03',
      title: 'Account Management',
      subtitle: 'Professional Capital Management',
      badge: 'High Yield',
      badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: Users,
      accentGradient: 'from-purple-500 to-indigo-600',
      iconBg: 'bg-purple-50 text-purple-600 border-purple-100',
      description: 'Let experienced institutional traders manage your account or pass your Prop Firm challenge with strict risk controls.',
      highlights: ['Strict Capital Preservation', 'Custom Profit Split Model', 'Real-Time Performance Dashboard'],
      ctaText: 'Account Management',
      accentColor: '#8B5CF6'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-slate-800 flex flex-col justify-between relative font-sans">
      {/* Soft Background Accent Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-blue-50/80 via-emerald-50/40 to-transparent pointer-events-none" />

      {/* Header Bar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between max-w-7xl mx-auto w-full">
        <button
          onClick={onBackToLanding}
          className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 bg-white shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back to Main Site</span>
          <span className="sm:hidden">Back</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-base shadow-sm">
            F
          </div>
          <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900">
            FOREX <span className="text-blue-600 font-light">ROYAL</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectOption('dashboard', 'login')}
            className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3.5 py-1.5 rounded-lg transition-all"
          >
            Sign In
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-12 flex-1 flex flex-col justify-center z-10 w-full">
        {/* Title Section */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Welcome Gateway
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-3">
            Choose Your <span className="text-blue-600">Destination</span>
          </h1>
          <p className="text-slate-500 text-sm sm:text-base leading-relaxed px-2">
            Select your path below. You will be seamlessly directed to your chosen feature after a quick sign in or account creation.
          </p>
        </div>

        {/* Destination Cards Grid (Order: 1. VIP Signals, 2. Pool Trading, 3. Account Management) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {options.map((opt) => {
            const IconComp = opt.icon;
            return (
              <div
                key={opt.id}
                className="group relative bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-5 sm:p-6 transition-all duration-200 hover:-translate-y-1 shadow-card hover:shadow-xl flex flex-col justify-between overflow-hidden"
              >
                {/* Top Accent Bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5 transition-all duration-300"
                  style={{ background: opt.accentColor }}
                />

                <div>
                  {/* Card Top Header */}
                  <div className="flex items-center justify-between mb-4 pt-1">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl border ${opt.iconBg} shadow-sm`}>
                        <IconComp className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-xs font-mono font-bold text-slate-400">PATH {opt.number}</span>
                        <p className="text-xs font-semibold text-slate-500">{opt.subtitle}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${opt.badgeClass}`}>
                      {opt.badge}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {opt.title}
                  </h2>
                  <p className="text-slate-500 text-xs sm:text-sm mb-4 leading-relaxed">
                    {opt.description}
                  </p>

                  {/* Highlights list */}
                  <div className="bg-slate-50 rounded-xl p-3 sm:p-4 mb-5 border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Key Features</p>
                    <ul className="space-y-2">
                      {opt.highlights.map((h, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Dual Action Buttons (Login / Signup) */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => onSelectOption(opt.id, 'login')}
                    className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-slate-900 hover:bg-blue-600 active:scale-[0.99] flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <Lock className="w-3.5 h-3.5 opacity-70" />
                    <span>Login to Access {opt.ctaText}</span>
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </button>

                  <button
                    onClick={() => onSelectOption(opt.id, 'signup')}
                    className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 border border-slate-200 transition-all flex items-center justify-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-slate-400" />
                    <span>New User? Create Account</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Security / Trust Banner */}
        <div className="mt-8 sm:mt-12 text-center flex items-center justify-center gap-6 text-xs text-slate-400">
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-500" /> 256-Bit SSL Encrypted
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:flex items-center gap-1.5 font-medium">
            <Sparkles className="w-4 h-4 text-blue-500" /> Instant Intent Navigation
          </span>
        </div>
      </main>

      {/* Footer info */}
      <footer className="px-4 py-4 border-t border-slate-200 bg-white text-center text-xs text-slate-400">
        © {new Date().getFullYear()} FOREX ROYAL. Institutional Grade Trading Solutions & Managed Portfolios.
      </footer>
    </div>
  );
};
