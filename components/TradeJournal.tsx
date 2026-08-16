import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TradeEntry, TradeOutcome, TradeValidationStatus, User } from '../types';
import { journalService } from '../services/journalService';
import { supabase } from '../supabase/client';
import { exportTradeJournal } from '../services/exportService';
import {
  Plus, Search, Filter, ArrowUpRight, ArrowDownRight, MoreHorizontal,
  Calendar, DollarSign, Smile, Frown, Meh, Save, X, Upload, Image as ImageIcon,
  Trash2, Eye, ArrowUpDown, ChevronDown, Loader2, Download, FileText, ChevronRight,
  CheckCircle, AlertCircle, XCircle
} from 'lucide-react';

interface TradeJournalProps {
  user: User;
}

const EMOTIONS = ['Confident', 'Anxious', 'FOMO', 'Patient', 'Revenge', 'Disciplined'];

// Add new constants for enhanced fields
const STRATEGIES = ['Breakout', 'Pullback', 'Trend Following', 'Mean Reversion', 'News Trade', 'Scalping', 'Swing Trade'];
const TIME_FRAMES = ['1M', '5M', '15M', '30M', '1H', '4H', 'Daily', 'Weekly'];
const MARKET_CONDITIONS = ['Trending', 'Ranging', 'Volatile', 'Consolidating', 'News Event'];
const TRADE_SOURCES = ['Demo', 'Live', 'Paper'];

type SortOption = 'date' | 'pnl';
type SortDirection = 'asc' | 'desc';

