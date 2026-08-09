import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp, Lock, Unlock, CheckCircle2, AlertTriangle,
  Send, MessageCircle, X, ChevronRight, Copy, Clock,
  DollarSign, Percent, Shield, Zap, Star
} from 'lucide-react';
import { ADMIN_WHATSAPP, ADMIN_TELEGRAM_URL } from '../lib/constants';

/* ─── Types ─────────────────────────────────────────────────────────────── */
export interface PoolPackage {
  id: string;
  name: string;
  description: string;
  duration_value: number;
  duration_unit: 'hours' | 'days';
  min_amount: number;
  max_amount?: number;
  roi_percentage: number;
  risk_level: 'low' | 'medium' | 'high';
  recommended?: boolean;
}

export interface Investment {
  id: string;
  package_name: string;
  invested_amount: number;
  expected_return: number;
  total_payout: number;
  start_date: string;
  maturity_date: string;
  status: 'active' | 'matured' | 'withdrawal_pending' | 'withdrawn' | 'rejected' | 'pending';
  rejection_reason?: string;
}

export interface ApplicationHistoryItem {
  id: string;
  date: string;
  package_name: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  rejection_reason?: string;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const fmt = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function formatCountdown(ms: number) {
  if (ms <= 0) return 'Matured';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  return `${h}h ${m}m ${sec}s`;
}

function progressPct(start: string, maturity: string): number {
  const s = new Date(start).getTime();
  const m = new Date(maturity).getTime();
  const now = Date.now();
  if (now >= m) return 100;
  return Math.min(100, Math.max(0, ((now - s) / (m - s)) * 100));
}

/* ─── Risk configs ───────────────────────────────────────────────────────── */
const riskCfg = {
  low: { label: 'Low Risk', color: '#10B981', textColor: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', accent: '#10B981' },
  medium: { label: 'Medium Risk', color: '#3B82F6', textColor: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', accent: '#3B82F6' },
  high: { label: 'High Risk', color: '#F59E0B', textColor: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', accent: '#F59E0B' },
};

/* ─── Global CSS ─────────────────────────────────────────────────────────── */
const globalCSS = `
  .shadow-card { box-shadow: 0 4px 6px -1px rgba(15,23,42,0.06), 0 2px 4px -2px rgba(15,23,42,0.04); }
  .shadow-card-hover { transition: all 0.2s ease; }
  .shadow-card-hover:hover { box-shadow: 0 10px 15px -3px rgba(15,23,42,0.09); transform: translateY(-2px); }
  .tabular-nums { font-variant-numeric: tabular-nums; }
  @keyframes scaleIn { from { opacity:0; transform:scale(0.5); } to { opacity:1; transform:scale(1); } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes modalIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
  @keyframes pulse-green { 0%,100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); } 50% { box-shadow: 0 0 0 8px rgba(16,185,129,0); } }
  .btn-unlock { animation: pulse-green 2s ease infinite; }
  .scroll-snap-x { scroll-snap-type: x mandatory; overflow-x: auto; display: flex; gap: 20px; padding: 4px 16px 12px; -webkit-overflow-scrolling: touch; }
  .scroll-snap-x::-webkit-scrollbar { display: none; }
  .snap-card { scroll-snap-align: start; flex-shrink: 0; }
`;

/* ─── Modal Wrapper ──────────────────────────────────────────────────────── */
function Modal({ open, onClose, title, children, maxW = 'max-w-md' }: {
  open: boolean; onClose: () => void; title: string; children?: React.ReactNode; maxW?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className={`bg-white w-full ${maxW} rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto`}
        style={{ animation: 'modalIn 0.18s ease' }}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PACKAGE CARD
═══════════════════════════════════════════════════════════════════════════ */
function PackageCard({ pkg, onSelect }: { key?: string; pkg: PoolPackage; onSelect: (p: PoolPackage) => void }) {
  const r = riskCfg[pkg.risk_level];
  // Fixed profit = invest × roi_percentage / 100
  const fixedProfit = (pkg.min_amount * pkg.roi_percentage) / 100;
  const fixedPayout = pkg.min_amount + fixedProfit;

  return (
    <div className={`relative bg-white flex flex-col rounded-xl overflow-hidden shadow-card shadow-card-hover
      ${pkg.recommended ? 'border-2 border-blue-500' : 'border border-slate-200'}`}>

      {/* Accent bar */}
      <div className="h-1 w-full flex-shrink-0" style={{ background: r.accent }} />

      {/* Most Popular badge */}
      {pkg.recommended && (
        <div className="absolute top-3 right-3 bg-blue-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
          <Star className="w-3 h-3" /> Most Popular
        </div>
      )}

      <div className="p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2 flex-wrap pr-20">
            <h3 className="text-lg font-bold text-slate-900">{pkg.name}</h3>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full">
              {pkg.duration_value} {pkg.duration_unit}
            </span>
            <span className={`text-xs font-semibold ${r.bg} ${r.textColor} border ${r.border} px-2 py-0.5 rounded-full`}>
              {r.label}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">{pkg.description}</p>
        </div>

        {/* Details 2x2 grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Invest Capital</p>
            <p className="text-base font-bold text-slate-800 tabular-nums mt-0.5">£{fmt(pkg.min_amount)}</p>
          </div>
          <div className="bg-emerald-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">You Receive</p>
            <p className="text-base font-bold text-emerald-600 tabular-nums mt-0.5">£{fmt(fixedProfit)}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Total Payout</p>
            <p className="text-base font-bold text-blue-700 tabular-nums mt-0.5">£{fmt(fixedPayout)}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Duration</p>
            <p className="text-base font-bold text-slate-800 mt-0.5">{pkg.duration_value} {pkg.duration_unit}</p>
          </div>
        </div>

        {/* Fixed Return Summary */}
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4 mb-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Returns Summary</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Invest</p>
              <p className="text-lg font-extrabold text-slate-800 tabular-nums">£{fmt(pkg.min_amount)}</p>
            </div>
            <div className="text-2xl text-emerald-400 font-black">→</div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Profit</p>
              <p className="text-lg font-extrabold text-emerald-600 tabular-nums">£{fmt(fixedProfit)}</p>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-emerald-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Total Payout</span>
            <span className="text-base font-extrabold text-blue-600 tabular-nums">£{fmt(fixedPayout)}</span>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-auto pt-3 border-t border-slate-100">
          <button
            onClick={() => onSelect(pkg)}
            className={`w-full py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2
              ${pkg.recommended
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                : 'bg-slate-900 hover:bg-slate-800 text-white'}`}
          >
            Select & Apply <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   INVESTMENT VAULT CARD
═══════════════════════════════════════════════════════════════════════════ */
function InvestmentCard({ inv, now, onWithdraw }: {
  key?: string; inv: Investment; now: number; onWithdraw: (i: Investment) => void;
}) {
  const maturityMs = new Date(inv.maturity_date).getTime();
  const remaining = maturityMs - now;
  const pct = progressPct(inv.start_date, inv.maturity_date);
  const isUnlocked = now >= maturityMs && (inv.status === 'active' || inv.status === 'matured');
  const isActive = inv.status === 'active' || inv.status === 'matured';

  const statusCfg: Record<string, { label: string; class: string; dot?: boolean }> = {
    active: { label: 'Active — Growing', class: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: true },
    matured: { label: 'Matured — Ready', class: 'bg-blue-50 text-blue-700 border-blue-200' },
    withdrawal_pending: { label: 'Withdrawal Pending', class: 'bg-amber-50 text-amber-700 border-amber-200' },
    withdrawn: { label: 'Withdrawn', class: 'bg-slate-100 text-slate-500 border-slate-200' },
    rejected: { label: 'Rejected', class: 'bg-red-50 text-red-700 border-red-200' },
    pending: { label: 'Pending Review', class: 'bg-amber-50 text-amber-700 border-amber-200' },
  };
  const sc = statusCfg[inv.status] || statusCfg.pending;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
      {/* Top Row */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100">
        <h3 className="text-base font-bold text-slate-900">{inv.package_name}</h3>
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold border px-2.5 py-0.5 rounded-full ${sc.class}`}>
          {sc.dot && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
          {sc.label}
        </span>
      </div>

      <div className="px-5 py-4">
        {/* Financials */}
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Invested Amount</p>
            <p className="text-3xl font-bold text-slate-900 tabular-nums">${fmt(inv.invested_amount)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Expected Return</p>
            <p className="text-xl font-bold text-emerald-600 tabular-nums">+${fmt(inv.expected_return)}</p>
          </div>
        </div>

        {/* Maturity */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-slate-600">
            Matures: <span className="font-semibold">{new Date(inv.maturity_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </span>
          {isActive && remaining > 0 && (
            <span className="text-sm font-bold text-blue-600 tabular-nums">{formatCountdown(remaining)}</span>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #3B82F6, #60A5FA)' }}
          />
        </div>

        {/* Withdrawal Button */}
        {isActive && (
          isUnlocked ? (
            <button
              onClick={() => onWithdraw(inv)}
              className="btn-unlock w-full py-3 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 transition-all"
            >
              <Unlock className="w-4 h-4" />
              Withdraw ${fmt(inv.total_payout)}
            </button>
          ) : (
            <button disabled
              className="w-full py-3 rounded-lg text-sm font-semibold text-slate-400 bg-slate-100 border border-slate-200 flex items-center justify-center gap-2 cursor-not-allowed">
              <Lock className="w-4 h-4" />
              Locked until {new Date(inv.maturity_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </button>
          )
        )}

        {inv.status === 'withdrawn' && (
          <div className="w-full py-3 rounded-lg text-sm font-semibold text-slate-400 bg-slate-50 border border-slate-200 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-slate-400" /> Withdrawal Complete
          </div>
        )}

        {inv.status === 'rejected' && (
          <div className="w-full py-3 rounded-lg text-sm font-semibold text-red-500 bg-red-50 border border-red-200 text-center">
            Rejected: {inv.rejection_reason || 'Contact support for details.'}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   WITHDRAWAL MODAL
═══════════════════════════════════════════════════════════════════════════ */
const NETWORKS = [
  { id: 'USDT_TRC20', label: 'USDT TRC20', prefix: 'T', len: 34, hint: 'Starts with T, 34 chars' },
  { id: 'USDT_ERC20', label: 'USDT ERC20 (ETH)', prefix: '0x', len: 42, hint: 'Starts with 0x, 42 chars' },
  { id: 'BTC', label: 'Bitcoin (BTC)', prefix: 'bc1', len: 0, hint: 'Starts with bc1 or 1 or 3' },
  { id: 'ETH', label: 'Ethereum (ETH)', prefix: '0x', len: 42, hint: 'Starts with 0x, 42 chars' },
];

function WithdrawModal({ inv, open, onClose, onSubmit }: {
  inv: Investment | null; open: boolean; onClose: () => void; onSubmit: () => void;
}) {
  const [network, setNetwork] = useState('USDT_TRC20');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');

  const validate = (net: string, addr: string) => {
    if (!addr) return 'Wallet address is required.';
    const n = NETWORKS.find(x => x.id === net);
    if (!n) return '';
    if (net === 'USDT_TRC20' || net === 'USDT_ERC20' || net === 'ETH') {
      if (!addr.startsWith(n.prefix)) return `${n.label} addresses must start with "${n.prefix}".`;
      if (n.len > 0 && addr.length !== n.len) return `${n.label} addresses must be exactly ${n.len} characters (currently ${addr.length}).`;
    }
    if (net === 'BTC') {
      if (!addr.startsWith('bc1') && !addr.startsWith('1') && !addr.startsWith('3')) {
        return 'BTC addresses must start with bc1, 1, or 3.';
      }
    }
    return '';
  };

  const handleAddressChange = (val: string) => {
    setAddress(val);
    setError(validate(network, val));
  };

  const handleNetworkChange = (net: string) => {
    setNetwork(net);
    setError(validate(net, address));
  };

  const canSubmit = !error && address.length > 0;

  if (!open || !inv) return null;

  return (
    <Modal open={open} onClose={onClose} title="Withdraw Funds">
      {/* Payout Amount */}
      <div className="text-center py-4 mb-4 bg-emerald-50 rounded-xl border border-emerald-200">
        <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Total Payout</p>
        <p className="text-4xl font-extrabold text-emerald-600 tabular-nums mt-1">${fmt(inv.total_payout)}</p>
        <p className="text-xs text-slate-500 mt-1">${fmt(inv.invested_amount)} principal + ${fmt(inv.expected_return)} profit</p>
      </div>

      {/* Network Select */}
      <div className="mb-4">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Select Network</label>
        <select value={network} onChange={e => handleNetworkChange(e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:border-blue-400 transition-all">
          {NETWORKS.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
        </select>
        <p className="text-xs text-slate-400 mt-1">{NETWORKS.find(n => n.id === network)?.hint}</p>
      </div>

      {/* Wallet Address */}
      <div className="mb-4">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Wallet Address</label>
        <div className="relative">
          <input
            type="text"
            value={address}
            onChange={e => handleAddressChange(e.target.value)}
            placeholder={network === 'USDT_TRC20' ? 'TXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' : '0x...'}
            className={`w-full border rounded-lg px-3 py-2.5 pr-10 text-sm font-mono text-slate-900 bg-slate-50 focus:bg-white transition-all
              ${error ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-blue-400'}`}
          />
          <button onClick={() => navigator.clipboard.readText?.().then(t => handleAddressChange(t))}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-all" title="Paste">
            <Copy className="w-4 h-4" />
          </button>
        </div>
        {error && <p className="text-xs text-red-600 mt-1 font-medium">{error}</p>}
      </div>

      {/* Danger Banner */}
      <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-5">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 font-medium">
          Incorrect wallet addresses result in <strong>permanent, irreversible loss of funds</strong>. Verify your address carefully before submitting.
        </p>
      </div>

      <button
        onClick={() => { onSubmit(); onClose(); setAddress(''); setError(''); }}
        disabled={!canSubmit}
        className="w-full py-3 rounded-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all">
        Submit Withdrawal
      </button>
    </Modal>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SUCCESS STATE
═══════════════════════════════════════════════════════════════════════════ */
function SuccessState({ sub, onDismiss, whatsappUrl }: { sub: any; onDismiss: () => void; whatsappUrl: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center" style={{ animation: 'fadeUp 0.3s ease' }}>
      {/* Checkmark */}
      <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mb-5"
        style={{ animation: 'scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
      </div>
      <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Application Submitted!</h2>
      <p className="text-slate-500 text-sm max-w-sm">
        Your account manager has been notified. Please contact them to finalize your slot.
      </p>

      {/* Receipt Card */}
      <div className="w-full max-w-sm bg-slate-50 border border-slate-200 rounded-xl p-5 mt-6 text-left space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Package</span>
          <span className="text-sm font-bold text-slate-800">{sub.package_name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Amount</span>
          <span className="text-sm font-bold text-slate-800 tabular-nums">${fmt(sub.amount)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Expected Return</span>
          <span className="text-sm font-bold text-emerald-600 tabular-nums">+${fmt(sub.expected_return)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</span>
          <span className="text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full">Pending Review</span>
        </div>
      </div>

      {/* Contact Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mt-6 w-full max-w-sm">
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm text-white bg-emerald-500 hover:bg-emerald-600 transition-all">
          <MessageCircle className="w-4 h-4" /> Open WhatsApp
        </a>
        <a href={ADMIN_TELEGRAM_URL} target="_blank" rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm text-white bg-blue-500 hover:bg-blue-600 transition-all">
          <Send className="w-4 h-4" /> Open Telegram
        </a>
      </div>
      <button onClick={onDismiss} className="mt-4 text-sm text-slate-400 hover:text-slate-600 transition-all underline">
        Return to Packages
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
const PACKAGES: PoolPackage[] = [
  /* ── 24-Hour Plans ─────────────────────────────────────────────────────── */
  {
    id: 'pkg_24h_500', name: '24H · £500 Plan', description: 'Quick 24-hour institutional pool. Invest £500 and receive £4,200 profit within 24 hours.',
    duration_value: 24, duration_unit: 'hours', min_amount: 500, max_amount: 500, roi_percentage: 840, risk_level: 'low'
  },
  {
    id: 'pkg_24h_600', name: '24H · £600 Plan', description: 'Quick 24-hour institutional pool. Invest £600 and receive £5,000 profit within 24 hours.',
    duration_value: 24, duration_unit: 'hours', min_amount: 600, max_amount: 600, roi_percentage: 833, risk_level: 'low'
  },
  {
    id: 'pkg_24h_700', name: '24H · £700 Plan', description: 'Quick 24-hour institutional pool. Invest £700 and receive £6,100 profit within 24 hours.',
    duration_value: 24, duration_unit: 'hours', min_amount: 700, max_amount: 700, roi_percentage: 871, risk_level: 'low'
  },
  {
    id: 'pkg_24h_800', name: '24H · £800 Plan', description: 'Quick 24-hour institutional pool. Invest £800 and receive £7,000 profit within 24 hours.',
    duration_value: 24, duration_unit: 'hours', min_amount: 800, max_amount: 800, roi_percentage: 875, risk_level: 'low', recommended: true
  },
  /* ── 2-Day Plans ───────────────────────────────────────────────────────── */
  {
    id: 'pkg_2d_900', name: '2-Day · £900 Plan', description: 'Two-day compounded pool. Invest £900 and receive £8,000 profit at maturity.',
    duration_value: 2, duration_unit: 'days', min_amount: 900, max_amount: 900, roi_percentage: 889, risk_level: 'medium'
  },
  {
    id: 'pkg_2d_1000', name: '2-Day · £1,000 Plan', description: 'Two-day compounded pool. Invest £1,000 and receive £9,000 profit at maturity.',
    duration_value: 2, duration_unit: 'days', min_amount: 1000, max_amount: 1000, roi_percentage: 900, risk_level: 'medium'
  },
  {
    id: 'pkg_2d_1500', name: '2-Day · £1,500 Plan', description: 'Two-day compounded pool. Invest £1,500 and receive £12,000 profit at maturity.',
    duration_value: 2, duration_unit: 'days', min_amount: 1500, max_amount: 1500, roi_percentage: 800, risk_level: 'medium'
  },
  /* ── Weekly Plans ──────────────────────────────────────────────────────── */
  {
    id: 'pkg_7d_2000', name: 'Weekly · £2,000 Plan', description: 'Full-week institutional syndicate. Invest £2,000 and receive £16,000 profit at maturity.',
    duration_value: 7, duration_unit: 'days', min_amount: 2000, max_amount: 2000, roi_percentage: 800, risk_level: 'high'
  },
  {
    id: 'pkg_7d_3000', name: 'Weekly · £3,000 Plan', description: 'Full-week institutional syndicate. Invest £3,000 and receive £20,000 profit at maturity.',
    duration_value: 7, duration_unit: 'days', min_amount: 3000, max_amount: 3000, roi_percentage: 667, risk_level: 'high'
  },
  {
    id: 'pkg_7d_5000', name: 'Weekly · £5,000 Plan', description: 'Full-week institutional syndicate. Invest £5,000 and receive £30,000 profit at maturity.',
    duration_value: 7, duration_unit: 'days', min_amount: 5000, max_amount: 5000, roi_percentage: 600, risk_level: 'high'
  },
  {
    id: 'pkg_7d_10000', name: 'Weekly · £10,000 Plan', description: 'Elite-tier week syndicate. Invest £10,000 and receive £60,000 profit at maturity.',
    duration_value: 7, duration_unit: 'days', min_amount: 10000, max_amount: 10000, roi_percentage: 600, risk_level: 'high'
  },
];


const INVESTMENTS: Investment[] = [
  {
    id: 'inv_101', package_name: '7-Day Growth Plan', invested_amount: 500.00, expected_return: 120.00, total_payout: 620.00,
    start_date: new Date(Date.now() - 3 * 86400000).toISOString(),
    maturity_date: new Date(Date.now() + 4 * 86400000).toISOString(),
    status: 'active'
  },
  {
    id: 'inv_102', package_name: '24-Hour Starter', invested_amount: 250.00, expected_return: 21.25, total_payout: 271.25,
    start_date: new Date(Date.now() - 26 * 3600000).toISOString(),
    maturity_date: new Date(Date.now() - 2 * 3600000).toISOString(),
    status: 'matured'
  },
  {
    id: 'inv_103', package_name: '7-Day Growth Plan', invested_amount: 1000.00, expected_return: 240.00, total_payout: 1240.00,
    start_date: new Date(Date.now() - 10 * 86400000).toISOString(),
    maturity_date: new Date(Date.now() - 3 * 86400000).toISOString(),
    status: 'withdrawn'
  },
];

const HISTORY: ApplicationHistoryItem[] = [
  { id: 'app_901', date: new Date(Date.now() - 10 * 86400000).toLocaleDateString(), package_name: '7-Day Growth Plan', amount: 1000.00, status: 'approved' },
  { id: 'app_902', date: new Date(Date.now() - 5 * 86400000).toLocaleDateString(), package_name: '24-Hour Starter', amount: 250.00, status: 'approved' },
  { id: 'app_903', date: new Date(Date.now() - 2 * 86400000).toLocaleDateString(), package_name: '30-Day VIP Syndicate', amount: 2500.00, status: 'pending' },
  { id: 'app_904', date: new Date(Date.now() - 15 * 86400000).toLocaleDateString(), package_name: '24-Hour Starter', amount: 100.00, status: 'rejected', rejection_reason: 'Insufficient KYC documentation.' },
];

export function PoolTradingDashboard() {
  const [activeTab, setActiveTab] = useState<'packages' | 'my-investments' | 'history'>('packages');
  const [investments, setInvestments] = useState<Investment[]>(INVESTMENTS);
  const [history, setHistory] = useState<ApplicationHistoryItem[]>(HISTORY);
  const [investFilter, setInvestFilter] = useState<'all' | 'active' | 'matured' | 'withdrawn'>('all');
  const [submissionSuccess, setSubmissionSuccess] = useState<any | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<PoolPackage | null>(null);
  const [confirmAmt, setConfirmAmt] = useState(500);
  const [withdrawInv, setWithdrawInv] = useState<Investment | null>(null);
  const [nowTime, setNowTime] = useState(Date.now());

  const userName = 'Francesco Battista';
  const userEmail = 'francesco.battista@forexelites.com';
  const whatsappUrl = `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(
    `Hi, I'm ${userName} (${userEmail}). I just submitted a pool trading application.`
  )}`;

  useEffect(() => {
    const t = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleSelectPackage = (pkg: PoolPackage) => {
    setSelectedPackage(pkg);
    setConfirmAmt(pkg.min_amount);
  };

  const handleConfirmApplication = () => {
    if (!selectedPackage) return;
    const fixedAmt = selectedPackage.min_amount;
    const expectedReturn = (fixedAmt * selectedPackage.roi_percentage) / 100;
    setSubmissionSuccess({ package_name: selectedPackage.name, amount: fixedAmt, expected_return: expectedReturn });
    setHistory(prev => [
      { id: `app_${Date.now()}`, date: new Date().toLocaleDateString(), package_name: selectedPackage.name, amount: fixedAmt, status: 'pending' },
      ...prev
    ]);
    setSelectedPackage(null);
  };

  const handleWithdrawSubmit = () => {
    if (!withdrawInv) return;
    setInvestments(prev => prev.map(i => i.id === withdrawInv.id ? { ...i, status: 'withdrawal_pending' } : i));
    setWithdrawInv(null);
  };

  const filteredInvestments = investments.filter(i => {
    if (investFilter === 'all') return true;
    if (investFilter === 'active') return i.status === 'active';
    if (investFilter === 'matured') return i.status === 'matured' || i.status === 'withdrawal_pending';
    if (investFilter === 'withdrawn') return i.status === 'withdrawn';
    return true;
  });

  const TABS = [
    { id: 'packages', label: 'Packages' },
    { id: 'my-investments', label: 'My Investments' },
    { id: 'history', label: 'History' },
  ] as const;

  const statusColor: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
    withdrawn: 'bg-slate-100 text-slate-500 border-slate-200',
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] font-sans pb-24 sm:pb-16">
      <style>{globalCSS}</style>

      <div className="w-full max-w-[1400px] mx-auto px-3.5 sm:px-8 py-3 sm:py-6">
        {/* ── PAGE HEADER ────────────────────────────────────────────── */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 sm:w-7 sm:h-7 text-blue-600 flex-shrink-0" /> Pool Trading
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 hidden sm:block">Grow your capital passively with expert-managed institutional liquidity pools.</p>
          </div>
        </div>

        {/* ── TAB BAR ────────────────────────────────────────────────── */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 mb-4 sm:mb-6 shadow-sm overflow-x-auto scrollbar-none flex-nowrap -mx-3.5 px-3.5 sm:mx-0 sm:px-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 ${activeTab === t.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ──────────────────────────────────────────────────────────── */}
        {/* TAB: PACKAGES */}
        {/* ──────────────────────────────────────────────────────────── */}
        {activeTab === 'packages' && (
          submissionSuccess ? (
            <SuccessState sub={submissionSuccess} onDismiss={() => setSubmissionSuccess(null)} whatsappUrl={whatsappUrl} />
          ) : (
            <>
              {/* Desktop grid */}
              <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                {PACKAGES.map(p => <PackageCard key={p.id} pkg={p} onSelect={handleSelectPackage} />)}
              </div>
              {/* Mobile horizontal scroll */}
              <div className="sm:hidden scroll-snap-x -mx-3.5">
                {PACKAGES.map(p => (
                  <div key={p.id} className="snap-card" style={{ width: '88vw' }}>
                    <PackageCard pkg={p} onSelect={handleSelectPackage} />
                  </div>
                ))}
              </div>
            </>
          )
        )}

        {/* ──────────────────────────────────────────────────────────── */}
        {/* TAB: MY INVESTMENTS */}
        {/* ──────────────────────────────────────────────────────────── */}
        {activeTab === 'my-investments' && (
          <div className="w-full">
            {/* Filter tabs */}
            <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-5 overflow-x-auto scrollbar-none flex-nowrap">
              {(['all', 'active', 'matured', 'withdrawn'] as const).map(f => (
                <button key={f} onClick={() => setInvestFilter(f)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-bold capitalize transition-all whitespace-nowrap flex-shrink-0 ${investFilter === f ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  {f}
                </button>
              ))}
            </div>

            {filteredInvestments.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center w-full">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-slate-300" />
                </div>
                <p className="text-base sm:text-lg font-bold text-slate-700">No investments found</p>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">Apply for a pool package to start earning passive compound returns.</p>
                <button onClick={() => setActiveTab('packages')}
                  className="mt-4 sm:mt-5 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-blue-700 transition-all shadow-sm">
                  Browse Pool Packages
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 w-full">
                {filteredInvestments.map(inv => (
                  <InvestmentCard key={inv.id} inv={inv} now={nowTime} onWithdraw={setWithdrawInv} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────── */}
        {/* TAB: HISTORY */}
        {/* ──────────────────────────────────────────────────────────── */}
        {activeTab === 'history' && (
          <div className="w-full">
            {history.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center w-full">
                <Clock className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300 mx-auto mb-3" />
                <p className="font-bold text-slate-600 text-sm sm:text-base">No transaction history yet</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden w-full">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                          <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Package Name</th>
                          <th className="text-right px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Invested Amount</th>
                          <th className="text-right px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {history.map(h => (
                          <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 text-slate-600 font-medium text-xs sm:text-sm whitespace-nowrap">{h.date}</td>
                            <td className="px-6 py-4 font-bold text-slate-900 text-xs sm:text-sm whitespace-nowrap">
                              {h.package_name}
                            </td>
                            <td className="px-6 py-4 text-right font-extrabold text-slate-900 text-xs sm:text-sm tabular-nums whitespace-nowrap">${fmt(h.amount)}</td>
                            <td className="px-6 py-4 text-right whitespace-nowrap">
                              <span className={`inline-flex text-xs font-bold border px-3 py-1 rounded-full capitalize ${statusColor[h.status] || ''}`}>
                                {h.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile Cards View */}
                <div className="sm:hidden space-y-3">
                  {history.map(h => (
                    <div key={h.id} className="bg-white border border-slate-200 rounded-xl shadow-card p-4 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{h.package_name}</span>
                        <span className={`inline-flex text-[11px] font-bold border px-2.5 py-0.5 rounded-full capitalize ${statusColor[h.status] || ''}`}>
                          {h.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                        <span>Date: {h.date}</span>
                        <span className="font-extrabold text-slate-900 tabular-nums text-sm">£{fmt(h.amount)}</span>
                      </div>
                      {h.rejection_reason && (
                        <p className="text-[11px] text-red-600 bg-red-50 p-2 rounded border border-red-100 mt-1">
                          Reason: {h.rejection_reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── PACKAGE CONFIRM MODAL ──────────────────────────────────── */}
      <Modal open={!!selectedPackage} onClose={() => setSelectedPackage(null)} title="Confirm Application">
        {selectedPackage && (() => {
          const r = riskCfg[selectedPackage.risk_level];
          const fixedProfit = (selectedPackage.min_amount * selectedPackage.roi_percentage) / 100;
          const fixedPayout = selectedPackage.min_amount + fixedProfit;
          return (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-xs font-bold text-blue-500 uppercase tracking-wide mb-0.5">Selected Package</p>
                <p className="text-base font-extrabold text-slate-900">{selectedPackage.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{selectedPackage.duration_value} {selectedPackage.duration_unit} · <span className={r.textColor}>{r.label}</span></p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Investment Amount (GBP)</p>
                <p className="text-2xl font-extrabold text-slate-900 tabular-nums">£{fmt(selectedPackage.min_amount)}</p>
                <p className="text-xs text-slate-400 mt-1">Fixed amount for this plan</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Expected Profit</span>
                  <span className="text-lg font-extrabold text-emerald-600 tabular-nums">+£{fmt(fixedProfit)}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-slate-600">Total Payout</span>
                  <span className="text-xl font-extrabold text-emerald-700 tabular-nums">£{fmt(fixedPayout)}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setSelectedPackage(null)} className="flex-1 py-3 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all">Cancel</button>
                <button onClick={handleConfirmApplication} className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all">
                  Confirm Application
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ── WITHDRAWAL MODAL ──────────────────────────────────────── */}
      <WithdrawModal inv={withdrawInv} open={!!withdrawInv} onClose={() => setWithdrawInv(null)} onSubmit={handleWithdrawSubmit} />
    </div>
  );
}
