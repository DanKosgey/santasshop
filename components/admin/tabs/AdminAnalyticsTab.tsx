import React, { useState, useEffect } from 'react';
import { useAdminPortal } from '../AdminPortalContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid, Cell } from 'recharts';
import { DollarSign, TrendingUp, BarChart2, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { journalService } from '../../../services/journalService';
import { supabase } from '../../../supabase/client';

const AdminAnalyticsTab: React.FC = () => {
  const { students } = useAdminPortal();
  const [adminTrades, setAdminTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTrades = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const trades = await journalService.getJournalEntries(user.id);
          setAdminTrades(trades);
        }
      } catch (err) {
        console.error('Error loading admin trades:', err);
      } finally {
        setLoading(false);
      }
    };
    loadTrades();
  }, []);

  const adminStats = adminTrades.length > 0 ? (() => {
    const closedTrades = adminTrades.filter(t => t.status !== 'pending');
    const wins = closedTrades.filter(t => t.status === 'win').length;
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
    totalPnL: 0, winRate: 0, totalTrades: 0, bestAsset: '-', largestWin: 0, largestLoss: 0, profitFactor: 0, pairStats: {}
  };

  const pnlOverTimeData = adminTrades.length > 0 ? (() => {
    let runningPnL = 0;
    return [...adminTrades]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(t => {
        runningPnL += t.pnl || 0;
        return {
          date: new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          cumulativePnL: runningPnL,
        };
      });
  })() : [];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const tooltipStyle = {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
    color: '#0F172A'
  };

  return (
    <div className="space-y-0 animate-slide-up">
      {/* Page Header */}
      <div className="page-header">
        <h2 className="section-title">Admin Performance Analytics</h2>
        <p className="section-desc">Personal trading performance and platform-wide class metrics.</p>
      </div>

      {/* Key Metrics */}
      <div className="page-section">
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <div className="stat-card">
            <div className="stat-card-top">
              <div className={`stat-card-icon ${adminStats.totalPnL >= 0 ? 'icon-green' : 'icon-red'}`}>
                <DollarSign className="w-5 h-5" />
              </div>
              <span className="stat-card-label">Total P&L</span>
            </div>
            <div className={`stat-card-value ${adminStats.totalPnL >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {adminStats.totalPnL >= 0 ? '+' : ''}${adminStats.totalPnL.toLocaleString()}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-top">
              <div className="stat-card-icon icon-blue">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="stat-card-label">Win Rate</span>
            </div>
            <div className="stat-card-value text-blue-600">{adminStats.winRate}%</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-top">
              <div className="stat-card-icon icon-purple">
                <BarChart2 className="w-5 h-5" />
              </div>
              <span className="stat-card-label">Total Trades</span>
            </div>
            <div className="stat-card-value text-slate-900">{adminStats.totalTrades}</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-top">
              <div className="stat-card-icon icon-amber">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <span className="stat-card-label">Best Asset</span>
            </div>
            <div className="stat-card-value text-amber-600">{adminStats.bestAsset}</div>
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="page-section">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="stat-card">
            <div className="stat-card-top">
              <div className="stat-card-icon icon-green">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <span className="stat-card-label">Largest Win</span>
            </div>
            <div className="stat-card-value text-emerald-600">${adminStats.largestWin.toLocaleString()}</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-top">
              <div className="stat-card-icon icon-red">
                <ArrowDownRight className="w-5 h-5" />
              </div>
              <span className="stat-card-label">Largest Loss</span>
            </div>
            <div className="stat-card-value text-red-600">${Math.abs(adminStats.largestLoss).toLocaleString()}</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-top">
              <div className="stat-card-icon icon-blue">
                <Activity className="w-5 h-5" />
              </div>
              <span className="stat-card-label">Profit Factor</span>
            </div>
            <div className="stat-card-value text-blue-600">{adminStats.profitFactor.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="page-section">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="content-card p-6">
            <h3 className="section-title mb-6">P&L Over Time</h3>
            <div className="h-64 sm:h-72">
              {pnlOverTimeData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <AreaChart data={pnlOverTimeData}>
                    <defs>
                      <linearGradient id="pnlGradientLight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={adminStats.totalPnL >= 0 ? '#10B981' : '#EF4444'} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={adminStats.totalPnL >= 0 ? '#10B981' : '#EF4444'} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} tickMargin={5} />
                    <YAxis stroke="#94A3B8" fontSize={12} />
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="cumulativePnL" stroke={adminStats.totalPnL >= 0 ? '#10B981' : '#EF4444'} strokeWidth={2} fill="url(#pnlGradientLight)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">No trade data available</div>
              )}
            </div>
          </div>

          <div className="content-card p-6">
            <h3 className="section-title mb-6">Asset Performance</h3>
            <div className="h-64 sm:h-72">
              {Object.keys(adminStats.pairStats).length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={Object.entries(adminStats.pairStats).map(([name, value]) => ({ name, pnl: (value as { pnl: number }).pnl }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickMargin={5} />
                    <YAxis stroke="#94A3B8" fontSize={12} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                      {Object.entries(adminStats.pairStats).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={(entry[1] as { pnl: number }).pnl >= 0 ? '#10B981' : '#EF4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">No trade data available</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Class Analytics */}
      <div className="page-section">
        <div className="content-card p-6">
          <h3 className="section-title mb-6">Class Performance Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
              <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Total Students</h4>
              <div className="text-3xl font-extrabold text-slate-900 tabular-nums">{students.length}</div>
            </div>
            <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-100">
              <h4 className="text-sm font-semibold text-emerald-600 uppercase tracking-wider mb-2">Active Students</h4>
              <div className="text-3xl font-extrabold text-emerald-600 tabular-nums">
                {students.filter(s => s.status === 'active').length}
              </div>
            </div>
            <div className="bg-red-50/50 p-5 rounded-xl border border-red-100">
              <h4 className="text-sm font-semibold text-red-600 uppercase tracking-wider mb-2">At-Risk Students</h4>
              <div className="text-3xl font-extrabold text-red-600 tabular-nums">
                {students.filter(s => s.status === 'at-risk').length}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="h-10" />
    </div>
  );
};

export default AdminAnalyticsTab;