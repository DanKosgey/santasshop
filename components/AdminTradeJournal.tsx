import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TradeEntry, TradeOutcome, TradeValidationStatus } from '../types';
import { journalService } from '../services/journalService';
import { supabase } from '../supabase/client';
import { 
  Plus, Search, Filter, ArrowUpRight, ArrowDownRight, MoreHorizontal, 
  Calendar, DollarSign, Smile, Frown, Meh, Save, X, Upload, Image as ImageIcon, 
  Trash2, Eye, ArrowUpDown, ChevronDown, Loader2, Download, FileText, ChevronRight,
  CheckCircle, AlertCircle, XCircle, BarChart3, TrendingUp, TrendingDown,
  Activity, Target, Zap, Award, Flame, Anchor, Users, User
} from 'lucide-react';

const STRATEGIES = ['Breakout', 'Pullback', 'Trend Following', 'Mean Reversion', 'News Trade', 'Scalping', 'Swing Trade'];
const TIME_FRAMES = ['1M', '5M', '15M', '30M', '1H', '4H', 'Daily', 'Weekly'];
const MARKET_CONDITIONS = ['Trending', 'Ranging', 'Volatile', 'Consolidating', 'News Event'];
const TRADE_SOURCES = ['Demo', 'Live', 'Paper'];

type SortOption = 'date' | 'pnl';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'journal' | 'analytics';
type JournalView = 'personal' | 'all-students'; // New type for journal view

