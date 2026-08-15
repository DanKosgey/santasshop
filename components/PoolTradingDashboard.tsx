import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  TrendingUp, Lock, Unlock, CheckCircle2, AlertTriangle,
  Send, MessageCircle, X, ChevronRight, Copy, Clock,
  DollarSign, Percent, Shield, Zap, Star, RefreshCw,
  Wallet, ArrowUpRight, Check, Info, Sparkles
} from 'lucide-react';
import { ADMIN_WHATSAPP, ADMIN_TELEGRAM_URL } from '../lib/constants';
import { supabase } from '../supabase/client';
import {
  poolTradingService,
  PoolPackage,
  PoolInvestment,
  PoolApplication,
  WithdrawalRequest,
  DEFAULT_PACKAGES
} from '../services/poolTradingService';
import { User } from '../types';

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
  if (d > 0) return `${d}d ${h}h ${m}m ${sec}s`;
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
  @keyframes swipe-nudge {
    0%   { transform: translateX(0); opacity: 1; }
    30%  { transform: translateX(18px); opacity: 1; }
    60%  { transform: translateX(4px); opacity: 0.7; }
    80%  { transform: translateX(22px); opacity: 1; }
    100% { transform: translateX(0); opacity: 1; }
  }
  @keyframes hint-fade-in  { from { opacity:0; } to { opacity:1; } }
  @keyframes hint-fade-out { from { opacity:1; } to { opacity:0; pointer-events:none; } }
  .swipe-hint { animation: hint-fade-in 0.5s ease forwards; }
  .swipe-hint.hiding { animation: hint-fade-out 0.4s ease forwards; }
  .swipe-hand { animation: swipe-nudge 1.4s ease-in-out infinite; }
  @keyframes arrow-slide {
    0%,100% { transform: translateX(0); opacity: 0.5; }
    50%      { transform: translateX(10px); opacity: 1; }
  }
  .swipe-arrow { animation: arrow-slide 1.4s ease-in-out infinite; }
