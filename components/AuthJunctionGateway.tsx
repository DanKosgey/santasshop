import React from 'react';
import { Send, Users, TrendingUp, ShieldCheck, ArrowRight, ArrowLeft, Sparkles, CheckCircle2, Bot } from 'lucide-react';

export type GatewayTarget = 'vip-signals' | 'account-management' | 'pool-trading' | 'dashboard' | 'bot-store';

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
      title: 'VIP Signals & Telegram Community',
      badge: 'Popular',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      icon: Send,
      color: 'from-emerald-500 to-teal-600',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      description: 'Get real-time institutional forex signals, daily chart breakdowns, and direct VIP Telegram group access.',
      highlights: ['90%+ Signal Accuracy', 'Live Entry/SL/TP Alerts', '1-on-1 Trading Guidance'],
      ctaText: 'Access VIP Signals'
    },
    {
      id: 'account-management' as GatewayTarget,
      title: 'Account Management & Prop Firm',
      badge: 'High Yield',
      badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      icon: Users,
      color: 'from-purple-500 to-indigo-600',
      iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      description: 'Let experienced institutional traders manage your account or pass your Prop Firm challenge with strict risk controls.',
      highlights: ['Strict Capital Preservation', 'Custom Profit Split', 'Real-Time Performance Dashboard'],
      ctaText: 'Explore Account Management'
    },
    {
      id: 'pool-trading' as GatewayTarget,
      title: 'Pool Trading Investment',
      badge: 'Passive Income',
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      icon: TrendingUp,
      color: 'from-amber-500 to-orange-600',
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      description: 'Deposit funds into managed liquidity pools and earn steady compound profits from algorithmic & expert strategy execution.',
      highlights: ['Transparent Return Tracking', 'Flexible Capital Withdrawal', 'Multi-Tiered Staking Plans'],
      ctaText: 'Join Pool Trading'
    },
    {
      id: 'bot-store' as GatewayTarget,
      title: 'Automated Trading Bots',
      badge: 'Automated',
      badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      icon: Bot,
      color: 'from-cyan-500 to-blue-600',
      iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      description: 'Acquire high-performance automated MT4/MT5 trading bots, backtested strategies, and auto-execution tools.',
      highlights: ['Instant File Downloads', 'Automated Risk Rules', 'Free Lifetime Updates'],
      ctaText: 'Get Trading Bots'
    },
    {
      id: 'dashboard' as GatewayTarget,
      title: 'General Trading Platform Hub',
      badge: 'All-In-One',
      badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      icon: ShieldCheck,
      color: 'from-blue-500 to-cyan-600',
      iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      description: 'Access the main trader portal including AI Trade Assistant, CRT Rule Builder, Trade Journal, and Academy Courses.',
      highlights: ['AI Trade Assistant', 'CRT Rule Checker', 'Journal & Analytics'],
      ctaText: 'Enter Main Portal'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0A0D14] text-white flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Background Glow Elements */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Header Bar */}
      <header className="px-6 py-6 border-b border-gray-800/80 backdrop-blur-md flex items-center justify-between z-10 max-w-7xl mx-auto w-full">
        <button
          onClick={onBackToLanding}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-800 hover:border-gray-700 bg-gray-900/50"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Main Site
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-black text-lg">
            M
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400">
            MAICHEZ <span className="text-emerald-400 font-light">FX</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectOption('dashboard', 'login')}
            className="text-sm font-semibold text-gray-300 hover:text-white px-4 py-2 rounded-xl transition-all hover:bg-gray-800/60"
          >
            Direct Sign In
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-12 flex-1 flex flex-col justify-center z-10 w-full">
        {/* Title Section */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Welcome Gateway
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 text-white">
            Choose Your <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300">Destination</span>
          </h1>
          <p className="text-gray-400 text-base md:text-lg leading-relaxed">
            Select what you would like to access today. We will guide you straight to your feature after signing in or creating an account.
          </p>
        </div>

        {/* Destination Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {options.map((opt) => {
            const IconComp = opt.icon;
            return (
              <div
                key={opt.id}
                className="group relative bg-gray-900/60 border border-gray-800 hover:border-emerald-500/50 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/10 flex flex-col justify-between backdrop-blur-xl"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl border ${opt.iconBg}`}>
                      <IconComp className="w-6 h-6" />
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${opt.badgeColor}`}>
                      {opt.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                    {opt.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-5 leading-relaxed">
                    {opt.description}
                  </p>

                  {/* Highlights list */}
                  <ul className="space-y-2 mb-6 border-t border-gray-800/80 pt-4">
                    {opt.highlights.map((h, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-gray-300 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => onSelectOption(opt.id, 'login')}
                    className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
                  >
                    <span>Sign In & {opt.ctaText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onSelectOption(opt.id, 'signup')}
                    className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-gray-300 hover:text-white bg-gray-800/40 hover:bg-gray-800/80 border border-gray-700/50 transition-colors text-center"
                  >
                    Don't have an account? <span className="text-emerald-400 underline">Sign Up</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer info */}
      <footer className="px-6 py-6 border-t border-gray-800/80 text-center text-xs text-gray-500 z-10">
        © {new Date().getFullYear()} MAICHEZ FX. Institutional Grade Trading Solutions & Managed Portfolios.
      </footer>
    </div>
  );
};
