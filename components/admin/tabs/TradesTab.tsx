import React, { useState, useMemo } from 'react';
import { useAdminPortal } from '../AdminPortalContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#00ff94', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const TradesTab: React.FC = () => {
  const { trades } = useAdminPortal();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPair, setFilterPair] = useState('all');
  const [filterOutcome, setFilterOutcome] = useState('all');
  const [filterStrategy, setFilterStrategy] = useState('all');

  // Get unique pairs for filter dropdown
  const uniquePairs = useMemo(() => {
    return Array.from(new Set(trades.map(t => t.pair).filter(Boolean)));
  }, [trades]);

  // Get unique strategies for filter dropdown
  const uniqueStrategies = useMemo(() => {
    return Array.from(new Set(trades.map(t => t.strategy).filter(Boolean)));
  }, [trades]);

  // Transform trade data to match the table structure
  const tableData = useMemo(() => {
    return trades.map(trade => ({
      id: trade.id,
      student: trade.studentName || 'Unknown',
      pair: trade.pair || '',
      type: trade.type || '',
      entry: trade.entryPrice || 0,
      sl: trade.stopLoss || 0,
      tp: trade.takeProfit || 0,
      status: trade.status || '',
      pnl: trade.pnl || 0,
      date: trade.date ? new Date(trade.date).toLocaleDateString() : '',
      notes: trade.notes || '',
      strategy: trade.strategy || 'N/A',
      confidence: trade.confidenceLevel || 'N/A',
      reviewStatus: trade.adminReviewStatus || 'N/A'
    }));
  }, [trades]);

  const filteredTrades = tableData.filter(trade =>
    (trade.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.pair.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.strategy.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterPair === 'all' || trade.pair === filterPair) &&
    (filterOutcome === 'all' || trade.status === filterOutcome) &&
    (filterStrategy === 'all' || trade.strategy === filterStrategy)
  );

  // Calculate trade analytics
  const tradeAnalytics = useMemo(() => {
    const total = filteredTrades.length;
    const wins = filteredTrades.filter(t => t.status === 'win').length;
    const losses = filteredTrades.filter(t => t.status === 'loss').length;
    const winRate = (wins + losses) > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;
    const netPnL = filteredTrades.reduce((s, t) => s + (t.pnl || 0), 0);

    // P&L by pair
    const pairStats: Record<string, { pnl: number; count: number }> = {};
    filteredTrades.forEach(t => {
      if (t.pair) {
        if (!pairStats[t.pair]) {
          pairStats[t.pair] = { pnl: 0, count: 0 };
        }
        pairStats[t.pair].pnl += (t.pnl || 0);
        pairStats[t.pair].count += 1;
      }
    });

    // Convert to array and sort by absolute P&L value
    const pairData = Object.entries(pairStats)
      .map(([name, { pnl, count }]) => ({ name, value: pnl, count }))
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

    return { total, wins, losses, winRate, netPnL, pairData };
  }, [filteredTrades]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'win': return 'bg-green-500/20 text-green-400';
      case 'loss': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'buy': return 'bg-blue-500/20 text-blue-400';
      case 'sell': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getReviewStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'reviewed': return 'bg-green-500/20 text-green-400';
      case 'flagged': return 'bg-red-500/20 text-red-400';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="space-y-8 animate-slide-up">
      <div>
        <h2 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-trade-neon to-blue-400">Trade Analysis</h2>
        <p className="text-gray-400">Analyze and review student trades</p>
      </div>

      {/* Trade Analytics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50 backdrop-blur-sm shadow-xl hover:scale-105 transition-transform">
          <div className="flex items-center gap-3 text-gray-300 mb-3">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-sm font-medium">Total Trades</span>
          </div>
          <div className="text-3xl font-extrabold text-white">{tradeAnalytics.total}</div>
        </div>
        <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50 backdrop-blur-sm shadow-xl hover:scale-105 transition-transform">
          <div className="flex items-center gap-3 text-gray-300 mb-3">
            <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">Wins</span>
          </div>
          <div className="text-3xl font-extrabold text-green-400">{tradeAnalytics.wins}</div>
        </div>
        <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50 backdrop-blur-sm shadow-xl hover:scale-105 transition-transform">
          <div className="flex items-center gap-3 text-gray-300 mb-3">
            <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">Losses</span>
          </div>
          <div className="text-3xl font-extrabold text-red-400">{tradeAnalytics.losses}</div>
        </div>
        <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50 backdrop-blur-sm shadow-xl hover:scale-105 transition-transform">
          <div className="flex items-center gap-3 text-gray-300 mb-3">
            <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-sm font-medium">Win Rate</span>
          </div>
          <div className="text-3xl font-extrabold text-blue-400">{tradeAnalytics.winRate}%</div>
        </div>
        <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50 backdrop-blur-sm shadow-xl hover:scale-105 transition-transform">
          <div className="flex items-center gap-3 text-gray-300 mb-3">
            <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">Net P&L</span>
          </div>
          <div className={`text-3xl font-extrabold ${tradeAnalytics.netPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {tradeAnalytics.netPnL >= 0 ? '+' : ''}${tradeAnalytics.netPnL.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search trades by student, pair, type, or strategy..."
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-trade-neon focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={filterPair}
            onChange={e => setFilterPair(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-trade-neon outline-none"
          >
            <option value="all">All Pairs</option>
            {uniquePairs.map(pair => (
              <option key={pair} value={pair}>{pair}</option>
            ))}
          </select>
          <select
            value={filterOutcome}
            onChange={e => setFilterOutcome(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-trade-neon outline-none"
          >
            <option value="all">All Outcomes</option>
            <option value="win">Wins</option>
            <option value="loss">Losses</option>
            <option value="breakeven">Breakeven</option>
          </select>
          <select
            value={filterStrategy}
            onChange={e => setFilterStrategy(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-trade-neon outline-none"
          >
            <option value="all">All Strategies</option>
            {uniqueStrategies.map(strategy => (
              <option key={strategy} value={strategy}>{strategy}</option>
            ))}
          </select>
        </div>

        {/* Trades Table */}
        <div className="overflow-x-auto no-scrollbar pb-4">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-700/50">
                <th className="pb-4 font-medium">Student</th>
                <th className="pb-4 font-medium">Pair</th>
                <th className="pb-4 font-medium">Type</th>
                <th className="pb-4 font-medium">Entry</th>
                <th className="pb-4 font-medium">SL</th>
                <th className="pb-4 font-medium">TP</th>
                <th className="pb-4 font-medium">Status</th>
                <th className="pb-4 font-medium">Strategy</th>
                <th className="pb-4 font-medium">Confidence</th>
                <th className="pb-4 font-medium">Review Status</th>
                <th className="pb-4 font-medium">PnL</th>
                <th className="pb-4 font-medium">Date</th>
                <th className="pb-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {filteredTrades.map((trade) => (
                <tr key={trade.id} className="hover:bg-gray-900/50 transition-colors">
                  <td className="py-4">
                    <div className="font-medium text-white">{trade.student}</div>
                  </td>
                  <td className="py-4 text-white">{trade.pair}</td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(trade.type)}`}>
                      {trade.type}
                    </span>
                  </td>
                  <td className="py-4 text-gray-400">{trade.entry}</td>
                  <td className="py-4 text-gray-400">{trade.sl}</td>
                  <td className="py-4 text-gray-400">{trade.tp}</td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(trade.status)}`}>
                      {trade.status}
                    </span>
                  </td>
                  <td className="py-4 text-gray-400">{trade.strategy}</td>
                  <td className="py-4 text-gray-400">{trade.confidence}</td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getReviewStatusColor(trade.reviewStatus)}`}>
                      {trade.reviewStatus}
                    </span>
                  </td>
                  <td className={`py-4 font-medium ${trade.pnl > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {trade.pnl > 0 ? '+' : ''}{trade.pnl}
                  </td>
                  <td className="py-4 text-gray-400">{trade.date}</td>
                  <td className="py-4">
                    <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition">
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTrades.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No trades found matching your search.</p>
          </div>
        )}
      </div>

      {/* P&L by Asset Chart */}
      <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50 shadow-xl">
        <h3 className="font-bold text-xl mb-6 text-gray-200">P&L by Asset</h3>
        <div className="h-64 md:h-72">
          {tradeAnalytics.pairData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={tradeAnalytics.pairData}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.5} />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={12}
                  tick={{ fill: '#94a3b8' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tick={{ fill: '#94a3b8' }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value) => [`$${value}`, 'P&L']}
                  labelFormatter={(label) => `Asset: ${label}`}
                />
                <Bar
                  dataKey="value"
                  name="P&L"
                  fill="#00ff94"
                  radius={[4, 4, 0, 0]}
                >
                  {tradeAnalytics.pairData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.value >= 0 ? '#00ff94' : '#ef4444'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">No data available</div>
          )}
        </div>

        {/* Asset Details */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tradeAnalytics.pairData.map((asset, index) => (
            <div key={asset.name} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700/30">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: asset.value >= 0 ? '#00ff94' : '#ef4444' }}
                ></div>
                <span className="text-white font-medium">{asset.name}</span>
              </div>
              <div className="text-right">
                <div className={`font-bold ${asset.value >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${asset.value.toFixed(2)}
                </div>
                <div className="text-gray-400 text-sm">{asset.count} trades</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TradesTab;