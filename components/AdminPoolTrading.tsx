import { useState } from 'react';
import { 
  TrendingUp, Bell, CheckCircle2, 
  XCircle, ChevronDown, ChevronUp, Copy
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export function AdminPoolTrading() {
  const [activeTab, setActiveTab] = useState<'overview' | 'applications' | 'investments' | 'withdrawals' | 'packages' | 'settings'>('overview');

  // Chart expand state for mobile view
  const [isChartExpanded, setIsChartExpanded] = useState(false);

  // Notification Feed Bell State
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 'n1', title: 'New Application', message: 'John Doe applied for 7-Day Plan — $500', is_read: false, time: '5m ago' },
    { id: 'n2', title: 'Withdrawal Request', message: 'Jane Smith requested $271.25 USDT', is_read: false, time: '20m ago' }
  ]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Overview Data
  const stats = {
    active_investments: 14,
    funds_under_management: 38450.00,
    total_payouts: 12890.00,
    pending_applications: 3,
    total_participants: 28
  };

  const chartData7Days = [
    { day: 'Mon', current: 4200, last: 3100 },
    { day: 'Tue', current: 5800, last: 4000 },
    { day: 'Wed', current: 7500, last: 4900 },
    { day: 'Thu', current: 9100, last: 6200 },
    { day: 'Fri', current: 12400, last: 8500 },
    { day: 'Sat', current: 15300, last: 10200 },
    { day: 'Sun', current: 18450, last: 12800 },
  ];

  // Pending Applications
  const [pendingApplications, setPendingApplications] = useState([
    {
      id: 'app_001',
      user_name: 'John Doe',
      user_email: 'john@example.com',
      user_phone: '+1234567890',
      package_name: '7-Day Growth Plan',
      duration: '7 Days',
      amount: 500.00,
      applied_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      hours_ago: 3
    },
    {
      id: 'app_002',
      user_name: 'Sarah Connor',
      user_email: 'sarah@skynet.com',
      user_phone: '+1987654321',
      package_name: '30-Day VIP Syndicate',
      duration: '30 Days',
      amount: 2500.00,
      applied_at: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
      hours_ago: 28
    },
    {
      id: 'app_003',
      user_name: 'Michael Scott',
      user_email: 'michael@dundermifflin.com',
      user_phone: '+1555019283',
      package_name: '24-Hour Starter Plan',
      duration: '24 Hours',
      amount: 1000.00,
      applied_at: new Date(Date.now() - 52 * 3600 * 1000).toISOString(),
      hours_ago: 52
    }
  ]);

  const [approveAppModal, setApproveAppModal] = useState<any | null>(null);
  const [rejectAppModal, setRejectAppModal] = useState<any | null>(null);
  const [customApproveAmount, setCustomApproveAmount] = useState<number>(0);
  const [customMaturityDate, setCustomMaturityDate] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');

  // Active Investments
  const [activeInvestments, setActiveInvestments] = useState([
    {
      id: 'inv_801',
      user_name: 'Alex Vance',
      package_name: '7-Day Growth Plan',
      amount: 500.00,
      expected_return: 120.00,
      start_date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toLocaleDateString(),
      maturity_date: new Date(Date.now() + 4 * 24 * 3600 * 1000).toLocaleDateString(),
      progress_pct: 42.8,
      status: 'active'
    },
    {
      id: 'inv_802',
      user_name: 'David Miller',
      package_name: '24-Hour Starter Plan',
      amount: 250.00,
      expected_return: 21.25,
      start_date: new Date(Date.now() - 26 * 3600 * 1000).toLocaleDateString(),
      maturity_date: new Date(Date.now() - 2 * 3600 * 1000).toLocaleDateString(),
      progress_pct: 100,
      status: 'matured'
    }
  ]);

  // Withdrawal Requests
  const [withdrawals] = useState([
    {
      id: 'w_1',
      user_name: 'David Miller',
      investment_id: 'inv_802',
      amount: 271.25,
      payment_method: 'USDT_TRC20',
      wallet_address: 'TX9kZ2P...8Nm3Lq',
      full_wallet: 'TX9kZ2Pq1VbM5K8W0A9L3J2N8Nm3Lq4P1X',
      request_date: new Date().toLocaleDateString(),
      status: 'pending'
    }
  ]);

  const [setCompleteWithdrawModal] = useState<any | null>(null);
  const [setFailWithdrawModal] = useState<any | null>(null);

  const handleOpenApproveModal = (app: any) => {
    setApproveAppModal(app);
    setCustomApproveAmount(app.amount);
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setCustomMaturityDate(d.toISOString().slice(0, 16));
  };

  const handleConfirmApproval = () => {
    if (!approveAppModal) return;
    setPendingApplications(pendingApplications.filter(a => a.id !== approveAppModal.id));
    setActiveInvestments([
      {
        id: `inv_${Date.now()}`,
        user_name: approveAppModal.user_name,
        package_name: approveAppModal.package_name,
        amount: customApproveAmount,
        expected_return: (customApproveAmount * 15) / 100,
        start_date: new Date().toLocaleDateString(),
        maturity_date: new Date(customMaturityDate).toLocaleDateString(),
        progress_pct: 0,
        status: 'active'
      },
      ...activeInvestments
    ]);
    setApproveAppModal(null);
  };

  const handleConfirmRejection = () => {
    if (!rejectAppModal) return;
    setPendingApplications(pendingApplications.filter(a => a.id !== rejectAppModal.id));
    setRejectAppModal(null);
    setRejectionReason('');
  };

  const handleCopyWallet = (fullWallet: string) => {
    navigator.clipboard.writeText(fullWallet);
    alert('Wallet address copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-slate-700 px-4 py-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6 font-sans pb-24 sm:pb-10">
      
      {/* COMPACT PAGE HEADER */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 gap-3 relative">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2 truncate">
            <TrendingUp className="w-5 h-5 sm:w-7 sm:h-7 text-blue-600 shrink-0" />
            <span className="truncate">Pool Trading Command Center</span>
          </h1>
          {/* Subtitle description hidden on mobile below 640px */}
          <p className="hidden sm:block text-xs sm:text-sm text-slate-500 mt-0.5 font-medium truncate">
            Admin control room for user portfolios, applications, and withdrawals.
          </p>
        </div>

        {/* Bell Notification Icon */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="relative">
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="p-2 sm:p-2.5 bg-white border border-slate-200 hover:border-blue-300 rounded-xl text-slate-600 relative transition shadow-xs"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white font-bold text-[9px] sm:text-[10px] rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {isNotificationOpen && (
              <div className="absolute right-0 mt-3 w-72 sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-bold text-sm text-slate-900">Live Audit Feed</h4>
                  <button
                    onClick={() => setNotifications(notifications.map(n => ({ ...n, is_read: true })))}
                    className="text-xs text-blue-600 font-semibold hover:underline"
                  >
                    Mark all read
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                        n.is_read ? 'bg-slate-50 border-slate-200' : 'bg-blue-50/50 border-blue-200 border-l-4 border-l-blue-600'
                      }`}
                    >
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>{n.title}</span>
                        <span className="text-slate-400 font-mono text-[10px] tabular-nums">{n.time}</span>
                      </div>
                      <p className="text-slate-600">{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* COMPACT MOBILE STAT STRIP / DESKTOP GRID */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-4">
        {/* Active Investments */}
        <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-xs flex flex-col justify-between items-center sm:items-start text-center sm:text-left min-w-0 overflow-hidden">
          <span className="text-[10px] sm:text-[11px] text-slate-400 sm:text-slate-500 uppercase font-bold tracking-tight sm:tracking-wider truncate w-full" title="Active Investments">
            <span className="sm:hidden">Active</span>
            <span className="hidden sm:inline">Active Investments</span>
          </span>
          <p className="text-lg sm:text-3xl font-extrabold text-emerald-600 tabular-nums mt-0.5 sm:mt-2 truncate w-full">{stats.active_investments}</p>
        </div>

        {/* Funds Under Management */}
        <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-xs flex flex-col justify-between items-center sm:items-start text-center sm:text-left min-w-0 overflow-hidden">
          <span className="text-[10px] sm:text-[11px] text-slate-400 sm:text-slate-500 uppercase font-bold tracking-tight sm:tracking-wider truncate w-full" title="Funds Under Management">
            <span className="sm:hidden">Funds</span>
            <span className="hidden sm:inline">Funds Under Mgmt</span>
          </span>
          <p className="text-lg sm:text-3xl font-extrabold text-blue-600 tabular-nums mt-0.5 sm:mt-2 truncate w-full">
            ${(stats.funds_under_management / 1000).toFixed(1)}k
          </p>
        </div>

        {/* Total Payouts */}
        <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-xs flex flex-col justify-between items-center sm:items-start text-center sm:text-left min-w-0 overflow-hidden">
          <span className="text-[10px] sm:text-[11px] text-slate-400 sm:text-slate-500 uppercase font-bold tracking-tight sm:tracking-wider truncate w-full" title="Total Payouts">
            <span className="sm:hidden">Payouts</span>
            <span className="hidden sm:inline">Total Payouts</span>
          </span>
          <p className="text-lg sm:text-3xl font-extrabold text-indigo-600 tabular-nums mt-0.5 sm:mt-2 truncate w-full">
            ${(stats.total_payouts / 1000).toFixed(1)}k
          </p>
        </div>

        {/* Pending Applications */}
        <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-xs flex flex-col justify-between items-center sm:items-start text-center sm:text-left min-w-0 overflow-hidden hidden sm:flex">
          <span className="text-[10px] sm:text-[11px] text-slate-500 uppercase font-bold tracking-wider truncate w-full" title="Pending Applications">Pending Apps</span>
          <p className="text-lg sm:text-3xl font-extrabold text-amber-600 tabular-nums mt-2 truncate w-full">{stats.pending_applications}</p>
        </div>

        {/* Total Participants */}
        <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-xs flex flex-col justify-between items-center sm:items-start text-center sm:text-left min-w-0 overflow-hidden hidden sm:flex">
          <span className="text-[10px] sm:text-[11px] text-slate-500 uppercase font-bold tracking-wider truncate w-full" title="Total Users">Total Users</span>
          <p className="text-lg sm:text-3xl font-extrabold text-slate-900 tabular-nums mt-2 truncate w-full">{stats.total_participants}</p>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex overflow-x-auto no-scrollbar bg-white p-1 rounded-xl sm:rounded-2xl border border-slate-200 space-x-1 shadow-xs">
        {(['overview', 'applications', 'investments', 'withdrawals', 'packages', 'settings'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold capitalize whitespace-nowrap transition shrink-0 ${
              activeTab === tab ? 'bg-blue-600 text-white shadow-blue-glow' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-4 sm:space-y-6">

          {/* HERO CONTENT ON MOBILE: PENDING APPLICATION CARDS */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-4 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-xl font-bold text-slate-900">Pending Application Requests</h2>
              <span className="badge badge-warning">{pendingApplications.length} Pending</span>
            </div>

            {/* Mobile Cards Layout (< 640px) */}
            <div className="block sm:hidden space-y-3">
              {pendingApplications.map((app) => (
                <div key={app.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  {/* Row 1: Avatar + Name + Time */}
                  <div className="flex items-center gap-3 p-4 pb-3">
                    <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                      {app.user_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-slate-900 truncate leading-tight">{app.user_name}</div>
                      <div className="text-xs text-slate-400 truncate mt-0.5">{app.user_email}</div>
                    </div>
                    <span className={`text-[11px] font-bold px-2 py-1 rounded-lg shrink-0 ${
                      app.hours_ago > 48 ? 'bg-red-50 text-red-600' : app.hours_ago > 24 ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {app.hours_ago}h ago
                    </span>
                  </div>

                  {/* Row 2: Package + Amount */}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-t border-b border-slate-100">
                    <div className="min-w-0 flex-1 mr-3">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wide block">Package</span>
                      <span className="text-sm font-semibold text-slate-700 block truncate">{app.package_name}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wide block">Amount</span>
                      <span className="text-lg font-extrabold text-blue-600 tabular-nums block">${app.amount.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Row 3: Action Buttons */}
                  <div className="grid grid-cols-2 gap-0">
                    <button
                      onClick={() => handleOpenApproveModal(app)}
                      className="flex items-center justify-center gap-1.5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => setRejectAppModal(app)}
                      className="flex items-center justify-center gap-1.5 py-3 bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition active:scale-95"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (>= 640px) */}
            <div className="hidden sm:block overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-sm text-slate-700 min-w-[700px]">
                <thead className="bg-[#F8FAFC] text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-4">User</th>
                    <th className="p-4">Package</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Time Applied</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {pendingApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50 transition">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{app.user_name}</div>
                        <div className="text-xs text-slate-400 font-normal">{app.user_email}</div>
                      </td>
                      <td className="p-4 font-semibold text-slate-800">{app.package_name}</td>
                      <td className="p-4 font-bold text-blue-600 tabular-nums">${app.amount.toFixed(2)}</td>
                      <td className="p-4">
                        <span className={`text-xs tabular-nums font-semibold ${app.hours_ago > 48 ? 'text-red-600 font-bold' : app.hours_ago > 24 ? 'text-amber-600' : 'text-slate-500'}`}>
                          {app.hours_ago}h ago
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleOpenApproveModal(app)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-xs transition"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => setRejectAppModal(app)}
                            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shadow-xs transition"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* COLLAPSIBLE CHART ON MOBILE */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-card">
            <button
              onClick={() => setIsChartExpanded(!isChartExpanded)}
              className="w-full p-4 sm:p-6 flex items-center justify-between text-left hover:bg-slate-50 transition"
            >
              <h3 className="text-sm sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>📈 Investment Growth Comparison (7 Days)</span>
              </h3>
              <div className="sm:hidden text-slate-400">
                {isChartExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </button>

            {/* Collapsed on mobile by default unless expanded, expanded on desktop */}
            <div className={`p-4 sm:p-6 pt-0 ${isChartExpanded ? 'block' : 'hidden sm:block'}`}>
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <LineChart data={chartData7Days}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a' }} />
                    <Line type="monotone" dataKey="current" stroke="#3b82f6" strokeWidth={3} name="This Week" />
                    <Line type="monotone" dataKey="last" stroke="#94a3b8" strokeWidth={2} name="Last Week" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: PENDING APPLICATIONS */}
      {activeTab === 'applications' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-card p-4 sm:p-6 space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Pending Application Requests</h2>

          {/* Mobile Cards */}
          <div className="block sm:hidden space-y-3">
            {pendingApplications.map((app) => (
              <div key={app.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                {/* Row 1: Avatar + Name + Time */}
                <div className="flex items-center gap-3 p-4 pb-3">
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                    {app.user_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-slate-900 truncate leading-tight">{app.user_name}</div>
                    <div className="text-xs text-slate-400 truncate mt-0.5">{app.user_email}</div>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-1 rounded-lg shrink-0 ${
                    app.hours_ago > 48 ? 'bg-red-50 text-red-600' : app.hours_ago > 24 ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {app.hours_ago}h ago
                  </span>
                </div>

                {/* Row 2: Package + Amount */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-t border-b border-slate-100">
                  <div className="min-w-0 flex-1 mr-3">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wide block">Package</span>
                    <span className="text-sm font-semibold text-slate-700 block truncate">{app.package_name}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wide block">Amount</span>
                    <span className="text-lg font-extrabold text-blue-600 tabular-nums block">${app.amount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Row 3: Action Buttons */}
                <div className="grid grid-cols-2 gap-0">
                  <button
                    onClick={() => handleOpenApproveModal(app)}
                    className="flex items-center justify-center gap-1.5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => setRejectAppModal(app)}
                    className="flex items-center justify-center gap-1.5 py-3 bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition active:scale-95"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-sm text-slate-700 min-w-[700px]">
              <thead className="bg-[#F8FAFC] text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Package</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Time Applied</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {pendingApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50 transition">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{app.user_name}</div>
                      <div className="text-xs text-slate-400 font-normal">{app.user_email}</div>
                    </td>
                    <td className="p-4 font-semibold text-slate-800">{app.package_name}</td>
                    <td className="p-4 font-bold text-blue-600 tabular-nums">${app.amount.toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`text-xs tabular-nums font-semibold ${app.hours_ago > 48 ? 'text-red-600 font-bold' : app.hours_ago > 24 ? 'text-amber-600' : 'text-slate-500'}`}>
                        {app.hours_ago}h ago
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenApproveModal(app)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-xs transition"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => setRejectAppModal(app)}
                          className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shadow-xs transition"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* APPROVE MODAL */}
      {approveAppModal && (
        <div className="fixed inset-0 z-50 modal-overlay flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="modal-panel max-w-md w-full p-6 space-y-4 shadow-xl relative">
            <h3 className="text-lg font-bold text-slate-900">Approve Application</h3>
            <p className="text-xs text-slate-500">
              User: <strong className="text-slate-900">{approveAppModal.user_name}</strong> ({approveAppModal.user_email})
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Approved Investment Amount ($)</label>
              <input
                type="number"
                value={customApproveAmount}
                onChange={(e) => setCustomApproveAmount(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 tabular-nums text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Custom Maturity Date/Time</label>
              <input
                type="datetime-local"
                value={customMaturityDate}
                onChange={(e) => setCustomMaturityDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 tabular-nums text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button onClick={() => setApproveAppModal(null)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold min-h-[44px]">
                Cancel
              </button>
              <button onClick={handleConfirmApproval} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm shadow-xs min-h-[44px]">
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectAppModal && (
        <div className="fixed inset-0 z-50 modal-overlay flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="modal-panel max-w-md w-full p-6 space-y-4 shadow-xl relative">
            <h3 className="text-lg font-bold text-slate-900">Reject Application</h3>
            <p className="text-xs text-slate-500">
              User: <strong className="text-slate-900">{rejectAppModal.user_name}</strong>
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Reason for Rejection</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-900 text-sm focus:outline-none focus:border-blue-500"
                rows={3}
                placeholder="State the reason..."
                required
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button onClick={() => setRejectAppModal(null)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold min-h-[44px]">
                Cancel
              </button>
              <button onClick={handleConfirmRejection} className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm shadow-xs min-h-[44px]">
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: WITHDRAWAL REQUESTS */}
      {activeTab === 'withdrawals' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-card p-4 sm:p-6 space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Withdrawal Queue</h2>

          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-sm text-slate-700 min-w-[650px]">
              <thead className="bg-[#F8FAFC] text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Wallet Address</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-bold text-slate-900">{w.user_name}</td>
                    <td className="p-3 font-bold text-emerald-600 tabular-nums">${w.amount.toFixed(2)}</td>
                    <td className="p-3 text-xs font-semibold text-slate-600">{w.payment_method}</td>
                    <td className="p-3 font-mono text-xs text-slate-600">
                      <div className="flex items-center space-x-2">
                        <span>{w.wallet_address}</span>
                        <button onClick={() => handleCopyWallet(w.full_wallet)} className="text-blue-600 hover:text-blue-700">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full capitalize font-semibold">
                        {w.status}
                      </span>
                    </td>
                    <td className="p-3">
                      {w.status === 'pending' && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setCompleteWithdrawModal(w)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs min-h-[38px]"
                          >
                            Mark Complete
                          </button>
                          <button
                            onClick={() => setFailWithdrawModal(w)}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-xs min-h-[38px]"
                          >
                            Fail
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPoolTrading;
