import React, { useState, useEffect } from 'react';
import { useAdminPortal } from '../AdminPortalContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, TrendingUp, BarChart2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { journalService } from '../../../services/journalService';
import { supabase } from '../../../supabase/client';

const AdminAnalyticsTab: React.FC = () => {
  const { students } = useAdminPortal();
  const [adminTrades, setAdminTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Calculate admin stats
  const adminStats = adminTrades.length > 0 ? (() => {
    const closedTrades = adminTrades.filter(t => t.status !== 'pending');
    const wins = closedTrades.filter(t => t.status === 'win').length;
    const losses = closedTrades.filter(t => t.status === 'loss').length;
    const winRate = closedTrades.length > 0 ? Math.round((wins / closedTrades.length) * 100) : 0;
    const totalPnL = adminTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const largestWin = Math.max(...adminTrades.filter(t => (t.pnl || 0) > 0).map(t => t.pnl || 0), 0);
    const largestLoss = Math.min(...adminTrades.filter(t => (t.pnl || 0) < 0).map(t => t.pnl || 0), 0);
    const winSum = adminTrades.filter(t => t.status === 'win').reduce((sum, t) => sum + (t.pnl || 0), 0);
    const lossSum = Math.abs(adminTrades.filter(t => t.status === 'loss').reduce((sum, t) => sum + (t.pnl || 0), 0));
    const profitFactor = lossSum > 0 ? winSum / lossSum : 0;

    const pairStats: Record<string, { wins: number; losses: number; pnl: number }> = {};
    adminTrades.forEach(trade => {
      const pair = trade.pair || 'Unknown';
      if (!pairStats[pair]) pairStats[pair] = { wins: 0, losses: 0, pnl: 0 };
      if (trade.status === 'win') pairStats[pair].wins++;
      if (trade.status === 'loss') pairStats[pair].losses++;
      pairStats[pair].pnl += trade.pnl || 0;
    });

    const bestAsset = Object.entries(pairStats).sort(([, a], [, b]) => b.pnl - a.pnl)[0]?.[0] || '-';

    return { totalPnL, winRate, totalTrades: adminTrades.length, bestAsset, largestWin, largestLoss, profitFactor, pairStats };
  })() : {
    totalPnL: 0,
    winRate: 0,
    totalTrades: 0,
    bestAsset: '-',
    largestWin: 0,
    largestLoss: 0,
    profitFactor: 0,
    pairStats: {}
  };

  // P&L over time data
  const pnlOverTimeData = adminTrades.length > 0 ? (() => {
    const sortedTrades = [...adminTrades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const tradesByDate: Record<string, number> = {};
    sortedTrades.forEach(trade => {
      const date = new Date(trade.date).toLocaleDateString();
      tradesByDate[date] = (tradesByDate[date] || 0) + (trade.pnl || 0);
    });

    const dates = Object.keys(tradesByDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    let cumulativePnL = 0;
    return dates.map(date => {
      cumulativePnL += tradesByDate[date];
      return { date, dailyPnL: tradesByDate[date], cumulativePnL };
    });
  })() : [];

  // Fetch admin trades
  useEffect(() => {
    const fetchAdminTrades = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const entries = await journalService.getJournalEntries(user.id);
          setAdminTrades(entries || []);
        }
      } catch (err) {
        console.error('Error fetching admin trades:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminTrades();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-trade-neon"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-slide-up">
      <div>
        <h2 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-trade-neon to-blue-400">Admin Performance Analytics</h2>
        <p className="text-gray-400">Personal trading performance and analytics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50 backdrop-blur-sm shadow-xl hover:scale-105 transition-transform">
          <div className="flex items-center gap-3 text-gray-300 mb-3">
            <DollarSign className="h-5 w-5 text-green-400" />
            <span className="text-sm font-medium">Total P&L</span>
          </div>
          <div className={`text-3xl font-extrabold ${adminStats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {adminStats.totalPnL >= 0 ? '+' : ''}${adminStats.totalPnL.toLocaleString()}
          </div>
        </div>
        <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50 backdrop-blur-sm shadow-xl hover:scale-105 transition-transform">
          <div className="flex items-center gap-3 text-gray-300 mb-3">
            <TrendingUp className="h-5 w-5 text-blue-400" />
            <span className="text-sm font-medium">Win Rate</span>
          </div>
          <div className="text-3xl font-extrabold text-blue-400">{adminStats.winRate}%</div>
        </div>
        <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50 backdrop-blur-sm shadow-xl hover:scale-105 transition-transform">
          <div className="flex items-center gap-3 text-gray-300 mb-3">
            <BarChart2 className="h-5 w-5 text-purple-400" />
            <span className="text-sm font-medium">Total Trades</span>
          </div>
          <div className="text-3xl font-extrabold text-purple-400">{adminStats.totalTrades}</div>
        </div>
        <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50 backdrop-blur-sm shadow-xl hover:scale-105 transition-transform">
          <div className="flex items-center gap-3 text-gray-300 mb-3">
            <ArrowUpRight className="h-5 w-5 text-yellow-400" />
            <span className="text-sm font-medium">Best Asset</span>
          </div>
          <div className="text-3xl font-extrabold text-yellow-400">{adminStats.bestAsset}</div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50 backdrop-blur-sm shadow-xl">
          <div className="flex items-center gap-3 text-gray-300 mb-3">
            <ArrowUpRight className="h-5 w-5 text-green-400" />
            <span className="text-sm font-medium">Largest Win</span>
          </div>
          <div className="text-3xl font-extrabold text-green-400">${adminStats.largestWin.toLocaleString()}</div>
        </div>
        <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50 backdrop-blur-sm shadow-xl">
          <div className="flex items-center gap-3 text-gray-300 mb-3">
            <ArrowDownRight className="h-5 w-5 text-red-400" />
            <span className="text-sm font-medium">Largest Loss</span>
          </div>
          <div className="text-3xl font-extrabold text-red-400">${Math.abs(adminStats.largestLoss).toLocaleString()}</div>
        </div>
        <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50 backdrop-blur-sm shadow-xl">
          <div className="flex items-center gap-3 text-gray-300 mb-3">
            <BarChart2 className="h-5 w-5 text-blue-400" />
            <span className="text-sm font-medium">Profit Factor</span>
          </div>
          <div className="text-3xl font-extrabold text-blue-400">{adminStats.profitFactor.toFixed(2)}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50 shadow-xl">
          <h3 className="font-bold text-xl mb-6 text-gray-200">P&L Over Time</h3>
          <div className="h-64 sm:h-72">
            {pnlOverTimeData.length > 0 ? (
              <ResponsiveContainer>
                <AreaChart data={pnlOverTimeData}>
                  <defs>
                    <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={adminStats.totalPnL >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={adminStats.totalPnL >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickMargin={5} />
                  <YAxis stroke="#94a3b8" fontSize={10} hide={window.innerWidth < 640} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.5} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #475569', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="cumulativePnL" stroke={adminStats.totalPnL >= 0 ? '#10b981' : '#ef4444'} fill="url(#pnlGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">No trade data available</div>
            )}
          </div>
        </div>
        <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50 shadow-xl">
          <h3 className="font-bold text-xl mb-6 text-gray-200">Asset Performance</h3>
          <div className="h-64 sm:h-72">
            {Object.keys(adminStats.pairStats).length > 0 ? (
              <ResponsiveContainer>
                <BarChart data={Object.entries(adminStats.pairStats).map(([name, value]) => ({ name, pnl: (value as { pnl: number }).pnl }))}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickMargin={5} />
                  <YAxis stroke="#94a3b8" fontSize={10} hide={window.innerWidth < 640} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #475569', borderRadius: '8px' }} />
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                    {Object.entries(adminStats.pairStats).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={(entry[1] as { pnl: number }).pnl >= 0 ? '#10b981' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">No trade data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Class Analytics */}
      <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50 shadow-xl">
        <h3 className="font-bold text-xl mb-6 text-gray-200">Class Performance Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700/30">
            <h4 className="font-bold text-lg mb-4 text-gray-200">Total Students</h4>
            <div className="text-4xl font-bold text-white">{students.length}</div>
          </div>
          <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700/30">
            <h4 className="font-bold text-lg mb-4 text-gray-200">Active Students</h4>
            <div className="text-4xl font-bold text-green-400">
              {students.filter(s => s.status === 'active').length}
            </div>
          </div>
          <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700/30">
            <h4 className="font-bold text-lg mb-4 text-gray-200">At-Risk Students</h4>
            <div className="text-4xl font-bold text-red-400">
              {students.filter(s => s.status === 'at-risk').length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsTab;