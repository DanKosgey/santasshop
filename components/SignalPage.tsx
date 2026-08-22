import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  RefreshCw, Target, AlertCircle, ArrowUp, ArrowDown,
  Clock, Info, Zap, Shield, Copy, Check, BarChart2,
  Sliders, Sparkles, Layers, Plus, X, TrendingUp,
  TrendingDown, CheckCircle2, Loader2
} from 'lucide-react';
import { User } from '../types';
import { supabase } from '../supabase/client';

// ── Strategy constants (mirrors XAUUSD LadderedBreakoutBasket EA) ────────────
const SPACINGS = [0.5, 0.6, 0.7, 0.8, 0.9];
const TP_PCT = 1.0;
const OPP_CANCEL_PCT = 0.6;
const BREAKEVEN_TRIGGER_PCT = 0.9;

// ── Formatters ────────────────────────────────────────────────────────────────
const fmtPrice = (p: number) =>
  p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtPct = (price: number, base: number) => {
  if (!base) return '0.000%';
  const v = ((price - base) / base) * 100;
  return `${v >= 0 ? '+' : ''}${v.toFixed(3)}%`;
};

interface Rung { spacing: number; idx: number; buy: number; sell: number }

// ── TradingView Widget Component ──────────────────────────────────────────────
function TradingViewChartWidget({ symbol, interval }: { symbol: string; interval: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const id = `tv_${Math.random().toString(36).substring(7)}`;
    containerRef.current.innerHTML = `<div id="${id}" style="height:100%;width:100%"></div>`;

    const s = document.createElement('script');
    s.src = 'https://s3.tradingview.com/tv.js';
    s.async = true;
    s.onload = () => {
      if ((window as any).TradingView) {
        new (window as any).TradingView.widget({
          autosize: true, symbol, interval, timezone: 'Etc/UTC',
          theme: 'dark', style: '1', locale: 'en',
          toolbar_bg: '#0E0E10', enable_publishing: false,
          allow_symbol_change: true, save_image: false, container_id: id,
          hide_side_toolbar: false,
          studies: ['MASimple@tv-basicstudies', 'RSI@tv-basicstudies'],
        });
      }
    };
    containerRef.current.appendChild(s);
    return () => { if (containerRef.current) containerRef.current.innerHTML = ''; };
  }, [symbol, interval]);

  return <div ref={containerRef} className="w-full h-full min-h-[360px] sm:min-h-[480px]" />;
}

// ── Log Trade Modal ───────────────────────────────────────────────────────────
interface LogTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  sessionId: string | null;
  sessionDate: string;
  userId: string;
  levels: ReturnType<typeof computeLevels>;
  prevClose: number | null;
}