const TradeJournal: React.FC<TradeJournalProps> = ({ user }) => {
  const [entries, setEntries] = useState<TradeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null); // Add this state for delete operations
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TradeEntry | null>(null);

  // --- Filtering & Sorting State ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'buy' | 'sell'>('all');
  const [filterOutcome, setFilterOutcome] = useState<'all' | 'win' | 'loss' | 'breakeven' | 'pending'>('all');
  const [sortConfig, setSortConfig] = useState<{ key: SortOption; direction: SortDirection }>({
    key: 'date',
    direction: 'desc'
  });

  // Form State
  const [formData, setFormData] = useState<Partial<TradeEntry>>({
    pair: 'EURUSD',
    type: 'buy',
    status: 'pending',
    validationResult: 'none',
    emotions: [],
    date: new Date().toISOString().split('T')[0],
    // Initialize new fields
    strategy: '',
    timeFrame: '',
    marketCondition: '',
    confidenceLevel: 5,
    riskAmount: undefined,
    positionSize: undefined,
    tradeDuration: '',
    tags: [],
    tradeSource: 'demo',
    screenshotUrl: '',
    exitPrice: undefined,
    pnl: undefined
  });

  // Fetch real journal entries
  useEffect(() => {
    const fetchEntries = async () => {
      try {
        setLoading(true);
        const entriesData = await journalService.getJournalEntries(user.id);
        setEntries(entriesData);
      } catch (err) {
        console.error('Error fetching journal entries:', err);
        setError('Failed to load journal entries');
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();

    // Set up real-time subscription for journal entries
    const channel = supabase
      .channel('journal-entries-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'journal_entries',
          filter: `user_id=eq.${user.id}` // Changed back to user_id for journal entries
        },
        (payload) => {
          // Add new entry to the list
          const newEntry: TradeEntry = {
            id: payload.new.id,
            pair: payload.new.pair,
            type: payload.new.type,
            entryPrice: payload.new.entry_price,
            stopLoss: payload.new.stop_loss,
            takeProfit: payload.new.take_profit,
            exitPrice: payload.new.exit_price,
            status: payload.new.status,
            validationResult: payload.new.validation_result,
            notes: payload.new.notes,
            date: payload.new.date,
            emotions: payload.new.emotions,
            pnl: payload.new.pnl,
            screenshotUrl: payload.new.screenshot_url,
            // Include new fields
            strategy: payload.new.strategy,
            timeFrame: payload.new.time_frame,
            marketCondition: payload.new.market_condition,
            confidenceLevel: payload.new.confidence_level,
            riskAmount: payload.new.risk_amount,
            positionSize: payload.new.position_size,
            tradeDuration: payload.new.trade_duration,
            tags: payload.new.tags,
            adminNotes: payload.new.admin_notes,
            adminReviewStatus: payload.new.admin_review_status,
            reviewTimestamp: payload.new.review_timestamp,
            mentorId: payload.new.mentor_id,
            sessionId: payload.new.session_id,
            tradeSource: payload.new.trade_source
          };
          setEntries(prev => [newEntry, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'journal_entries',
          filter: `user_id=eq.${user.id}` // Changed back to user_id for journal entries
        },
        (payload) => {
          // Update existing entry
          const updatedEntry: TradeEntry = {
            id: payload.new.id,
            pair: payload.new.pair,
            type: payload.new.type,
            entryPrice: payload.new.entry_price,
            stopLoss: payload.new.stop_loss,
            takeProfit: payload.new.take_profit,
            exitPrice: payload.new.exit_price,
            status: payload.new.status,
            validationResult: payload.new.validation_result,
            notes: payload.new.notes,
            date: payload.new.date,
            emotions: payload.new.emotions,
            pnl: payload.new.pnl,
            screenshotUrl: payload.new.screenshot_url,
            // Include new fields
            strategy: payload.new.strategy,
            timeFrame: payload.new.time_frame,
            marketCondition: payload.new.market_condition,
            confidenceLevel: payload.new.confidence_level,
            riskAmount: payload.new.risk_amount,
            positionSize: payload.new.position_size,
            tradeDuration: payload.new.trade_duration,
            tags: payload.new.tags,
            adminNotes: payload.new.admin_notes,
            adminReviewStatus: payload.new.admin_review_status,
            reviewTimestamp: payload.new.review_timestamp,
            mentorId: payload.new.mentor_id,
            sessionId: payload.new.session_id,
            tradeSource: payload.new.trade_source
          };
          setEntries(prev => prev.map(entry => entry.id === updatedEntry.id ? updatedEntry : entry));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'journal_entries',
          filter: `user_id=eq.${user.id}` // Changed back to user_id for journal entries
        },
        (payload) => {
          // Remove deleted entry
          setEntries(prev => prev.filter(entry => entry.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEntry(null);
    setFormData({
      pair: 'EURUSD',
      type: 'buy',
      status: 'pending',
      validationResult: 'none',
      emotions: [],
      date: new Date().toISOString().split('T')[0],
      // Reset all fields
      strategy: '',
      timeFrame: '',
      marketCondition: '',
      confidenceLevel: 5,
      riskAmount: undefined,
      positionSize: undefined,
      tradeDuration: '',
      tags: [],
      tradeSource: 'demo',
      screenshotUrl: '',
      exitPrice: undefined,
      pnl: undefined
    });
  };

  // Add this new function to handle editing an entry
  const handleEditEntry = (entry: TradeEntry) => {
    setEditingEntry(entry);
    setFormData({
      pair: entry.pair,
      type: entry.type,
      entryPrice: entry.entryPrice,
      stopLoss: entry.stopLoss,
      takeProfit: entry.takeProfit,
      exitPrice: entry.exitPrice,
      status: entry.status,
      validationResult: entry.validationResult,
      notes: entry.notes,
      date: entry.date,
      emotions: entry.emotions || [],
      pnl: entry.pnl,
      screenshotUrl: entry.screenshotUrl,
      // Include new fields
      strategy: entry.strategy,
      timeFrame: entry.timeFrame,
      marketCondition: entry.marketCondition,
      confidenceLevel: entry.confidenceLevel,
      riskAmount: entry.riskAmount,
      positionSize: entry.positionSize,
      tradeDuration: entry.tradeDuration,
      tags: entry.tags,
      tradeSource: entry.tradeSource
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Automatically determine trade status based on P&L if provided
      let status = formData.status || 'pending';
      const pnl = formData.pnl ? Number(formData.pnl) : undefined;

      // If P&L is provided, automatically set status
      if (pnl !== undefined) {
        if (pnl > 0) {
          status = 'win';
        } else if (pnl < 0) {
          status = 'loss';
        } else {
          status = 'breakeven';
        }
      }

      // If exit price is provided but P&L is not, calculate P&L
      let calculatedPnl = pnl;
      if (formData.exitPrice && formData.entryPrice && calculatedPnl === undefined) {
        const entryPrice = Number(formData.entryPrice) || 0;
        const exitPrice = Number(formData.exitPrice) || 0;
        const type = formData.type || 'buy';
        const pair = formData.pair || 'EURUSD';
        const positionSize = formData.positionSize ? Number(formData.positionSize) : 1; // Default to 1 lot

        // Calculate P&L based on trade type and pair
        let priceDifference = 0;
        if (type === 'buy') {
          priceDifference = exitPrice - entryPrice;
        } else {
          priceDifference = entryPrice - exitPrice;
        }

        // Calculate pip value (simplified - in a real system this would be more complex)
        // For most pairs, 1 pip = 0.0001; for JPY pairs, 1 pip = 0.01
        const pipValue = pair.endsWith('JPY') ? 0.01 : 0.0001;
        const pips = priceDifference / pipValue;

        // Standard lot = 100,000 units of base currency
        // Mini lot = 10,000 units
        // Micro lot = 1,000 units
        // Nano lot = 100 units
        calculatedPnl = pips * positionSize; // Simplified calculation

        // Set status based on calculated P&L
        if (calculatedPnl > 0) {
          status = 'win';
        } else if (calculatedPnl < 0) {
          status = 'loss';
        } else {
          status = 'breakeven';
        }
      }

      // Validate that manually entered status matches calculated P&L
      if (pnl !== undefined && status !== formData.status) {
        if (!window.confirm(`The calculated outcome based on P&L (${calculatedPnl >= 0 ? (calculatedPnl > 0 ? 'Win' : 'Breakeven') : 'Loss'}) doesn't match the manually entered status (${formData.status}). Do you want to use the calculated outcome?`)) {
          // User chose to keep the manually entered status
          status = formData.status;
        }
      }

      const entryData: Omit<TradeEntry, 'id'> = {
        pair: formData.pair || 'EURUSD',
        type: formData.type || 'buy',
        entryPrice: Number(formData.entryPrice) || 0,
        stopLoss: Number(formData.stopLoss) || 0,
        takeProfit: Number(formData.takeProfit) || 0,
        exitPrice: formData.exitPrice ? Number(formData.exitPrice) : undefined,
        status: status, // Use calculated status
        validationResult: formData.validationResult || 'none',
        notes: formData.notes || '',
        date: formData.date || new Date().toISOString(),
        emotions: formData.emotions || [],
        pnl: calculatedPnl, // Use calculated P&L if available
        screenshotUrl: formData.screenshotUrl || undefined,
        // Include new fields
        strategy: formData.strategy || undefined,
        timeFrame: formData.timeFrame || undefined,
        marketCondition: formData.marketCondition || undefined,
        confidenceLevel: formData.confidenceLevel,
        riskAmount: formData.riskAmount ? Number(formData.riskAmount) : undefined,
        positionSize: formData.positionSize ? Number(formData.positionSize) : undefined,
        tradeDuration: formData.tradeDuration || undefined,
        tags: formData.tags || undefined,
        tradeSource: formData.tradeSource || 'demo'
      };

      // Ensure manually journalized trades never go through AI validation
      entryData.validationResult = 'none';

      if (editingEntry) {
        // Update existing entry
        const success = await journalService.updateJournalEntry(editingEntry.id, entryData);
        if (success) {
          // The real-time subscription will automatically update the entries list
          handleCloseModal();
        } else {
          setError('Failed to update journal entry');
        }
      } else {
        // Create new entry
        const result = await journalService.createJournalEntry(entryData, user.id);
        if (result) {
          // The real-time subscription will automatically update the entries list
          handleCloseModal();
        } else {
          setError('Failed to create journal entry');
        }
      }
    } catch (err) {
      console.error('Error saving journal entry:', err);
      setError('Failed to save journal entry');
    } finally {
      setSaving(false);
    }
  };

  const toggleEmotion = (emotion: string) => {
    setFormData(prev => {
      const current = prev.emotions || [];
      return current.includes(emotion)
        ? { ...prev, emotions: current.filter(e => e !== emotion) }
        : { ...prev, emotions: [...current, emotion] };
    });
  };

  // Add function to toggle tags
  const toggleTag = (tag: string) => {
    setFormData(prev => {
      const current = prev.tags || [];
      return current.includes(tag)
        ? { ...prev, tags: current.filter(t => t !== tag) }
        : { ...prev, tags: [...current, tag] };
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, screenshotUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setFormData(prev => ({ ...prev, screenshotUrl: undefined }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSort = (key: SortOption) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  // --- Logic: Filter & Sort Entries ---
  const processedEntries = useMemo(() => {
    // 1. Filter
    const filtered = entries.filter(entry => {
      const matchesSearch = (entry.pair && entry.pair.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (entry.notes && entry.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (entry.strategy && entry.strategy.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = filterType === 'all' || (entry.type && entry.type === filterType);
      const matchesOutcome = filterOutcome === 'all' || (entry.status && entry.status === filterOutcome);
      return matchesSearch && matchesType && matchesOutcome;
    });

    // 2. Sort
    return filtered.sort((a, b) => {
      let aValue: any = a[sortConfig.key];
      let bValue: any = b[sortConfig.key];

      if (sortConfig.key === 'date') {
        aValue = new Date(a.date).getTime();
        bValue = new Date(b.date).getTime();
      } else if (sortConfig.key === 'pnl') {
        aValue = a.pnl || 0;
        bValue = b.pnl || 0;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [entries, searchTerm, filterType, filterOutcome, sortConfig]);

  // --- Logic: Calculate Stats based on FILTERED view ---
  const stats = useMemo(() => {
    const total = processedEntries.length;
    const wins = processedEntries.filter(e => e.status === 'win').length;
    const losses = processedEntries.filter(e => e.status === 'loss').length;
    const winRate = total > 0 && (wins + losses) > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;
    const totalPnL = processedEntries.reduce((acc, curr) => acc + (curr.pnl || 0), 0);

    return { total, winRate, totalPnL };
  }, [processedEntries]);

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="mt-2 text-gray-400">Loading your journal entries...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 text-center">
        <p className="text-red-200">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  // Add this function to handle delete operations
  const handleDeleteEntry = async (entryId: string) => {
    if (!window.confirm('Are you sure you want to delete this trade entry? This action cannot be undone.')) {
      return;
    }

    setDeleting(entryId);
    try {
      const success = await journalService.deleteJournalEntry(entryId);
      if (success) {
        // The real-time subscription will automatically update the entries list
        // But we can also manually remove it for immediate feedback
        setEntries(prev => prev.filter(entry => entry.id !== entryId));
      } else {
        setError('Failed to delete journal entry');
      }
    } catch (err) {
      console.error('Error deleting journal entry:', err);
      setError('Failed to delete journal entry');
    } finally {
      setDeleting(null);
    }
  };

  // Function to handle export
  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      await exportTradeJournal(entries, format, `trade-journal-${user.name || 'user'}-${new Date().toISOString().split('T')[0]}`);
      setShowExportModal(false);
    } catch (error) {
      console.error(`Error exporting to ${format.toUpperCase()}:`, error);
      // In a real app, you would show an error message to the user
    }
  };

  return (
    <div className="text-slate-700 font-sans pb-6">
      {/* ── PAGE HEADER ─────────────────────────────── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-slate-900 tracking-tight">Trade Journal</h1>
          <p className="text-slate-500 text-xs md:text-sm mt-0.5">Track performance &amp; trading psychology</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExportModal(true)}
            className="h-9 w-9 flex items-center justify-center bg-white border border-slate-200 rounded-xl shadow-sm text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition md:w-auto md:px-3 md:gap-1.5 md:text-sm md:font-semibold"
          >
            <Download className="h-4 w-4 flex-shrink-0" />
            <span className="hidden md:inline">Export</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="h-9 flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-xl text-sm font-bold shadow-sm transition"
          >
            <Plus className="h-4 w-4" />
            <span>New Trade</span>
          </button>
        </div>
      </div>

      {/* ── STATS STRIP ── full-bleed 3-col ─────────── */}
      <div className="grid grid-cols-3 border-t border-b border-slate-200 bg-white divide-x divide-slate-200">
        <div className="flex flex-col items-center justify-center py-4 px-2">
          <span className="text-[10px] font-700 uppercase tracking-wider text-slate-400 mb-1">Win Rate</span>
          <span className={`text-2xl font-extrabold tabular-nums ${stats.winRate >= 50 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {stats.winRate}%
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">filtered</span>
        </div>
        <div className="flex flex-col items-center justify-center py-4 px-2">
          <span className="text-[10px] font-700 uppercase tracking-wider text-slate-400 mb-1">Net P&amp;L</span>
          <span className={`text-2xl font-extrabold tabular-nums ${stats.totalPnL >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            ${stats.totalPnL.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">filtered</span>
        </div>
        <div className="flex flex-col items-center justify-center py-4 px-2">
          <span className="text-[10px] font-700 uppercase tracking-wider text-slate-400 mb-1">Trades</span>
          <span className="text-2xl font-extrabold text-slate-900 tabular-nums">{stats.total}</span>
          <span className="text-[10px] text-slate-400 mt-0.5">shown</span>
        </div>
      </div>

      {/* ── SEARCH BAR ── full-bleed ─────────────────── */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 md:hidden">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search pairs, notes, strategies..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* ── FILTER CHIP BAR ── horizontal scroll ─────── */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar bg-white border-b border-slate-200 px-4 py-2.5 md:hidden">
        {/* Type filter */}
        {(['all', 'buy', 'sell'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition ${
              filterType === t
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-white border-slate-200 text-slate-500'
            }`}
          >
            {t === 'all' ? 'All' : t === 'buy' ? '▲ Buys' : '▼ Sells'}
          </button>
        ))}
        <div className="w-px bg-slate-200 flex-shrink-0 self-stretch my-1" />
        {/* Outcome filter */}
        {(['all', 'win', 'loss', 'breakeven'] as const).map((o) => (
          <button
            key={o}
            onClick={() => setFilterOutcome(o)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition ${
              filterOutcome === o
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-white border-slate-200 text-slate-500'
            }`}
          >
            {o === 'all' ? 'All Results' : o.charAt(0).toUpperCase() + o.slice(1)}
          </button>
        ))}
        <div className="w-px bg-slate-200 flex-shrink-0 self-stretch my-1" />
        {/* Sort */}
        <button
          onClick={() => handleSort('date')}
          className={`flex-shrink-0 flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-semibold border transition ${
            sortConfig.key === 'date' ? 'bg-slate-800 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-500'
          }`}
        >
          <Calendar className="h-3 w-3" />
          Date
          {sortConfig.key === 'date' && <ArrowUpDown className={`h-3 w-3 transition-transform ${sortConfig.direction === 'asc' ? 'rotate-180' : ''}`} />}
        </button>
        <button
          onClick={() => handleSort('pnl')}
          className={`flex-shrink-0 flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-semibold border transition ${
            sortConfig.key === 'pnl' ? 'bg-slate-800 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-500'
          }`}
        >
          <DollarSign className="h-3 w-3" />
          P&amp;L
          {sortConfig.key === 'pnl' && <ArrowUpDown className={`h-3 w-3 transition-transform ${sortConfig.direction === 'asc' ? 'rotate-180' : ''}`} />}
        </button>
      </div>

      {/* ── DESKTOP SEARCH + FILTER BAR ─────────────── */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 p-3 md:p-4 space-y-3 md:space-y-0 md:flex md:flex-row md:gap-4 md:items-center shadow-card mb-4 mx-4 mt-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search pairs, notes..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <select className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 flex-shrink-0 font-medium" value={filterType} onChange={(e) => setFilterType(e.target.value as any)}>
            <option value="all">All Types</option>
            <option value="buy">Buys</option>
            <option value="sell">Sells</option>
          </select>
          <select className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 flex-shrink-0 font-medium" value={filterOutcome} onChange={(e) => setFilterOutcome(e.target.value as any)}>
            <option value="all">All Outcomes</option>
            <option value="win">Wins</option>
            <option value="loss">Losses</option>
            <option value="breakeven">Breakeven</option>
          </select>
          <button onClick={() => handleSort('date')} className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm border transition flex-shrink-0 font-semibold ${sortConfig.key === 'date' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
            <Calendar className="h-4 w-4" /> Date
            {sortConfig.key === 'date' && <ArrowUpDown className={`h-3 w-3 ml-1 transition-transform ${sortConfig.direction === 'asc' ? 'rotate-180' : ''}`} />}
          </button>
          <button onClick={() => handleSort('pnl')} className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm border transition flex-shrink-0 font-semibold ${sortConfig.key === 'pnl' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
            <DollarSign className="h-4 w-4" /> P&amp;L
            {sortConfig.key === 'pnl' && <ArrowUpDown className={`h-3 w-3 ml-1 transition-transform ${sortConfig.direction === 'asc' ? 'rotate-180' : ''}`} />}
          </button>
        </div>
      </div>

      {/* ── MOBILE TRADE LIST ── full-bleed iOS-style ── */}
      <div className="md:hidden">
        {processedEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border-t border-slate-200 gap-3 text-center px-6">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
              <Search className="h-7 w-7 text-slate-300" />
            </div>
            <p className="text-slate-700 font-semibold text-base">No trades found</p>
            <p className="text-slate-400 text-sm">Try adjusting your filters or log a new trade.</p>
          </div>
        ) : (
          <div className="bg-white border-t border-slate-200">
            {processedEntries.map((entry, idx) => {
              const pnlPositive = entry.pnl != null && entry.pnl > 0;
              const pnlNegative = entry.pnl != null && entry.pnl < 0;
              const statusColor = entry.status === 'win' ? 'bg-emerald-500' : entry.status === 'loss' ? 'bg-red-500' : entry.status === 'breakeven' ? 'bg-amber-500' : 'bg-slate-300';
              return (
                <div
                  key={entry.id}
                  className={`px-4 py-3.5 ${idx < processedEntries.length - 1 ? 'border-b border-slate-100' : ''}`}
                >
                  {/* Row 1: Type badge + Pair + Date + PnL */}
                  <div className="flex items-center gap-3 mb-2">
                    {/* Left accent = win/loss color */}
                    <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${statusColor}`} style={{ minHeight: 36 }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-md flex-shrink-0 ${entry.type === 'buy' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                          {entry.type === 'buy' ? '▲' : '▼'} {entry.type}
                        </span>
                        <span className="font-bold text-slate-900 text-base truncate">{entry.pair}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="tabular-nums">{new Date(entry.date).toLocaleDateString()}</span>
                        {entry.timeFrame && <><span>·</span><span>{entry.timeFrame}</span></>}
                        {entry.strategy && <><span>·</span><span className="truncate max-w-[100px]">{entry.strategy}</span></>}
                      </div>
                    </div>
                    {/* Right: PnL */}
                    <div className="text-right flex-shrink-0">
                      <p className={`text-base font-extrabold tabular-nums ${pnlPositive ? 'text-emerald-600' : pnlNegative ? 'text-red-600' : 'text-slate-400'}`}>
                        {entry.pnl != null ? (entry.pnl > 0 ? `+$${entry.pnl}` : `$${entry.pnl}`) : '—'}
                      </p>
                      <p className={`text-[10px] font-semibold capitalize ${entry.status === 'win' ? 'text-emerald-500' : entry.status === 'loss' ? 'text-red-500' : 'text-slate-400'}`}>
                        {entry.status || '—'}
                      </p>
                    </div>
                  </div>

                  {/* Row 2: Notes + actions */}
                  {(entry.notes || entry.screenshotUrl) && (
                    <div className="flex items-center gap-2 pl-4">
                      {entry.notes && (
                        <p className="flex-1 text-slate-500 text-xs line-clamp-1 italic">"{entry.notes}"</p>
                      )}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {entry.screenshotUrl && (
                          <button onClick={() => setPreviewImage(entry.screenshotUrl!)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition">
                            <ImageIcon className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button onClick={() => handleEditEntry(entry)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition">
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                        </button>
                        <button onClick={() => handleDeleteEntry(entry.id)} disabled={deleting === entry.id} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-50">
                          {deleting === entry.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                  )}
                  {/* Actions even without notes */}
                  {!entry.notes && !entry.screenshotUrl && (
                    <div className="flex items-center justify-end gap-1 pl-4">
                      <button onClick={() => handleEditEntry(entry)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                      </button>
                      <button onClick={() => handleDeleteEntry(entry.id)} disabled={deleting === entry.id} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-50">
                        {deleting === entry.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Desktop Table View (>= md) ───────────────────── */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden shadow-card">
        <table className="w-full text-left text-sm min-w-[800px]">
          <thead className="bg-[#F8FAFC] text-slate-500 border-b border-slate-200 uppercase tracking-wider text-xs font-semibold">
            <tr>
              <th className="p-4 whitespace-nowrap">Date</th>
              <th className="p-4">Pair</th>
              <th className="p-4">Type</th>
              <th className="p-4">Setup Notes</th>
              <th className="p-4 text-center">Chart</th>
              <th className="p-4 text-right">P&L</th>
              <th className="p-4 text-center">Outcome</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {processedEntries.map((entry) => (
              <tr key={entry.id} className="hover:bg-slate-50 transition group">
                <td className="p-4 text-slate-500 tabular-nums text-xs font-medium">
                  {new Date(entry.date).toLocaleDateString()}
                </td>
                <td className="p-4 font-bold text-slate-900">{entry.pair}</td>
                <td className="p-4">
                  <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase flex items-center gap-1 w-fit ${entry.type === 'buy' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                    {entry.type === 'buy' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {entry.type}
                  </span>
                </td>
                <td className="p-4 text-slate-600 max-w-xs truncate" title={entry.notes}>
                  {entry.notes || <span className="text-slate-300 italic">No notes</span>}
                </td>
                <td className="p-4 text-center">
                  {entry.screenshotUrl ? (
                    <button
                      onClick={() => setPreviewImage(entry.screenshotUrl!)}
                      className="text-slate-500 hover:text-blue-600 transition p-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-blue-300"
                      title="View Chart"
                    >
                      <ImageIcon className="h-4 w-4" />
                    </button>
                  ) : (
                    <span className="text-slate-300">-</span>
                  )}
                </td>
                <td className={`p-4 text-right tabular-nums font-bold ${entry.pnl && entry.pnl > 0 ? 'text-emerald-600' :
                  entry.pnl && entry.pnl < 0 ? 'text-red-600' : 'text-slate-400'
                  }`}>
                  {entry.pnl ? (entry.pnl > 0 ? `+$${entry.pnl}` : `$${entry.pnl}`) : '-'}
                </td>
                <td className="p-4 text-center">
                  <div className="flex justify-center">
                    <span className={`w-2.5 h-2.5 rounded-full ${entry.status === 'win' ? 'bg-emerald-500' :
                      entry.status === 'loss' ? 'bg-red-500' :
                        entry.status === 'breakeven' ? 'bg-amber-500' : 'bg-slate-300'
                      }`}></span>
                  </div>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => handleEditEntry(entry)}
                      className="text-slate-400 hover:text-slate-700 transition p-1.5 rounded-lg hover:bg-slate-100"
                      title="Edit Entry"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        <path d="m15 5 4 4" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      disabled={deleting === entry.id}
                      className="text-slate-400 hover:text-red-600 transition p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-50"
                      title="Delete Entry"
                    >
                      {deleting === entry.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {processedEntries.length === 0 && (
              <tr>
                <td colSpan={8} className="p-12 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <Search className="h-8 w-8 mb-3 opacity-40" />
                    <p className="text-lg font-bold text-slate-600">No trades found</p>
                    <p className="text-sm text-slate-400">Try adjusting your filters or search term.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 text-gray-400 hover:text-white p-2"
            >
              <X className="h-8 w-8" />
            </button>
            <img
              src={previewImage}
              alt="Trade Preview"
              className="max-w-full max-h-[85vh] object-contain rounded-lg border border-gray-700 shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Add Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4 overflow-y-auto">
          <div className="bg-trade-dark border border-gray-700 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-2xl shadow-2xl sm:my-8 animate-in fade-in slide-in-from-bottom-4 sm:zoom-in duration-200">
            <form onSubmit={handleSubmit}>
              <div className="flex justify-between items-center p-6 border-b border-gray-700 bg-gray-800/50 rounded-t-2xl">
                <h2 className="text-xl font-bold text-white">
                  {editingEntry ? 'Edit Trade Entry' : 'Log New Trade'}
                </h2>
                <button type="button" onClick={handleCloseModal} className="text-gray-400 hover:text-white">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {/* Top Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="col-span-1">
                    <label className="block text-xs text-gray-400 mb-1">Pair</label>
                    <input
                      type="text"
                      required
                      className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-trade-accent outline-none uppercase font-bold"
                      value={formData.pair}
                      onChange={e => setFormData({ ...formData, pair: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs text-gray-400 mb-1">Date</label>
                    <input
                      type="date"
                      required
                      className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-trade-accent outline-none"
                      value={formData.date ? new Date(formData.date).toISOString().split('T')[0] : ''}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-400 mb-1">Direction</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className={`flex-1 py-2 rounded font-bold text-sm flex items-center justify-center gap-2 border transition ${formData.type === 'buy' ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-gray-900 border-gray-600 text-gray-500 hover:bg-gray-800'}`}
                        onClick={() => setFormData({ ...formData, type: 'buy' })}
                      >
                        <ArrowUpRight className="h-4 w-4" /> BUY
                      </button>
                      <button
                        type="button"
                        className={`flex-1 py-2 rounded font-bold text-sm flex items-center justify-center gap-2 border transition ${formData.type === 'sell' ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-gray-900 border-gray-600 text-gray-500 hover:bg-gray-800'}`}
                        onClick={() => setFormData({ ...formData, type: 'sell' })}
                      >
                        <ArrowDownRight className="h-4 w-4" /> SELL
                      </button>
                    </div>
                  </div>
                </div>

                {/* Prices */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-800/30 p-4 rounded-lg border border-gray-700">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Entry Price</label>
                    <input
                      type="number" step="0.00001"
                      className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white outline-none focus:border-blue-500"
                      value={formData.entryPrice || ''}
                      onChange={e => setFormData({ ...formData, entryPrice: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Stop Loss</label>
                    <input
                      type="number" step="0.00001"
                      className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white outline-none text-red-400 focus:border-red-500"
                      value={formData.stopLoss || ''}
                      onChange={e => setFormData({ ...formData, stopLoss: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Take Profit</label>
                    <input
                      type="number" step="0.00001"
                      className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white outline-none text-green-400 focus:border-green-500"
                      value={formData.takeProfit || ''}
                      onChange={e => setFormData({ ...formData, takeProfit: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Exit Price</label>
                    <input
                      type="number" step="0.00001"
                      className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white outline-none"
                      value={formData.exitPrice || ''}
                      onChange={e => setFormData({ ...formData, exitPrice: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>
                </div>

                {/* Outcome & PnL */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Outcome</label>
                    <select
                      className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white outline-none"
                      value={formData.status || 'pending'}
                      onChange={e => setFormData({ ...formData, status: e.target.value as TradeOutcome })}
                    >
                      <option value="pending">Pending / Open</option>
                      <option value="win">Win</option>
                      <option value="loss">Loss</option>
                      <option value="breakeven">Breakeven</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Realized P&L ($)</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      className={`w-full bg-gray-900 border border-gray-600 rounded p-2 outline-none font-bold ${(formData.pnl || 0) > 0 ? 'text-green-400' : (formData.pnl || 0) < 0 ? 'text-red-400' : 'text-white'
                        }`}
                      value={formData.pnl || ''}
                      onChange={e => setFormData({ ...formData, pnl: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Setup Notes</label>
                  <textarea
                    rows={3}
                    className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white outline-none resize-none focus:border-trade-accent"
                    placeholder="Describe your confluence (e.g., 15m FVG, Liquidity Sweep...)"
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>

                {/* Screenshot Upload */}
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Chart Screenshot</label>
                  <div className="border-2 border-dashed border-gray-700 rounded-lg p-4 flex flex-col items-center justify-center bg-gray-800/30 hover:bg-gray-800/50 transition relative">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />

                    {formData.screenshotUrl ? (
                      <div className="relative w-full group">
                        <img
                          src={formData.screenshotUrl}
                          alt="Trade Setup"
                          className="w-full h-48 object-contain rounded-lg bg-black/50"
                        />
                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => setPreviewImage(formData.screenshotUrl!)}
                            className="bg-gray-900/80 p-2 rounded text-white hover:text-trade-accent"
                            title="View Fullscreen"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={clearImage}
                            className="bg-red-500/80 p-2 rounded text-white hover:bg-red-600"
                            title="Remove Image"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="text-center cursor-pointer w-full py-4"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className="bg-gray-700 p-3 rounded-full inline-flex mb-3">
                          <Upload className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-300 font-medium">Click to upload chart</p>
                        <p className="text-xs text-gray-500 mt-1">JPG, PNG up to 5MB</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Emotions */}
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Emotional State</label>
                  <div className="flex flex-wrap gap-2">
                    {EMOTIONS.map(emo => (
                      <button
                        key={emo}
                        type="button"
                        onClick={() => toggleEmotion(emo)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition border ${formData.emotions?.includes(emo)
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-gray-800 text-gray-400 border-gray-600 hover:border-gray-400'
                          }`}
                      >
                        {emo}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Strategy and Time Frame */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Strategy</label>
                    <select
                      className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-trade-accent outline-none"
                      value={formData.strategy || ''}
                      onChange={e => setFormData({ ...formData, strategy: e.target.value })}
                    >
                      <option value="">Select Strategy</option>
                      {STRATEGIES.map(strategy => (
                        <option key={strategy} value={strategy}>{strategy}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Time Frame</label>
                    <select
                      className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-trade-accent outline-none"
                      value={formData.timeFrame || ''}
                      onChange={e => setFormData({ ...formData, timeFrame: e.target.value })}
                    >
                      <option value="">Select Time Frame</option>
                      {TIME_FRAMES.map(tf => (
                        <option key={tf} value={tf}>{tf}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Market Condition and Confidence */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Market Condition</label>
                    <select
                      className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-trade-accent outline-none"
                      value={formData.marketCondition || ''}
                      onChange={e => setFormData({ ...formData, marketCondition: e.target.value })}
                    >
                      <option value="">Select Condition</option>
                      {MARKET_CONDITIONS.map(condition => (
                        <option key={condition} value={condition}>{condition}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Confidence Level: {formData.confidenceLevel || 5}/10</label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={formData.confidenceLevel || 5}
                      onChange={e => setFormData({ ...formData, confidenceLevel: Number(e.target.value) })}
                      className="w-full accent-trade-accent"
                    />
                  </div>
                </div>

                {/* Risk and Position */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Risk Amount ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white outline-none focus:border-blue-500"
                      value={formData.riskAmount || ''}
                      onChange={e => setFormData({ ...formData, riskAmount: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Position Size</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white outline-none focus:border-blue-500"
                      value={formData.positionSize || ''}
                      onChange={e => setFormData({ ...formData, positionSize: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>
                </div>

                {/* Trade Duration and Source */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Trade Duration</label>
                    <input
                      type="text"
                      placeholder="e.g., PT30M for 30 minutes"
                      className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white outline-none focus:border-trade-accent"
                      value={formData.tradeDuration || ''}
                      onChange={e => setFormData({ ...formData, tradeDuration: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Trade Source</label>
                    <select
                      className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-trade-accent outline-none"
                      value={formData.tradeSource || 'demo'}
                      onChange={e => setFormData({ ...formData, tradeSource: e.target.value as 'demo' | 'live' | 'paper' })}
                    >
                      {TRADE_SOURCES.map(source => (
                        <option key={source} value={source.toLowerCase()}>{source}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {['Scalping', 'Swing', 'News Trade', 'Technical', 'Fundamental', 'EURUSD', 'GBPUSD', 'Breakout', 'Pullback'].map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition border ${formData.tags?.includes(tag)
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-gray-800 text-gray-400 border-gray-600 hover:border-gray-400'
                          }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>


              </div>

              <div className="p-6 pb-[calc(1.5rem+60px)] sm:pb-6 border-t border-gray-700 flex justify-end gap-3 bg-gray-800/50 rounded-b-2xl">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-trade-accent hover:bg-blue-600 text-white rounded-lg font-medium flex items-center gap-2 transition shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {editingEntry ? 'Update Entry' : 'Save Entry'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-trade-dark border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl my-8 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-700 bg-gray-800/50 rounded-t-2xl">
              <h2 className="text-xl font-bold text-white">Export Trade Journal</h2>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <p className="text-gray-300">Choose a format to export your trade journal:</p>

              <div className="space-y-4">
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg p-4 flex items-center justify-between transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-500/20 p-2 rounded-lg">
                      <FileText className="h-6 w-6 text-blue-400" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-white">CSV Format</h3>
                      <p className="text-sm text-gray-400">Compatible with Excel and other spreadsheet applications</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>

                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg p-4 flex items-center justify-between transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-red-500/20 p-2 rounded-lg">
                      <FileText className="h-6 w-6 text-red-400" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-white">PDF Report</h3>
                      <p className="text-sm text-gray-400">Professional report format for sharing</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>
              </div>

              <div className="text-xs text-gray-500 mt-4">
                <p>Exporting {entries.length} trade entries</p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-700 flex justify-end gap-3 bg-gray-800/50 rounded-b-2xl">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// Add missing icon components
// Tiny Helper Components for Icons

export default TradeJournal;
