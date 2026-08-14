import React, { useState } from 'react';
import { Send, TrendingUp, Users, ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck, Zap, Star, Globe } from 'lucide-react';

export type GatewayTarget = 'vip-signals' | 'pool-trading' | 'account-management' | 'dashboard' | 'bot-store';

interface AuthJunctionGatewayProps {
  onSelectOption: (target: GatewayTarget, mode: 'login' | 'signup') => void;
  onBackToLanding: () => void;
}

const options = [
  {
    id: 'vip-signals' as GatewayTarget,
    number: '01',
    title: 'VIP Signals & Telegram',
    subtitle: 'Institutional Trading Signals',
    badge: 'Most Popular',
    icon: Send,
    stat: '90%+',
    statLabel: 'Signal Accuracy',
    description: 'Real-time institutional forex signals, daily chart breakdowns, and direct VIP Telegram channel access.',
    highlights: ['90%+ Historical Signal Accuracy', 'Instant Telegram & Push Alerts', '1-on-1 Trading Guidance'],
    gradientFrom: '#10B981',
    gradientTo: '#0D9488',
    glowColor: 'rgba(16,185,129,0.35)',
    hoverBorder: 'hover:border-emerald-500/60',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    iconGlow: 'shadow-[0_0_20px_rgba(16,185,129,0.4)]',
    numberColor: 'text-emerald-400',
  },
  {
    id: 'pool-trading' as GatewayTarget,
    number: '02',
    title: 'Pool Trading Investment',
    subtitle: 'Automated Managed Yield Pools',
    badge: 'Passive Income',
    icon: TrendingUp,
    stat: '24/7',
    statLabel: 'Active Monitoring',
    description: 'Deposit into expert-managed liquidity pools and earn steady compound yields from algorithmic execution.',
    highlights: ['Transparent Yield Tracking', 'Flexible Capital Withdrawal', 'Institutional Staking Pools'],
    gradientFrom: '#3B82F6',
    gradientTo: '#6366F1',
    glowColor: 'rgba(59,130,246,0.35)',
    hoverBorder: 'hover:border-blue-500/60',
    badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    iconGlow: 'shadow-[0_0_20px_rgba(59,130,246,0.4)]',
    numberColor: 'text-blue-400',
  },
  {
    id: 'account-management' as GatewayTarget,
    number: '03',
    title: 'Account Management',
    subtitle: 'Professional Capital Management',
    badge: 'High Yield',
    icon: Users,
    stat: '1:3+',
    statLabel: 'Risk-to-Reward',
    description: 'Let experienced institutional traders manage your account or pass your Prop Firm challenge with strict risk controls.',
    highlights: ['Strict Capital Preservation', 'Custom Profit Split Model', 'Real-Time Performance Dashboard'],
    gradientFrom: '#8B5CF6',
    gradientTo: '#EC4899',
    glowColor: 'rgba(139,92,246,0.35)',
    hoverBorder: 'hover:border-purple-500/60',
    badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    iconGlow: 'shadow-[0_0_20px_rgba(139,92,246,0.4)]',
    numberColor: 'text-purple-400',
  },
];

const trustBadges = [
  { icon: ShieldCheck, label: '256-Bit SSL Encrypted',     color: 'text-emerald-400' },
  { icon: Globe,       label: 'Global Institutional Grade', color: 'text-blue-400' },
  { icon: Zap,         label: 'Instant Access',             color: 'text-yellow-400' },
];