function LogTradeModal({ isOpen, onClose, onSaved, sessionId, sessionDate, userId, levels, prevClose }: LogTradeModalProps) {
  const [direction, setDirection] = useState<'buy' | 'sell'>('buy');
  const [rungNumber, setRungNumber] = useState<number>(1);
  const [entryPrice, setEntryPrice] = useState('');
  const [lotSize, setLotSize] = useState('0.01');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-fill entry price from rung selection
  useEffect(() => {
    if (!levels) return;
    const rung = levels.rungs[rungNumber - 1];
    if (!rung) return;
    setEntryPrice((direction === 'buy' ? rung.buy : rung.sell).toFixed(2));
  }, [direction, rungNumber, levels]);

  if (!isOpen) return null;

  const tp = levels ? (direction === 'buy' ? levels.tpBuy : levels.tpSell).toFixed(2) : '';
  const sl = levels?.sl ? levels.sl.toFixed(2) : '';
  const entryNum = parseFloat(entryPrice);

  const handleSave = async () => {
    if (!entryPrice || isNaN(entryNum) || entryNum <= 0) { setError('Enter a valid entry price.'); return; }
    const lot = parseFloat(lotSize);
    if (isNaN(lot) || lot <= 0) { setError('Enter a valid lot size.'); return; }

    setSaving(true); setError(null);
    try {
      const { error: dbError } = await supabase.from('signal_trades').insert({
        session_id:       sessionId,
        user_id:          userId,
        symbol:           'XAUUSD',
        trade_direction:  direction,
        rung_number:      rungNumber,
        entry_price:      entryNum,
        take_profit:      parseFloat(tp) || null,
        stop_loss:        parseFloat(sl) || null,
        lot_size:         lot,
        notes:            notes.trim() || null,
        session_date:     sessionDate,
        trade_result:     'open',
      });
      if (dbError) throw dbError;
      setSaved(true);
      setTimeout(() => { setSaved(false); onSaved(); onClose(); }, 1200);
    } catch (e: any) {
      setError(e.message || 'Failed to save trade.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal panel */}
      <div className="relative z-10 w-full sm:max-w-lg bg-[#131318] border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#17171E]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#D4A24C] flex items-center justify-center">
              <Plus className="w-4 h-4 text-[#0B0B0C]" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-white">Log Signal Trade</div>
              <div className="text-[11px] text-slate-400">{sessionDate} · XAUUSD</div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition">
            <X className="w-4 h-4 text-slate-300" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">

          {/* Direction selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Direction</label>
            <div className="grid grid-cols-2 gap-2">
              {(['buy', 'sell'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDirection(d)}
                  className={`min-h-[44px] rounded-xl font-bold text-sm flex items-center justify-center gap-2 border transition ${
                    direction === d
                      ? d === 'buy'
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                        : 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {d === 'buy' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {d.toUpperCase()} STOP
                </button>
              ))}
            </div>
          </div>

          {/* Rung selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Rung / Entry Level</label>
            <div className="flex gap-1.5">
              {SPACINGS.map((sp, i) => (
                <button
                  key={i}
                  onClick={() => setRungNumber(i + 1)}
                  className={`flex-1 min-h-[44px] rounded-xl font-bold text-xs border transition flex flex-col items-center justify-center gap-0.5 ${
                    rungNumber === i + 1
                      ? 'bg-[#D4A24C] border-[#D4A24C] text-[#0B0B0C]'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>R{i + 1}</span>
                  <span className="text-[9px] opacity-70">±{sp}%</span>
                </button>
              ))}
            </div>
          </div>

          {/* Price fields */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Entry $</label>
              <input
                type="number" step="0.01" value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                className="w-full min-h-[44px] bg-[#1C1C24] border border-slate-700 rounded-xl px-3 text-white text-sm font-bold focus:outline-none focus:border-[#D4A24C] transition"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-emerald-400/70 uppercase tracking-wider mb-1">TP $</label>
              <input
                type="text" readOnly value={tp}
                className="w-full min-h-[44px] bg-emerald-950/20 border border-emerald-500/20 rounded-xl px-3 text-emerald-400 text-sm font-bold cursor-default"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-orange-400/70 uppercase tracking-wider mb-1">SL $</label>
              <input
                type="text" readOnly value={sl}
                className="w-full min-h-[44px] bg-orange-950/20 border border-orange-500/20 rounded-xl px-3 text-orange-400 text-sm font-bold cursor-default"
              />
            </div>
          </div>

          {/* Lot size */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Lot Size</label>
            <div className="flex gap-2">
              {['0.01', '0.05', '0.10', '0.50', '1.00'].map((v) => (
                <button
                  key={v}
                  onClick={() => setLotSize(v)}
                  className={`flex-1 min-h-[40px] rounded-xl text-xs font-bold border transition ${
                    lotSize === v
                      ? 'bg-[#D4A24C] border-[#D4A24C] text-[#0B0B0C]'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {v}
                </button>
              ))}
              <input
                type="number" step="0.01" value={lotSize}
                onChange={(e) => setLotSize(e.target.value)}
                className="w-20 min-h-[40px] bg-[#1C1C24] border border-slate-700 rounded-xl px-2 text-white text-xs font-bold focus:outline-none focus:border-[#D4A24C] transition"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Notes (optional)</label>
            <textarea
              rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. News event at 14:00, gap fill setup…"
              className="w-full bg-[#1C1C24] border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4A24C] transition resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/25">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span className="text-red-300 text-xs">{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className={`w-full min-h-[48px] rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg ${
              saved
                ? 'bg-emerald-500 text-white'
                : 'bg-[#D4A24C] text-[#0B0B0C] hover:bg-[#c3913d] active:scale-[0.98]'
            } disabled:opacity-70`}
          >
            {saved ? (
              <><CheckCircle2 className="w-4 h-4" /> Trade Logged!</>
            ) : saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
            ) : (
              <><Plus className="w-4 h-4" /> Log This Trade</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Compute levels helper ─────────────────────────────────────────────────────
function computeLevels(prevClose: number | null, dailyOpen: number | null) {
  if (!prevClose) return null;
  return {
    tpBuy:  prevClose * (1 + TP_PCT / 100),
    tpSell: prevClose * (1 - TP_PCT / 100),
    rungs:  SPACINGS.map((s, i): Rung => ({
      spacing: s, idx: i,
      buy:  prevClose * (1 + s / 100),
      sell: prevClose * (1 - s / 100),
    })),
    sl: dailyOpen,
  };
}

// ── Main page ─────────────────────────────────────────────────────────────────
interface SignalPageProps {
  currentUser?: User;
}

export function SignalPage({ currentUser }: SignalPageProps) {
  const [prevClose, setPrevClose]       = useState<number | null>(null);
  const [dailyOpen, setDailyOpen]       = useState<number | null>(null);
  const [prevCloseStr, setPrevCloseStr] = useState('');
  const [dailyOpenStr, setDailyOpenStr] = useState('');
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError]     = useState<string | null>(null);
  const [lastUpdated, setLastUpdated]   = useState<Date | null>(null);
  const [dataSource, setDataSource]     = useState<string>('');
  const [copiedKey, setCopiedKey]       = useState<string | null>(null);
  const [activeMobileTab, setActiveMobileTab] = useState<'ladder' | 'chart' | 'settings' | 'all'>('ladder');
  const [selectedSymbol, setSelectedSymbol]   = useState('OANDA:XAUUSD');
  const [selectedInterval, setSelectedInterval] = useState('D');
  const [sessionId, setSessionId]       = useState<string | null>(null);
  const [showLogTrade, setShowLogTrade] = useState(false);
  const [tradeCount, setTradeCount]     = useState(0);

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // ── 1. Auto-fetch XAUUSD prev close & open ──────────────────────────────────
  const fetchPrices = useCallback(async () => {
    setFetchLoading(true);
    setFetchError(null);

    let pClose: number | null = null;
    let dOpen: number | null = null;
    let sourceName = '';

    // Method A: Binance PAXG/USDT (Tokenized Physical Gold, exact 1:1 USD price, open CORS)
    try {
      const res = await fetch(
        'https://api.binance.com/api/v3/klines?symbol=PAXGUSDT&interval=1d&limit=5',
        { signal: AbortSignal.timeout(6000) }
      );
      if (res.ok) {
        const klines = await res.json();
        if (Array.isArray(klines) && klines.length >= 2) {
          const prevDay = klines[klines.length - 2];
          const currDay = klines[klines.length - 1];
          pClose = parseFloat(prevDay[4]); // close price of previous day
          dOpen  = parseFloat(currDay[1]); // open price of today
          sourceName = 'Live Market (XAU/USD)';
        }
      }
    } catch {
      // Fall through to other sources
    }

    // Method B: Yahoo Finance (GC=F Gold Futures) via CORS proxies
    if (!pClose || !dOpen) {
      const yahooProxies = [
        `https://corsproxy.io/?url=${encodeURIComponent('https://query1.finance.yahoo.com/v8/finance/chart/GC%3DF?interval=1d&range=5d')}`,
        `https://api.allorigins.win/get?url=${encodeURIComponent('https://query1.finance.yahoo.com/v8/finance/chart/GC%3DF?interval=1d&range=5d')}`,
      ];

      for (const url of yahooProxies) {
        try {
          const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(6000) });
          if (!res.ok) continue;
          const raw = await res.json();
          const parsed = raw?.contents ? JSON.parse(raw.contents) : raw;
          const result = parsed?.chart?.result?.[0];
          if (result) {
            const closes = (result.indicators.quote[0].close as (number|null)[]).filter((v): v is number => v != null);
            const opens  = (result.indicators.quote[0].open  as (number|null)[]).filter((v): v is number => v != null);
            if (closes.length >= 2) {
              pClose = closes[closes.length - 2];
              dOpen  = opens[opens.length - 1] ?? pClose;
              sourceName = 'Yahoo Finance (GC=F)';
              break;
            }
          }
        } catch {
          continue;
        }
      }
    }

    // Method C: Gold-API live spot price fallback
    if (!pClose) {
      try {
        const res = await fetch('https://api.gold-api.com/price/XAU', { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          const data = await res.json();
          if (data?.price && typeof data.price === 'number') {
            pClose = Math.round(data.price * 100) / 100;
            dOpen  = pClose;
            sourceName = 'Gold-API Spot';
          }
        }
      } catch {}
    }

    if (pClose) {
      setPrevClose(pClose);
      if (dOpen) setDailyOpen(dOpen);
      setPrevCloseStr(pClose.toFixed(2));
      if (dOpen) setDailyOpenStr(dOpen.toFixed(2));
      setDataSource(sourceName || 'Live Feed');
      setLastUpdated(new Date());
      setFetchError(null);

      // Save/upsert into Supabase signal_sessions if possible
      await upsertSignalSession(pClose, dOpen || pClose, sourceName);
    } else {
      setFetchError('Auto-fetch unavailable. You can type anchor prices manually.');
    }
    setFetchLoading(false);
  }, []);

  const upsertSignalSession = async (pClose: number, dOpen: number, source: string) => {
    try {
      const levels = computeLevels(pClose, dOpen);
      if (!levels) return;
      const rungData = levels.rungs.map(r => ({ idx: r.idx, spacing: r.spacing, buy: r.buy.toFixed(2), sell: r.sell.toFixed(2) }));

      const { data, error } = await supabase
        .from('signal_sessions')
        .upsert({
          session_date: today,
          symbol:       'XAUUSD',
          prev_close:   pClose,
          daily_open:   dOpen,
          tp_buy:       levels.tpBuy,
          tp_sell:      levels.tpSell,
          rung_data:    rungData,
          sl_level:     dOpen,
          data_source:  source,
          is_published: true,
          created_by:   currentUser?.id ?? null,
        }, { onConflict: 'session_date,symbol' })
        .select('id')
        .maybeSingle();

      if (!error && data?.id) setSessionId(data.id);
    } catch {}
  };

  const applyManual = async () => {
    const pc = parseFloat(prevCloseStr);
    const dO = parseFloat(dailyOpenStr);
    if (!isNaN(pc) && pc > 0) setPrevClose(pc);
    if (!isNaN(dO) && dO > 0) setDailyOpen(dO);
    setDataSource('Manual');
    setLastUpdated(new Date());
    setFetchError(null);
    if (!isNaN(pc) && !isNaN(dO)) await upsertSignalSession(pc, dO, 'manual');
  };

  // ── Load trade count for today ─────────────────────────────────────────────
  const loadTradeCount = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const { count } = await supabase
        .from('signal_trades')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', currentUser.id)
        .eq('session_date', today);
      setTradeCount(count ?? 0);
    } catch {}
  }, [currentUser?.id, today]);

  // ── Load today's session from Supabase on mount ────────────────────────────
  useEffect(() => {
    const loadSession = async () => {
      try {
        const { data } = await supabase
          .from('signal_sessions')
          .select('id, prev_close, daily_open, data_source')
          .eq('session_date', today)
          .eq('symbol', 'XAUUSD')
          .maybeSingle();

        if (data) {
          // Session exists in DB
          setSessionId(data.id);
          setPrevClose(data.prev_close);
          setDailyOpen(data.daily_open);
          setPrevCloseStr(Number(data.prev_close).toFixed(2));
          setDailyOpenStr(Number(data.daily_open).toFixed(2));
          setDataSource(`${data.data_source} (cached)`);
          setLastUpdated(new Date());
        }
      } catch {}

      // Auto-fetch fresh live prices
      await fetchPrices();
    };
    loadSession();
    loadTradeCount();
  }, [fetchPrices, loadTradeCount]);

  const handleCopy = (key: string, val: number) => {
    navigator.clipboard.writeText(val.toFixed(2));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const levels = computeLevels(prevClose, dailyOpen);
  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="space-y-4 sm:space-y-5 pb-24 font-sans text-slate-100 max-w-7xl mx-auto px-1 sm:px-3">

      {/* Log Trade Modal */}
      <LogTradeModal
        isOpen={showLogTrade}
        onClose={() => setShowLogTrade(false)}
        onSaved={loadTradeCount}
        sessionId={sessionId}
        sessionDate={today}
        userId={currentUser?.id ?? ''}
        levels={levels}
        prevClose={prevClose}
      />

      {/* ── Hero Banner ── */}
      <div className="rounded-2xl sm:rounded-3xl px-4 py-4 sm:px-7 sm:py-5 bg-[#0B0B0E] border border-[#D4A24C]/25 shadow-xl relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-48 h-48 sm:w-72 sm:h-72 bg-[#D4A24C]/8 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#D4A24C]/15 border border-[#D4A24C]/25 text-[#D4A24C] text-[10px] font-bold uppercase tracking-wider mb-1.5">
              <Zap className="w-3 h-3 animate-pulse" /> XAUUSD Live Signal
            </div>
            <h1 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight leading-tight">
              Laddered Breakout Strategy
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="text-[#D4A24C] font-bold">{todayLabel}</span>
              {lastUpdated && (
                <span className="flex items-center gap-1 text-slate-500">
                  <Clock className="w-3 h-3" /> {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {dataSource && <span className="text-slate-600">· {dataSource}</span>}
                </span>
              )}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Log Trade button */}
            <button
              onClick={() => setShowLogTrade(true)}
              className="relative min-h-[40px] px-3.5 py-2 rounded-xl font-bold text-xs bg-[#D4A24C] text-[#0B0B0C] hover:bg-[#c3913d] active:scale-[0.98] transition flex items-center gap-1.5 shadow-lg shadow-[#D4A24C]/10"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Trade</span>
              {tradeCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-white text-[#0B0B0C] text-[10px] font-extrabold flex items-center justify-center px-1">
                  {tradeCount}
                </span>
              )}
            </button>

            {/* Refresh button */}
            <button
              onClick={fetchPrices}
              disabled={fetchLoading}
              className="min-h-[40px] px-3 py-2 rounded-xl font-bold text-xs bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 active:scale-[0.98] transition flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${fetchLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{fetchLoading ? 'Fetching…' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Price summary strip */}
        {prevClose && (
          <div className="mt-3 pt-3 border-t border-white/[0.06] flex flex-wrap items-center gap-3 sm:gap-5 text-xs">
            <span className="text-slate-400">Anchor: <strong className="text-[#D4A24C]">${fmtPrice(prevClose)}</strong></span>
            {levels && <span className="text-slate-400">Buy TP: <strong className="text-emerald-400">${fmtPrice(levels.tpBuy)}</strong></span>}
            {levels && <span className="text-slate-400">Sell TP: <strong className="text-rose-400">${fmtPrice(levels.tpSell)}</strong></span>}
            {levels?.sl && <span className="text-slate-400">SL: <strong className="text-orange-400">${fmtPrice(levels.sl)}</strong></span>}
            {fetchError && (
              <span className="flex items-center gap-1 text-amber-400/80">
                <AlertCircle className="w-3.5 h-3.5" /> {fetchError}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Mobile Tab Switcher ── */}
      <div className="md:hidden flex items-center justify-between p-1 bg-[#121217] rounded-xl border border-white/[0.07] text-[11px] font-bold">
        {[
          { id: 'ladder',   label: '🪜 Ladder',  icon: Layers   },
          { id: 'chart',    label: '📊 Chart',   icon: BarChart2 },
          { id: 'settings', label: '⚙️ Inputs',  icon: Sliders   },
          { id: 'all',      label: '👁 All',     icon: Sparkles  },
        ].map((tab) => (
          <button key={tab.id}
            onClick={() => setActiveMobileTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 px-1 rounded-lg transition min-h-[38px] ${
              activeMobileTab === tab.id
                ? 'bg-[#D4A24C] text-[#0B0B0C] shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span className="hidden xs:inline truncate">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── TradingView Chart ── */}
      <div className={`rounded-2xl sm:rounded-3xl border border-slate-800 bg-[#0E0E12] overflow-hidden shadow-xl ${
        activeMobileTab !== 'chart' && activeMobileTab !== 'all' ? 'hidden md:block' : 'block'
      }`}>
        <div className="p-3 sm:p-4 bg-[#141419] border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#D4A24C] animate-pulse" />
            <span className="text-xs sm:text-sm font-bold text-white">{selectedSymbol} · {selectedInterval === 'D' ? 'Daily' : selectedInterval}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Feed selector */}
            <div className="flex rounded-lg bg-slate-900 border border-slate-800 p-0.5">
              {[{ l: 'OANDA', v: 'OANDA:XAUUSD' }, { l: 'FOREX.COM', v: 'FOREXCOM:XAUUSD' }, { l: 'TVC', v: 'TVC:GOLD' }].map(s => (
                <button key={s.v} onClick={() => setSelectedSymbol(s.v)}
                  className={`px-2.5 py-1.5 text-[10px] font-bold rounded-md transition whitespace-nowrap ${selectedSymbol === s.v ? 'bg-[#D4A24C] text-[#0B0B0C]' : 'text-slate-400 hover:text-white'}`}
                >{s.l}</button>
              ))}
            </div>
            {/* Interval selector */}
            <div className="flex rounded-lg bg-slate-900 border border-slate-800 p-0.5">
              {[{ l: 'D1', v: 'D' }, { l: '4H', v: '240' }, { l: '1H', v: '60' }, { l: '15M', v: '15' }].map(t => (
                <button key={t.v} onClick={() => setSelectedInterval(t.v)}
                  className={`px-2.5 py-1.5 text-[10px] font-bold rounded-md transition ${selectedInterval === t.v ? 'bg-[#D4A24C] text-[#0B0B0C]' : 'text-slate-400 hover:text-white'}`}
                >{t.l}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="w-full h-[360px] sm:h-[480px] bg-[#0E0E12]">
          <TradingViewChartWidget symbol={selectedSymbol} interval={selectedInterval} />
        </div>
      </div>

      {/* ── Quick Stats Grid ── */}
      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 ${activeMobileTab === 'chart' ? 'hidden md:grid' : 'grid'}`}>
        {[
          { label: 'Buy TP +1.0%',   val: levels?.tpBuy,         key: 'tpBuy',  color: 'emerald', sub: '+1.000% Target'      },
          { label: 'Buy R1 +0.5%',   val: levels?.rungs[0]?.buy, key: 'buyR1',  color: 'emerald', sub: 'First Breakout Stop'  },
          { label: 'Sell R1 -0.5%',  val: levels?.rungs[0]?.sell,key: 'sellR1', color: 'rose',    sub: 'First Breakdown Stop' },
          { label: 'Sell TP -1.0%',  val: levels?.tpSell,        key: 'tpSell', color: 'rose',    sub: '-1.000% Target'      },
        ].map(({ label, val, key, color, sub }) => (
          <div key={key} className={`rounded-xl sm:rounded-2xl border p-3 sm:p-4 flex flex-col justify-between ${
            color === 'emerald' ? 'border-emerald-500/25 bg-emerald-950/20' : 'border-rose-500/25 bg-rose-950/20'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${color === 'emerald' ? 'text-emerald-400' : 'text-rose-400'}`}>{label}</span>
              {val && (
                <button onClick={() => handleCopy(key, val)}
                  className={`p-1 rounded ${color === 'emerald' ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400'} transition`}>
                  {copiedKey === key ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </button>
              )}
            </div>
            <div className={`text-lg sm:text-2xl font-black tabular-nums mt-1 ${color === 'emerald' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {val ? `$${fmtPrice(val)}` : '—'}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5">{sub}</span>
          </div>
        ))}

        {/* SL card */}
        <div className="col-span-2 lg:col-span-4 rounded-xl sm:rounded-2xl border border-orange-500/25 bg-orange-950/20 p-3 sm:p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 flex-shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">Shared Stop Loss · Daily Open</div>
              <div className="text-[10px] text-slate-400 hidden sm:block">Invalidation level — same for all buy &amp; sell positions</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-lg sm:text-2xl font-black text-orange-400 tabular-nums">
                {levels?.sl ? `$${fmtPrice(levels.sl)}` : '—'}
              </div>
              <div className="text-[10px] text-orange-400/60">
                {levels?.sl && prevClose ? fmtPct(levels.sl, prevClose) : ''}
              </div>
            </div>
            {levels?.sl && (
              <button onClick={() => handleCopy('sl', levels.sl!)}
                className="p-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 transition">
                {copiedKey === 'sl' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Inputs + Ladder Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">

        {/* Input Panel */}
        <div className={`lg:col-span-1 rounded-2xl sm:rounded-3xl border border-slate-800 bg-[#121217] p-4 sm:p-5 space-y-4 shadow-xl ${
          activeMobileTab !== 'settings' && activeMobileTab !== 'all' ? 'hidden lg:block' : 'block'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-xs font-bold text-white flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-[#D4A24C]" /> Anchor Parameters</h3>
            {lastUpdated && <span className="text-[10px] text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" />{lastUpdated.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>}
          </div>

          {fetchError && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-amber-300 text-[11px]">{fetchError} Prices above will auto-populate once market opens.</p>
            </div>
          )}

          {fetchLoading && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
              <span className="text-blue-300 text-[11px]">Fetching live prices from Yahoo Finance…</span>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-[#D4A24C] uppercase tracking-wider mb-1">Prev Day Close (Anchor $)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
              <input type="number" step="0.01" value={prevCloseStr} onChange={(e) => setPrevCloseStr(e.target.value)}
                placeholder="Auto-fetched from TradingView"
                className="w-full min-h-[44px] bg-[#181820] border border-slate-700 rounded-xl pl-8 pr-3 text-white text-sm font-bold focus:outline-none focus:border-[#D4A24C] transition placeholder:text-slate-600" />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Auto-populated from Yahoo Finance (GC=F)</p>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-orange-400 uppercase tracking-wider mb-1">Today's Open (SL Anchor $)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
              <input type="number" step="0.01" value={dailyOpenStr} onChange={(e) => setDailyOpenStr(e.target.value)}
                placeholder="Auto-fetched from TradingView"
                className="w-full min-h-[44px] bg-[#181820] border border-slate-700 rounded-xl pl-8 pr-3 text-white text-sm font-bold focus:outline-none focus:border-orange-400 transition placeholder:text-slate-600" />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Used as stop loss for all positions</p>
          </div>

          <button onClick={applyManual}
            className="w-full min-h-[44px] py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-[#0B0B0C] bg-[#D4A24C] hover:bg-[#c3913d] active:scale-[0.98] transition flex items-center justify-center gap-2">
            <RefreshCw className="w-3.5 h-3.5" /> Apply &amp; Recalculate
          </button>

          <div className="p-3 rounded-xl bg-[#18181F] border border-slate-800">
            <div className="text-[11px] font-bold text-[#D4A24C] flex items-center gap-1.5 mb-1.5"><Info className="w-3 h-3" /> Strategy Summary</div>
            <ul className="space-y-1 text-[11px] text-slate-400 list-disc pl-4">
              <li>Rungs: ±0.5%, 0.6%, 0.7%, 0.8%, 0.9%</li>
              <li>TP: ±1.0% from prev close</li>
              <li>Opposite cancel: ±0.6%</li>
              <li>BE sweep: ±0.9% (rungs &lt; 0.7%)</li>
            </ul>
          </div>
        </div>

        {/* Price Ladder */}
        <div className={`lg:col-span-2 rounded-2xl sm:rounded-3xl border border-slate-800 bg-[#121217] overflow-hidden shadow-xl ${
          activeMobileTab !== 'ladder' && activeMobileTab !== 'all' ? 'hidden lg:block' : 'block'
        }`}>
          <div className="p-3.5 sm:p-5 bg-[#17171E] border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-white">XAUUSD Strategy Ladder</h2>
              <p className="text-[11px] text-slate-400">Anchor: <strong className="text-[#D4A24C]">{prevClose ? `$${fmtPrice(prevClose)}` : 'awaiting prices…'}</strong></p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-bold">
              <span className="flex items-center gap-1 text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-400" />Buy</span>
              <span className="flex items-center gap-1 text-rose-400"><span className="w-2 h-2 rounded-full bg-rose-400" />Sell</span>
            </div>
          </div>

          {levels && prevClose ? (
            <div className="p-3 sm:p-5 space-y-2 bg-[#0D0D12]">

              {/* TP Buy */}
              <LadderRow side="buy" emphasis icon={<Target className="w-4 h-4" />}
                label="BUY TAKE PROFIT" badge="+1.0% TP" note="Exit target for all buy positions"
                price={fmtPrice(levels.tpBuy)} pct="+1.000%"
                onCopy={() => handleCopy('tpBuyLadder', levels.tpBuy)} copied={copiedKey === 'tpBuyLadder'} />

              {[...levels.rungs].reverse().map((r) => (
                <LadderRow key={`b${r.idx}`} side="buy" icon={<ArrowUp className="w-3.5 h-3.5" />}
                  label={`Buy Stop R${r.idx + 1}`}
                  badge={r.idx === 0 ? 'FIRST ENTRY' : r.spacing === OPP_CANCEL_PCT ? 'OPP CANCEL' : r.spacing === BREAKEVEN_TRIGGER_PCT ? 'BE TRIGGER' : `+${r.spacing}%`}
                  note={`+${r.spacing}% from anchor`}
                  price={fmtPrice(r.buy)} pct={fmtPct(r.buy, prevClose)}
                  highlight={r.idx === 0}
                  onCopy={() => handleCopy(`b${r.idx}`, r.buy)} copied={copiedKey === `b${r.idx}`} />
              ))}

              {/* Anchor */}
              <div className="my-2 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#D4A24C]/8 border-2 border-[#D4A24C]/35 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#D4A24C] text-[#0B0B0C] flex items-center justify-center font-black text-sm flex-shrink-0">⚓</div>
                  <div>
                    <div className="text-xs sm:text-sm font-black text-[#D4A24C]">Prev Day Close — Anchor</div>
                    <div className="text-[10px] text-slate-300">All levels measured from here</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base sm:text-xl font-black text-[#D4A24C] tabular-nums">${fmtPrice(prevClose)}</div>
                  <div className="text-[10px] text-slate-400">0.000%</div>
                </div>
              </div>

              {levels.rungs.map((r) => (
                <LadderRow key={`s${r.idx}`} side="sell" icon={<ArrowDown className="w-3.5 h-3.5" />}
                  label={`Sell Stop R${r.idx + 1}`}
                  badge={r.idx === 0 ? 'FIRST ENTRY' : r.spacing === OPP_CANCEL_PCT ? 'OPP CANCEL' : r.spacing === BREAKEVEN_TRIGGER_PCT ? 'BE TRIGGER' : `-${r.spacing}%`}
                  note={`-${r.spacing}% from anchor`}
                  price={fmtPrice(r.sell)} pct={fmtPct(r.sell, prevClose)}
                  highlight={r.idx === 0}
                  onCopy={() => handleCopy(`s${r.idx}`, r.sell)} copied={copiedKey === `s${r.idx}`} />
              ))}

              {/* TP Sell */}
              <LadderRow side="sell" emphasis icon={<Target className="w-4 h-4" />}
                label="SELL TAKE PROFIT" badge="-1.0% TP" note="Exit target for all sell positions"
                price={fmtPrice(levels.tpSell)} pct="-1.000%"
                onCopy={() => handleCopy('tpSellLadder', levels.tpSell)} copied={copiedKey === 'tpSellLadder'} />
            </div>
          ) : (
            <div className="p-12 text-center">
              {fetchLoading ? (
                <div className="flex flex-col items-center gap-3 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-[#D4A24C]" />
                  <p className="text-sm font-medium">Fetching live XAUUSD prices…</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-slate-500">
                  <BarChart2 className="w-10 h-10" />
                  <p className="text-sm">Enter anchor prices or click <strong className="text-[#D4A24C]">Refresh</strong></p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Reusable Ladder Row ───────────────────────────────────────────────────────
interface LadderRowProps {
  side: 'buy' | 'sell';
  icon: React.ReactNode;
  label: string;
  badge?: string;
  note?: string;
  price: string;
  pct: string;
  emphasis?: boolean;
  highlight?: boolean;
  onCopy: () => void;
  copied: boolean;
}

function LadderRow({ side, icon, label, badge, note, price, pct, emphasis, highlight, onCopy, copied }: LadderRowProps) {
  const g = side === 'buy'
    ? { border: highlight ? 'border-emerald-500/35' : 'border-emerald-500/15', bg: highlight ? 'bg-emerald-950/25' : 'bg-[#15151C]', icon: 'text-emerald-400', price: 'text-emerald-400', badge: 'border-emerald-500/30 text-emerald-300' }
    : { border: highlight ? 'border-rose-500/35'    : 'border-rose-500/15',    bg: highlight ? 'bg-rose-950/25'    : 'bg-[#15151C]', icon: 'text-rose-400',    price: 'text-rose-400',    badge: 'border-rose-500/30 text-rose-300'       };

  if (emphasis) {
    const eb = side === 'buy'
      ? { bg: 'bg-emerald-950/30', border: 'border-emerald-500/40', icon: 'text-emerald-400', price: 'text-emerald-400', badge: 'border-emerald-500/30 text-emerald-300' }
      : { bg: 'bg-rose-950/30',    border: 'border-rose-500/40',    icon: 'text-rose-400',    price: 'text-rose-400',    badge: 'border-rose-500/30 text-rose-300'       };
    return (
      <div className={`flex items-center gap-2.5 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border ${eb.border} ${eb.bg}`}>
        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ${eb.icon} bg-current/10`}>{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`text-xs sm:text-sm font-extrabold ${eb.price}`}>{label}</span>
            {badge && <span className={`px-1.5 rounded text-[9px] font-black border ${eb.badge}`}>{badge}</span>}
          </div>
          {note && <div className="text-[10px] text-slate-400 truncate">{note}</div>}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 pl-2">
          <div className="text-right">
            <div className={`text-sm sm:text-base font-black tabular-nums ${eb.price}`}>${price}</div>
            <div className="text-[10px] text-slate-400">{pct}</div>
          </div>
          <button onClick={onCopy} className={`p-1.5 rounded-lg ${eb.bg} hover:opacity-80 ${eb.icon} transition`}>
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl border transition ${g.border} ${g.bg}`}>
      <div className={`flex-shrink-0 ${g.icon}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
          <span className="text-xs font-bold text-white">{label}</span>
          {badge && <span className={`px-1 rounded text-[8.5px] font-extrabold border ${g.badge}`}>{badge}</span>}
        </div>
        {note && <div className="text-[10px] text-slate-500 truncate">{note}</div>}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0 pl-1">
        <div className="text-right">
          <div className={`text-xs sm:text-sm font-black tabular-nums ${g.price}`}>${price}</div>
          <div className="text-[10px] text-slate-500">{pct}</div>
        </div>
        <button onClick={onCopy} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition">
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
        </button>
      </div>
    </div>
  );
}

export default SignalPage;
