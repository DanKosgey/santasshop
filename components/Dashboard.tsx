import React, { useMemo, useState, useEffect } from 'react';
import { User, CourseModule, TradeEntry } from '../types';
import { PlayCircle, Award, TrendingUp, Clock, CalendarPlus, CheckCircle, AlertTriangle, Activity, DollarSign, TrendingDown, Percent, BookOpen, Cpu as Bot } from 'lucide-react';
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
          filter: `user_id=eq.${user.id}` // Changed back to user_id for journal entries
        },
        (payload) => {
          // Add new trade to the list
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
          filter: `user_id=eq.${user.id}` // Changed back to user_id for journal entries
        },
        (payload) => {
          // Update existing trade
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
          filter: `user_id=eq.${user.id}` // Changed back to user_id for journal entries
        },
        (payload) => {
          // Remove deleted trade
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

      // Market Window: 02:00 to 23:59 (2:00 AM to 11:59 PM)
      const startMinutes = 2 * 60; // 02:00
      const endMinutes = 23 * 60 + 59;  // 23:59

      if (totalMinutes >= startMinutes && totalMinutes < endMinutes) {
        // Market is OPEN
        const diff = endMinutes - totalMinutes;
        const h = Math.floor(diff / 60);
        const m = diff % 60;
        setMarketStatus({
          isOpen: true,
          label: `Market Open (${h}h ${m}m left)`,
          subtext: 'High volatility expected. Stick to your plan.'
        });
      } else {
        // Market is CLOSED
        let diff = 0;
        if (totalMinutes < startMinutes) {
          // Opens later today (e.g. it's 1 AM)
          diff = startMinutes - totalMinutes;
        } else {
          // Opens tomorrow
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

    updateMarketStatus(); // Initial call
    const timer = setInterval(updateMarketStatus, 1000 * 60); // Update every minute
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

    // Drawdown Calculation
    // Sort by date ascending
    const sortedTrades = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let peak = 0;
    let maxDrawdown = 0;
    let runningPnL = 0;

    // Chart Data preparation
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

    // If no trades, provide an empty starting point
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

  // Helper to generate Google Calendar Link
  const handleAddToCalendar = (title: string, date: Date, durationMinutes: number = 90) => {
    const formatDate = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');

    const startDate = formatDate(date);
    const endDate = formatDate(new Date(date.getTime() + durationMinutes * 60000));

    const details = `Join the live trading session on ${APP_NAME}. Covered topics: Market Structure, Liquidity Sweeps, and Live Execution.`;
    const location = APP_MESSAGES.liveRoom;

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}&sf=true&output=xml`;

    window.open(url, '_blank');
  };

  // Calculate next session time
  const nextSessionDate = new Date();
  nextSessionDate.setDate(nextSessionDate.getDate() + 1);
  nextSessionDate.setHours(10, 0, 0, 0);

  return (
    <div className="space-y-6 md:space-y-8 text-white pb-24 md:pb-10">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-3">
        <div>
          <h1 className="text-xl md:text-3xl font-bold">Welcome back, <span className="text-trade-neon">{user.name}</span> 👋</h1>
          <p className="text-gray-400 mt-1 text-xs md:text-base">You're on the path to becoming a funded trader.</p>
        </div>
        <div className="text-left sm:text-right bg-gray-800/50 p-3 rounded-xl border border-gray-700 self-start sm:self-auto flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1">
          <span className="text-xs text-gray-400">Current Tier</span>
          <div className="text-trade-accent font-bold uppercase tracking-wider flex items-center gap-2 text-sm">
            {user.subscriptionTier} <CheckCircle className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-trade-neon"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 text-center">
          <p className="text-red-200">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Content */}
      {!loading && !error && (
        <>
          {/* Top Level Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
            {/* Course Progress */}
            <div className="bg-trade-dark p-4 md:p-6 rounded-xl border border-gray-700 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <Award className="h-12 w-12 text-blue-500" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 md:p-2 bg-blue-500/20 rounded text-blue-400"><Award className="h-4 w-4 md:h-5 md:w-5" /></div>
                <span className="text-gray-400 text-xs md:text-sm">Progress</span>
              </div>
              <div className="text-2xl md:text-3xl font-bold mb-2">{courseProgress}%</div>
              <div className="w-full bg-gray-700 h-1.5 rounded-full mt-2">
                <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${courseProgress}%` }}></div>
              </div>
            </div>

            {/* Win Rate */}
            <div className="bg-trade-dark p-4 md:p-6 rounded-xl border border-gray-700 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <Activity className="h-12 w-12 text-emerald-500" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 md:p-2 bg-emerald-500/20 rounded text-emerald-400"><Activity className="h-4 w-4 md:h-5 md:w-5" /></div>
                <span className="text-gray-400 text-xs md:text-sm">Win Rate</span>
              </div>
              <div className="text-2xl md:text-3xl font-bold">{stats.winRate}%</div>
              <p className={`text-xs mt-1 font-medium ${stats.totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {stats.totalPnL >= 0 ? '+' : ''}${stats.totalPnL} P&L
              </p>
            </div>

            {/* Profit Factor */}
            <div className="bg-trade-dark p-4 md:p-6 rounded-xl border border-gray-700 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <TrendingUp className="h-12 w-12 text-purple-500" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 md:p-2 bg-purple-500/20 rounded text-purple-400"><TrendingUp className="h-4 w-4 md:h-5 md:w-5" /></div>
                <span className="text-gray-400 text-xs md:text-sm">Profit Factor</span>
              </div>
              <div className="text-2xl md:text-3xl font-bold">{stats.profitFactor}</div>
              <p className="text-xs text-gray-500 mt-1">Target: &gt; 2.0</p>
            </div>


            {/* Journal Trade Button */}
            <div
              className="bg-gradient-to-br from-trade-accent to-blue-700 p-4 md:p-6 rounded-xl border border-blue-500 shadow-lg shadow-blue-900/20 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition flex flex-col justify-center"
              onClick={() => window.dispatchEvent(new CustomEvent('navigateToView', { detail: 'journal' }))}
            >
              <h3 className="font-bold text-base md:text-lg mb-1 text-white">Trade Journal</h3>
              <p className="text-blue-100 text-xs md:text-sm mb-3 opacity-80">Log & track your trades</p>
              <div className="flex items-center text-white font-bold text-xs md:text-sm bg-white/20 w-fit px-3 py-1.5 rounded-lg hover:bg-white/30 transition">
                Log Trade <BookOpen className="ml-2 h-3.5 w-3.5" />
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">

            {/* Equity Curve */}
            <div className="lg:col-span-2 bg-trade-dark p-4 md:p-6 rounded-xl border border-gray-700">
              <div className="flex justify-between items-center mb-4 md:mb-6">
                <h3 className="font-bold text-base md:text-lg flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-trade-neon" /> Account Growth
                </h3>
                <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">All Time</span>
              </div>
              <div className="h-48 md:h-72" style={{ minHeight: '160px' }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <AreaChart data={stats.equityCurveData} width={undefined} height={undefined}>
                    <defs>
                      <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00ff94" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#00ff94" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickMargin={10} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                      labelStyle={{ color: '#94a3b8' }}
                      itemStyle={{ color: '#f8fafc' }}
                    />
                    <Area type="monotone" dataKey="equity" stroke="#00ff94" strokeWidth={3} fillOpacity={1} fill="url(#colorEquity)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Detailed Stats Column */}
            <div className="space-y-6">
              <div className="bg-trade-dark p-6 rounded-xl border border-gray-700">
                <h3 className="font-bold text-lg mb-4">Performance Metrics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-500/20 p-2 rounded text-green-400"><DollarSign className="h-4 w-4" /></div>
                      <span className="text-sm text-gray-300">Avg Win</span>
                    </div>
                    <span className="font-bold text-green-400">${stats.avgWin}</span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="bg-red-500/20 p-2 rounded text-red-400"><TrendingDown className="h-4 w-4" /></div>
                      <span className="text-sm text-gray-300">Avg Loss</span>
                    </div>
                    <span className="font-bold text-red-400">${stats.avgLoss}</span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg border border-red-900/30">
                    <div className="flex items-center gap-3">
                      <div className="bg-red-500/20 p-2 rounded text-red-400"><Percent className="h-4 w-4" /></div>
                      <span className="text-sm text-gray-300">Max Drawdown</span>
                    </div>
                    <span className="font-bold text-red-400">-${stats.maxDrawdown}</span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-500/20 p-2 rounded text-blue-400"><Activity className="h-4 w-4" /></div>
                      <span className="text-sm text-gray-300">Total Trades</span>
                    </div>
                    <span className="font-bold text-white">{stats.totalTrades}</span>
                  </div>
                </div>
              </div>

              {/* Weekly P&L Distribution */}
              <div className="bg-trade-dark p-6 rounded-xl border border-gray-700 flex-1">
                <h3 className="font-bold text-sm text-gray-400 mb-4 uppercase tracking-wider">Recent Trades P&L</h3>
                <div className="h-40" style={{ minHeight: '150px' }}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <BarChart data={stats.equityCurveData.slice(-7)} width={undefined} height={undefined}>
                      <Bar dataKey="pnl" radius={[2, 2, 2, 2]}>
                        {stats.equityCurveData.slice(-7).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                        ))}
                      </Bar>
                      <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: 'none' }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Market Status */}
          <div className={`p-5 md:p-6 rounded-xl border flex flex-col items-center justify-center text-center transition-colors duration-500 ${marketStatus.isOpen
            ? 'bg-gradient-to-br from-green-900/40 to-black border-green-800'
            : 'bg-gradient-to-br from-gray-900 to-black border-gray-800'
            }`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${marketStatus.isOpen ? 'bg-green-500/20 text-green-500 animate-pulse' : 'bg-trade-neon/10 text-trade-neon'
              }`}>
              <Clock className="h-8 w-8" />
            </div>
            <h3 className="font-bold text-xl mb-2">{marketStatus.label}</h3>
            <p className="text-gray-400 text-sm max-w-xs mb-6">{marketStatus.subtext}</p>
            <button onClick={onContinueCourse} className="text-trade-neon font-bold text-sm hover:underline">
              Review Pre-Market Routine &rarr;
            </button>
          </div>
        </>
      )}

    </div>
  );
};

export default Dashboard;