import React, { useState, useMemo } from 'react';
import { useAdminPortal } from '../AdminPortalContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const TradesTab: React.FC = () => {
  const { trades, students } = useAdminPortal();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPair, setFilterPair] = useState('all');
  const [filterOutcome, setFilterOutcome] = useState('all');
  const [filterStrategy, setFilterStrategy] = useState('all');

  const uniquePairs = useMemo(() =>
    Array.from(new Set(trades.map(t => t.pair).filter(Boolean))), [trades]);

  const uniqueStrategies = useMemo(() =>
    Array.from(new Set(trades.map(t => t.strategy).filter(Boolean))), [trades]);

  const tableData = useMemo(() => trades.map(trade => ({
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
    reviewStatus: trade.adminReviewStatus || 'N/A',
  })), [trades]);

  const filteredTrades = tableData.filter(trade =>
    (trade.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.pair.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.strategy.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterPair === 'all' || trade.pair === filterPair) &&
    (filterOutcome === 'all' || trade.status === filterOutcome) &&
    (filterStrategy === 'all' || trade.strategy === filterStrategy)
  );

  const tradeAnalytics = useMemo(() => {
    const total = filteredTrades.length;
    const wins = filteredTrades.filter(t => t.status === 'win').length;
    const losses = filteredTrades.filter(t => t.status === 'loss').length;
    const winRate = (wins + losses) > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;
    const netPnL = filteredTrades.reduce((s, t) => s + (t.pnl || 0), 0);

    const pairStats: Record<string, { pnl: number; count: number }> = {};
    filteredTrades.forEach(t => {
      if (t.pair) {
        if (!pairStats[t.pair]) pairStats[t.pair] = { pnl: 0, count: 0 };
        pairStats[t.pair].pnl += (t.pnl || 0);
        pairStats[t.pair].count += 1;
      }
    });

    const pairData = Object.entries(pairStats)
      .map(([name, { pnl, count }]) => ({ name, value: pnl, count }))
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

    return { total, wins, losses, winRate, netPnL, pairData };
  }, [filteredTrades]);

  // Calculate Student P&L Performance Ranking
  const pnlByStudent = useMemo(() => {
    const byStudent: Record<string, any[]> = {};
    trades.forEach(t => {
      if (!byStudent[t.studentId]) byStudent[t.studentId] = [];
      byStudent[t.studentId].push(t);
    });
    return Object.entries(byStudent)
      .map(([id, sts]) => {
        const pnl = sts.reduce((s, t) => s + (t.pnl || 0), 0);
        const wins = sts.filter(t => t.status === 'win').length;
        const student = students.find(s => s.id === id);
        return {
          id,
          name: student?.name || 'Unknown',
          tier: student?.tier || 'free',
          totalPnL: pnl,
          winTrades: wins,
          lossTrades: sts.length - wins,
          totalTrades: sts.length,
          winRate: sts.length > 0 ? Math.round((wins / sts.length) * 100) : 0,
        };
      })
      .sort((a, b) => Math.abs(b.totalPnL) - Math.abs(a.totalPnL));
  }, [trades, students]);

  const getTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'buy':  return 'badge badge-primary';
      case 'sell': return 'badge badge-purple';
      default:     return 'badge badge-gray';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'win':       return 'badge badge-success';
      case 'loss':      return 'badge badge-danger';
      case 'breakeven': return 'badge badge-warning';
      default:          return 'badge badge-gray';
    }
  };

  const getReviewBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'reviewed': return 'badge badge-success';
      case 'flagged':  return 'badge badge-danger';
      case 'pending':  return 'badge badge-warning';
      default:         return 'badge badge-gray';
    }
  };

  const statCards = [
    { label: 'Total Trades', value: tradeAnalytics.total,   iconClass: 'icon-blue',  color: 'text-slate-900' },
    { label: 'Wins',         value: tradeAnalytics.wins,    iconClass: 'icon-green', color: 'text-emerald-600' },
    { label: 'Losses',       value: tradeAnalytics.losses,  iconClass: 'icon-red',   color: 'text-red-600' },
    { label: 'Win Rate',     value: `${tradeAnalytics.winRate}%`, iconClass: 'icon-blue', color: 'text-blue-600' },
    {
      label: 'Net P&L',
      value: `${tradeAnalytics.netPnL >= 0 ? '+' : ''}$${tradeAnalytics.netPnL.toLocaleString()}`,
      iconClass: tradeAnalytics.netPnL >= 0 ? 'icon-green' : 'icon-red',
      color: tradeAnalytics.netPnL >= 0 ? 'text-emerald-600' : 'text-red-600',
    },
  ];

  return (
    <div className="space-y-0 animate-slide-up">

      {/* Page Header */}
      <div className="page-header">
        <h2 className="section-title">Trade Analysis</h2>
        <p className="section-desc">Analyze, filter, and review all student trades and student P&L performance.</p>
      </div>

      {/* Stat Cards */}
      <div className="page-section">
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
          {statCards.map((s, i) => (
            <div key={i} className="stat-card">
              <div className="stat-card-top">
                <div className={`stat-card-icon ${s.iconClass}`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="stat-card-label">{s.label}</span>
              </div>
              <div className={`stat-card-value ${s.color}`} style={{ fontSize: 24 }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Student P&L Performance Ranking (Migrated from Command Center) */}
      <div className="page-section">
        <div className="section-header">
          <h3 className="section-title">Student P&L Performance</h3>
          <p className="section-desc">Trade performance ranked by total P&L across all students.</p>
        </div>

        <div className="content-card">
          <div className="p-6 border-b border-slate-100">
            <div className="h-56 sm:h-72">
              {pnlByStudent.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart
                    data={pnlByStudent.slice(0, 10)}
                    layout="vertical"
                    margin={{ top: 5, right: 16, left: 110, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis
                      type="number"
                      stroke="#94A3B8"
                      fontSize={12}
                      tickFormatter={v => `$${v}`}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="#94A3B8"
                      fontSize={12}
                      width={100}
                      tick={{ fill: '#64748B' }}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(15,23,42,0.06)' }}
                      formatter={v => [`$${parseFloat(v as string).toFixed(2)}`, 'Total P&L']}
                      labelStyle={{ color: '#0F172A', fontWeight: 600 }}
                    />
                    <Bar
                      dataKey="totalPnL"
                      name="Total P&L"
                      fill="#3B82F6"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                  No trade data available yet.
                </div>
              )}
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {pnlByStudent.length > 0 ? (
              pnlByStudent.slice(0, 5).map(s => (
                <div key={s.id} className="pnl-row mx-6 my-0 rounded-none border-none bg-transparent hover:bg-slate-50" style={{ borderRadius: 0, margin: 0, padding: '12px 24px' }}>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">{s.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {s.tier} tier &middot; {s.winTrades}W / {s.lossTrades}L &middot; {s.winRate}% win rate
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-base font-bold tabular-nums ${s.totalPnL >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {s.totalPnL >= 0 ? '+' : ''}${s.totalPnL.toFixed(2)}
                    </span>
                    <p className="text-xs text-slate-400 mt-0.5">{s.totalTrades} trades</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 text-sm">
                No student trade data available.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="page-section">
        <div className="content-card p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <div className="flex-1 min-w-0" style={{ minWidth: 180 }}>
              <input
                type="text"
                placeholder="Search by student, pair, type, or strategy…"
                className="input w-full"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <select value={filterPair} onChange={e => setFilterPair(e.target.value)} className="input sm:w-36">
              <option value="all">All Pairs</option>
              {uniquePairs.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={filterOutcome} onChange={e => setFilterOutcome(e.target.value)} className="input sm:w-36">
              <option value="all">All Outcomes</option>
              <option value="win">Wins</option>
              <option value="loss">Losses</option>
              <option value="breakeven">Breakeven</option>
            </select>
            <select value={filterStrategy} onChange={e => setFilterStrategy(e.target.value)} className="input sm:w-36">
              <option value="all">All Strategies</option>
              {uniqueStrategies.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Trades Table */}
      <div className="page-section">
        <div className="content-card">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Pair</th>
                  <th>Type</th>
                  <th>Entry</th>
                  <th>SL</th>
                  <th>TP</th>
                  <th>Status</th>
                  <th>Strategy</th>
                  <th>Confidence</th>
                  <th>Review</th>
                  <th className="text-right">P&L</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrades.map(trade => (
                  <tr key={trade.id}>
                    <td className="font-semibold text-slate-800">{trade.student}</td>
                    <td className="font-medium">{trade.pair}</td>
                    <td><span className={getTypeBadge(trade.type)}>{trade.type}</span></td>
                    <td className="text-right tabular-nums">{trade.entry}</td>
                    <td className="text-right tabular-nums text-red-600">{trade.sl}</td>
                    <td className="text-right tabular-nums text-emerald-600">{trade.tp}</td>
                    <td><span className={getStatusBadge(trade.status)}>{trade.status}</span></td>
                    <td>{trade.strategy}</td>
                    <td>{trade.confidence}</td>
                    <td><span className={getReviewBadge(trade.reviewStatus)}>{trade.reviewStatus}</span></td>
                    <td className={`text-right font-semibold tabular-nums ${trade.pnl > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {trade.pnl > 0 ? '+' : ''}{trade.pnl}
                    </td>
                    <td className="text-slate-500">{trade.date}</td>
                    <td><button className="btn btn-sm btn-secondary">Review</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredTrades.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-sm">No trades found matching your filters.</div>
          )}
        </div>
      </div>

      {/* P&L by Asset Chart */}
      <div className="page-section">
        <div className="section-header">
          <h3 className="section-title">P&L by Asset</h3>
          <p className="section-desc">Net profit/loss grouped by currency pair or instrument.</p>
        </div>

        <div className="content-card p-6">
          <div className="h-60 sm:h-72">
            {tradeAnalytics.pairData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={tradeAnalytics.pairData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tick={{ fill: '#64748B' }} />
                  <YAxis stroke="#94A3B8" fontSize={12} tick={{ fill: '#64748B' }} tickFormatter={v => `$${v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: 8 }}
                    formatter={v => [`$${v}`, 'P&L']}
                    labelFormatter={l => `Asset: ${l}`}
                  />
                  <Bar dataKey="value" name="P&L" radius={[4, 4, 0, 0]}>
                    {tradeAnalytics.pairData.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={entry.value >= 0 ? '#10B981' : '#EF4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">No chart data available</div>
            )}
          </div>

          {tradeAnalytics.pairData.length > 0 && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {tradeAnalytics.pairData.map(asset => (
                <div key={asset.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: asset.value >= 0 ? '#10B981' : '#EF4444' }} />
                    <span className="text-sm font-semibold text-slate-700">{asset.name}</span>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold tabular-nums ${asset.value >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      ${asset.value.toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-400">{asset.count} trades</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="h-10" />
    </div>
  );
};

export default TradesTab;