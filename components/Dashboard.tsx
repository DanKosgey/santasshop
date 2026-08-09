import React, { useMemo, useState, useEffect } from 'react';
import { User, CourseModule, TradeEntry } from '../types';
import { PlayCircle, Award, TrendingUp, Clock, CalendarPlus, CheckCircle, AlertTriangle, Activity, DollarSign, TrendingDown, Percent, BookOpen, Cpu as Bot, ArrowRight } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, CartesianGrid
} from 'recharts';
import { fetchStudentWithTrades } from '../services/adminService';
import { courseService } from '../services/courseService';
import { supabase } from '../supabase/client';
import { APP_MESSAGES, APP_NAME } from '../lib/constants';

interface DashboardProps {
  user: User;
  courses: CourseModule[];
  onContinueCourse: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, courses, onContinueCourse }) => {
  // State for real trade data
  const [trades, setTrades] = useState<TradeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courseProgress, setCourseProgress] = useState<number>(0);

  // --- Market Status Timer Logic ---
  const [marketStatus, setMarketStatus] = useState<{ isOpen: boolean; label: string; subtext: string }>({
    isOpen: false,
    label: 'Calculating...',
    subtext: 'Checking market hours...'
  });

  // Fetch real trade data for the student
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch trades
        const studentData = await fetchStudentWithTrades(user.id);
        if (studentData) {
          setTrades(studentData.recentTrades);
        }

        // Fetch course progress
        const progressData = await courseService.getStudentCourseProgress(user.id);
        if (progressData && progressData.length > 0) {
          // Calculate overall progress as average of all courses
          const totalProgress = progressData.reduce((sum, course) => sum + (course.completion_percentage || 0), 0);
          const avgProgress = Math.round(totalProgress / progressData.length);
          setCourseProgress(avgProgress);
        } else {
          // Fallback to mock data calculation if no progress data
          const completedCount = courses.filter(c => c.completed).length;
          const totalCount = courses.length;
          const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
          setCourseProgress(percent);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');

        // Fallback to mock data calculation on error
        const completedCount = courses.filter(c => c.completed).length;
        const totalCount = courses.length;
        const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
        setCourseProgress(percent);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up real-time subscription for trade changes
    const channel = supabase
      .channel('trades-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'journal_entries',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newTrade: TradeEntry = {
            id: payload.new.id,
            pair: payload.new.pair,
            type: payload.new.type,
            entryPrice: payload.new.entry_price,
            stopLoss: payload.new.stop_loss,
            takeProfit: payload.new.take_profit,
            status: payload.new.status,
            validationResult: payload.new.validation_result,
            notes: payload.new.notes,
            date: payload.new.date,
            pnl: payload.new.pnl
          };
          setTrades(prev => [newTrade, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'journal_entries',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const updatedTrade: TradeEntry = {
            id: payload.new.id,
            pair: payload.new.pair,
            type: payload.new.type,
            entryPrice: payload.new.entry_price,
            stopLoss: payload.new.stop_loss,
            takeProfit: payload.new.take_profit,
            status: payload.new.status,
            validationResult: payload.new.validation_result,
            notes: payload.new.notes,
            date: payload.new.date,
            pnl: payload.new.pnl
          };
          setTrades(prev => prev.map(trade => trade.id === updatedTrade.id ? updatedTrade : trade));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'journal_entries',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          setTrades(prev => prev.filter(trade => trade.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id]);

  useEffect(() => {
    const updateMarketStatus = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const totalMinutes = hours * 60 + minutes;

      const startMinutes = 2 * 60;
      const endMinutes = 23 * 60 + 59;

      if (totalMinutes >= startMinutes && totalMinutes < endMinutes) {
        const diff = endMinutes - totalMinutes;
        const h = Math.floor(diff / 60);
        const m = diff % 60;
        setMarketStatus({
          isOpen: true,
          label: `Market Open (${h}h ${m}m left)`,
          subtext: 'High volatility expected. Stick to your plan.'
        });
      } else {
        let diff = 0;
        if (totalMinutes < startMinutes) {
          diff = startMinutes - totalMinutes;
        } else {
          diff = (24 * 60 - totalMinutes) + startMinutes;
        }
        const h = Math.floor(diff / 60);
        const m = diff % 60;
        setMarketStatus({
          isOpen: false,
          label: `Market Opens in ${h}h ${m}m`,
          subtext: 'Prepare your watchlist. Do not force trades during low volatility.'
        });
      }
    };

    updateMarketStatus();
    const timer = setInterval(updateMarketStatus, 1000 * 60);
    return () => clearInterval(timer);
  }, []);

  // --- Performance Calculations ---
  const stats = useMemo(() => {
    const wins = trades.filter(t => t.status === 'win');
    const losses = trades.filter(t => t.status === 'loss');

    const totalTrades = trades.length;
    const winRate = totalTrades > 0 ? Math.round((wins.length / totalTrades) * 100) : 0;

    const totalWinAmount = wins.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const totalLossAmount = Math.abs(losses.reduce((sum, t) => sum + (t.pnl || 0), 0));

    const avgWin = wins.length > 0 ? Math.round(totalWinAmount / wins.length) : 0;
    const avgLoss = losses.length > 0 ? Math.round(totalLossAmount / losses.length) : 0;

    const profitFactor = totalLossAmount > 0 ? (totalWinAmount / totalLossAmount).toFixed(2) : '∞';
    const totalPnL = totalWinAmount - totalLossAmount;

    const sortedTrades = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let peak = 0;
    let maxDrawdown = 0;
    let runningPnL = 0;

    const equityCurveData = sortedTrades.map(t => {
      runningPnL += (t.pnl || 0);
      if (runningPnL > peak) peak = runningPnL;
      const drawdown = peak - runningPnL;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;

      return {
        date: new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        equity: runningPnL,
        pnl: t.pnl || 0
      };
    });

    if (equityCurveData.length === 0) {
      equityCurveData.push({ date: 'Start', equity: 0, pnl: 0 });
    }

    return {
      totalTrades,
      winRate,
      avgWin,
      avgLoss,
      profitFactor,
      totalPnL,
      maxDrawdown,
      equityCurveData
    };
  }, [trades]);

  return (
    <div className="text-slate-700 font-sans">
      {/* ── Page Header ── */}
      <div className="px-4 pt-4 pb-3 md:pt-0 flex flex-col sm:flex-row justify-between sm:items-end gap-3">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Welcome back, <span className="text-blue-600">{user.name}</span> 👋
          </h1>
          <p className="text-slate-500 mt-1 text-xs md:text-sm">You're on the path to becoming a funded trader.</p>
        </div>
        <div className="text-left sm:text-right bg-white p-3 rounded-xl border border-slate-200 shadow-xs self-start sm:self-auto flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Current Tier</span>
          <div className="text-blue-600 font-bold uppercase tracking-wider flex items-center gap-1.5 text-sm">
            {user.subscriptionTier} <CheckCircle className="h-4 w-4 text-emerald-500" />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mx-4 bg-red-50 border border-red-200 rounded-xl p-6 text-center shadow-xs">
          <p className="text-red-700 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium text-sm transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Content */}
      {!loading && !error && (
        <div className="space-y-4 md:space-y-6 pb-6">
          {/* Top Level Stats Grid — px-4 on mobile for breathing room */}
          <div className="px-4 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {/* Course Progress */}
            <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-card card-hover min-w-0 flex flex-col justify-between overflow-hidden">
              <div className="flex items-center gap-2 mb-2 min-w-0">
                <div className="p-2 bg-blue-50 rounded-xl text-blue-600 shrink-0"><Award className="h-4 w-4" /></div>
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider truncate">Progress</span>
              </div>
              <div className="text-2xl md:text-3xl font-extrabold text-slate-900 tabular-nums truncate mb-2">{courseProgress}%</div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${courseProgress}%` }}></div>
              </div>
            </div>

            {/* Win Rate */}
            <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-card card-hover min-w-0 flex flex-col justify-between overflow-hidden">
              <div className="flex items-center gap-2 mb-2 min-w-0">
                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 shrink-0"><Activity className="h-4 w-4" /></div>
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider truncate">Win Rate</span>
              </div>
              <div className="text-2xl md:text-3xl font-extrabold text-slate-900 tabular-nums truncate">{stats.winRate}%</div>
              <p className={`text-xs mt-1 font-bold tabular-nums truncate ${stats.totalPnL >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {stats.totalPnL >= 0 ? '+' : ''}${stats.totalPnL.toFixed(2)} P&L
              </p>
            </div>

            {/* Profit Factor */}
            <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-card card-hover min-w-0 flex flex-col justify-between overflow-hidden">
              <div className="flex items-center gap-2 mb-2 min-w-0">
                <div className="p-2 bg-purple-50 rounded-xl text-purple-600 shrink-0"><TrendingUp className="h-4 w-4" /></div>
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider truncate">Profit Factor</span>
              </div>
              <div className="text-2xl md:text-3xl font-extrabold text-slate-900 tabular-nums truncate">{stats.profitFactor}</div>
              <p className="text-xs text-slate-400 font-semibold mt-1 truncate">Target: &gt; 2.0</p>
            </div>

            {/* Journal Trade Button */}
            <div
              className="bg-blue-600 hover:bg-blue-700 p-4 md:p-5 rounded-2xl shadow-blue-glow cursor-pointer transition flex flex-col justify-between text-white min-w-0 overflow-hidden group"
              onClick={() => window.dispatchEvent(new CustomEvent('navigateToView', { detail: 'journal' }))}
            >
              <h3 className="font-bold text-sm md:text-lg mb-1 truncate">Trade Journal</h3>
              <p className="text-xs text-blue-100 mb-3 truncate hidden sm:block">Log your trades & track performance</p>
              <div className="flex items-center justify-between font-bold text-xs">
                <span>Log Trade</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform shrink-0" />
              </div>
            </div>
          </div>

          {/* Charts Section — full-width on mobile, cards go edge-to-edge */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 md:gap-6 md:px-0">

            {/* Equity Curve — full-bleed on mobile */}
            <div className="lg:col-span-2 bg-white md:rounded-xl border-y md:border border-slate-200 shadow-card">
              <div className="flex justify-between items-center p-4 md:p-6 pb-0 md:mb-6">
                <h3 className="font-bold text-base md:text-lg text-slate-900 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" /> Account Growth
                </h3>
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">All Time</span>
              </div>
              <div className="h-52 md:h-72 px-2 pb-4 md:px-6" style={{ minHeight: '180px' }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <AreaChart data={stats.equityCurveData}>
                    <defs>
                      <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickMargin={8} />
                    <YAxis stroke="#94A3B8" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                      labelStyle={{ color: '#64748B', fontWeight: 600 }}
                      itemStyle={{ color: '#0F172A', fontWeight: 700 }}
                    />
                    <Area type="monotone" dataKey="equity" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorEquity)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Detailed Stats Column — full-bleed on mobile */}
            <div className="space-y-0 md:space-y-6">
              <div className="bg-white md:rounded-xl border-y md:border border-slate-200 shadow-card">
                <h3 className="font-bold text-slate-900 text-base px-4 pt-4 pb-2 md:p-6 md:pb-4">Performance Metrics</h3>
                <div className="space-y-1 px-4 pb-4 md:px-6">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-100 p-2 rounded-md text-emerald-600"><DollarSign className="h-4 w-4" /></div>
                      <span className="text-sm font-medium text-slate-600">Avg Win</span>
                    </div>
                    <span className="font-bold text-emerald-600 tabular-nums">${stats.avgWin}</span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="bg-red-100 p-2 rounded-md text-red-600"><TrendingDown className="h-4 w-4" /></div>
                      <span className="text-sm font-medium text-slate-600">Avg Loss</span>
                    </div>
                    <span className="font-bold text-red-600 tabular-nums">${stats.avgLoss}</span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-red-50/50 rounded-lg border border-red-100">
                    <div className="flex items-center gap-3">
                      <div className="bg-red-100 p-2 rounded-md text-red-600"><Percent className="h-4 w-4" /></div>
                      <span className="text-sm font-medium text-slate-600">Max Drawdown</span>
                    </div>
                    <span className="font-bold text-red-600 tabular-nums">-${stats.maxDrawdown}</span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-md text-blue-600"><Activity className="h-4 w-4" /></div>
                      <span className="text-sm font-medium text-slate-600">Total Trades</span>
                    </div>
                    <span className="font-bold text-slate-900 tabular-nums">{stats.totalTrades}</span>
                  </div>
                </div>
              </div>

              {/* Recent Trades P&L — full-bleed on mobile */}
              <div className="bg-white md:rounded-xl border-y md:border border-slate-200 shadow-card">
                <h3 className="font-semibold text-xs text-slate-400 px-4 pt-4 pb-2 md:p-6 md:pb-4 uppercase tracking-wider">Recent Trades P&L</h3>
                <div className="h-40 px-2 pb-4 md:px-6" style={{ minHeight: '150px' }}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <BarChart data={stats.equityCurveData.slice(-7)}>
                      <Bar dataKey="pnl" radius={[4, 4, 4, 4]}>
                        {stats.equityCurveData.slice(-7).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10B981' : '#EF4444'} />
                        ))}
                      </Bar>
                      <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Market Status Banner — full-bleed on mobile */}
          <div className={`md:rounded-xl border-y md:border flex flex-col items-center justify-center text-center transition-colors duration-300 py-8 px-4 md:p-6 md:shadow-card ${
            marketStatus.isOpen
              ? 'bg-emerald-50/60 border-emerald-200'
              : 'bg-white border-slate-200'
          }`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${marketStatus.isOpen ? 'bg-emerald-100 text-emerald-600 animate-pulse-dot' : 'bg-blue-50 text-blue-600'}`}>
              <Clock className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg md:text-xl mb-1">{marketStatus.label}</h3>
            <p className="text-slate-500 text-sm max-w-sm mb-4 leading-relaxed">{marketStatus.subtext}</p>
            <button onClick={onContinueCourse} className="text-blue-600 font-semibold text-sm hover:underline">
              Review Pre-Market Routine &rarr;
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;