export const AuthJunctionGateway: React.FC<AuthJunctionGatewayProps> = ({
  onSelectOption,
  onBackToLanding,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#07090F] text-white flex flex-col relative font-sans overflow-x-hidden">
      {/* ── Animated ambient background orbs ── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #3B82F6 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/3 -right-32 w-[400px] h-[400px] rounded-full opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 left-1/3 w-[450px] h-[300px] rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #10B981 0%, transparent 70%)' }}
        />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
        {/* Top shimmer line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      {/* ── Sticky Header ── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/[0.06] bg-[#07090F]/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-14 sm:h-16 flex items-center justify-between">
          <button
            onClick={onBackToLanding}
            className="group flex items-center gap-2 text-white/60 hover:text-white transition-all duration-200 text-xs sm:text-sm font-medium px-3 py-1.5 rounded-xl border border-white/[0.08] hover:border-white/20 hover:bg-white/[0.05]"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Back to Site</span>
            <span className="sm:hidden">Back</span>
          </button>

          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm text-white"
              style={{ background: 'linear-gradient(135deg,#3B82F6,#6366F1)' }}
            >
              F
            </div>
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">
              FOREX <span className="font-light text-white/40">ROYAL</span>
            </span>
          </div>

          {/* Spacer to balance header */}
          <div className="w-[72px] sm:w-[96px]" />
        </div>
      </header>

      {/* ── Main ── */}
      <main className="relative z-10 flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 sm:py-12 justify-center">


        {/* ── Cards Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {options.map((opt) => {
            const IconComp = opt.icon;
            const isHovered = hoveredId === opt.id;

            return (
              <div
                key={opt.id}
                onClick={() => onSelectOption(opt.id, 'login')}
                onMouseEnter={() => setHoveredId(opt.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`group relative flex flex-col rounded-2xl sm:rounded-3xl border cursor-pointer overflow-hidden transition-all duration-300 select-none
                  bg-white/[0.03] border-white/[0.08] ${opt.hoverBorder}
                  hover:-translate-y-1.5 hover:bg-white/[0.06] active:scale-[0.99]`}
                style={{
                  boxShadow: isHovered
                    ? `0 0 0 1px ${opt.gradientFrom}50, 0 20px 50px ${opt.glowColor}, 0 8px 24px rgba(0,0,0,0.5)`
                    : '0 4px 20px rgba(0,0,0,0.35)',
                }}
              >
                {/* Gradient top accent line */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px] transition-opacity duration-300"
                  style={{
                    background: `linear-gradient(90deg, ${opt.gradientFrom}, ${opt.gradientTo})`,
                    opacity: isHovered ? 1 : 0.45,
                  }}
                />

                {/* Inner glow blob */}
                <div
                  className="absolute -top-6 -right-6 w-28 h-28 rounded-full blur-2xl transition-opacity duration-300 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle, ${opt.gradientFrom} 0%, transparent 70%)`,
                    opacity: isHovered ? 0.25 : 0.08,
                  }}
                />

                <div className="relative z-10 flex flex-col h-full p-5 sm:p-6">
                  {/* Icon + badge row */}
                  <div className="flex items-start justify-between mb-4 sm:mb-5">
                    <div
                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 flex-shrink-0 ${opt.iconGlow}`}
                      style={{
                        background: `linear-gradient(135deg, ${opt.gradientFrom}30, ${opt.gradientTo}18)`,
                        border: `1px solid ${opt.gradientFrom}40`,
                      }}
                    >
                      <IconComp className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: opt.gradientFrom }} />
                    </div>

                    <span className={`text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full border ${opt.badgeBg} backdrop-blur-sm flex-shrink-0 ml-2`}>
                      {opt.badge}
                    </span>
                  </div>

                  {/* Path number + Title + Subtitle */}
                  <div className="mb-3">
                    <span className={`text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-[0.18em] ${opt.numberColor} opacity-70`}>
                      PATH {opt.number}
                    </span>
                    <h2 className="text-lg sm:text-xl font-bold text-white mt-0.5 leading-tight group-hover:text-white transition-colors">
                      {opt.title}
                    </h2>
                    <p className="text-white/40 text-xs mt-1">{opt.subtitle}</p>
                  </div>

                  {/* Description */}
                  <p className="text-white/55 text-xs sm:text-sm leading-relaxed mb-4">
                    {opt.description}
                  </p>

                  {/* Stat pill */}
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl mb-4 self-start"
                    style={{
                      background: `${opt.gradientFrom}18`,
                      border: `1px solid ${opt.gradientFrom}30`,
                    }}
                  >
                    <Star className="w-3 h-3 flex-shrink-0" style={{ color: opt.gradientFrom }} />
                    <span className="font-black text-xs sm:text-sm" style={{ color: opt.gradientFrom }}>
                      {opt.stat}
                    </span>
                    <span className="text-white/40 text-xs">{opt.statLabel}</span>
                  </div>

                  {/* Highlights */}
                  <div
                    className="rounded-xl p-3 sm:p-3.5 mb-5 space-y-2"
                    style={{
                      background: 'rgba(255,255,255,0.025)',
                      border: '1px solid rgba(255,255,255,0.055)',
                    }}
                  >
                    {opt.highlights.map((h, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <CheckCircle2
                          className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0"
                          style={{ color: opt.gradientFrom }}
                        />
                        <span className="text-white/60 text-[11px] sm:text-xs font-medium">{h}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA row — pinned to bottom */}
                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/[0.06]">
                    <span className="text-white/30 text-[11px] font-medium">Click card to proceed</span>
                    <div
                      className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all duration-200 group-hover:gap-2.5 flex-shrink-0 shadow-sm"
                      style={{
                        background: `linear-gradient(135deg, ${opt.gradientFrom}22, ${opt.gradientTo}11)`,
                        border: `1px solid ${opt.gradientFrom}40`,
                        color: opt.gradientFrom,
                      }}
                    >
                      Sign In & Enter
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Trust badges ── */}
        <div className="mt-10 sm:mt-14 flex flex-wrap items-center justify-center gap-4 sm:gap-8">
          {trustBadges.map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex items-center gap-2 text-white/30 text-xs font-medium">
              <Icon className={`w-4 h-4 ${color}`} />
              {label}
            </div>
          ))}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/[0.06] px-4 py-4 text-center text-xs text-white/25">
        © {new Date().getFullYear()} FOREX ROYAL — Institutional Grade Trading Solutions &amp; Managed Portfolios.
      </footer>
    </div>
  );
};

