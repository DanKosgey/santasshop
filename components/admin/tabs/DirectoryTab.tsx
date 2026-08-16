import React, { useState, useMemo } from 'react';
import { useAdminPortal } from '../AdminPortalContext';
import { StudentProfile } from '../../../types';
import { Users, UserCheck, AlertTriangle, UserX, Clock, ArrowRight } from 'lucide-react';

const DirectoryTab: React.FC = () => {
  const { students, trades } = useAdminPortal();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'at-risk' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Enhance student data with trade information
  const enhancedStudents = useMemo(() => {
    return students.map(student => {
      const studentTrades = trades.filter(trade => trade.studentId === student.id);
      const totalTrades = studentTrades.length;
      const wins = studentTrades.filter(t => t.status === 'win').length;
      const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0;
      const totalPnL = studentTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);

      return {
        ...student,
        stats: {
          ...student.stats,
          tradesCount: totalTrades,
          winRate,
          totalPnL
        },
        recentTrades: studentTrades.slice(0, 3)
      };
    });
  }, [students, trades]);

  const tableData = enhancedStudents.map(student => ({
    id: student.id,
    name: student.name || 'Unknown',
    email: student.email || '',
    tier: student.tier || 'free',
    status: student.status || 'inactive',
    joinDate: student.joinedDate || '',
    trades: student.stats?.tradesCount || 0,
    winRate: `${student.stats?.winRate || 0}%`,
    totalPnL: student.stats?.totalPnL || 0,
    avgRiskReward: student.stats?.avgRiskReward || 0,
    recentTrades: student.recentTrades || []
  }));

  const filteredStudents = tableData.filter(student => {
    const q = (searchTerm || '').toLowerCase();
    const name = (student.name || '').toLowerCase();
    const email = (student.email || '').toLowerCase();
    const tier = (student.tier || '').toLowerCase();
    const matchesSearch = name.includes(q) || email.includes(q) || tier.includes(q);
    const matchesFilter = filter === 'all' || student.status === filter;
    return matchesSearch && matchesFilter;
  });

  // Recent Join Events
  const recentActivities = useMemo(() => {
    const safe = Array.isArray(students) ? students : [];
    return safe
      .filter(s => s?.joinedDate)
      .sort((a, b) => new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime())
      .slice(0, 5)
      .map((student, i) => {
        const joinDate = new Date(student.joinedDate);
        const hoursAgo = Math.floor((Date.now() - joinDate.getTime()) / 3600000);
        const timeText = hoursAgo < 24 ? `${hoursAgo}h ago` : `${Math.floor(hoursAgo / 24)}d ago`;
        return {
          id: `join-${student.id || i}`,
          user: student.name || 'Unknown User',
          email: student.email || '',
          action: 'Joined Platform',
          time: timeText,
          tier: student.tier || 'free'
        };
      });
  }, [students]);

  const getStatusBadge = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'active':   return 'badge badge-success';
      case 'at risk':
      case 'at-risk':  return 'badge badge-danger';
      case 'inactive': return 'badge badge-gray';
      default:         return 'badge badge-gray';
    }
  };

  const getTierBadge = (tier: string) => {
    switch ((tier || '').toLowerCase()) {
      case 'elite':        return 'badge badge-purple';
      case 'professional': return 'badge badge-primary';
      case 'foundation':   return 'badge badge-success';
      default:             return 'badge badge-gray';
    }
  };

  const activeCount  = students.filter(s => s.status === 'active').length;
  const atRiskCount  = students.filter(s => s.status === 'at-risk' || s.status === 'at risk').length;
  const inactiveCount = students.filter(s => s.status === 'inactive').length;

  return (
    <div className="space-y-0 animate-slide-up">

      {/* Page Header */}
      <div className="page-header">
        <h2 className="section-title">Student Directory</h2>
        <p className="section-desc">Search, filter, and monitor all platform members and recent signup activity.</p>
      </div>

      {/* Summary Stat Cards */}
      <div className="page-section">
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
          <div className="stat-card">
            <div className="stat-card-top">
              <div className="stat-card-icon icon-blue">
                <Users className="w-5 h-5" />
              </div>
              <span className="stat-card-label">Total Students</span>
            </div>
            <div className="stat-card-value text-slate-900">{students.length}</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-top">
              <div className="stat-card-icon icon-green">
                <UserCheck className="w-5 h-5" />
              </div>
              <span className="stat-card-label">Active</span>
            </div>
            <div className="stat-card-value text-emerald-600">{activeCount}</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-top">
              <div className="stat-card-icon icon-red">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <span className="stat-card-label">At Risk</span>
            </div>
            <div className="stat-card-value text-red-600">{atRiskCount}</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-top">
              <div className="stat-card-icon icon-amber">
                <UserX className="w-5 h-5" />
              </div>
              <span className="stat-card-label">Inactive</span>
            </div>
            <div className="stat-card-value text-slate-500">{inactiveCount}</div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="page-section">
        <div className="content-card p-4 sm:p-5 mb-0" style={{ borderRadius: 12 }}>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name, email, or tier…"
                className="input"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={filter}
              onChange={e => setFilter(e.target.value as any)}
              className="input sm:w-40"
            >
              <option value="all">All Students</option>
              <option value="active">Active</option>
              <option value="at-risk">At-Risk</option>
              <option value="inactive">Inactive</option>
            </select>
            <div className="flex border border-slate-200 rounded-lg overflow-hidden shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 text-sm font-medium transition ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 text-sm font-medium transition border-l border-slate-200 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Students View */}
      <div className="page-section">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredStudents.map(student => (
              <div key={student.id} className="stat-card gap-3" style={{ gap: 0 }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-base font-bold text-blue-600 shrink-0">
                      {(student.name || '?')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{student.name}</p>
                      <p className="text-xs text-slate-400 truncate" title={student.email}>{student.email}</p>
                    </div>
                  </div>
                  <span className={getTierBadge(student.tier)}>{student.tier}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Win Rate</p>
                    <p className={`text-sm font-bold mt-0.5 ${(parseFloat(student.winRate) || 0) >= 50 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {student.winRate}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">P&L</p>
                    <p className={`text-sm font-bold mt-0.5 tabular-nums ${(student.totalPnL || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      ${(student.totalPnL || 0).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400">
                  <span>Joined {new Date(student.joinDate).toLocaleDateString()}</span>
                  <span className={getStatusBadge(student.status)}>{student.status}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="content-card">
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Tier</th>
                    <th>Status</th>
                    <th>Join Date</th>
                    <th>Trades</th>
                    <th>Win Rate</th>
                    <th>P&L</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(student => (
                    <tr key={student.id}>
                      <td style={{ maxWidth: 200 }}>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-sm font-bold text-blue-600 shrink-0">
                            {(student.name || '?')[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{student.name}</p>
                            <p className="text-xs text-slate-400 truncate" title={student.email}>{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td><span className={getTierBadge(student.tier)}>{student.tier}</span></td>
                      <td><span className={getStatusBadge(student.status)}>{student.status}</span></td>
                      <td className="text-slate-500">{new Date(student.joinDate).toLocaleDateString()}</td>
                      <td className="text-right">{student.trades}</td>
                      <td className={`text-right font-medium ${(parseFloat(student.winRate) || 0) >= 50 ? 'text-emerald-600' : 'text-red-600'}`}>{student.winRate}</td>
                      <td className={`text-right ${(student.totalPnL || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>${(student.totalPnL || 0).toFixed(2)}</td>
                      <td>
                        <button className="btn btn-sm btn-secondary">Manage</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredStudents.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-sm">
                No students found matching your search.
              </div>
            )}
          </div>
        )}

        {viewMode === 'grid' && filteredStudents.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">
            No students found matching your search.
          </div>
        )}
      </div>

      {/* Recent Platform Activity Feed */}
      <div className="page-section">
        <div className="section-header">
          <h3 className="section-title flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" /> Recent Student Activity
          </h3>
          <p className="section-desc">Latest student signups and join events.</p>
        </div>

        <div className="content-card">
          {recentActivities.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {recentActivities.map(a => (
                <div key={a.id} className="flex items-center justify-between gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-blue-600">
                        {(a.user || '?')[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{a.user}</p>
                      <p className="text-xs text-slate-400 truncate">{a.email || a.action}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-3">
                    <span className={getTierBadge(a.tier)}>{a.tier}</span>
                    <span className="text-xs font-medium text-slate-400">{a.time}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-sm">
              No recent activity to display.
            </div>
          )}
        </div>
      </div>

      <div className="h-10" />
    </div>
  );
};

export default DirectoryTab;
