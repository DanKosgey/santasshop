import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw, Target, AlertCircle, ArrowUp, ArrowDown,
  Clock, Info, TrendingUp, TrendingDown, Zap, Shield, HelpCircle
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

// ── TradingView D1 & Intraday Widget URLs for XAUUSD ───────────────────────────
const TV_D1_URL =
  'https://www.tradingview-widget.com/embed-widget/advanced-chart/?locale=en#%7B%22symbol%22%3A%22OANDA%3AXAUUSD%22%2C%22interval%22%3A%22D%22%2C%22timezone%22%3A%22Etc%2FUTC%22%2C%22theme%22%3A%22dark%22%2C%22style%22%3A%221%22%2C%22withdateranges%22%3Atrue%2C%22hide_side_toolbar%22%3Afalse%2C%22allow_symbol_change%22%3Afalse%2C%22save_image%22%3Afalse%2C%22details%22%3Atrue%2C%22hotlist%22%3Afalse%2C%22calendar%22%3Afalse%22%7D';

interface SignalPageProps {
  currentUser?: User;
}

export function SignalPage({ currentUser }: SignalPageProps) {
  const [prevClose, setPrevClose] = useState<number | null>(null);
  const [dailyOpen, setDailyOpen] = useState<number | null>(null);
  const [prevCloseStr, setPrevCloseStr] = useState<string>('2900.00');
  const [dailyOpenStr, setDailyOpenStr] = useState<string>('2902.50');
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchNotice, setFetchNotice] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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
    if (!isNaN(pc) && pc > 0) {
      setPrevClose(pc);
    }
    if (!isNaN(dO) && dO > 0) {
      setDailyOpen(dO);
    }
    setLastUpdated(new Date());
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
    <div className="space-y-6 pb-12 font-sans text-slate-100">
      {/* ── Top Hero Banner ── */}
      <div className="rounded-3xl p-6 sm:p-8 bg-[#0B0B0C] border border-[#D4A24C]/30 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#D4A24C]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4A24C]/15 border border-[#D4A24C]/30 text-[#D4A24C] text-xs font-bold uppercase tracking-wider mb-3">
              <Zap className="w-3.5 h-3.5" />
              XAUUSD Institutional Signal Engine
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Laddered Breakout Basket Signals
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl mt-1.5 leading-relaxed">
              Derived mathematically from previous day close anchor. Symmetric stop ladder (+/-0.5% to +/-0.9%) targeting <span className="text-[#D4A24C] font-semibold">1.0% Net TP</span> with daily open shared invalidation SL.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleApplyValues}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-[#D4A24C] text-[#0B0B0C] hover:bg-[#c3913d] transition shadow-md"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Recalculate Levels
            </button>
          </div>
        </div>
      </div>

      {/* ── TradingView Live Chart Embed ── */}
      <div className="rounded-3xl border border-slate-800 bg-[#0E0E10] overflow-hidden shadow-xl">
        <div className="p-4 bg-[#141417] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#D4A24C] animate-pulse" />
            <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
              XAUUSD (GOLD / USD) · D1 Live Price Chart
            </span>
          </div>
          <span className="text-[11px] font-medium text-slate-400">
            Check Previous Day Close &amp; Today's Open below
          </span>
        </div>
        <div className="w-full h-[480px] bg-[#0E0E10]">
          <iframe
            src={TV_D1_URL}
            title="XAUUSD TradingView Chart"
            className="w-full h-full border-0"
            allowFullScreen
          />
        </div>
      </div>

      {/* ── Interactive Input Form & Strategy Anchors ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 rounded-3xl border border-slate-800 bg-[#121215] p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#D4A24C]" />
              Strategy Anchor Inputs
            </h3>
            {lastUpdated && (
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#D4A24C] uppercase tracking-wider mb-1.5">
                Previous Day Close (Anchor)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={prevCloseStr}
                  onChange={(e) => setPrevCloseStr(e.target.value)}
                  placeholder="e.g. 2900.00"
                  className="w-full bg-[#18181D] border border-slate-700 rounded-xl pl-8 pr-4 py-2.5 text-white text-sm font-bold focus:outline-none focus:border-[#D4A24C] transition"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Used to anchor all rung spacings (+/-0.5% to +/-0.9%) &amp; Take Profit (+/-1.0%).
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-orange-400 uppercase tracking-wider mb-1.5">
                Today's Daily Open (Stop Loss)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={dailyOpenStr}
                  onChange={(e) => setDailyOpenStr(e.target.value)}
                  placeholder="e.g. 2902.50"
                  className="w-full bg-[#18181D] border border-slate-700 rounded-xl pl-8 pr-4 py-2.5 text-white text-sm font-bold focus:outline-none focus:border-orange-400 transition"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Shared invalidation level for both Buy &amp; Sell ladders.
              </p>
            </div>

            <button
              onClick={handleApplyValues}
              className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-[#0B0B0C] bg-[#D4A24C] hover:bg-[#c3913d] transition shadow-lg flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Apply &amp; Generate Signal Matrix
            </button>
          </div>

          {/* Quick Guide Card */}
          <div className="p-4 rounded-2xl bg-[#18181D] border border-slate-800 text-xs space-y-2 text-slate-300">
            <div className="font-bold text-[#D4A24C] flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" /> Strategy Rules Summary
            </div>
            <ul className="space-y-1.5 text-[11px] text-slate-400 list-disc pl-4">
              <li><strong className="text-slate-200">First Rung:</strong> Triggers at +/-0.5% net change from prev close.</li>
              <li><strong className="text-slate-200">Take Profit:</strong> Fixed at +/-1.0% net change ($ target).</li>
              <li><strong className="text-slate-200">Opposite-Side Cancel:</strong> When price hits +/-0.6%, opposite pending stops cancel.</li>
              <li><strong className="text-slate-200">Breakeven Sweep:</strong> At +/-0.9%, rungs below 0.7% move SL to entry price.</li>
            </ul>
          </div>
        </div>

        {/* ── Key Metrics Overview Cards ── */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Buy TP (+1.0%)</span>
              <div className="text-xl font-black text-emerald-400 mt-1">
                ${levels ? fmtPrice(levels.tpBuy) : '—'}
              </div>
            </div>
            <span className="text-[10px] text-emerald-500/70 mt-2">+1.000% Target</span>
          </div>

          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Buy Rung 1 (+0.5%)</span>
              <div className="text-xl font-black text-emerald-400 mt-1">
                ${levels ? fmtPrice(levels.rungs[0].buy) : '—'}
              </div>
            </div>
            <span className="text-[10px] text-emerald-500/70 mt-2">First Breakout Entry</span>
          </div>

          <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-4 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Sell Rung 1 (-0.5%)</span>
              <div className="text-xl font-black text-rose-400 mt-1">
                ${levels ? fmtPrice(levels.rungs[0].sell) : '—'}
              </div>
            </div>
            <span className="text-[10px] text-rose-500/70 mt-2">First Breakdown Entry</span>
          </div>

          <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-4 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Sell TP (-1.0%)</span>
              <div className="text-xl font-black text-rose-400 mt-1">
                ${levels ? fmtPrice(levels.tpSell) : '—'}
              </div>
            </div>
            <span className="text-[10px] text-rose-500/70 mt-2">-1.000% Target</span>
          </div>

          {/* Shared Stop Loss Card */}
          <div className="col-span-2 sm:col-span-2 md:col-span-4 rounded-2xl border border-orange-500/30 bg-orange-950/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-orange-400 uppercase tracking-wider">
                  Shared Stop Loss (Daily Open)
                </div>
                <p className="text-xs text-slate-300">
                  Applies to all active stop orders &amp; positions on both sides.
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-orange-400">
                ${levels && levels.sl ? fmtPrice(levels.sl) : '—'}
              </div>
              <span className="text-[10px] text-orange-400/70">
                {levels && prevClose && levels.sl ? fmtPct(levels.sl, prevClose) : '0.00%'} from Anchor
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Complete Strategy Price Ladder Matrix ── */}
      {levels && prevClose && (
        <div className="rounded-3xl border border-slate-800 bg-[#121215] overflow-hidden shadow-2xl">
          <div className="p-5 bg-[#17171C] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-white">
                XAUUSD Daily Ladder Matrix
              </h2>
              <p className="text-xs text-slate-400">
                Calculated from Previous Close: <strong className="text-[#D4A24C]">${fmtPrice(prevClose)}</strong>
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Buy Stop Ladder
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                Sell Stop Ladder
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-2.5 bg-[#0D0D10]">
            {/* Take Profit Buy */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/40">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-emerald-400 flex items-center gap-2">
                    BUY TAKE PROFIT (+1.0%)
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">
                      TP TARGET
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">Target exit for all buy rungs</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-black text-emerald-400">${fmtPrice(levels.tpBuy)}</div>
                <div className="text-xs text-emerald-500/70">+1.000%</div>
              </div>
            </div>

            {/* Buy Rungs (from Rung 5 down to Rung 1) */}
            {[...levels.rungs].reverse().map((rung) => (
              <div
                key={`buy-rung-${rung.idx}`}
                className={`flex items-center justify-between p-3 rounded-xl border transition ${
                  rung.idx === 0
                    ? 'bg-emerald-900/20 border-emerald-500/30'
                    : 'bg-[#15151A] border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ArrowUp className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      Buy Stop · Rung {rung.idx + 1} (+{rung.spacing}%)
                      {rung.idx === 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-[#D4A24C]/20 border border-[#D4A24C]/30 text-[#D4A24C]">
                          FIRST TRIGGER
                        </span>
                      )}
                      {rung.spacing === OPP_CANCEL_PCT && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 border border-blue-500/30 text-blue-300">
                          OPPOSITE CANCEL TRIGGER
                        </span>
                      )}
                      {rung.spacing === BREAKEVEN_TRIGGER_PCT && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/20 border border-purple-500/30 text-purple-300">
                          BREAKEVEN SWEEP TRIGGER
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Rung {rung.idx + 1} Pending Order Level
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-emerald-400">${fmtPrice(rung.buy)}</div>
                  <div className="text-[11px] text-slate-400">+{rung.spacing.toFixed(2)}%</div>
                </div>
              </div>
            ))}

            {/* ── Anchor Level ── */}
            <div className="my-3 p-4 rounded-2xl bg-[#D4A24C]/10 border-2 border-[#D4A24C]/40 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D4A24C] text-[#0B0B0C] flex items-center justify-center font-black text-base shadow">
                  ⚓
                </div>
                <div>
                  <div className="text-sm font-black text-[#D4A24C] uppercase tracking-wide">
                    Previous Day Close (Anchor Baseline)
                  </div>
                  <div className="text-xs text-slate-300">
                    All ladder delta percentages are measured from this closing price
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-[#D4A24C]">${fmtPrice(prevClose)}</div>
                <div className="text-xs text-slate-400">0.000% Anchor</div>
              </div>
            </div>

            {/* Sell Rungs (from Rung 1 down to Rung 5) */}
            {levels.rungs.map((rung) => (
              <div
                key={`sell-rung-${rung.idx}`}
                className={`flex items-center justify-between p-3 rounded-xl border transition ${
                  rung.idx === 0
                    ? 'bg-rose-900/20 border-rose-500/30'
                    : 'bg-[#15151A] border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ArrowDown className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      Sell Stop · Rung {rung.idx + 1} (-{rung.spacing}%)
                      {rung.idx === 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-[#D4A24C]/20 border border-[#D4A24C]/30 text-[#D4A24C]">
                          FIRST TRIGGER
                        </span>
                      )}
                      {rung.spacing === OPP_CANCEL_PCT && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 border border-blue-500/30 text-blue-300">
                          OPPOSITE CANCEL TRIGGER
                        </span>
                      )}
                      {rung.spacing === BREAKEVEN_TRIGGER_PCT && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/20 border border-purple-500/30 text-purple-300">
                          BREAKEVEN SWEEP TRIGGER
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Rung {rung.idx + 1} Pending Order Level
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-rose-400">${fmtPrice(rung.sell)}</div>
                  <div className="text-[11px] text-slate-400">-{rung.spacing.toFixed(2)}%</div>
                </div>
              </div>
            ))}

            {/* Take Profit Sell */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-950/30 border border-rose-500/40">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-rose-400 flex items-center gap-2">
                    SELL TAKE PROFIT (-1.0%)
                    <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 border border-rose-500/30 text-rose-300">
                      TP TARGET
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">Target exit for all sell rungs</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-black text-rose-400">${fmtPrice(levels.tpSell)}</div>
                <div className="text-xs text-rose-500/70">-1.000%</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SignalPage;
