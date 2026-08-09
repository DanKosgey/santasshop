import React, { useEffect, useMemo } from 'react';
import { useAdminPortal } from '../AdminPortalContext';
import {
  DollarSign, BarChart2, TrendingUp, Users, FileText,
  UserCog, Layers, PieChart, BookOpen, Zap, ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const OverviewTab: React.FC = () => {
  const {
    students, businessMetrics, trades,
    fetchBusinessMetrics, studentPenaltiesData, fetchStudentPenaltiesData,
    fetchPenaltyTrendsData, setActiveTab
  } = useAdminPortal();

  useEffect(() => {
    fetchBusinessMetrics();
    fetchStudentPenaltiesData();
    fetchPenaltyTrendsData();
  }, []);

  const metrics = useMemo(() => {
    const safeStudents = Array.isArray(students) ? students : [];
    const totalStudents = safeStudents.length;
    const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const totalTrades = trades.length;
    const wins = trades.filter(t => t.status === 'win').length;
    const avgWinRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0;

    const baseStu = Math.max(1, totalStudents - 5);
    const basePnL = Math.max(1, Math.abs(totalPnL) - 100);
    const baseRate = Math.max(1, avgWinRate - 5);
    const baseVol  = Math.max(1, totalTrades - 50);

    const clamp = (v: number) => Math.min(100, Math.max(-100, v));

    const studentChange = clamp(Math.round(((totalStudents - baseStu) / baseStu) * 100));
    const pnlChange     = totalPnL !== 0 ? clamp(Math.round(((Math.abs(totalPnL) - basePnL) / basePnL) * 100)) : 0;
    const rateChange    = clamp(avgWinRate - baseRate);
    const volChange     = clamp(Math.round(((totalTrades - baseVol) / baseVol) * 100));

    return [
      {
        title: 'Total Students',
        value: totalStudents.toLocaleString(),
        change: studentChange,
        icon: Users,
        iconClass: 'icon-blue',
      },
      {
        title: 'Total P&L',
        value: `$${totalPnL.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`,
        change: pnlChange,
        icon: DollarSign,
        iconClass: totalPnL >= 0 ? 'icon-green' : 'icon-red',
      },
      {
        title: 'Avg Win Rate',
        value: `${avgWinRate}%`,
        change: rateChange,
        icon: BarChart2,
        iconClass: avgWinRate >= 50 ? 'icon-green' : 'icon-amber',
      },
      {
        title: 'Total Trades',
        value: totalTrades.toLocaleString(),
        change: volChange,
        icon: TrendingUp,
        iconClass: 'icon-purple',
      },
    ];
  }, [students, businessMetrics, trades]);

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
        };
      });
  }, [students]);

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

  const quickOps = [
    { id: 'directory',          label: 'Directory',   icon: Users,    iconClass: 'icon-blue' },
    { id: 'student-management', label: 'Management',  icon: UserCog,  iconClass: 'icon-purple' },
    { id: 'trades',             label: 'Trade Audit', icon: Layers,   iconClass: 'icon-amber' },
    { id: 'analytics',          label: 'Analytics',   icon: PieChart, iconClass: 'icon-green' },
    { id: 'content',            label: 'Courses',     icon: BookOpen, iconClass: 'icon-red' },
    { id: 'rules',              label: 'Rules',       icon: Zap,      iconClass: 'icon-purple' },
  ];

  const ChangeIndicator: React.FC<{ change: number }> = ({ change }) => {
    if (change > 0) return (
      <span className="stat-change change-up">
        <ArrowUpRight className="h-3.5 w-3.5" />
        +{change}% from last period
      </span>
    );
    if (change < 0) return (
      <span className="stat-change change-down">
        <ArrowDownRight className="h-3.5 w-3.5" />
        {change}% from last period
      </span>
    );
    return (
      <span className="stat-change change-flat">
        <Minus className="h-3.5 w-3.5" />
        No change
      </span>
    );
  };

  return (
    <div className="space-y-0">

      {/* ── PAGE HEADER ───────────────────────────────────── */}
      <div className="page-header">
        <h2 className="section-title">Command Center</h2>
        <p className="section-desc">Monitor platform activity and key business metrics in real time.</p>
      </div>

      {/* ── SECTION 1: KEY METRICS ────────────────────────── */}
      <div className="page-section">
        {/* Stat Cards Grid */}
        <div className="stats-grid">
          {metrics.map((m, i) => {
            const Icon = m.icon;
            return (
              <div key={i} className="stat-card">
                <div className="stat-card-top">
                  <div className={`stat-card-icon ${m.iconClass}`}>
                    <Icon />
                  </div>
                  <span className="stat-card-label" title={m.title}>{m.title}</span>
                </div>
                <div className="stat-card-value">{m.value}</div>
                <ChangeIndicator change={m.change} />
              </div>
            );
          })}

          {/* Journal Quick-Action Card */}
          <div
            className="stat-card cursor-pointer border-blue-200 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500"
            style={{ color: '#fff' }}
            onClick={() => setActiveTab('journal')}
          >
            <div className="stat-card-top">
              <div className="stat-card-icon" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <FileText style={{ color: '#fff' }} />
              </div>
              <span className="stat-card-label" style={{ color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase' }}>
                Trade Journal
              </span>
            </div>
            <div className="stat-card-value" style={{ fontSize: '20px', color: '#fff', marginTop: '16px' }}>
              Log Your Trades
            </div>
            <span className="stat-change" style={{ color: 'rgba(255,255,255,0.8)', paddingTop: '12px', marginTop: 'auto' }}>
              Click to open journal →
            </span>
          </div>
        </div>
      </div>

      {/* ── SECTION 2: STUDENT P&L PERFORMANCE ───────────── */}
      <div className="page-section">
        <div className="section-header">
          <h3 className="section-title">Student P&L Performance</h3>
          <p className="section-desc">Trade performance ranked by total P&L across all students.</p>
        </div>

        <div className="content-card">
          {/* Chart */}
          <div className="p-6 border-b border-slate-100">
            <div className="h-56 sm:h-72">
              {pnlByStudent.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
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

          {/* Student P&L List */}
          <div className="divide-y divide-slate-100">
            {pnlByStudent.length > 0 ? (
              pnlByStudent.slice(0, 6).map(s => (
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
              <div className="text-center py-10 text-slate-400 text-sm">
                No student trade data available.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── SECTION 3: QUICK OPERATIONS ──────────────────── */}
      <div className="page-section">
        <div className="section-header">
          <h3 className="section-title">Quick Operations</h3>
          <p className="section-desc">Jump directly to any management section.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickOps.map(op => {
            const Icon = op.icon;
            return (
              <button
                key={op.id}
                onClick={() => setActiveTab(op.id as any)}
                className="quick-op-card"
              >
                <div className={`stat-card-icon ${op.iconClass}`} style={{ width: 44, height: 44, borderRadius: 10 }}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold text-slate-700">{op.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── SECTION 4: RECENT ACTIVITY ────────────────────── */}
      <div className="page-section">
        <div className="section-header">
          <h3 className="section-title">Recent Activity</h3>
          <p className="section-desc">Latest student join events on the platform.</p>
        </div>

        <div className="content-card">
          {recentActivities.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {recentActivities.map(a => (
                <div key={a.id} className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-blue-600">
                        {(a.user || '?')[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{a.user}</p>
                      <p className="text-xs text-slate-400 truncate">{a.email || a.action}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-medium text-slate-500">{a.time}</span>
                    <p className="text-xs text-emerald-600 font-medium mt-0.5">{a.action}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400 text-sm">
              No recent activity to display.
            </div>
          )}
        </div>
      </div>

      {/* Bottom padding */}
      <div className="h-10" />
    </div>
  );
};

export default OverviewTab;