import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  RefreshCw, Target, AlertCircle, ArrowUp, ArrowDown,
  Clock, Info, Zap, Shield, Copy, Check, BarChart2,
  Sliders, Plus, X, TrendingUp, TrendingDown,
  CheckCircle2, Loader2, Award, History, ChevronRight
} from 'lucide-react';
import { User } from '../types';
import { supabase } from '../supabase/client';

// ── Strategy Constants (1 Trade A Day Breakout) ─────────────────────────────
const ENTRY_PCT = 0.5; // ±0.5% from Previous Day Close
const TP_PCT = 1.0;    // ±1.0% from Previous Day Close

// ── Formatters ────────────────────────────────────────────────────────────────
const fmtPrice = (p: number) =>
  p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtPct = (price: number, base: number) => {
  if (!base) return '0.000%';
  const v = ((price - base) / base) * 100;
  return `${v >= 0 ? '+' : ''}${v.toFixed(3)}%`;
};

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
          autosize: true,
          symbol,
          interval,
          timezone: 'Etc/UTC',
          theme: 'dark',
          style: '1',
          locale: 'en',
          toolbar_bg: '#0E0E10',
          enable_publishing: false,
          allow_symbol_change: true,
          save_image: false,
          container_id: id,
          hide_side_toolbar: false,
          studies: ['MASimple@tv-basicstudies', 'RSI@tv-basicstudies'],
        });
      }
    };
    containerRef.current.appendChild(s);
    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [symbol, interval]);

  return <div ref={containerRef} className="w-full h-full min-h-[360px] sm:min-h-[460px]" />;
}

// ── Log Trade Modal ───────────────────────────────────────────────────────────
interface LogTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  defaultDirection: 'buy' | 'sell';
  sessionId: string | null;
  sessionDate: string;
  userId: string;
  prevClose: number | null;
  dailyOpen: number | null;
}

