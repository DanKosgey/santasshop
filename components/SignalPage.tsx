import React, { useState, useEffect, useRef } from 'react';
import {
  RefreshCw, Target, AlertCircle, ArrowUp, ArrowDown,
  Clock, Info, Zap, Shield, Copy, Check, BarChart2,
  Sliders, ChevronRight, Layers, Sparkles
} from 'lucide-react';
import { User } from '../types';

// ── Strategy constants (mirrors XAUUSD LadderedBreakoutBasket EA) ────────────────
const SPACINGS = [0.5, 0.6, 0.7, 0.8, 0.9]; // % spacing from prevClose per rung
const TP_PCT = 1.0;                         // TP % from prevClose
const OPP_CANCEL_PCT = 0.6;                 // Delta % at which remaining opposite-side pendings are cancelled
const BREAKEVEN_TRIGGER_PCT = 0.9;          // Delta % that triggers breakeven move
const BREAKEVEN_SPACING_THRESH = 0.7;       // Only rungs with spacing < 0.7% get moved to breakeven

// ── Formatters ────────────────────────────────────────────────────────────────
const fmtPrice = (p: number) =>
  p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtPct = (price: number, base: number) => {
  if (!base) return '0.000%';
  const v = ((price - base) / base) * 100;
  return `${v >= 0 ? '+' : ''}${v.toFixed(3)}%`;
};

interface Rung {
  spacing: number;
  idx: number;
  buy: number;
  sell: number;
}

// ── Real-Time TradingView Embed Widget Component ──────────────────────────────
interface TradingViewWidgetProps {
  symbol: string;
  interval: string;
}

function TradingViewChartWidget({ symbol, interval }: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const containerId = `tv_chart_${Math.random().toString(36).substring(7)}`;

    containerRef.current.innerHTML = `<div id="${containerId}" style="height: 100%; width: 100%;"></div>`;

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.type = 'text/javascript';
    script.async = true;
    script.onload = () => {
      if (typeof (window as any).TradingView !== 'undefined') {
        new (window as any).TradingView.widget({
          autosize: true,
          symbol: symbol,
          interval: interval,
          timezone: 'Etc/UTC',
          theme: 'dark',
          style: '1',
          locale: 'en',
          toolbar_bg: '#0E0E10',
          enable_publishing: false,
          allow_symbol_change: true,
          save_image: false,
          container_id: containerId,
          hide_side_toolbar: false,
          studies: [
            'MASimple@tv-basicstudies',
            'RSI@tv-basicstudies'
          ],
        });
      }
    };

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol, interval]);

  return <div ref={containerRef} className="w-full h-full min-h-[380px] sm:min-h-[480px]" />;
}

interface SignalPageProps {
  currentUser?: User;
}