const AdminTradeJournal: React.FC = () => {
  const [entries, setEntries] = useState<TradeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('analytics');
  const [journalView, setJournalView] = useState<JournalView>('personal'); // New state for journal view
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingEntry, setEditingEntry] = useState<TradeEntry | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'buy' | 'sell'>('all');
  const [filterOutcome, setFilterOutcome] = useState<'all' | 'win' | 'loss' | 'breakeven' | 'pending'>('all');
  const [sortConfig, setSortConfig] = useState<{ key: SortOption; direction: SortDirection }>({
    key: 'date',
    direction: 'desc'
  });

  const [formData, setFormData] = useState<Partial<TradeEntry>>({
    pair: 'EURUSD',
    type: 'buy',
    status: 'pending',
    emotions: [],
    date: new Date().toISOString().split('T')[0],
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
    pnl: undefined,
    validationResult: 'none'
  });

  // Fetch journal entries based on view mode
  useEffect(() => {
    let channel: any = null;

    const fetchEntries = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        let entriesData: TradeEntry[] = [];
        
        if (journalView === 'personal') {
          // Fetch current admin's journal entries
          entriesData = await journalService.getJournalEntries(user.id);
        } else {
          // Fetch all students' journal entries for admin view
          const allEntries = await journalService.getAllJournalEntriesForAdmin();
          entriesData = allEntries.map((entry: any) => ({
            id: entry.id,
            pair: entry.pair,
            type: entry.type,
            entryPrice: entry.entry_price,
            stopLoss: entry.stop_loss,
            takeProfit: entry.take_profit,
            exitPrice: entry.exit_price,
            status: entry.status,
            validationResult: entry.validation_result,
            notes: entry.notes,
            date: entry.date,
            emotions: entry.emotions,
            pnl: entry.pnl,
            screenshotUrl: entry.screenshot_url,
            strategy: entry.strategy,
            timeFrame: entry.time_frame,
            marketCondition: entry.market_condition,
            confidenceLevel: entry.confidence_level,
            riskAmount: entry.risk_amount,
            positionSize: entry.position_size,
            tradeDuration: entry.trade_duration,
            tags: entry.tags,
            adminNotes: entry.admin_notes,
            adminReviewStatus: entry.admin_review_status,
            reviewTimestamp: entry.review_timestamp,
            mentorId: entry.mentor_id,
            sessionId: entry.session_id,
            tradeSource: entry.trade_source,
            // Additional fields for admin view
            studentName: entry.student_name,
            studentTier: entry.student_tier
          }));
        }
        
        setEntries(entriesData);
      } catch (err) {
        console.error('Error fetching journal entries:', err);
        setError('Failed to load journal entries');
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();

    // Set up real-time subscription
    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel('admin-journal-entries-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'journal_entries'
          },
          (payload) => {
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
            
            // For all students view, we might want to add student info
            if (journalView === 'all-students') {
              // In a real implementation, we would fetch student info here
              // For now, we'll just add the entry
              setEntries(prev => [newEntry, ...prev]);
            } else {
              // For personal view, only add if it belongs to current user
              if (payload.new.user_id === user.id) {
                setEntries(prev => [newEntry, ...prev]);
              }
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'journal_entries'
          },
          (payload) => {
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
            table: 'journal_entries'
          },
          (payload) => {
            setEntries(prev => prev.filter(entry => entry.id !== payload.old.id));
          }
        )
        .subscribe();
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [journalView]); // Add journalView as dependency

  // Add this function to handle delete operations
  const handleDeleteEntry = async (entryId: string) => {
    if (!window.confirm('Are you sure you want to delete this trade entry? This action cannot be undone.')) {
      return;
    }
    
    setDeleting(entryId);
    try {
      const success = await journalService.deleteJournalEntry(entryId);
      if (success) {
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

  const handleEditEntry = (entry: TradeEntry) => {
    setEditingEntry(entry);
    setFormData(entry);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let status = formData.status || 'pending';
      const pnl = formData.pnl ? Number(formData.pnl) : undefined;
      
      if (pnl !== undefined) {
        if (pnl > 0) {
          status = 'win';
        } else if (pnl < 0) {
          status = 'loss';
        } else {
          status = 'breakeven';
        }
      }

      const entryData: Omit<TradeEntry, 'id'> = {
        pair: formData.pair || 'EURUSD',
        type: formData.type || 'buy',
        entryPrice: Number(formData.entryPrice) || 0,
        stopLoss: Number(formData.stopLoss) || 0,
        takeProfit: Number(formData.takeProfit) || 0,
        exitPrice: formData.exitPrice ? Number(formData.exitPrice) : undefined,
        status: status as TradeOutcome,
        validationResult: formData.validationResult || 'none',
        notes: formData.notes || '',
        date: formData.date || new Date().toISOString(),
        emotions: formData.emotions || [],
        pnl: pnl,
        screenshotUrl: formData.screenshotUrl || undefined,
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

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('User not authenticated');
        return;
      }

      if (editingEntry) {
        const success = await journalService.updateJournalEntry(editingEntry.id, entryData);
        if (success) {
          handleCloseModal();
        } else {
          setError('Failed to update journal entry');
        }
      } else {
        const result = await journalService.createJournalEntry(entryData, user.id);
        if (result) {
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

  const processedEntries = useMemo(() => {
    const filtered = entries.filter(entry => {
      const matchesSearch = (entry.pair && entry.pair.toLowerCase().includes(searchTerm.toLowerCase())) || 
                            (entry.notes && entry.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (entry.strategy && entry.strategy.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = filterType === 'all' || (entry.type && entry.type === filterType);
      const matchesOutcome = filterOutcome === 'all' || (entry.status && entry.status === filterOutcome);
      return matchesSearch && matchesType && matchesOutcome;
    });

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

  const stats = useMemo(() => {
    const total = processedEntries.length;
    const wins = processedEntries.filter(e => e.status === 'win').length;
    const losses = processedEntries.filter(e => e.status === 'loss').length;
    const breakeven = processedEntries.filter(e => e.status === 'breakeven').length;
    const closedTrades = wins + losses + breakeven;
    const winRate = closedTrades > 0 ? Math.round((wins / closedTrades) * 100) : 0;
    const totalPnL = processedEntries.reduce((acc, curr) => acc + (curr.pnl || 0), 0);
    const avgPnL = closedTrades > 0 ? (totalPnL / closedTrades).toFixed(2) : 0;
    const largestWin = Math.max(...processedEntries.filter(e => e.pnl && e.pnl > 0).map(e => e.pnl || 0), 0);
    const largestLoss = Math.min(...processedEntries.filter(e => e.pnl && e.pnl < 0).map(e => e.pnl || 0), 0);
    const winSum = processedEntries.filter(e => e.status === 'win').reduce((a, c) => a + (c.pnl || 0), 0);
    const lossSum = Math.abs(processedEntries.filter(e => e.status === 'loss').reduce((a, c) => a + (c.pnl || 0), 0));
    const profitFactor = lossSum > 0 ? (winSum / lossSum).toFixed(2) : 'N/A';
    
    const strategyStats: Record<string, { wins: number; losses: number; pnl: number }> = {};
    processedEntries.forEach(e => {
      const strategy = e.strategy || 'Unknown';
      if (!strategyStats[strategy]) {
        strategyStats[strategy] = { wins: 0, losses: 0, pnl: 0 };
      }
      if (e.status === 'win') strategyStats[strategy].wins++;
      if (e.status === 'loss') strategyStats[strategy].losses++;
      strategyStats[strategy].pnl += e.pnl || 0;
    });

    const timeFrameStats: Record<string, { wins: number; losses: number; total: number }> = {};
    processedEntries.forEach(e => {
      const tf = e.timeFrame || 'Unknown';
      if (!timeFrameStats[tf]) {
        timeFrameStats[tf] = { wins: 0, losses: 0, total: 0 };
      }
      timeFrameStats[tf].total++;
      if (e.status === 'win') timeFrameStats[tf].wins++;
      if (e.status === 'loss') timeFrameStats[tf].losses++;
    });

    const pairStats: Record<string, { wins: number; losses: number; pnl: number; total: number }> = {};
    processedEntries.forEach(e => {
      const pair = e.pair || 'Unknown';
      if (!pairStats[pair]) {
        pairStats[pair] = { wins: 0, losses: 0, pnl: 0, total: 0 };
      }
      pairStats[pair].total++;
      if (e.status === 'win') pairStats[pair].wins++;
      if (e.status === 'loss') pairStats[pair].losses++;
      pairStats[pair].pnl += e.pnl || 0;
    });

    return { total, wins, losses, breakeven, winRate, totalPnL, avgPnL, largestWin, largestLoss, profitFactor, strategyStats, timeFrameStats, pairStats, closedTrades };
  }, [processedEntries]);

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

  return (
    <div className="text-slate-900 space-y-6 pb-20 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Trade Journal</h1>
          <p className="text-slate-500 text-sm">
            {journalView === 'personal' 
              ? 'Track your trading performance and analytics' 
              : 'Monitor all students trading performance and analytics'}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* View toggle buttons */}
          <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-white shadow-xs">
            <button
              onClick={() => setJournalView('personal')}
              className={`px-4 py-2 text-xs font-bold flex items-center gap-2 transition ${
                journalView === 'personal'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <User className="h-4 w-4" />
              My Trades
            </button>
            <button
              onClick={() => setJournalView('all-students')}
              className={`px-4 py-2 text-xs font-bold flex items-center gap-2 transition ${
                journalView === 'all-students'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Users className="h-4 w-4" />
              All Students
            </button>
          </div>
          
          <button 
            onClick={() => setViewMode('analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              viewMode === 'analytics' 
                ? 'bg-blue-600 text-white shadow-blue-glow' 
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <BarChart3 className="h-4 w-4" /> Analytics
          </button>
          <button 
            onClick={() => setViewMode('journal')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              viewMode === 'journal' 
                ? 'bg-blue-600 text-white shadow-blue-glow' 
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <FileText className="h-4 w-4" /> Journal
          </button>
          <button 
            onClick={() => {
              setEditingEntry(null);
              setFormData({
                pair: 'EURUSD',
                type: 'buy',
                status: 'pending',
                emotions: [],
                date: new Date().toISOString().split('T')[0],
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
                pnl: undefined,
                validationResult: 'none'
              });
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-blue-glow"
          >
            <Plus className="h-4 w-4" /> New Entry
          </button>
        </div>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="mt-2 text-slate-500 text-sm font-medium">
              {journalView === 'personal' 
                ? 'Loading your journal entries...' 
                : 'Loading all students journal entries...'}
            </p>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 text-sm font-semibold">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-xl text-white text-xs font-bold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main content - only shown when not loading and no error */}
      {!loading && !error && (
        <>
          {/* Analytics View */}
          {viewMode === 'analytics' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card min-w-0 flex flex-col justify-between overflow-hidden">
                  <div className="flex items-center justify-between mb-2 min-w-0">
                    <div className="text-slate-500 text-xs font-bold uppercase tracking-wider truncate">Win Rate</div>
                    <Award className="h-5 w-5 text-amber-500 shrink-0" />
                  </div>
                  <div className="text-2xl md:text-3xl font-extrabold text-slate-900 tabular-nums truncate">{stats.winRate}%</div>
                  <div className="text-xs text-slate-500 mt-2 font-medium truncate">{stats.wins} Wins / {stats.losses} Losses</div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card min-w-0 flex flex-col justify-between overflow-hidden">
                  <div className="flex items-center justify-between mb-2 min-w-0">
                    <div className="text-slate-500 text-xs font-bold uppercase tracking-wider truncate">Total P&L</div>
                    <TrendingUp className={`h-5 w-5 shrink-0 ${stats.totalPnL >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
                  </div>
                  <div className={`text-2xl md:text-3xl font-extrabold tabular-nums truncate ${stats.totalPnL >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    ${stats.totalPnL.toFixed(2)}
                  </div>
                  <div className="text-xs text-slate-500 mt-2 font-medium truncate">Avg: ${stats.avgPnL}</div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card min-w-0 flex flex-col justify-between overflow-hidden">
                  <div className="flex items-center justify-between mb-2 min-w-0">
                    <div className="text-slate-500 text-xs font-bold uppercase tracking-wider truncate">Profit Factor</div>
                    <Zap className="h-5 w-5 text-purple-600 shrink-0" />
                  </div>
                  <div className="text-2xl md:text-3xl font-extrabold text-slate-900 tabular-nums truncate">{stats.profitFactor}</div>
                  <div className="text-xs text-slate-500 mt-2 font-medium truncate">Wins to Losses Ratio</div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card min-w-0 flex flex-col justify-between overflow-hidden">
                  <div className="flex items-center justify-between mb-2 min-w-0">
                    <div className="text-slate-500 text-xs font-bold uppercase tracking-wider truncate">Total Trades</div>
                    <Activity className="h-5 w-5 text-blue-600 shrink-0" />
                  </div>
                  <div className="text-2xl md:text-3xl font-extrabold text-slate-900 tabular-nums truncate">{stats.total}</div>
                  <div className="text-xs text-slate-500 mt-2 font-medium truncate">{stats.closedTrades} Closed</div>
                </div>
              </div>

              {/* Win/Loss Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card min-w-0 flex flex-col justify-between overflow-hidden">
                  <div className="flex items-center gap-3 mb-4 min-w-0">
                    <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 shrink-0">
                      <ArrowUpRight className="h-5 w-5 text-emerald-600" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 truncate">Largest Win</h3>
                  </div>
                  <div className="text-2xl md:text-3xl font-extrabold text-emerald-600 tabular-nums truncate">${stats.largestWin.toFixed(2)}</div>
                  <div className="text-xs text-slate-500 mt-1 font-medium truncate">Best performing trade</div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card min-w-0 flex flex-col justify-between overflow-hidden">
                  <div className="flex items-center gap-3 mb-4 min-w-0">
                    <div className="p-2.5 bg-red-50 rounded-xl border border-red-200 shrink-0">
                      <ArrowDownRight className="h-5 w-5 text-red-600" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 truncate">Largest Loss</h3>
                  </div>
                  <div className="text-2xl md:text-3xl font-extrabold text-red-600 tabular-nums truncate">-${Math.abs(stats.largestLoss).toFixed(2)}</div>
                  <div className="text-xs text-slate-500 mt-1 font-medium truncate">Worst performing trade</div>
                </div>
              </div>

              {/* Strategy Performance */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" /> Strategy Performance
                </h3>
                <div className="space-y-3">
                  {Object.entries(stats.strategyStats).sort((a, b) => (b[1] as any).pnl - (a[1] as any).pnl).map(([strategy, data]) => (
                    <div key={strategy} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 transition group">
                      <div className="flex-1">
                        <div className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition">{strategy}</div>
                        <div className="text-xs text-slate-500 font-medium">{(data as any).wins}W / {(data as any).losses}L</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-blue-600 h-full transition-all duration-500" 
                            style={{ width: `${Math.min((Math.abs((data as any).pnl) / Math.abs(stats.totalPnL) * 100) || 0, 100)}%` }}
                          />
                        </div>
                        <div className={`text-base font-bold w-24 text-right tabular-nums ${(data as any).pnl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          ${(data as any).pnl.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Currency Pair Performance */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Anchor className="h-5 w-5 text-blue-600" /> Currency Pair Stats
                </h3>
                <div className="space-y-2">
                  {Object.entries(stats.pairStats).sort((a, b) => (b[1] as any).pnl - (a[1] as any).pnl).slice(0, 6).map(([pair, data]) => (
                    <div key={pair} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 transition">
                      <div className="flex-1">
                        <span className="text-slate-900 font-mono font-bold text-sm">{pair}</span>
                        <span className="text-slate-500 text-xs ml-2 font-medium">({(data as any).total}T • {(data as any).wins}W • {(data as any).losses}L)</span>
                      </div>
                      <div className={`text-sm font-bold tabular-nums ${(data as any).pnl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        ${(data as any).pnl.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Journal View */}
          {viewMode === 'journal' && (
            <>
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
                  <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5"><Award className="h-4 w-4 text-amber-500" /> Win Rate</div>
                  <div className={`text-3xl font-extrabold tabular-nums ${stats.winRate >= 50 ? 'text-emerald-600' : 'text-amber-500'}`}>
                    {stats.winRate}%
                  </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
                  <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5"><DollarSign className="h-4 w-4 text-blue-500" /> Net P&L</div>
                  <div className={`text-3xl font-extrabold tabular-nums ${stats.totalPnL >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    ${stats.totalPnL.toFixed(2)}
                  </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
                  <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5"><Activity className="h-4 w-4 text-blue-600" /> Total Trades</div>
                  <div className="text-3xl font-extrabold text-slate-900 tabular-nums">{stats.total}</div>
                </div>
              </div>

              {/* Controls Bar */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col md:flex-row gap-4 items-center shadow-card">
                <div className="relative flex-1 w-full md:w-auto">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search pairs, notes, strategies..." 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
                  <select 
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold outline-none focus:border-blue-500 focus:bg-white transition"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                  >
                    <option value="all">All Types</option>
                    <option value="buy">Buys Only</option>
                    <option value="sell">Sells Only</option>
                  </select>

                  <select 
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold outline-none focus:border-blue-500 focus:bg-white transition"
                    value={filterOutcome}
                    onChange={(e) => setFilterOutcome(e.target.value as any)}
                  >
                    <option value="all">All Outcomes</option>
                    <option value="win">Wins</option>
                    <option value="loss">Losses</option>
                    <option value="breakeven">Breakeven</option>
                  </select>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                  <button 
                    onClick={() => handleSort('date')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                      sortConfig.key === 'date' 
                        ? 'bg-blue-50 border-blue-200 text-blue-700' 
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Calendar className="h-3.5 w-3.5" /> Date
                  </button>

                  <button 
                    onClick={() => handleSort('pnl')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                      sortConfig.key === 'pnl' 
                        ? 'bg-blue-50 border-blue-200 text-blue-700' 
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <DollarSign className="h-3.5 w-3.5" /> P&L
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden overflow-x-auto shadow-card">
                <table className="w-full text-left text-sm min-w-[900px]">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-xs font-bold uppercase tracking-wider">
                    <tr>
                      {journalView === 'all-students' && (
                        <th className="p-4">Student</th>
                      )}
                      <th className="p-4 whitespace-nowrap">Date</th>
                      <th className="p-4">Pair</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Strategy</th>
                      <th className="p-4">Setup Notes</th>
                      <th className="p-4 text-center">Chart</th>
                      <th className="p-4 text-right">P&L</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {processedEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50 transition group">
                        {journalView === 'all-students' && (
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="bg-blue-50 border border-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold">
                                {(entry as any).studentName?.charAt(0) || 'S'}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 text-sm">
                                  {(entry as any).studentName || 'Unknown Student'}
                                </div>
                                <div className="text-xs text-slate-400 font-medium">
                                  {(entry as any).studentTier || 'free'} tier
                                </div>
                              </div>
                            </div>
                          </td>
                        )}
                        <td className="p-4 text-slate-500 font-mono text-xs tabular-nums">
                          {new Date(entry.date).toLocaleDateString()}
                        </td>
                        <td className="p-4 font-bold text-slate-900 group-hover:text-blue-600 transition font-mono">{entry.pair}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold uppercase flex items-center gap-1 w-fit ${
                            entry.type === 'buy' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {entry.type === 'buy' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {entry.type}
                          </span>
                        </td>
                        <td className="p-4 text-slate-600 text-xs font-semibold">{entry.strategy || '-'}</td>
                        <td className="p-4 text-slate-600 max-w-xs truncate text-xs" title={entry.notes}>
                          {entry.notes || <span className="text-slate-400 italic">No notes</span>}
                        </td>
                        <td className="p-4 text-center">
                          {entry.screenshotUrl ? (
                            <button 
                              onClick={() => setPreviewImage(entry.screenshotUrl!)}
                              className="text-slate-400 hover:text-blue-600 transition p-1.5 rounded-lg hover:bg-slate-100 bg-slate-50 border border-slate-200"
                              title="View Chart"
                            >
                              <ImageIcon className="h-4 w-4" />
                            </button>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className={`p-4 text-right font-mono font-bold text-sm tabular-nums ${
                          entry.pnl && entry.pnl > 0 ? 'text-emerald-600' : 
                          entry.pnl && entry.pnl < 0 ? 'text-red-600' : 'text-slate-400'
                        }`}>
                          {entry.pnl ? (entry.pnl > 0 ? `+$${entry.pnl.toFixed(2)}` : `-$${Math.abs(entry.pnl).toFixed(2)}`) : '-'}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex justify-center">
                            <span className={`w-2.5 h-2.5 rounded-full ${
                              entry.status === 'win' ? 'bg-emerald-500' : 
                              entry.status === 'loss' ? 'bg-red-500' : 
                              entry.status === 'breakeven' ? 'bg-amber-500' : 'bg-slate-300'
                            }`}></span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button 
                              onClick={() => handleEditEntry(entry)}
                              className="text-slate-400 hover:text-blue-600 transition p-1.5 rounded-lg hover:bg-slate-100 inline-block"
                              title="Edit Entry"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                                <path d="m15 5 4 4"/>
                              </svg>
                            </button>
                            <button 
                              onClick={() => handleDeleteEntry(entry.id)}
                              disabled={deleting === entry.id}
                              className="text-slate-400 hover:text-red-600 transition p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-50 inline-block"
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
                        <td colSpan={journalView === 'all-students' ? 10 : 9} className="p-12 text-center">
                          <div className="flex flex-col items-center justify-center text-slate-400">
                            <Search className="h-8 w-8 mb-3 opacity-50 text-slate-300" />
                            <p className="text-base font-bold text-slate-700">No trades found</p>
                            <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search term.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Image Preview Modal */}
          {previewImage && (
            <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
              <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
                <button 
                  onClick={() => setPreviewImage(null)}
                  className="absolute -top-10 right-0 text-slate-400 hover:text-white p-2"
                >
                  <X className="h-6 w-6" />
                </button>
                <img 
                  src={previewImage} 
                  alt="Trade Preview" 
                  className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-slate-200 shadow-xl bg-white" 
                />
              </div>
            </div>
          )}

          {/* Add/Edit Entry Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-xl my-8">
                <form onSubmit={handleSubmit}>
                  <div className="flex justify-between items-center p-6 border-b border-slate-100">
                    <h2 className="text-xl font-extrabold text-slate-900">
                      {editingEntry ? 'Edit Trade Entry' : 'Log New Trade'}
                    </h2>
                    <button type="button" onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pair</label>
                        <input 
                          type="text" 
                          required
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold focus:border-blue-500 focus:bg-white outline-none uppercase text-sm"
                          value={formData.pair}
                          onChange={e => setFormData({...formData, pair: e.target.value.toUpperCase()})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Date</label>
                        <input 
                          type="date" 
                          required
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium focus:border-blue-500 focus:bg-white outline-none text-sm tabular-nums"
                          value={formData.date ? new Date(formData.date).toISOString().split('T')[0] : ''}
                          onChange={e => setFormData({...formData, date: e.target.value})}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Direction</label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition ${formData.type === 'buy' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                            onClick={() => setFormData({...formData, type: 'buy'})}
                          >
                            <ArrowUpRight className="h-4 w-4" /> BUY
                          </button>
                          <button
                            type="button"
                            className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition ${formData.type === 'sell' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                            onClick={() => setFormData({...formData, type: 'sell'})}
                          >
                            <ArrowDownRight className="h-4 w-4" /> SELL
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Entry Price</label>
                        <input type="number" step="0.00001" className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 font-medium outline-none focus:border-blue-500 text-xs tabular-nums" value={formData.entryPrice || ''} onChange={e => setFormData({...formData, entryPrice: e.target.value ? Number(e.target.value) : undefined})} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Stop Loss</label>
                        <input type="number" step="0.00001" className="w-full bg-white border border-slate-200 rounded-lg p-2 text-red-600 font-medium outline-none focus:border-red-500 text-xs tabular-nums" value={formData.stopLoss || ''} onChange={e => setFormData({...formData, stopLoss: e.target.value ? Number(e.target.value) : undefined})} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Take Profit</label>
                        <input type="number" step="0.00001" className="w-full bg-white border border-slate-200 rounded-lg p-2 text-emerald-600 font-medium outline-none focus:border-emerald-500 text-xs tabular-nums" value={formData.takeProfit || ''} onChange={e => setFormData({...formData, takeProfit: e.target.value ? Number(e.target.value) : undefined})} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Exit Price</label>
                        <input type="number" step="0.00001" className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 font-medium outline-none focus:border-blue-500 text-xs tabular-nums" value={formData.exitPrice || ''} onChange={e => setFormData({...formData, exitPrice: e.target.value ? Number(e.target.value) : undefined})} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Outcome</label>
                        <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 text-xs font-semibold outline-none focus:border-blue-500 focus:bg-white" value={formData.status || 'pending'} onChange={e => setFormData({...formData, status: e.target.value as TradeOutcome})}>
                          <option value="pending">Pending</option>
                          <option value="win">Win</option>
                          <option value="loss">Loss</option>
                          <option value="breakeven">Breakeven</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">P&L ($)</label>
                        <input type="number" placeholder="0.00" className={`w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold outline-none focus:border-blue-500 focus:bg-white tabular-nums ${(formData.pnl || 0) > 0 ? 'text-emerald-600' : (formData.pnl || 0) < 0 ? 'text-red-600' : 'text-slate-900'}`} value={formData.pnl || ''} onChange={e => setFormData({...formData, pnl: e.target.value ? Number(e.target.value) : undefined})} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Setup Notes</label>
                      <textarea rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 text-xs font-medium outline-none resize-none focus:border-blue-500 focus:bg-white" placeholder="Describe your trade setup..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                    </div>

                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition relative">
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
                            className="w-full h-48 object-contain rounded-lg bg-white border border-slate-200" 
                          />
                          <div className="absolute top-2 right-2 flex gap-2">
                            <button 
                              type="button"
                              onClick={() => setPreviewImage(formData.screenshotUrl!)}
                              className="bg-slate-900/80 p-2 rounded-lg text-white hover:bg-slate-900"
                              title="View Fullscreen"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              type="button"
                              onClick={clearImage}
                              className="bg-red-600/90 p-2 rounded-lg text-white hover:bg-red-600"
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
                          <Upload className="h-6 w-6 text-slate-400 mx-auto mb-2" />
                          <p className="text-xs font-bold text-slate-700">Click to upload chart screenshot</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">JPG, PNG up to 5MB</p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Strategy</label>
                        <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 text-xs font-semibold focus:border-blue-500 outline-none" value={formData.strategy || ''} onChange={e => setFormData({...formData, strategy: e.target.value})}>
                          <option value="">Select Strategy</option>
                          {STRATEGIES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Time Frame</label>
                        <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 text-xs font-semibold focus:border-blue-500 outline-none" value={formData.timeFrame || ''} onChange={e => setFormData({...formData, timeFrame: e.target.value})}>
                          <option value="">Select Time Frame</option>
                          {TIME_FRAMES.map(tf => <option key={tf} value={tf}>{tf}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Market Condition</label>
                        <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 text-xs font-semibold focus:border-blue-500 outline-none" value={formData.marketCondition || ''} onChange={e => setFormData({...formData, marketCondition: e.target.value})}>
                          <option value="">Select Condition</option>
                          {MARKET_CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Confidence: {formData.confidenceLevel}/10</label>
                        <input type="range" min="1" max="10" value={formData.confidenceLevel || 5} onChange={e => setFormData({...formData, confidenceLevel: Number(e.target.value)})} className="w-full accent-blue-600 mt-2" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Risk Amount ($)</label>
                        <input type="number" step="0.01" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 text-xs font-medium outline-none focus:border-blue-500 tabular-nums" value={formData.riskAmount || ''} onChange={e => setFormData({...formData, riskAmount: e.target.value ? Number(e.target.value) : undefined})} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Position Size</label>
                        <input type="number" step="0.01" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 text-xs font-medium outline-none focus:border-blue-500 tabular-nums" value={formData.positionSize || ''} onChange={e => setFormData({...formData, positionSize: e.target.value ? Number(e.target.value) : undefined})} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Trade Duration</label>
                        <input type="text" placeholder="e.g., PT30M" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 text-xs font-medium outline-none focus:border-blue-500" value={formData.tradeDuration || ''} onChange={e => setFormData({...formData, tradeDuration: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Trade Source</label>
                        <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 text-xs font-semibold focus:border-blue-500 outline-none" value={formData.tradeSource || 'demo'} onChange={e => setFormData({...formData, tradeSource: e.target.value as any})}>
                          {TRADE_SOURCES.map(s => <option key={s} value={s.toLowerCase()}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Validation Result</label>
                        <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 text-xs font-semibold focus:border-blue-500 outline-none" value={formData.validationResult || 'none'} onChange={e => setFormData({...formData, validationResult: e.target.value as any})}>
                          <option value="none">None</option>
                          <option value="approved">Approved</option>
                          <option value="warning">Warning</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
                    <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold text-xs transition">
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={saving}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-blue-glow disabled:opacity-50 disabled:cursor-not-allowed"
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
        </>
      )}
    </div>
  );
};


export default AdminTradeJournal;