`;

/* ─── Modal Wrapper ──────────────────────────────────────────────────────── */
function Modal({ open, onClose, title, children, maxW = 'max-w-md' }: {
  open: boolean; onClose: () => void; title: string; children?: React.ReactNode; maxW?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/50 backdrop-blur-sm">
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
function PackageCard({ pkg, onSelect }: { pkg: PoolPackage; onSelect: (p: PoolPackage) => void }) {
  const r = riskCfg[pkg.risk_level] || riskCfg.medium;
  const fixedProfit = (pkg.min_amount * pkg.roi_percentage) / 100;
  const fixedPayout = pkg.min_amount + fixedProfit;

  return (
    <div className={`relative bg-white flex flex-col rounded-2xl overflow-hidden shadow-card shadow-card-hover border transition-all ${
      pkg.recommended ? 'border-2 border-blue-500 ring-4 ring-blue-500/10' : 'border-slate-200'
    }`}>
      {pkg.recommended && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-extrabold uppercase tracking-wider py-1 px-3 text-center flex items-center justify-center gap-1.5 shadow-sm">
          <Sparkles className="w-3 h-3 text-yellow-300" /> Recommended Institutional Plan
        </div>
      )}

      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
        <div>
          {/* Top header & badges */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${r.bg} ${r.textColor} ${r.border} mb-1.5`}>
                {r.label}
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">{pkg.name}</h3>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-400 block uppercase">Duration</span>
              <span className="text-sm font-extrabold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                {pkg.duration_value} {pkg.duration_unit}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 mb-5 leading-relaxed min-h-[36px]">
            {pkg.description || `Institutional pool plan with ${pkg.duration_value} ${pkg.duration_unit} maturity cycle.`}
          </p>

          {/* Investment & Profit Details */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Deposit Amount</span>
              <span className="text-base font-extrabold text-slate-900 tabular-nums">£{fmt(pkg.min_amount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">ROI Percentage</span>
              <span className="text-sm font-extrabold text-emerald-600 tabular-nums">+{pkg.roi_percentage}%</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
              <span className="text-xs font-semibold text-slate-500">Expected Profit</span>
              <span className="text-base font-extrabold text-emerald-600 tabular-nums">+£{fmt(fixedProfit)}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-700">Total Payout at Maturity</span>
              <span className="text-lg font-black text-blue-600 tabular-nums">£{fmt(fixedPayout)}</span>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={() => onSelect(pkg)}
          className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 active:scale-[0.99] ${
            pkg.recommended
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25'
              : 'bg-slate-900 hover:bg-slate-800 text-white'
          }`}
        >
          <span>Select Plan & Apply</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   INVESTMENT VAULT CARD
═══════════════════════════════════════════════════════════════════════════ */
function InvestmentCard({ inv, now, onWithdraw }: {
  inv: PoolInvestment; now: number; onWithdraw: (i: PoolInvestment) => void;
}) {
  const maturityMs = new Date(inv.maturity_date).getTime();
  const remaining = maturityMs - now;
  const pct = progressPct(inv.start_date, inv.maturity_date);
  const isUnlocked = now >= maturityMs && (inv.status === 'active' || inv.status === 'matured');
  const isActive = inv.status === 'active' || inv.status === 'matured';

  const statusCfg: Record<string, { label: string; class: string; dot?: boolean }> = {
    active: { label: 'Active — Compounding', class: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: true },
    matured: { label: 'Matured — Ready to Withdraw', class: 'bg-blue-50 text-blue-700 border-blue-200' },
    withdrawal_pending: { label: 'Withdrawal Processing', class: 'bg-amber-50 text-amber-700 border-amber-200' },
    withdrawn: { label: 'Withdrawn — Paid Out', class: 'bg-slate-100 text-slate-600 border-slate-200' },
    cancelled: { label: 'Cancelled', class: 'bg-red-50 text-red-700 border-red-200' },
  };
  const sc = statusCfg[inv.status] || { label: inv.status, class: 'bg-slate-100 text-slate-700 border-slate-200' };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden transition-all hover:border-slate-300">
      {/* Top Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-extrabold text-slate-900">{inv.package_name}</h3>
          <p className="text-[11px] text-slate-400">Started: {new Date(inv.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-xs font-bold border px-3 py-1 rounded-full ${sc.class}`}>
          {sc.dot && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
          {sc.label}
        </span>
      </div>

      <div className="px-5 py-4">
        {/* Financial Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Invested Principal</p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums">£{fmt(inv.invested_amount)}</p>
          </div>
          <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100">
            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide">Expected Profit</p>
            <p className="text-xl sm:text-2xl font-black text-emerald-600 tabular-nums">+£{fmt(inv.expected_return)}</p>
          </div>
        </div>

        {/* Maturity info and countdown */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-600 font-medium">
            Matures: <span className="font-bold text-slate-800">{new Date(inv.maturity_date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </span>
          {isActive && remaining > 0 ? (
            <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md tabular-nums">
              ⏱ {formatCountdown(remaining)}
            </span>
          ) : (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              ✓ Cycle Completed
            </span>
          )}
        </div>

        {/* Dynamic Progress Bar */}
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-4">
          <div
            className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-blue-500 to-indigo-600"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Total Payout Summary */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/50 border border-blue-100 mb-4">
          <span className="text-xs font-bold text-slate-700">Total Guaranteed Payout</span>
          <span className="text-lg font-black text-blue-700 tabular-nums">£{fmt(inv.total_payout)}</span>
        </div>

        {/* Action Button */}
        {isActive && (
          isUnlocked ? (
            <button
              onClick={() => onWithdraw(inv)}
              className="btn-unlock w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] transition-all shadow-lg shadow-emerald-600/20"
            >
              <Unlock className="w-4 h-4" />
              <span>Withdraw £{fmt(inv.total_payout)} Now</span>
            </button>
          ) : (
            <button disabled
              className="w-full py-3 rounded-xl text-xs sm:text-sm font-semibold text-slate-400 bg-slate-100 border border-slate-200 flex items-center justify-center gap-2 cursor-not-allowed">
              <Lock className="w-4 h-4" />
              <span>Locked until maturity date</span>
            </button>
          )
        )}

        {inv.status === 'withdrawal_pending' && (
          <div className="w-full py-3 rounded-xl text-xs sm:text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200 flex items-center justify-center gap-2">
            <Clock className="w-4 h-4 text-amber-500 animate-spin" /> Payout Request Under Review by Admin
          </div>
        )}

        {inv.status === 'withdrawn' && (
          <div className="w-full py-3 rounded-xl text-xs sm:text-sm font-semibold text-slate-500 bg-slate-50 border border-slate-200 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Funds Dispatched & Completed
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
  { id: 'USDT_TRC20', label: 'USDT (TRC20 - Tron)', placeholder: 'TXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', hint: 'Tron address starting with T' },
  { id: 'USDT_ERC20', label: 'USDT (ERC20 - Ethereum)', placeholder: '0x...', hint: 'Ethereum address starting with 0x' },
  { id: 'BTC', label: 'Bitcoin (BTC)', placeholder: 'bc1... or 1... or 3...', hint: 'Native BTC address' },
  { id: 'MPESA', label: 'M-Pesa (Kenya / East Africa)', placeholder: 'e.g. +254 712 345 678', hint: 'Registered M-Pesa phone number' },
  { id: 'BANK', label: 'Bank Wire Transfer', placeholder: 'Bank Name, Account Number, Swift/IBAN', hint: 'Full bank routing details' },
];

function WithdrawModal({ inv, open, onClose, onSubmit, isSubmitting }: {
  inv: PoolInvestment | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (method: string, address: string) => Promise<void>;
  isSubmitting: boolean;
}) {
  const [network, setNetwork] = useState('USDT_TRC20');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');

  const validate = (net: string, addr: string) => {
    if (!addr.trim()) return 'Destination account / wallet address is required.';
    if (net === 'USDT_TRC20' && (!addr.startsWith('T') || addr.length < 30)) {
      return 'TRC20 addresses must start with "T" and be at least 34 characters.';
    }
    if ((net === 'USDT_ERC20') && (!addr.startsWith('0x') || addr.length !== 42)) {
      return 'ERC20 addresses must start with "0x" and be 42 characters.';
    }
    if (net === 'MPESA' && addr.replace(/\D/g, '').length < 9) {
      return 'Please enter a valid phone number for M-Pesa.';
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

  const handleSubmit = async () => {
    const err = validate(network, address);
    if (err) {
      setError(err);
      return;
    }
    await onSubmit(network, address);
    setAddress('');
    setError('');
  };

  if (!open || !inv) return null;

  return (
    <Modal open={open} onClose={onClose} title="Withdraw Payout Funds" maxW="max-w-lg">
      <div className="space-y-4">
        {/* Payout Amount Banner */}
        <div className="text-center py-4 bg-emerald-50 rounded-2xl border border-emerald-200">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Total Available Payout</p>
          <p className="text-3xl sm:text-4xl font-black text-emerald-700 tabular-nums mt-1">£{fmt(inv.total_payout)}</p>
          <p className="text-xs text-slate-500 mt-1">
            £{fmt(inv.invested_amount)} principal + £{fmt(inv.expected_return)} profit
          </p>
        </div>

        {/* Network / Payout method selector */}
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
            Select Payout Method
          </label>
          <select
            value={network}
            onChange={e => handleNetworkChange(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3.5 py-3 text-sm font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all"
          >
            {NETWORKS.map(n => (
              <option key={n.id} value={n.id}>{n.label}</option>
            ))}
          </select>
          <p className="text-[11px] text-slate-400 mt-1">{NETWORKS.find(n => n.id === network)?.hint}</p>
        </div>

        {/* Address / Account Input */}
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
            Receiving Wallet / Account Address
          </label>
          <div className="relative">
            <input
              type="text"
              value={address}
              onChange={e => handleAddressChange(e.target.value)}
              placeholder={NETWORKS.find(n => n.id === network)?.placeholder}
              className={`w-full border rounded-xl px-3.5 py-3 pr-10 text-sm font-mono text-slate-900 bg-slate-50 focus:bg-white outline-none transition-all ${
                error ? 'border-red-400 bg-red-50/50' : 'border-slate-200 focus:border-blue-500'
              }`}
            />
            <button
              type="button"
              onClick={() => navigator.clipboard.readText?.().then(t => handleAddressChange(t))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-all p-1"
              title="Paste from clipboard"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          {error && <p className="text-xs text-red-600 mt-1 font-semibold">{error}</p>}
        </div>

        {/* Safety Warning */}
        <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-900 font-medium">
            Please double-check your recipient details. Once dispatched by institutional pool custodians, withdrawals cannot be reversed.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !address.trim()}
            className="flex-1 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Submitting...
              </>
            ) : (
              'Submit Withdrawal'
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SUCCESS STATE COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
function SuccessState({ sub, onDismiss, whatsappUrl }: { sub: any; onDismiss: () => void; whatsappUrl: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center max-w-lg mx-auto" style={{ animation: 'fadeUp 0.3s ease' }}>
      <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mb-4"
        style={{ animation: 'scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <CheckCircle2 className="w-10 h-10 text-emerald-600" />
      </div>
      <h2 className="text-2xl font-black text-slate-900 mb-1">Application Registered!</h2>
      <p className="text-slate-500 text-xs sm:text-sm max-w-md">
        Your slot in the institutional pool has been recorded in real-time. Complete payment confirmation with the desk below.
      </p>

      {/* Receipt Details */}
      <div className="w-full bg-white border border-slate-200 shadow-card rounded-2xl p-5 mt-5 text-left space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-400 uppercase">Package</span>
          <span className="text-sm font-bold text-slate-900">{sub.package_name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase">Deposit Amount</span>
          <span className="text-base font-extrabold text-slate-900 tabular-nums">£{fmt(sub.amount)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase">Expected Return</span>
          <span className="text-base font-extrabold text-emerald-600 tabular-nums">+£{fmt(sub.expected_return)}</span>
        </div>
        {sub.transaction_reference && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-400 uppercase">Payment Ref</span>
            <span className="text-xs font-mono font-bold text-blue-600">{sub.transaction_reference}</span>
          </div>
        )}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-400 uppercase">Queue Status</span>
          <span className="text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3" /> Live In Admin Queue
          </span>
        </div>
      </div>

      {/* Support Direct Contacts */}
      <div className="flex flex-col sm:flex-row gap-3 mt-6 w-full">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-md"
        >
          <MessageCircle className="w-4 h-4" /> Message Desk on WhatsApp
        </a>
        <a
          href={ADMIN_TELEGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md"
        >
          <Send className="w-4 h-4" /> Open Telegram Support
        </a>
      </div>

      <button
        onClick={onDismiss}
        className="mt-5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-all underline"
      >
        View My Investments & Status
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN STUDENT POOL TRADING DASHBOARD
═══════════════════════════════════════════════════════════════════════════ */
export function PoolTradingDashboard({ currentUser }: { currentUser?: User }) {
  const [activeTab, setActiveTab] = useState<'packages' | 'my-investments' | 'history'>('packages');
  const [packages, setPackages] = useState<PoolPackage[]>(DEFAULT_PACKAGES);
  const [investments, setInvestments] = useState<PoolInvestment[]>([]);
  const [applications, setApplications] = useState<PoolApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRealtimeActive, setIsRealtimeActive] = useState(true);

  // Application Modal state
  const [selectedPackage, setSelectedPackage] = useState<PoolPackage | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('USDT_TRC20');
  const [transactionRef, setTransactionRef] = useState('');
  const [appNotes, setAppNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<any | null>(null);

  // Withdrawal Modal state
  const [withdrawInv, setWithdrawInv] = useState<PoolInvestment | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // VIP Request modal state
  const [showVipModal, setShowVipModal] = useState(false);
  const [vipNotes, setVipNotes] = useState('');
  const [isSubmittingVip, setIsSubmittingVip] = useState(false);

  // Filter state
  const [investFilter, setInvestFilter] = useState<'all' | 'active' | 'matured' | 'withdrawn'>('all');
  type PkgFilter = 'all' | '24h' | '2day' | 'weekly';
  const [pkgFilter, setPkgFilter] = useState<PkgFilter>('all');
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const [swipeHintHiding, setSwipeHintHiding] = useState(false);
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const [nowTime, setNowTime] = useState(Date.now());

  // Derive active user ID
  const effectiveUserId = currentUser?.id || 'demo-student-id';
  const userName = currentUser?.name || 'Trader';
  const userEmail = currentUser?.email || 'student@forexelites.com';

  const whatsappUrl = `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(
    `Hello Forex Royal Pool Trading Desk, I am ${userName} (${userEmail}). I would like to confirm my pool trading allocation.`
  )}`;

  // Live timer interval
  useEffect(() => {
    const t = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Fetch initial data & subscribe to real-time changes
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [pkgs, invs, apps] = await Promise.all([
        poolTradingService.getActivePackages(),
        poolTradingService.getUserInvestments(effectiveUserId),
        poolTradingService.getUserApplications(effectiveUserId),
      ]);
      setPackages(pkgs.length > 0 ? pkgs : DEFAULT_PACKAGES);
      setInvestments(invs);
      setApplications(apps);
    } catch (err) {
      console.error('Error loading pool trading data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveUserId]);

  useEffect(() => {
    loadData();

    // 1. Subscribe to packages changes
    const unsubPackages = poolTradingService.subscribePackages(async () => {
      const pkgs = await poolTradingService.getActivePackages();
      if (pkgs.length > 0) setPackages(pkgs);
    });

    // 2. Subscribe to investments changes
    const unsubInvestments = poolTradingService.subscribeInvestments(async () => {
      const invs = await poolTradingService.getUserInvestments(effectiveUserId);
      setInvestments(invs);
    });

    // 3. Subscribe to applications changes
    const unsubApplications = poolTradingService.subscribeApplications(async () => {
      const apps = await poolTradingService.getUserApplications(effectiveUserId);
      setApplications(apps);
      // Also refresh investments as an approved application spawns an investment
      const invs = await poolTradingService.getUserInvestments(effectiveUserId);
      setInvestments(invs);
    });

    return () => {
      unsubPackages();
      unsubInvestments();
      unsubApplications();
    };
  }, [effectiveUserId, loadData]);

  // Package Filter
  const PKG_FILTERS: { id: PkgFilter; label: string; emoji: string }[] = [
    { id: 'all',    label: 'All Plans',  emoji: '✨' },
    { id: '24h',   label: '24 Hours',   emoji: '⚡' },
    { id: '2day',  label: '2 Days',     emoji: '📅' },
    { id: 'weekly',label: 'Weekly',     emoji: '🗓️' },
  ];

  const filteredPackages = useMemo(() => {
    if (pkgFilter === 'all') return packages;
    if (pkgFilter === '24h')   return packages.filter(p => p.duration_unit === 'hours' && p.duration_value === 24);
    if (pkgFilter === '2day')  return packages.filter(p => p.duration_unit === 'days'  && p.duration_value === 2);
    if (pkgFilter === 'weekly')return packages.filter(p => p.duration_unit === 'days'  && p.duration_value === 7);
    return packages;
  }, [packages, pkgFilter]);

  // Dismiss mobile swipe hint
  const dismissSwipeHint = useCallback(() => {
    if (!showSwipeHint || swipeHintHiding) return;
    setSwipeHintHiding(true);
    setTimeout(() => setShowSwipeHint(false), 400);
  }, [showSwipeHint, swipeHintHiding]);

  useEffect(() => {
    const el = mobileScrollRef.current;
    if (!el) return;
    const onScroll = () => dismissSwipeHint();
    el.addEventListener('scroll', onScroll, { passive: true, once: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [dismissSwipeHint]);

  useEffect(() => {
    if (!showSwipeHint) return;
    const t = setTimeout(() => dismissSwipeHint(), 4000);
    return () => clearTimeout(t);
  }, [showSwipeHint, dismissSwipeHint]);

  // Application Submission Handler
  const handleConfirmApplication = async () => {
    if (!selectedPackage) return;
    try {
      setIsSubmitting(true);
      const fixedAmt = selectedPackage.min_amount;
      const expectedReturn = (fixedAmt * selectedPackage.roi_percentage) / 100;

      const newApp = await poolTradingService.submitApplication({
        userId: effectiveUserId,
        packageId: selectedPackage.id,
        amount: fixedAmt,
        paymentMethod,
        transactionReference: transactionRef,
        notes: appNotes,
      });

      setSubmissionSuccess({
        package_name: selectedPackage.name,
        amount: fixedAmt,
        expected_return: expectedReturn,
        transaction_reference: transactionRef,
      });

      // Update local applications list optimistically
      setApplications(prev => [newApp, ...prev]);
      setSelectedPackage(null);
      setTransactionRef('');
      setAppNotes('');
    } catch (err: any) {
      console.error('Failed to submit application:', err);
      alert('Application submission failed. Please check connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Withdrawal Submission Handler
  const handleWithdrawSubmit = async (method: string, address: string) => {
    if (!withdrawInv) return;
    try {
      setIsWithdrawing(true);
      await poolTradingService.submitWithdrawalRequest({
        userId: effectiveUserId,
        investmentId: withdrawInv.id,
        amount: withdrawInv.total_payout,
        paymentMethod: method,
        walletAddress: address,
      });

      // Update local state
      setInvestments(prev =>
        prev.map(i => (i.id === withdrawInv.id ? { ...i, status: 'withdrawal_pending' } : i))
      );
      setWithdrawInv(null);
      alert('Withdrawal request submitted successfully! Custodians are processing the payout.');
    } catch (err: any) {
      console.error('Failed to submit withdrawal:', err);
      alert('Withdrawal submission error: ' + (err.message || 'Please try again.'));
    } finally {
      setIsWithdrawing(false);
    }
  };

  // VIP Request Submission
  const handleVipSubmit = async () => {
    try {
      setIsSubmittingVip(true);
      await poolTradingService.submitVipRequest(effectiveUserId, vipNotes);
      setShowVipModal(false);
      setVipNotes('');
      alert('VIP Syndicate Request received. An institutional partner director will contact you shortly.');
    } catch (err: any) {
      alert('Failed to submit VIP request: ' + err.message);
    } finally {
      setIsSubmittingVip(false);
    }
  };

  // Filtered investments
  const filteredInvestments = useMemo(() => {
    return investments.filter(i => {
      if (investFilter === 'all') return true;
      if (investFilter === 'active') return i.status === 'active';
      if (investFilter === 'matured') return i.status === 'matured' || i.status === 'withdrawal_pending';
      if (investFilter === 'withdrawn') return i.status === 'withdrawn';
      return true;
    });
  }, [investments, investFilter]);

  const statusColor: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
    withdrawn: 'bg-slate-100 text-slate-500 border-slate-200',
  };

  const TABS = [
    { id: 'packages', label: 'Pool Packages' },
    { id: 'my-investments', label: `My Investments (${investments.filter(i => i.status === 'active' || i.status === 'matured').length})` },
    { id: 'history', label: `Application History (${applications.length})` },
  ] as const;

  return (
    <div className="min-h-screen bg-[#F5F7FA] font-sans pb-24 sm:pb-16">
      <style>{globalCSS}</style>

      <div className="w-full max-w-[1400px] mx-auto px-3.5 sm:px-8 py-4 sm:py-6">
        {/* ── PAGE HEADER ────────────────────────────────────────────── */}
        <div className="mb-5 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-blue-600 flex-shrink-0" /> Institutional Pool Trading
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Realtime Sync
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Grow capital with automated high-frequency liquidity pools managed by institutional traders.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowVipModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" /> VIP Syndicate Access
            </button>
            <button
              onClick={loadData}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* ── TAB BAR ────────────────────────────────────────────────── */}
        <div className="flex gap-1.5 bg-white border border-slate-200 rounded-xl p-1.5 mb-5 shadow-sm overflow-x-auto scrollbar-none flex-nowrap">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id); setSubmissionSuccess(null); }}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                activeTab === t.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ──────────────────────────────────────────────────────────── */}
        {/* TAB 1: PACKAGES */}
        {/* ──────────────────────────────────────────────────────────── */}
        {activeTab === 'packages' && (
          submissionSuccess ? (
            <SuccessState sub={submissionSuccess} onDismiss={() => setSubmissionSuccess(null)} whatsappUrl={whatsappUrl} />
          ) : (
            <>
              {/* Duration Filter Pills */}
              <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-none flex-nowrap pb-1">
                {PKG_FILTERS.map(f => (
                  <button
                    key={f.id}
                    onClick={() => { setPkgFilter(f.id); setShowSwipeHint(true); setSwipeHintHiding(false); }}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap flex-shrink-0 transition-all border ${
                      pkgFilter === f.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                    }`}
                  >
                    <span>{f.emoji}</span> {f.label}
                    {pkgFilter === f.id && (
                      <span className="ml-1 bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {filteredPackages.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Desktop Grid */}
              <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                {filteredPackages.map(p => (
                  <PackageCard key={p.id} pkg={p} onSelect={setSelectedPackage} />
                ))}
              </div>

              {/* Mobile Horizontal Scroll with Swipe Hint */}
              <div className="sm:hidden relative">
                {showSwipeHint && filteredPackages.length > 1 && (
                  <div
                    className={`swipe-hint${swipeHintHiding ? ' hiding' : ''} pointer-events-none absolute bottom-6 right-4 z-20 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-sm text-white text-xs font-bold px-3.5 py-2 rounded-full shadow-lg`}
                  >
                    <span className="swipe-hand text-base">👆</span>
                    <span>Swipe to explore plans</span>
                    <ChevronRight className="w-4 h-4 text-white/70" />
                  </div>
                )}

                <div ref={mobileScrollRef} className="scroll-snap-x -mx-3.5">
                  {filteredPackages.map(p => (
                    <div key={p.id} className="snap-card" style={{ width: '88vw' }}>
                      <PackageCard pkg={p} onSelect={setSelectedPackage} />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )
        )}

        {/* ──────────────────────────────────────────────────────────── */}
        {/* TAB 2: MY INVESTMENTS */}
        {/* ──────────────────────────────────────────────────────────── */}
        {activeTab === 'my-investments' && (
          <div className="w-full">
            {/* Status Filter */}
            <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-none flex-nowrap">
              {(['all', 'active', 'matured', 'withdrawn'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setInvestFilter(f)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap flex-shrink-0 ${
                    investFilter === f
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {filteredInvestments.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center w-full shadow-card">
                <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3">
                  <DollarSign className="w-7 h-7 text-blue-500" />
                </div>
                <p className="text-base sm:text-lg font-bold text-slate-800">No active investments in this view</p>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
                  Browse the pool trading packages and apply to start earning compounded returns.
                </p>
                <button
                  onClick={() => setActiveTab('packages')}
                  className="mt-5 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-blue-700 transition-all shadow-md"
                >
                  Browse Pool Packages
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full">
                {filteredInvestments.map(inv => (
                  <InvestmentCard
                    key={inv.id}
                    inv={inv}
                    now={nowTime}
                    onWithdraw={setWithdrawInv}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────── */}
        {/* TAB 3: APPLICATION HISTORY */}
        {/* ──────────────────────────────────────────────────────────── */}
        {activeTab === 'history' && (
          <div className="w-full">
            {applications.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center w-full shadow-card">
                <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="font-bold text-slate-700 text-base">No application history yet</p>
                <p className="text-xs text-slate-400 mt-1">Submitted applications and their approval status will show here.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden w-full">
                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date Applied</th>
                        <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Package</th>
                        <th className="text-right px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                        <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Payment Method</th>
                        <th className="text-right px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {applications.map(app => (
                        <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-slate-600 text-xs whitespace-nowrap">
                            {new Date(app.created_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-900 text-xs whitespace-nowrap">
                            {app.package_name}
                          </td>
                          <td className="px-6 py-4 text-right font-black text-slate-900 tabular-nums whitespace-nowrap">
                            £{fmt(app.amount)}
                          </td>
                          <td className="px-6 py-4 text-slate-600 text-xs whitespace-nowrap">
                            {app.payment_method || 'Crypto'} {app.transaction_reference && `(${app.transaction_reference})`}
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <span className={`inline-flex text-xs font-bold border px-3 py-1 rounded-full capitalize ${statusColor[app.status] || ''}`}>
                              {app.status}
                            </span>
                            {app.rejection_reason && (
                              <p className="text-[11px] text-red-500 mt-1">Reason: {app.rejection_reason}</p>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile List View */}
                <div className="sm:hidden divide-y divide-slate-100">
                  {applications.map(app => (
                    <div key={app.id} className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900">{app.package_name}</span>
                        <span className={`inline-flex text-[11px] font-bold border px-2.5 py-0.5 rounded-full capitalize ${statusColor[app.status] || ''}`}>
                          {app.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{new Date(app.created_at).toLocaleDateString()}</span>
                        <span className="font-extrabold text-slate-900 text-sm">£{fmt(app.amount)}</span>
                      </div>
                      {app.transaction_reference && (
                        <p className="text-[11px] text-slate-400 font-mono">Ref: {app.transaction_reference}</p>
                      )}
                      {app.rejection_reason && (
                        <p className="text-[11px] text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
                          Rejection Reason: {app.rejection_reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── PACKAGE CONFIRM / APPLICATION MODAL ────────────────────── */}
      <Modal
        open={!!selectedPackage}
        onClose={() => setSelectedPackage(null)}
        title="Apply for Pool Trading Slot"
        maxW="max-w-lg"
      >
        {selectedPackage && (() => {
          const r = riskCfg[selectedPackage.risk_level] || riskCfg.medium;
          const fixedProfit = (selectedPackage.min_amount * selectedPackage.roi_percentage) / 100;
          const fixedPayout = selectedPackage.min_amount + fixedProfit;

          return (
            <div className="space-y-4">
              {/* Selected Plan Overview */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${r.bg} ${r.textColor} ${r.border}`}>
                    {r.label}
                  </span>
                  <span className="text-xs font-bold text-slate-600">
                    Duration: {selectedPackage.duration_value} {selectedPackage.duration_unit}
                  </span>
                </div>
                <p className="text-lg font-black text-slate-900">{selectedPackage.name}</p>
                <p className="text-xs text-slate-500 mt-1">{selectedPackage.description}</p>
              </div>

              {/* Financial Breakdown */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
                  <span>Required Deposit</span>
                  <span className="text-base font-black text-slate-900 tabular-nums">£{fmt(selectedPackage.min_amount)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
                  <span>Guaranteed Profit ({selectedPackage.roi_percentage}%)</span>
                  <span className="text-base font-black text-emerald-600 tabular-nums">+£{fmt(fixedProfit)}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <span className="text-xs font-bold text-slate-800">Total Payout at Maturity</span>
                  <span className="text-lg font-black text-blue-600 tabular-nums">£{fmt(fixedPayout)}</span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all"
                >
                  <option value="USDT_TRC20">USDT (TRC20 - Tron)</option>
                  <option value="USDT_ERC20">USDT (ERC20 - Ethereum)</option>
                  <option value="BTC">Bitcoin (BTC)</option>
                  <option value="MPESA">M-Pesa Express</option>
                  <option value="BANK">Bank Wire Transfer</option>
                </select>
              </div>

              {/* Transaction Ref / Receipt */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Transaction Reference / Receipt ID <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={e => setTransactionRef(e.target.value)}
                  placeholder="e.g. TxHash or M-Pesa Reference Code"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPackage(null)}
                  className="flex-1 py-3 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmApplication}
                  disabled={isSubmitting}
                  className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:bg-slate-300 transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    'Confirm & Apply Slot'
                  )}
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ── WITHDRAWAL MODAL ──────────────────────────────────────── */}
      <WithdrawModal
        inv={withdrawInv}
        open={!!withdrawInv}
        onClose={() => setWithdrawInv(null)}
        onSubmit={handleWithdrawSubmit}
        isSubmitting={isWithdrawing}
      />

      {/* ── VIP SYNDICATE REQUEST MODAL ────────────────────────────── */}
      <Modal
        open={showVipModal}
        onClose={() => setShowVipModal(false)}
        title="Institutional VIP Syndicate"
        maxW="max-w-lg"
      >
        <div className="space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-purple-900">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h3 className="font-extrabold text-base text-purple-900">Custom Institutional Allocation</h3>
            </div>
            <p className="text-xs text-purple-700 leading-relaxed">
              For high-net-worth accounts investing above £25,000. Benefit from bespoke liquidity allocation, 1-on-1 institutional desk support, and custom maturity cycles.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Investment Notes / Desired Allocation
            </label>
            <textarea
              rows={3}
              value={vipNotes}
              onChange={e => setVipNotes(e.target.value)}
              placeholder="Specify your capital size (e.g. £50,000) and custom syndicate timeline..."
              className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-900 bg-slate-50 focus:bg-white focus:border-purple-500 outline-none transition-all"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowVipModal(false)}
              className="flex-1 py-3 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
            >
              Close
            </button>
            <button
              onClick={handleVipSubmit}
              disabled={isSubmittingVip}
              className="flex-1 py-3 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              {isSubmittingVip ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Request VIP Allocation'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