export function SignalPage({ currentUser }: SignalPageProps) {
  const [prevClose, setPrevClose] = useState<number | null>(null);
  const [dailyOpen, setDailyOpen] = useState<number | null>(null);
  const [prevCloseStr, setPrevCloseStr] = useState<string>('2900.00');
  const [dailyOpenStr, setDailyOpenStr] = useState<string>('2902.50');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Mobile View Tab Selection ('all' | 'ladder' | 'chart' | 'settings')
  const [activeMobileTab, setActiveMobileTab] = useState<'ladder' | 'chart' | 'settings' | 'all'>('ladder');

  // Chart settings
  const [selectedSymbol, setSelectedSymbol] = useState<string>('OANDA:XAUUSD');
  const [selectedInterval, setSelectedInterval] = useState<string>('D');

  // Initialize with default sensible values
  useEffect(() => {
    const pc = parseFloat(prevCloseStr);
    const dO = parseFloat(dailyOpenStr);
    if (!isNaN(pc)) setPrevClose(pc);
    if (!isNaN(dO)) setDailyOpen(dO);
    setLastUpdated(new Date());
  }, []);

  const handleApplyValues = () => {
    const pc = parseFloat(prevCloseStr);
    const dO = parseFloat(dailyOpenStr);
    if (!isNaN(pc) && pc > 0) setPrevClose(pc);
    if (!isNaN(dO) && dO > 0) setDailyOpen(dO);
    setLastUpdated(new Date());
  };

  const handleCopy = (key: string, val: number) => {
    navigator.clipboard.writeText(val.toFixed(2));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // ── Compute all strategy levels based on EA logic ──────────────────────────
  const levels = prevClose
    ? {
        tpBuy: prevClose * (1 + TP_PCT / 100),
        tpSell: prevClose * (1 - TP_PCT / 100),
        rungs: SPACINGS.map((s, i): Rung => ({
          spacing: s,
          idx: i,
          buy: prevClose * (1 + s / 100),
          sell: prevClose * (1 - s / 100),
        })),
        sl: dailyOpen,
        oppCancelBuyPrice: prevClose * (1 + OPP_CANCEL_PCT / 100),
        oppCancelSellPrice: prevClose * (1 - OPP_CANCEL_PCT / 100),
        beTriggerBuyPrice: prevClose * (1 + BREAKEVEN_TRIGGER_PCT / 100),
        beTriggerSellPrice: prevClose * (1 - BREAKEVEN_TRIGGER_PCT / 100),
      }
    : null;

  return (
    <div className="space-y-4 sm:space-y-6 pb-24 font-sans text-slate-100 max-w-7xl mx-auto px-1 sm:px-4">
      
      {/* ── Top Hero Card (Mobile-Optimized) ── */}
      <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-7 bg-[#0B0B0E] border border-[#D4A24C]/25 shadow-xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute -top-20 -right-20 w-52 h-52 sm:w-80 sm:h-80 bg-[#D4A24C]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#D4A24C]/15 border border-[#D4A24C]/30 text-[#D4A24C] text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2 sm:mb-2.5">
              <Zap className="w-3 h-3 text-[#D4A24C] animate-pulse" />
              <span>XAUUSD Live Signal Engine</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Laddered Breakout Strategy
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mt-1 leading-relaxed">
              Anchor: <span className="text-[#D4A24C] font-bold">${prevClose ? fmtPrice(prevClose) : '—'}</span> · TP Target: <span className="text-emerald-400 font-semibold">±1.0%</span> · SL Invalidation: <span className="text-orange-400 font-semibold">${dailyOpen ? fmtPrice(dailyOpen) : '—'}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1 md:pt-0">
            <button
              onClick={handleApplyValues}
              className="w-full sm:w-auto min-h-[42px] px-4 py-2.5 rounded-xl font-bold text-xs bg-[#D4A24C] text-[#0B0B0C] hover:bg-[#c3913d] active:scale-[0.98] transition flex items-center justify-center gap-2 shadow-lg shadow-[#D4A24C]/10"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Matrix</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile View Selector Tabs (Visible on small screens) ── */}
      <div className="md:hidden flex items-center justify-between p-1 bg-[#121217] rounded-xl border border-white/[0.08] text-xs font-bold">
        {[
          { id: 'ladder', label: '🪜 Ladder', icon: Layers },
          { id: 'chart', label: '📊 Chart', icon: BarChart2 },
          { id: 'settings', label: '⚙️ Inputs', icon: Sliders },
          { id: 'all', label: '👁️ All', icon: Sparkles },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveMobileTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 px-1.5 rounded-lg transition min-h-[38px] ${
              activeMobileTab === tab.id
                ? 'bg-[#D4A24C] text-[#0B0B0C] shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span className="truncate">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── TradingView Live Chart Embed Section ── */}
      <div className={`rounded-2xl sm:rounded-3xl border border-slate-800 bg-[#0E0E12] overflow-hidden shadow-xl ${
        activeMobileTab !== 'chart' && activeMobileTab !== 'all' ? 'hidden md:block' : 'block'
      }`}>
        <div className="p-3 sm:p-4 bg-[#141419] border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#D4A24C] animate-pulse" />
            <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
              {selectedSymbol} · {selectedInterval === 'D' ? 'Daily (D1)' : `${selectedInterval} Interval`}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            {/* Symbol Switcher */}
            <div className="flex items-center rounded-lg sm:rounded-xl bg-slate-900/90 border border-slate-800 p-0.5">
              {[
                { label: 'OANDA', val: 'OANDA:XAUUSD' },
                { label: 'FOREX.COM', val: 'FOREXCOM:XAUUSD' },
                { label: 'TVC GOLD', val: 'TVC:GOLD' },
              ].map((s) => (
                <button
                  key={s.val}
                  onClick={() => setSelectedSymbol(s.val)}
                  className={`px-2.5 py-1.5 text-[10px] sm:text-[11px] font-bold rounded-md sm:rounded-lg transition whitespace-nowrap ${
                    selectedSymbol === s.val
                      ? 'bg-[#D4A24C] text-[#0B0B0C]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Interval Switcher */}
            <div className="flex items-center rounded-lg sm:rounded-xl bg-slate-900/90 border border-slate-800 p-0.5">
              {[
                { label: 'D1', val: 'D' },
                { label: '4H', val: '240' },
                { label: '1H', val: '60' },
                { label: '15M', val: '15' },
              ].map((t) => (
                <button
                  key={t.val}
                  onClick={() => setSelectedInterval(t.val)}
                  className={`px-2.5 py-1.5 text-[10px] sm:text-[11px] font-bold rounded-md sm:rounded-lg transition ${
                    selectedInterval === t.val
                      ? 'bg-[#D4A24C] text-[#0B0B0C]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full h-[360px] sm:h-[480px] bg-[#0E0E12]">
          <TradingViewChartWidget symbol={selectedSymbol} interval={selectedInterval} />
        </div>
      </div>

      {/* ── Key Metrics Overview Cards (Mobile Responsive 2x2 Grid) ── */}
      <div className={`grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 ${
        activeMobileTab === 'chart' ? 'hidden md:grid' : 'grid'
      }`}>
        <div className="rounded-xl sm:rounded-2xl border border-emerald-500/25 bg-emerald-950/20 p-3 sm:p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-emerald-400 uppercase tracking-wider">Buy TP (+1.0%)</span>
            {levels && (
              <button
                onClick={() => handleCopy('tpBuy', levels.tpBuy)}
                className="p-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition"
                title="Copy Buy TP"
              >
                {copiedKey === 'tpBuy' ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
              </button>
            )}
          </div>
          <div className="text-lg sm:text-2xl font-black text-emerald-400 mt-1 tabular-nums">
            ${levels ? fmtPrice(levels.tpBuy) : '—'}
          </div>
          <span className="text-[10px] text-emerald-500/70 mt-1">+1.000% Target</span>
        </div>

        <div className="rounded-xl sm:rounded-2xl border border-emerald-500/25 bg-emerald-950/20 p-3 sm:p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-emerald-400 uppercase tracking-wider">Buy R1 (+0.5%)</span>
            {levels && (
              <button
                onClick={() => handleCopy('buyR1', levels.rungs[0].buy)}
                className="p-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition"
                title="Copy Buy Rung 1"
              >
                {copiedKey === 'buyR1' ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
              </button>
            )}
          </div>
          <div className="text-lg sm:text-2xl font-black text-emerald-400 mt-1 tabular-nums">
            ${levels ? fmtPrice(levels.rungs[0].buy) : '—'}
          </div>
          <span className="text-[10px] text-emerald-500/70 mt-1">First Breakout Stop</span>
        </div>

        <div className="rounded-xl sm:rounded-2xl border border-rose-500/25 bg-rose-950/20 p-3 sm:p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-rose-400 uppercase tracking-wider">Sell R1 (-0.5%)</span>
            {levels && (
              <button
                onClick={() => handleCopy('sellR1', levels.rungs[0].sell)}
                className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                title="Copy Sell Rung 1"
              >
                {copiedKey === 'sellR1' ? <Check className="w-3 h-3 text-rose-300" /> : <Copy className="w-3 h-3" />}
              </button>
            )}
          </div>
          <div className="text-lg sm:text-2xl font-black text-rose-400 mt-1 tabular-nums">
            ${levels ? fmtPrice(levels.rungs[0].sell) : '—'}
          </div>
          <span className="text-[10px] text-rose-500/70 mt-1">First Breakdown Stop</span>
        </div>

        <div className="rounded-xl sm:rounded-2xl border border-rose-500/25 bg-rose-950/20 p-3 sm:p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-rose-400 uppercase tracking-wider">Sell TP (-1.0%)</span>
            {levels && (
              <button
                onClick={() => handleCopy('tpSell', levels.tpSell)}
                className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                title="Copy Sell TP"
              >
                {copiedKey === 'tpSell' ? <Check className="w-3 h-3 text-rose-300" /> : <Copy className="w-3 h-3" />}
              </button>
            )}
          </div>
          <div className="text-lg sm:text-2xl font-black text-rose-400 mt-1 tabular-nums">
            ${levels ? fmtPrice(levels.tpSell) : '—'}
          </div>
          <span className="text-[10px] text-rose-500/70 mt-1">-1.000% Target</span>
        </div>

        {/* Shared Stop Loss Card */}
        <div className="col-span-2 sm:col-span-2 lg:col-span-4 rounded-xl sm:rounded-2xl border border-orange-500/30 bg-orange-950/20 p-3 sm:p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 flex-shrink-0">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="text-[11px] sm:text-xs font-bold text-orange-400 uppercase tracking-wider">
                Shared Stop Loss (Today's Open)
              </div>
              <p className="text-[11px] text-slate-300 hidden sm:block">
                Invalidation level across all buy &amp; sell positions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-lg sm:text-2xl font-black text-orange-400 tabular-nums">
                ${levels && levels.sl ? fmtPrice(levels.sl) : '—'}
              </div>
              <span className="text-[10px] text-orange-400/70">
                {levels && prevClose && levels.sl ? fmtPct(levels.sl, prevClose) : '0.00%'}
              </span>
            </div>
            {levels && levels.sl && (
              <button
                onClick={() => handleCopy('sl', levels.sl!)}
                className="p-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 transition"
                title="Copy Stop Loss"
              >
                {copiedKey === 'sl' ? <Check className="w-3.5 h-3.5 text-orange-300" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Inputs & Ladder Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Input Card */}
        <div className={`lg:col-span-1 rounded-2xl sm:rounded-3xl border border-slate-800 bg-[#121217] p-4 sm:p-6 shadow-xl space-y-4 ${
          activeMobileTab !== 'settings' && activeMobileTab !== 'all' ? 'hidden lg:block' : 'block'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#D4A24C]" />
              Anchor Parameters
            </h3>
            {lastUpdated && (
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-[#D4A24C] uppercase tracking-wider mb-1">
                Prev Day Close (Anchor $)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={prevCloseStr}
                  onChange={(e) => setPrevCloseStr(e.target.value)}
                  placeholder="2900.00"
                  className="w-full min-h-[44px] bg-[#181820] border border-slate-700 rounded-xl pl-8 pr-4 py-2.5 text-white text-sm font-bold focus:outline-none focus:border-[#D4A24C] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-orange-400 uppercase tracking-wider mb-1">
                Today's Open (Stop Loss $)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={dailyOpenStr}
                  onChange={(e) => setDailyOpenStr(e.target.value)}
                  placeholder="2902.50"
                  className="w-full min-h-[44px] bg-[#181820] border border-slate-700 rounded-xl pl-8 pr-4 py-2.5 text-white text-sm font-bold focus:outline-none focus:border-orange-400 transition"
                />
              </div>
            </div>

            <button
              onClick={handleApplyValues}
              className="w-full min-h-[44px] py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-[#0B0B0C] bg-[#D4A24C] hover:bg-[#c3913d] active:scale-[0.98] transition shadow-lg flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Apply &amp; Recalculate
            </button>
          </div>

          {/* Quick Strategy Cheat Sheet */}
          <div className="p-3.5 rounded-xl bg-[#181820] border border-slate-800 text-xs space-y-2 text-slate-300">
            <div className="font-bold text-[#D4A24C] flex items-center gap-1.5 text-[11px]">
              <Info className="w-3.5 h-3.5 flex-shrink-0" /> Strategy Execution Rules
            </div>
            <ul className="space-y-1.5 text-[11px] text-slate-400 list-disc pl-4">
              <li><strong>Rungs:</strong> ±0.5%, 0.6%, 0.7%, 0.8%, 0.9%</li>
              <li><strong>Take Profit:</strong> Fixed ±1.0% net delta from close</li>
              <li><strong>Opposite Cancel:</strong> At ±0.6%, opposite pendings delete</li>
              <li><strong>BE Sweep:</strong> At ±0.9%, rungs &lt; 0.7% move SL to entry</li>
            </ul>
          </div>
        </div>

        {/* ── Complete Strategy Price Ladder Matrix ── */}
        <div className={`lg:col-span-2 rounded-2xl sm:rounded-3xl border border-slate-800 bg-[#121217] overflow-hidden shadow-xl ${
          activeMobileTab !== 'ladder' && activeMobileTab !== 'all' ? 'hidden lg:block' : 'block'
        }`}>
          <div className="p-3.5 sm:p-5 bg-[#17171E] border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-white">
                XAUUSD Strategy Price Ladder
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Baseline Close: <strong className="text-[#D4A24C]">${prevClose ? fmtPrice(prevClose) : '—'}</strong>
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-bold">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Buy Ladder
              </span>
              <span className="flex items-center gap-1 text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-400" /> Sell Ladder
              </span>
            </div>
          </div>

          {levels && prevClose ? (
            <div className="p-3 sm:p-5 space-y-2 bg-[#0D0D12]">
              {/* Take Profit Buy */}
              <div className="flex items-center justify-between p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-emerald-950/30 border border-emerald-500/40">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-extrabold text-emerald-400 flex items-center gap-1.5 flex-wrap">
                      <span>BUY TAKE PROFIT</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">
                        +1.0% TP
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">Target exit for all buy stops</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 pl-2">
                  <div className="text-right">
                    <div className="text-sm sm:text-base font-black text-emerald-400 tabular-nums">
                      ${fmtPrice(levels.tpBuy)}
                    </div>
                    <div className="text-[10px] text-emerald-500/70">+1.000%</div>
                  </div>
                  <button
                    onClick={() => handleCopy('tpBuyRow', levels.tpBuy)}
                    className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition"
                  >
                    {copiedKey === 'tpBuyRow' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Buy Rungs (R5 down to R1) */}
              {[...levels.rungs].reverse().map((rung) => (
                <div
                  key={`buy-rung-${rung.idx}`}
                  className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition ${
                    rung.idx === 0
                      ? 'bg-emerald-950/20 border-emerald-500/30'
                      : 'bg-[#15151C] border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <ArrowUp className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
                        <span>Buy Stop R{rung.idx + 1}</span>
                        {rung.idx === 0 && (
                          <span className="px-1 py-0.2 rounded text-[8.5px] font-extrabold bg-[#D4A24C]/20 border border-[#D4A24C]/30 text-[#D4A24C]">
                            FIRST ENTRY
                          </span>
                        )}
                        {rung.spacing === OPP_CANCEL_PCT && (
                          <span className="px-1 py-0.2 rounded text-[8.5px] font-bold bg-blue-500/20 border border-blue-500/30 text-blue-300">
                            OPP CANCEL
                          </span>
                        )}
                        {rung.spacing === BREAKEVEN_TRIGGER_PCT && (
                          <span className="px-1 py-0.2 rounded text-[8.5px] font-bold bg-purple-500/20 border border-purple-500/30 text-purple-300">
                            BE TRIGGER
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">+{rung.spacing}% spacing</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 pl-2">
                    <div className="text-right">
                      <div className="text-xs sm:text-sm font-black text-emerald-400 tabular-nums">
                        ${fmtPrice(rung.buy)}
                      </div>
                      <div className="text-[10px] text-slate-400">+{rung.spacing.toFixed(2)}%</div>
                    </div>
                    <button
                      onClick={() => handleCopy(`buyRung_${rung.idx}`, rung.buy)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    >
                      {copiedKey === `buyRung_${rung.idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ))}

              {/* ── Anchor Level ── */}
              <div className="my-2 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#D4A24C]/10 border-2 border-[#D4A24C]/40 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[#D4A24C] text-[#0B0B0C] flex items-center justify-center font-black text-sm flex-shrink-0">
                    ⚓
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-black text-[#D4A24C] uppercase tracking-wide">
                      Prev Day Close (Anchor)
                    </div>
                    <div className="text-[10px] text-slate-300">Strategy Baseline</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base sm:text-xl font-black text-[#D4A24C] tabular-nums">
                    ${fmtPrice(prevClose)}
                  </div>
                  <div className="text-[10px] text-slate-400">0.000% Anchor</div>
                </div>
              </div>

              {/* Sell Rungs (R1 down to R5) */}
              {levels.rungs.map((rung) => (
                <div
                  key={`sell-rung-${rung.idx}`}
                  className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition ${
                    rung.idx === 0
                      ? 'bg-rose-950/20 border-rose-500/30'
                      : 'bg-[#15151C] border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <ArrowDown className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
                        <span>Sell Stop R{rung.idx + 1}</span>
                        {rung.idx === 0 && (
                          <span className="px-1 py-0.2 rounded text-[8.5px] font-extrabold bg-[#D4A24C]/20 border border-[#D4A24C]/30 text-[#D4A24C]">
                            FIRST ENTRY
                          </span>
                        )}
                        {rung.spacing === OPP_CANCEL_PCT && (
                          <span className="px-1 py-0.2 rounded text-[8.5px] font-bold bg-blue-500/20 border border-blue-500/30 text-blue-300">
                            OPP CANCEL
                          </span>
                        )}
                        {rung.spacing === BREAKEVEN_TRIGGER_PCT && (
                          <span className="px-1 py-0.2 rounded text-[8.5px] font-bold bg-purple-500/20 border border-purple-500/30 text-purple-300">
                            BE TRIGGER
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">-{rung.spacing}% spacing</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 pl-2">
                    <div className="text-right">
                      <div className="text-xs sm:text-sm font-black text-rose-400 tabular-nums">
                        ${fmtPrice(rung.sell)}
                      </div>
                      <div className="text-[10px] text-slate-400">-{rung.spacing.toFixed(2)}%</div>
                    </div>
                    <button
                      onClick={() => handleCopy(`sellRung_${rung.idx}`, rung.sell)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    >
                      {copiedKey === `sellRung_${rung.idx}` ? <Check className="w-3.5 h-3.5 text-rose-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ))}

              {/* Take Profit Sell */}
              <div className="flex items-center justify-between p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-rose-950/30 border border-rose-500/40">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-extrabold text-rose-400 flex items-center gap-1.5 flex-wrap">
                      <span>SELL TAKE PROFIT</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-500/20 border border-rose-500/30 text-rose-300">
                        -1.0% TP
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">Target exit for all sell stops</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 pl-2">
                  <div className="text-right">
                    <div className="text-sm sm:text-base font-black text-rose-400 tabular-nums">
                      ${fmtPrice(levels.tpSell)}
                    </div>
                    <div className="text-[10px] text-rose-500/70">-1.000%</div>
                  </div>
                  <button
                    onClick={() => handleCopy('tpSellRow', levels.tpSell)}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                  >
                    {copiedKey === 'tpSellRow' ? <Check className="w-3.5 h-3.5 text-rose-300" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs">
              Enter price anchors above to calculate the ladder.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SignalPage;