function LogTradeModal({
  isOpen,
  onClose,
  onSaved,
  defaultDirection,
  sessionId,
  sessionDate,
  userId,
  prevClose,
  dailyOpen,
}: LogTradeModalProps) {
  const [direction, setDirection] = useState<'buy' | 'sell'>(defaultDirection);
  const [entryPrice, setEntryPrice] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [lotSize, setLotSize] = useState('0.01');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state when opening with default values
  useEffect(() => {
    setDirection(defaultDirection);
  }, [defaultDirection, isOpen]);

  useEffect(() => {
    if (!prevClose) return;
    const isBuy = direction === 'buy';
    const calculatedEntry = isBuy
      ? prevClose * (1 + ENTRY_PCT / 100)
      : prevClose * (1 - ENTRY_PCT / 100);
    const calculatedTP = isBuy
      ? prevClose * (1 + TP_PCT / 100)
      : prevClose * (1 - TP_PCT / 100);
    const calculatedSL = dailyOpen ?? (isBuy ? prevClose * 0.995 : prevClose * 1.005);

    setEntryPrice(calculatedEntry.toFixed(2));
    setTakeProfit(calculatedTP.toFixed(2));
    setStopLoss(calculatedSL.toFixed(2));
  }, [direction, prevClose, dailyOpen, isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    const entryNum = parseFloat(entryPrice);
    const tpNum = parseFloat(takeProfit);
    const slNum = parseFloat(stopLoss);
    const lot = parseFloat(lotSize);

    if (isNaN(entryNum) || entryNum <= 0) {
      setError('Please provide a valid entry price.');
      return;
    }
    if (isNaN(lot) || lot <= 0) {
      setError('Please enter a valid lot size.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const { error: dbError } = await supabase.from('signal_trades').insert({
        session_id: sessionId,
        user_id: userId,
        symbol: 'XAUUSD',
        trade_direction: direction,
        rung_number: 1, // Single 0.5% primary trade
        entry_price: entryNum,
        take_profit: isNaN(tpNum) ? null : tpNum,
        stop_loss: isNaN(slNum) ? null : slNum,
        lot_size: lot,
        notes: notes.trim() || null,
        session_date: sessionDate,
        trade_result: 'open',
      });
      if (dbError) throw dbError;
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onSaved();
        onClose();
      }, 1000);
    } catch (e: any) {
      setError(e.message || 'Failed to save trade.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full sm:max-w-lg bg-[#121217] border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#16161D]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#D4A24C] flex items-center justify-center text-[#0B0B0C] font-black">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-white">Log Today's Signal Trade</div>
              <div className="text-[11px] text-slate-400">XAUUSD · 1-Trade Setup (0.5% Delta)</div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Direction Toggle */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Trade Setup</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDirection('buy')}
                className={`min-h-[44px] rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border transition ${
                  direction === 'buy'
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <TrendingUp className="w-4 h-4" /> BUY STOP (+0.5%)
              </button>
              <button
                type="button"
                onClick={() => setDirection('sell')}
                className={`min-h-[44px] rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border transition ${
                  direction === 'sell'
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <TrendingDown className="w-4 h-4" /> SELL STOP (-0.5%)
              </button>
            </div>
          </div>

          {/* Pricing fields */}
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Entry ({direction === 'buy' ? '+0.5%' : '-0.5%'})
              </label>
              <input
                type="number"
                step="0.01"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                className="w-full min-h-[42px] bg-[#181820] border border-slate-700 rounded-xl px-2.5 text-white text-xs sm:text-sm font-bold focus:outline-none focus:border-[#D4A24C]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
                TP ({direction === 'buy' ? '+1.0%' : '-1.0%'})
              </label>
              <input
                type="number"
                step="0.01"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                className="w-full min-h-[42px] bg-emerald-950/20 border border-emerald-500/30 rounded-xl px-2.5 text-emerald-400 text-xs sm:text-sm font-bold focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-1">
                SL (Open)
              </label>
              <input
                type="number"
                step="0.01"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                className="w-full min-h-[42px] bg-orange-950/20 border border-orange-500/30 rounded-xl px-2.5 text-orange-400 text-xs sm:text-sm font-bold focus:outline-none focus:border-orange-400"
              />
            </div>
          </div>

          {/* Lot Size */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Lot Size</label>
            <div className="flex gap-2">
              {['0.01', '0.05', '0.10', '0.25', '0.50', '1.00'].map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLotSize(l)}
                  className={`flex-1 min-h-[38px] rounded-xl text-xs font-bold border transition ${
                    lotSize === l
                      ? 'bg-[#D4A24C] border-[#D4A24C] text-[#0B0B0C]'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Trade Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Executed on London open breakout..."
              className="w-full bg-[#181820] border border-slate-800 rounded-xl p-3 text-white text-xs sm:text-sm focus:outline-none focus:border-[#D4A24C] resize-none"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || saved}
            className={`w-full min-h-[46px] rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition ${
              saved
                ? 'bg-emerald-500 text-white'
                : 'bg-[#D4A24C] text-[#0B0B0C] hover:bg-[#c3913d] active:scale-[0.98]'
            } disabled:opacity-70`}
          >
            {saved ? (
              <><CheckCircle2 className="w-4 h-4" /> Trade Saved to Journal!</>
            ) : saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
            ) : (
              <><Plus className="w-4 h-4" /> Record Trade</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page Component ───────────────────────────────────────────────────────
interface SignalPageProps {
  currentUser?: User;
}

export function SignalPage({ currentUser }: SignalPageProps) {
  const [prevClose, setPrevClose] = useState<number | null>(null);
  const [dailyOpen, setDailyOpen] = useState<number | null>(null);
  const [prevCloseStr, setPrevCloseStr] = useState('');
  const [dailyOpenStr, setDailyOpenStr] = useState('');
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [dataSource, setDataSource] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Modals & Tabs
  const [showLogModal, setShowLogModal] = useState(false);
  const [modalDirection, setModalDirection] = useState<'buy' | 'sell'>('buy');
  const [activeTab, setActiveTab] = useState<'signal' | 'chart' | 'journal'>('signal');
  const [todayTrades, setTodayTrades] = useState<any[]>([]);

  // Chart settings
  const [selectedSymbol, setSelectedSymbol] = useState('OANDA:XAUUSD');
  const [selectedInterval, setSelectedInterval] = useState('D');

  const today = new Date().toISOString().split('T')[0];
  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // ── Auto-Fetch Live Prices ──────────────────────────────────────────────────
  const fetchPrices = useCallback(async () => {
    setFetchLoading(true);
    setFetchError(null);

    let pClose: number | null = null;
    let dOpen: number | null = null;
    let sourceName = '';

    // Method A: Binance PAXG/USDT (Exact 1:1 Physical Gold tokenized in USD, Open CORS)
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
          pClose = parseFloat(prevDay[4]); // Previous Day Close
          dOpen = parseFloat(currDay[1]);  // Today's Open
          sourceName = 'Live Feed (XAU/USD)';
        }
      }
    } catch {}

    // Method B: Yahoo Finance (GC=F) via CORS Proxies
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
            const closes = (result.indicators.quote[0].close as (number | null)[]).filter((v): v is number => v != null);
            const opens = (result.indicators.quote[0].open as (number | null)[]).filter((v): v is number => v != null);
            if (closes.length >= 2) {
              pClose = closes[closes.length - 2];
              dOpen = opens[opens.length - 1] ?? pClose;
              sourceName = 'Yahoo Finance (GC=F)';
              break;
            }
          }
        } catch {
          continue;
        }
      }
    }

    // Method C: Gold-API live spot fallback
    if (!pClose) {
      try {
        const res = await fetch('https://api.gold-api.com/price/XAU', { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          const data = await res.json();
          if (data?.price && typeof data.price === 'number') {
            pClose = Math.round(data.price * 100) / 100;
            dOpen = pClose;
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
      setDataSource(sourceName || 'Live Gold Market');
      setLastUpdated(new Date());
      setFetchError(null);

      await upsertSignalSession(pClose, dOpen || pClose, sourceName);
    } else {
      setFetchError('Auto-fetch offline. You can set anchor prices manually below.');
    }
    setFetchLoading(false);
  }, []);

  const upsertSignalSession = async (pClose: number, dOpen: number, source: string) => {
    try {
      const buyEntry = pClose * (1 + ENTRY_PCT / 100);
      const sellEntry = pClose * (1 - ENTRY_PCT / 100);
      const buyTP = pClose * (1 + TP_PCT / 100);
      const sellTP = pClose * (1 - TP_PCT / 100);

      const { data, error } = await supabase
        .from('signal_sessions')
        .upsert(
          {
            session_date: today,
            symbol: 'XAUUSD',
            prev_close: pClose,
            daily_open: dOpen,
            tp_buy: buyTP,
            tp_sell: sellTP,
            rung_data: [
              { idx: 0, spacing: ENTRY_PCT, buy: buyEntry.toFixed(2), sell: sellEntry.toFixed(2) }
            ],
            sl_level: dOpen,
            data_source: source,
            is_published: true,
            created_by: currentUser?.id ?? null,
          },
          { onConflict: 'session_date,symbol' }
        )
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
    setDataSource('Manual Setting');
    setLastUpdated(new Date());
    setFetchError(null);
    if (!isNaN(pc) && !isNaN(dO)) await upsertSignalSession(pc, dO, 'manual');
  };

  const loadTodayTrades = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const { data } = await supabase
        .from('signal_trades')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('session_date', today)
        .order('created_at', { ascending: false });
      setTodayTrades(data ?? []);
    } catch {}
  }, [currentUser?.id, today]);

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
          setSessionId(data.id);
          setPrevClose(data.prev_close);
          setDailyOpen(data.daily_open);
          setPrevCloseStr(Number(data.prev_close).toFixed(2));
          setDailyOpenStr(Number(data.daily_open).toFixed(2));
          setDataSource(`${data.data_source} (cached)`);
          setLastUpdated(new Date());
        }
      } catch {}

      await fetchPrices();
    };
    loadSession();
    loadTodayTrades();
  }, [fetchPrices, loadTodayTrades]);

  // Copy helper
  const handleCopy = (key: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Calculations for 1 trade a day
  const buyEntry = prevClose ? prevClose * (1 + ENTRY_PCT / 100) : null;
  const buyTP = prevClose ? prevClose * (1 + TP_PCT / 100) : null;
  const buySL = dailyOpen ?? (prevClose ? prevClose * 0.995 : null);

  const sellEntry = prevClose ? prevClose * (1 - ENTRY_PCT / 100) : null;
  const sellTP = prevClose ? prevClose * (1 - TP_PCT / 100) : null;
  const sellSL = dailyOpen ?? (prevClose ? prevClose * 1.005 : null);

  const openLogModal = (dir: 'buy' | 'sell') => {
    setModalDirection(dir);
    setShowLogModal(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 font-sans text-slate-100 max-w-6xl mx-auto px-2 sm:px-4">

      {/* Log Trade Modal */}
      <LogTradeModal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        onSaved={loadTodayTrades}
        defaultDirection={modalDirection}
        sessionId={sessionId}
        sessionDate={today}
        userId={currentUser?.id ?? ''}
        prevClose={prevClose}
        dailyOpen={dailyOpen}
      />

      {/* ── Top Header Banner ── */}
      <div className="rounded-3xl p-4 sm:p-6 bg-gradient-to-br from-[#121218] via-[#0E0E12] to-[#0A0A0C] border border-[#D4A24C]/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#D4A24C]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#D4A24C]/15 border border-[#D4A24C]/30 text-[#D4A24C] text-[11px] font-black uppercase tracking-wider mb-2">
              <Zap className="w-3.5 h-3.5 animate-pulse" /> XAUUSD · 1 Trade A Day Strategy
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
              Daily 0.5% Breakout Trade Setup
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <span className="text-[#D4A24C] font-extrabold">{todayLabel}</span>
              {lastUpdated && (
                <span className="flex items-center gap-1 text-slate-500">
                  <Clock className="w-3.5 h-3.5" />
                  {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {dataSource && <span className="text-slate-600">· {dataSource}</span>}
                </span>
              )}
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => openLogModal('buy')}
              className="min-h-[42px] px-4 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Log Buy
            </button>
            <button
              onClick={() => openLogModal('sell')}
              className="min-h-[42px] px-4 rounded-xl font-bold text-xs bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20 active:scale-[0.98] transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Log Sell
            </button>
            <button
              onClick={fetchPrices}
              disabled={fetchLoading}
              className="min-h-[42px] px-3.5 rounded-xl font-bold text-xs bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 active:scale-[0.98] transition flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${fetchLoading ? 'animate-spin' : ''}`} />
              <span className="hidden xs:inline">{fetchLoading ? 'Syncing…' : 'Sync Prices'}</span>
            </button>
          </div>
        </div>

        {/* Anchor Summary Ribbon */}
        <div className="mt-4 pt-4 border-t border-white/[0.08] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-[#181822]/80 border border-white/[0.06] p-2.5 rounded-xl">
            <div className="text-[10px] uppercase font-bold text-slate-400">Previous Day Close</div>
            <div className="text-sm sm:text-base font-black text-[#D4A24C] tabular-nums mt-0.5">
              {prevClose ? `$${fmtPrice(prevClose)}` : 'Syncing…'}
            </div>
            <div className="text-[10px] text-slate-500">Anchor for ±0.5% Entry &amp; ±1% TP</div>
          </div>

          <div className="bg-[#181822]/80 border border-white/[0.06] p-2.5 rounded-xl">
            <div className="text-[10px] uppercase font-bold text-slate-400">Today's Daily Open</div>
            <div className="text-sm sm:text-base font-black text-orange-400 tabular-nums mt-0.5">
              {dailyOpen ? `$${fmtPrice(dailyOpen)}` : 'Syncing…'}
            </div>
            <div className="text-[10px] text-slate-500">Shared Stop Loss Anchor</div>
          </div>

          <div className="bg-emerald-950/20 border border-emerald-500/20 p-2.5 rounded-xl">
            <div className="text-[10px] uppercase font-bold text-emerald-400">Buy Entry (+0.5%)</div>
            <div className="text-sm sm:text-base font-black text-emerald-400 tabular-nums mt-0.5">
              {buyEntry ? `$${fmtPrice(buyEntry)}` : '—'}
            </div>
            <div className="text-[10px] text-emerald-500/80">TP: ${buyTP ? fmtPrice(buyTP) : '—'}</div>
          </div>

          <div className="bg-rose-950/20 border border-rose-500/20 p-2.5 rounded-xl">
            <div className="text-[10px] uppercase font-bold text-rose-400">Sell Entry (-0.5%)</div>
            <div className="text-sm sm:text-base font-black text-rose-400 tabular-nums mt-0.5">
              {sellEntry ? `$${fmtPrice(sellEntry)}` : '—'}
            </div>
            <div className="text-[10px] text-rose-500/80">TP: ${sellTP ? fmtPrice(sellTP) : '—'}</div>
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex items-center gap-1.5 p-1 bg-[#121217] rounded-2xl border border-white/[0.06] w-fit">
        {[
          { id: 'signal',  label: '🎯 Today\'s Trade Setup',      icon: Target },
          { id: 'chart',   label: '📊 TradingView Chart',        icon: BarChart2 },
          { id: 'journal', label: `📓 Logged Trades (${todayTrades.length})`, icon: History },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === t.id
                ? 'bg-[#D4A24C] text-[#0B0B0C] shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          TAB 1: 1-TRADE A DAY SIGNAL CARDS (BUY & SELL)
      ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'signal' && (
        <div className="space-y-4 sm:space-y-6">

          {/* TWO PRIMARY SIGNAL CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">

            {/* 🟢 BUY SIGNAL CARD */}
            <div className="rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-b from-emerald-950/20 via-[#101514] to-[#0D100F] p-5 sm:p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-emerald-500 text-[#0B0B0C] flex items-center justify-center font-black">
                      <ArrowUp className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-400">Position 1</span>
                      <h2 className="text-lg font-black text-white">BUY STOP · +0.5%</h2>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase">
                    Bullish Breakout
                  </span>
                </div>

                {/* Main Entry Price Box */}
                <div className="p-4 rounded-2xl bg-[#141A17] border border-emerald-500/25 mb-4">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400/80 mb-1 flex items-center justify-between">
                    <span>Order Entry Price (+0.500%)</span>
                    <button
                      onClick={() => handleCopy('buyEntry', buyEntry ? buyEntry.toFixed(2) : '')}
                      className="p-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition"
                      title="Copy Entry Price"
                    >
                      {copiedKey === 'buyEntry' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-400 tabular-nums">
                    {buyEntry ? `$${fmtPrice(buyEntry)}` : '—'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Pending order placed +0.5% above previous close ($
                    {prevClose ? fmtPrice(prevClose) : '—'})
                  </div>
                </div>

                {/* TP and SL Row */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {/* Take Profit */}
                  <div className="p-3.5 rounded-2xl bg-[#141A17] border border-emerald-500/20">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase text-emerald-400">
                      <span>Take Profit (+1.0%)</span>
                      <button
                        onClick={() => handleCopy('buyTP', buyTP ? buyTP.toFixed(2) : '')}
                        className="text-emerald-400 hover:text-white"
                      >
                        {copiedKey === 'buyTP' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <div className="text-lg font-black text-emerald-400 tabular-nums mt-1">
                      {buyTP ? `$${fmtPrice(buyTP)}` : '—'}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">+1.000% Target</div>
                  </div>

                  {/* Stop Loss */}
                  <div className="p-3.5 rounded-2xl bg-[#1D1614] border border-orange-500/20">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase text-orange-400">
                      <span>Stop Loss (Open)</span>
                      <button
                        onClick={() => handleCopy('buySL', buySL ? buySL.toFixed(2) : '')}
                        className="text-orange-400 hover:text-white"
                      >
                        {copiedKey === 'buySL' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <div className="text-lg font-black text-orange-400 tabular-nums mt-1">
                      {buySL ? `$${fmtPrice(buySL)}` : '—'}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Today's Daily Open</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => openLogModal('buy')}
                  className="w-full min-h-[44px] rounded-xl font-black text-xs uppercase tracking-wider bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Log This Buy Trade
                </button>
                <button
                  onClick={() =>
                    handleCopy(
                      'buyAll',
                      `BUY STOP XAUUSD\nEntry: ${buyEntry ? buyEntry.toFixed(2) : ''}\nTP: ${buyTP ? buyTP.toFixed(2) : ''}\nSL: ${buySL ? buySL.toFixed(2) : ''}`
                    )
                  }
                  className="w-full py-2 rounded-xl text-[11px] font-bold text-slate-400 hover:text-white bg-slate-900/80 border border-slate-800 transition flex items-center justify-center gap-1.5"
                >
                  {copiedKey === 'buyAll' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'buyAll' ? 'Copied Full Order Parameters!' : 'Copy MT5 Parameters'}</span>
                </button>
              </div>
            </div>

            {/* 🔴 SELL SIGNAL CARD */}
            <div className="rounded-3xl border-2 border-rose-500/40 bg-gradient-to-b from-rose-950/20 via-[#181113] to-[#100D0E] p-5 sm:p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-rose-500 text-white flex items-center justify-center font-black">
                      <ArrowDown className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-rose-400">Position 1</span>
                      <h2 className="text-lg font-black text-white">SELL STOP · -0.5%</h2>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] font-black uppercase">
                    Bearish Breakdown
                  </span>
                </div>

                {/* Main Entry Price Box */}
                <div className="p-4 rounded-2xl bg-[#1C1316] border border-rose-500/25 mb-4">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-rose-400/80 mb-1 flex items-center justify-between">
                    <span>Order Entry Price (-0.500%)</span>
                    <button
                      onClick={() => handleCopy('sellEntry', sellEntry ? sellEntry.toFixed(2) : '')}
                      className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                      title="Copy Entry Price"
                    >
                      {copiedKey === 'sellEntry' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-rose-400 tabular-nums">
                    {sellEntry ? `$${fmtPrice(sellEntry)}` : '—'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Pending order placed -0.5% below previous close ($
                    {prevClose ? fmtPrice(prevClose) : '—'})
                  </div>
                </div>

                {/* TP and SL Row */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {/* Take Profit */}
                  <div className="p-3.5 rounded-2xl bg-[#1C1316] border border-rose-500/20">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase text-rose-400">
                      <span>Take Profit (-1.0%)</span>
                      <button
                        onClick={() => handleCopy('sellTP', sellTP ? sellTP.toFixed(2) : '')}
                        className="text-rose-400 hover:text-white"
                      >
                        {copiedKey === 'sellTP' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <div className="text-lg font-black text-rose-400 tabular-nums mt-1">
                      {sellTP ? `$${fmtPrice(sellTP)}` : '—'}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">-1.000% Target</div>
                  </div>

                  {/* Stop Loss */}
                  <div className="p-3.5 rounded-2xl bg-[#1D1614] border border-orange-500/20">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase text-orange-400">
                      <span>Stop Loss (Open)</span>
                      <button
                        onClick={() => handleCopy('sellSL', sellSL ? sellSL.toFixed(2) : '')}
                        className="text-orange-400 hover:text-white"
                      >
                        {copiedKey === 'sellSL' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <div className="text-lg font-black text-orange-400 tabular-nums mt-1">
                      {sellSL ? `$${fmtPrice(sellSL)}` : '—'}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Today's Daily Open</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => openLogModal('sell')}
                  className="w-full min-h-[44px] rounded-xl font-black text-xs uppercase tracking-wider bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20 active:scale-[0.98] transition flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Log This Sell Trade
                </button>
                <button
                  onClick={() =>
                    handleCopy(
                      'sellAll',
                      `SELL STOP XAUUSD\nEntry: ${sellEntry ? sellEntry.toFixed(2) : ''}\nTP: ${sellTP ? sellTP.toFixed(2) : ''}\nSL: ${sellSL ? sellSL.toFixed(2) : ''}`
                    )
                  }
                  className="w-full py-2 rounded-xl text-[11px] font-bold text-slate-400 hover:text-white bg-slate-900/80 border border-slate-800 transition flex items-center justify-center gap-1.5"
                >
                  {copiedKey === 'sellAll' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'sellAll' ? 'Copied Full Order Parameters!' : 'Copy MT5 Parameters'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Strategy Rules & Anchor Adjuster */}
          <div className="rounded-3xl border border-slate-800 bg-[#121217] p-5 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Rules */}
            <div className="md:col-span-2 space-y-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#D4A24C]" /> 1-Trade A Day Strategy Execution Rules
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                <div className="p-3 rounded-2xl bg-[#171720] border border-slate-800 space-y-1">
                  <div className="font-bold text-[#D4A24C]">1. Daily Entry Setup (±0.5%)</div>
                  <p className="text-slate-400 text-[11px]">
                    Place one Buy Stop at +0.5% above previous close, and one Sell Stop at -0.5% below previous close.
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-[#171720] border border-slate-800 space-y-1">
                  <div className="font-bold text-emerald-400">2. Fixed Take Profit (±1.0%)</div>
                  <p className="text-slate-400 text-[11px]">
                    Take profit is fixed exactly at ±1.0% net change from the previous day close.
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-[#171720] border border-slate-800 space-y-1">
                  <div className="font-bold text-orange-400">3. Stop Loss Rule (Daily Open)</div>
                  <p className="text-slate-400 text-[11px]">
                    All trades use today's daily open as the invalidation stop price.
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-[#171720] border border-slate-800 space-y-1">
                  <div className="font-bold text-sky-400">4. One Active Trade</div>
                  <p className="text-slate-400 text-[11px]">
                    Once one side triggers (e.g. Buy), cancel the opposite pending stop order (Sell Stop).
                  </p>
                </div>
              </div>
            </div>

            {/* Manual Override Form */}
            <div className="p-4 rounded-2xl bg-[#171720] border border-slate-800 space-y-3">
              <div className="text-xs font-black text-white flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#D4A24C]" /> Manual Price Override
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Previous Day Close ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={prevCloseStr}
                  onChange={(e) => setPrevCloseStr(e.target.value)}
                  placeholder="Auto-synced from feed"
                  className="w-full bg-[#1F1F2C] border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs font-bold focus:outline-none focus:border-[#D4A24C]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Today's Open ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={dailyOpenStr}
                  onChange={(e) => setDailyOpenStr(e.target.value)}
                  placeholder="Auto-synced from feed"
                  className="w-full bg-[#1F1F2C] border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs font-bold focus:outline-none focus:border-orange-400"
                />
              </div>
              <button
                onClick={applyManual}
                className="w-full py-2 rounded-xl bg-[#D4A24C] hover:bg-[#c3913d] text-[#0B0B0C] font-black text-xs transition"
              >
                Apply Manual Anchors
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          TAB 2: TRADINGVIEW CHART
      ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'chart' && (
        <div className="rounded-3xl border border-slate-800 bg-[#0E0E12] overflow-hidden shadow-2xl">
          <div className="p-4 bg-[#141419] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#D4A24C] animate-pulse" />
              <span className="text-sm font-black text-white">{selectedSymbol} · {selectedInterval === 'D' ? 'Daily' : selectedInterval}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Feeds */}
              <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-0.5 text-[10px] font-bold">
                {[{ l: 'OANDA', v: 'OANDA:XAUUSD' }, { l: 'FOREX.COM', v: 'FOREXCOM:XAUUSD' }, { l: 'TVC', v: 'TVC:GOLD' }].map(s => (
                  <button
                    key={s.v}
                    onClick={() => setSelectedSymbol(s.v)}
                    className={`px-3 py-1.5 rounded-lg transition ${selectedSymbol === s.v ? 'bg-[#D4A24C] text-[#0B0B0C]' : 'text-slate-400 hover:text-white'}`}
                  >
                    {s.l}
                  </button>
                ))}
              </div>

              {/* Intervals */}
              <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-0.5 text-[10px] font-bold">
                {[{ l: 'D1', v: 'D' }, { l: '4H', v: '240' }, { l: '1H', v: '60' }, { l: '15M', v: '15' }].map(t => (
                  <button
                    key={t.v}
                    onClick={() => setSelectedInterval(t.v)}
                    className={`px-3 py-1.5 rounded-lg transition ${selectedInterval === t.v ? 'bg-[#D4A24C] text-[#0B0B0C]' : 'text-slate-400 hover:text-white'}`}
                  >
                    {t.l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full h-[480px] bg-[#0E0E12]">
            <TradingViewChartWidget symbol={selectedSymbol} interval={selectedInterval} />
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          TAB 3: LOGGED TRADES JOURNAL
      ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'journal' && (
        <div className="rounded-3xl border border-slate-800 bg-[#121217] p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-white">Your Logged Signal Trades Today</h2>
              <p className="text-xs text-slate-400">All executions recorded for {today}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => openLogModal('buy')}
                className="px-3 py-1.5 rounded-xl font-bold text-xs bg-emerald-500 text-white hover:bg-emerald-600 transition"
              >
                + Buy
              </button>
              <button
                onClick={() => openLogModal('sell')}
                className="px-3 py-1.5 rounded-xl font-bold text-xs bg-rose-500 text-white hover:bg-rose-600 transition"
              >
                + Sell
              </button>
            </div>
          </div>

          {todayTrades.length === 0 ? (
            <div className="p-10 text-center text-slate-500 space-y-2">
              <History className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-sm font-bold text-slate-400">No trades logged yet for today.</p>
              <p className="text-xs text-slate-500">Click the buttons above or on the signal cards to record your execution.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800 border border-slate-800 rounded-2xl overflow-hidden bg-[#16161E]">
              {todayTrades.map((t) => (
                <div key={t.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-black ${
                        t.trade_direction === 'buy'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {t.trade_direction === 'buy' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="text-xs font-black text-white flex items-center gap-2">
                        <span>{t.trade_direction.toUpperCase()} STOP</span>
                        <span className="text-slate-400">· {t.lot_size} Lots</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                          {t.trade_result.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Entry: <strong className="text-white">${fmtPrice(t.entry_price)}</strong> | TP: <strong className="text-emerald-400">${t.take_profit ? fmtPrice(t.take_profit) : '—'}</strong> | SL: <strong className="text-orange-400">${t.stop_loss ? fmtPrice(t.stop_loss) : '—'}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-xs text-slate-500">
                    {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {t.notes && <div className="text-[10px] text-slate-400 italic truncate max-w-xs">{t.notes}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SignalPage;
