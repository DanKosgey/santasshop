import React, { useState, useCallback } from 'react';
import {
  TrendingUp, CheckCircle2, XCircle, Search, Plus, Edit2, Trash2,
  X, ChevronDown, MoreVertical, Users, Clock, DollarSign,
  ShieldCheck, ShieldAlert, Layers, AlertTriangle, Check
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface Application {
  id: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  package_name: string;
  package_id: string;
  duration: string;
  amount: number;
  applied_at: string;
  hours_ago: number;
}

interface ActiveInvestment {
  id: string;
  user_name: string;
  user_email: string;
  package_name: string;
  invested_amount: number;
  expected_return: number;
  total_payout: number;
  start_date: string;
  maturity_date: string;
  status: 'active' | 'matured' | 'withdrawn';
  roi_pct: number;
}

interface Package {
  id: string;
  name: string;
  duration_value: number;
  duration_unit: 'hours' | 'days';
  roi_percentage: number;
  risk_level: 'low' | 'medium' | 'high';
  active: boolean;
  min_amount: number;
  max_amount?: number;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function timeAgoColor(h: number) {
  if (h > 48) return 'text-red-600';
  if (h > 24) return 'text-amber-600';
  return 'text-slate-400';
}

function progressPct(start: string, maturity: string): number {
  const s = new Date(start).getTime(), m = new Date(maturity).getTime(), now = Date.now();
  if (now >= m) return 100;
  return Math.min(100, Math.max(0, ((now - s) / (m - s)) * 100));
}

const riskCfg = {
  low:    { label: 'Low',    color: '#10B981', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  medium: { label: 'Medium', color: '#3B82F6', bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200' },
  high:   { label: 'High',   color: '#F59E0B', bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200' },
};

const globalCSS = `
  .shadow-card { box-shadow: 0 4px 6px -1px rgba(15,23,42,0.06), 0 2px 4px -2px rgba(15,23,42,0.04); }
  .tabular-nums { font-variant-numeric: tabular-nums; }
  @keyframes modalIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
  @keyframes fadeOut { from { opacity:1; transform:scale(1); } to { opacity:0; transform:scale(0.96); } }
  @keyframes slideIn { from { opacity:0; transform:translateX(24px); } to { opacity:1; transform:translateX(0); } }
  .approve-optimistic { animation: fadeOut 0.3s ease forwards; }
`;

/* ─── Reusable Modal ─────────────────────────────────────────────────────── */
function Modal({ open, onClose, title, children, maxW = 'max-w-lg' }: {
  open: boolean; onClose: () => void; title: string; children?: React.ReactNode; maxW?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className={`bg-white w-full ${maxW} rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto`}
        style={{ animation: 'modalIn 0.18s ease' }}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

/* ─── Toast ──────────────────────────────────────────────────────────────── */
function Toast({ msg, type = 'success' }: { msg: string; type?: 'success' | 'error' }) {
  return (
    <div className={`fixed top-5 right-5 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold text-white ${type === 'success' ? 'bg-emerald-600' : 'bg-red-500'}`}
      style={{ animation: 'slideIn 0.2s ease' }}>
      {type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
      {msg}
    </div>
  );
}

/* ─── Stat Strip Card ────────────────────────────────────────────────────── */
function StatChip({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className={`flex flex-col items-center justify-center p-2.5 sm:px-5 sm:py-3 rounded-xl border font-sans text-center ${color} flex-1 min-w-0`}>
      <p className="text-lg sm:text-2xl font-extrabold tabular-nums leading-none tracking-tight">{value}</p>
      <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider mt-1 opacity-80 truncate w-full">{label}</p>
    </div>
  );
}

/* ─── Toggle Switch ──────────────────────────────────────────────────────── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-blue-500' : 'bg-slate-300'}`}>
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
    </button>
  );
}

/* ─── Collapsible Chart Component ────────────────────────────────────────── */
const MOCK_CHART_DATA = [
  { day: 'Mon', growth: 1200, users: 4 },
  { day: 'Tue', growth: 2400, users: 7 },
  { day: 'Wed', growth: 1800, users: 5 },
  { day: 'Thu', growth: 3600, users: 11 },
  { day: 'Fri', growth: 4200, users: 14 },
  { day: 'Sat', growth: 5800, users: 18 },
  { day: 'Sun', growth: 7200, users: 22 },
];

function CollapsibleChart() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-card mb-6 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3.5 sm:p-4 bg-white hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">📈</span>
          <h3 className="text-xs sm:text-sm font-bold text-slate-800">Investment Growth Comparison (7 Days)</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full sm:hidden">
            {expanded ? 'Tap to hide' : 'Tap to expand'}
          </span>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {expanded && (
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="h-[180px] sm:h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MOCK_CHART_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', color: '#FFF', border: 'none', fontSize: '12px' }}
                  formatter={(val: any) => [`$${val}`, 'Growth']}
                />
                <Line type="monotone" dataKey="growth" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: '#3B82F6' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   APPLICATION QUEUE CARD
═══════════════════════════════════════════════════════════════════════════ */
function AppCard({ app, onApprove, onReject }: {
  app: Application; onApprove: (a: Application) => void; onReject: (a: Application) => void;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-card overflow-hidden">
      <div className="p-4 sm:p-5 flex flex-col gap-3">
        {/* Top row: Avatar, Name, Email, Time */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0 select-none">
              {getInitials(app.user_name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 truncate" title={app.user_name}>{app.user_name}</p>
              <p className="text-xs text-slate-400 truncate" title={app.user_email}>{app.user_email}</p>
              <p className="text-[11px] text-slate-400">{app.user_phone}</p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className={`text-xs font-bold ${timeAgoColor(app.hours_ago)}`}>
              {app.hours_ago < 1 ? 'Just now' : `${app.hours_ago}h ago`}
              {app.hours_ago > 48 && <span className="ml-1 text-red-500">⚠</span>}
            </p>
          </div>
        </div>

        {/* Middle row: Package & Amount details */}
        <div className="flex items-center justify-between bg-slate-50 p-2.5 sm:p-3 rounded-lg border border-slate-100">
          <div>
            <span className="text-[11px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full inline-block mb-0.5">
              {app.package_name}
            </span>
            <p className="text-xs text-slate-500">{app.duration}</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block uppercase font-semibold">Amount</span>
            <p className="text-base sm:text-lg font-extrabold text-slate-900 tabular-nums">${fmt(app.amount)}</p>
          </div>
        </div>

        {/* Action buttons - Full width grid on mobile, inline on desktop */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button onClick={() => onApprove(app)}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs sm:text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] transition-all min-h-[44px] shadow-sm">
            <Check className="w-4 h-4" /> Approve
          </button>
          <button onClick={() => onReject(app)}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs sm:text-sm font-bold text-red-600 bg-white border border-red-200 hover:bg-red-50 active:scale-[0.98] transition-all min-h-[44px]">
            <X className="w-4 h-4" /> Reject
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN ADMIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
const INIT_APPS: Application[] = [
  { id: 'app_001', user_name: 'Francesco Battista', user_email: 'f.battista@gmail.com', user_phone: '+1 415 555 0192', package_name: '7-Day Growth Plan', package_id: 'pkg_2', duration: '7 Days', amount: 5250.00, applied_at: '', hours_ago: 3 },
  { id: 'app_002', user_name: 'Sarah Al-Connor', user_email: 'sarah@invest.co', user_phone: '+44 7700 900461', package_name: '30-Day VIP Syndicate', package_id: 'pkg_3', duration: '30 Days', amount: 2500.00, applied_at: '', hours_ago: 28 },
  { id: 'app_003', user_name: 'Michael Osei', user_email: 'michael.osei@proton.me', user_phone: '+233 20 123 4567', package_name: '24-Hour Starter', package_id: 'pkg_1', duration: '24 Hours', amount: 1000.00, applied_at: '', hours_ago: 52 },
];

const INIT_INVESTMENTS: ActiveInvestment[] = [
  { id: 'inv_501', user_name: 'Elena Volkov', user_email: 'elena.v@mail.ru', package_name: '7-Day Growth Plan', invested_amount: 3500, expected_return: 840, total_payout: 4340, start_date: new Date(Date.now() - 2 * 86400000).toISOString(), maturity_date: new Date(Date.now() + 5 * 86400000).toISOString(), status: 'active', roi_pct: 24 },
  { id: 'inv_502', user_name: 'James Kiprotich', user_email: 'jkiprotich@ke.com', package_name: '30-Day VIP Syndicate', invested_amount: 10000, expected_return: 6500, total_payout: 16500, start_date: new Date(Date.now() - 10 * 86400000).toISOString(), maturity_date: new Date(Date.now() + 20 * 86400000).toISOString(), status: 'active', roi_pct: 65 },
  { id: 'inv_503', user_name: 'Amara Diallo', user_email: 'amara@senegal.net', package_name: '24-Hour Starter', invested_amount: 500, expected_return: 42.5, total_payout: 542.5, start_date: new Date(Date.now() - 2 * 86400000).toISOString(), maturity_date: new Date(Date.now() - 1 * 86400000).toISOString(), status: 'matured', roi_pct: 8.5 },
  { id: 'inv_504', user_name: 'Luca Rossi', user_email: 'luca.r@italia.it', package_name: '7-Day Growth Plan', invested_amount: 2000, expected_return: 480, total_payout: 2480, start_date: new Date(Date.now() - 8 * 86400000).toISOString(), maturity_date: new Date(Date.now() - 1 * 86400000).toISOString(), status: 'matured', roi_pct: 24 },
];

const INIT_PACKAGES: Package[] = [
  /* ── 24-Hour Plans ────────────────────────────────────────────────────── */
  { id: 'pkg_24h_500',   name: '24H · £500 Plan',       duration_value: 24, duration_unit: 'hours', roi_percentage: 840, risk_level: 'low',    active: true, min_amount: 500,   max_amount: 500   },
  { id: 'pkg_24h_600',   name: '24H · £600 Plan',       duration_value: 24, duration_unit: 'hours', roi_percentage: 833, risk_level: 'low',    active: true, min_amount: 600,   max_amount: 600   },
  { id: 'pkg_24h_700',   name: '24H · £700 Plan',       duration_value: 24, duration_unit: 'hours', roi_percentage: 871, risk_level: 'low',    active: true, min_amount: 700,   max_amount: 700   },
  { id: 'pkg_24h_800',   name: '24H · £800 Plan',       duration_value: 24, duration_unit: 'hours', roi_percentage: 875, risk_level: 'low',    active: true, min_amount: 800,   max_amount: 800   },
  /* ── 2-Day Plans ──────────────────────────────────────────────────────── */
  { id: 'pkg_2d_900',    name: '2-Day · £900 Plan',     duration_value: 2,  duration_unit: 'days',  roi_percentage: 889, risk_level: 'medium', active: true, min_amount: 900,   max_amount: 900   },
  { id: 'pkg_2d_1000',   name: '2-Day · £1,000 Plan',   duration_value: 2,  duration_unit: 'days',  roi_percentage: 900, risk_level: 'medium', active: true, min_amount: 1000,  max_amount: 1000  },
  { id: 'pkg_2d_1500',   name: '2-Day · £1,500 Plan',   duration_value: 2,  duration_unit: 'days',  roi_percentage: 800, risk_level: 'medium', active: true, min_amount: 1500,  max_amount: 1500  },
  /* ── Weekly Plans ─────────────────────────────────────────────────────── */
  { id: 'pkg_7d_2000',   name: 'Weekly · £2,000 Plan',  duration_value: 7,  duration_unit: 'days',  roi_percentage: 800, risk_level: 'high',   active: true, min_amount: 2000,  max_amount: 2000  },
  { id: 'pkg_7d_3000',   name: 'Weekly · £3,000 Plan',  duration_value: 7,  duration_unit: 'days',  roi_percentage: 667, risk_level: 'high',   active: true, min_amount: 3000,  max_amount: 3000  },
  { id: 'pkg_7d_5000',   name: 'Weekly · £5,000 Plan',  duration_value: 7,  duration_unit: 'days',  roi_percentage: 600, risk_level: 'high',   active: true, min_amount: 5000,  max_amount: 5000  },
  { id: 'pkg_7d_10000',  name: 'Weekly · £10,000 Plan', duration_value: 7,  duration_unit: 'days',  roi_percentage: 600, risk_level: 'high',   active: true, min_amount: 10000, max_amount: 10000 },
];

export function AdminPoolTrading() {
  const [activeTab, setActiveTab] = useState<'applications' | 'investments' | 'packages'>('applications');
  const [apps, setApps] = useState<Application[]>(INIT_APPS);
  const [investments, setInvestments] = useState<ActiveInvestment[]>(INIT_INVESTMENTS);
  const [packages, setPackages] = useState<Package[]>(INIT_PACKAGES);

  // Search
  const [search, setSearch] = useState('');

  // Approve modal
  const [approveApp, setApproveApp] = useState<Application | null>(null);
  const [approveAmt, setApproveAmt] = useState('');
  const [approveMaturity, setApproveMaturity] = useState('');
  const [approving, setApproving] = useState<string | null>(null); // optimistic id

  // Reject modal
  const [rejectApp, setRejectApp] = useState<Application | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Package modal
  const [pkgModal, setPkgModal] = useState<Package | null | 'new'>(null);
  const [pkgForm, setPkgForm] = useState<Partial<Package>>({ risk_level: 'medium', duration_unit: 'days', active: true });

  // Investment action dropdown
  const [invActionOpen, setInvActionOpen] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ msg: string; type?: 'success' | 'error' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Stats
  const pendingCount = apps.length;
  const approvedToday = 4;
  const rejectedTotal = 2;
  const totalFUM = investments.filter(i => i.status === 'active').reduce((s, i) => s + i.invested_amount, 0);
  const activeCount = investments.filter(i => i.status === 'active').length;
  const maturedCount = investments.filter(i => i.status === 'matured').length;

  /* ── Approve Logic ──────────────────────────────────────────────── */
  const handleOpenApprove = (app: Application) => {
    setApproveApp(app);
    setApproveAmt(String(app.amount));
    const d = new Date(Date.now() + 7 * 86400000);
    setApproveMaturity(d.toISOString().split('T')[0]);
  };

  const handleConfirmApprove = () => {
    if (!approveApp) return;
    setApproving(approveApp.id);
    setTimeout(() => {
      setApps(prev => prev.filter(a => a.id !== approveApp.id));
      setApproving(null);
      showToast(`${approveApp.user_name} approved successfully!`);
    }, 350);
    setApproveApp(null);
  };

  /* ── Reject Logic ───────────────────────────────────────────────── */
  const handleConfirmReject = () => {
    if (!rejectApp || !rejectReason.trim()) return;
    setApps(prev => prev.filter(a => a.id !== rejectApp.id));
    showToast(`Application from ${rejectApp.user_name} rejected.`, 'error');
    setRejectApp(null);
    setRejectReason('');
  };

  /* ── Package CRUD ───────────────────────────────────────────────── */
  const handleSavePackage = () => {
    if (!pkgForm.name || !pkgForm.roi_percentage || !pkgForm.min_amount) {
      showToast('Please fill all required fields.', 'error');
      return;
    }
    if (pkgModal === 'new') {
      const np: Package = { id: `pkg_${Date.now()}`, name: pkgForm.name!, duration_value: pkgForm.duration_value || 7, duration_unit: pkgForm.duration_unit || 'days', roi_percentage: pkgForm.roi_percentage!, risk_level: pkgForm.risk_level || 'medium', active: true, min_amount: pkgForm.min_amount!, max_amount: pkgForm.max_amount };
      setPackages(prev => [...prev, np]);
      showToast(`Package "${np.name}" created!`);
    } else if (pkgModal) {
      setPackages(prev => prev.map(p => p.id === (pkgModal as Package).id ? { ...p, ...pkgForm } as Package : p));
      showToast('Package updated.');
    }
    setPkgModal(null);
    setPkgForm({ risk_level: 'medium', duration_unit: 'days', active: true });
  };

  const handleDeletePackage = (id: string) => {
    setPackages(prev => prev.filter(p => p.id !== id));
    showToast('Package deleted.', 'error');
  };

  const filteredApps = apps.filter(a =>
    a.user_name.toLowerCase().includes(search.toLowerCase()) ||
    a.user_email.toLowerCase().includes(search.toLowerCase()) ||
    a.package_name.toLowerCase().includes(search.toLowerCase())
  );

  const TABS = [
    { id: 'applications', label: 'Applications Queue' },
    { id: 'investments', label: 'Active Investments' },
    { id: 'packages', label: 'Package Manager' },
  ] as const;

  /* ── ROI Estimate (Approve Modal) ───────────────────────────────── */
  const approveEst = approveApp
    ? (Number(approveAmt) * (INIT_PACKAGES.find(p => p.id === approveApp.package_id)?.roi_percentage || 24)) / 100
    : 0;

  return (
    <div className="min-h-screen bg-[#F5F7FA] font-sans pb-24 sm:pb-16">
      <style>{globalCSS}</style>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div className="max-w-6xl mx-auto px-3.5 sm:px-6 pt-3 sm:pt-6">
        {/* ── PAGE HEADER ────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-3 sm:mb-5 flex-wrap gap-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight truncate">
              Pool Trading Command Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 hidden sm:block">
              Manage applications, active investments, and trading packages.
            </p>
          </div>
          <button
            onClick={() => showToast('Refreshed data')}
            className="w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center gap-1.5 text-xs font-semibold transition-all shadow-sm flex-shrink-0"
            title="Refresh Data"
          >
            <span className="text-sm">↻</span>
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* ── TAB BAR (Horizontally scrollable on mobile) ────────────────────────── */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 mb-4 sm:mb-6 shadow-sm overflow-x-auto scrollbar-none flex-nowrap -mx-3.5 px-3.5 sm:mx-0 sm:px-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 ${activeTab === t.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
              {t.label}
              {t.id === 'applications' && apps.length > 0 && (
                <span className="ml-1.5 sm:ml-2 bg-amber-500 text-white text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded-full">{apps.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════
            TAB: APPLICATIONS QUEUE
        ══════════════════════════════════════════════════════════ */}
        {activeTab === 'applications' && (
          <>
            {/* Stats Strip - Zero Truncation */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
              <StatChip label="Pending" value={pendingCount} color="bg-amber-50 border-amber-200 text-amber-700" />
              <StatChip label="Approved" value={approvedToday} color="bg-emerald-50 border-emerald-200 text-emerald-700" />
              <StatChip label="Rejected" value={rejectedTotal} color="bg-slate-100 border-slate-200 text-slate-500" />
            </div>

            {/* Collapsible Chart (Secondary on mobile) */}
            <CollapsibleChart />

            {/* Search + Filter Bar */}
            <div className="flex gap-2 sm:gap-3 mb-4 flex-wrap">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search applications..."
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg bg-white focus:border-blue-400 focus:bg-white transition-all outline-none" />
              </div>
              <select className="px-2.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg bg-white text-slate-600 focus:border-blue-400 outline-none">
                <option>Newest First</option>
                <option>Oldest First</option>
                <option>Amount High→Low</option>
              </select>
            </div>

            {/* Application Cards */}
            {filteredApps.length === 0 ? (
              <div className="text-center py-12 sm:py-20 bg-white rounded-xl border border-slate-200 p-6">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-base sm:text-xl font-bold text-slate-600 mb-1">All caught up! 🎉</p>
                <p className="text-xs sm:text-sm text-slate-400">No pending applications right now.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredApps.map(app => (
                  <div key={app.id} className={approving === app.id ? 'approve-optimistic pointer-events-none' : ''}>
                    {approving === app.id ? (
                      <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-5 flex items-center justify-center gap-3 text-emerald-700 font-bold">
                        <CheckCircle2 className="w-5 h-5" /> Approving {app.user_name}...
                      </div>
                    ) : (
                      <AppCard app={app} onApprove={handleOpenApprove} onReject={setRejectApp} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB: ACTIVE INVESTMENTS
        ══════════════════════════════════════════════════════════ */}
        {activeTab === 'investments' && (
          <>
            {/* High-Level Stats - Compact & Zero Truncation */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
              <div className="bg-white rounded-xl border border-slate-200 shadow-card p-2.5 sm:p-5 flex flex-col sm:flex-row items-center text-center sm:text-left gap-1 sm:gap-4">
                <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
                <div className="min-w-0 w-full">
                  <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wide truncate">Funds Mgmt</p>
                  <p className="text-sm sm:text-xl font-extrabold text-slate-900 tabular-nums truncate">${fmt(totalFUM)}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 shadow-card p-2.5 sm:p-5 flex flex-col sm:flex-row items-center text-center sm:text-left gap-1 sm:gap-4">
                <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                </div>
                <div className="min-w-0 w-full">
                  <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wide truncate">Active Pools</p>
                  <p className="text-sm sm:text-xl font-extrabold text-slate-900 truncate">{activeCount}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 shadow-card p-2.5 sm:p-5 flex flex-col sm:flex-row items-center text-center sm:text-left gap-1 sm:gap-4">
                <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                </div>
                <div className="min-w-0 w-full">
                  <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wide truncate">Matured Today</p>
                  <p className="text-sm sm:text-xl font-extrabold text-slate-900 truncate">{maturedCount}</p>
                </div>
              </div>
            </div>


            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {['User', 'Package', 'Invested', 'ROI', 'Payout', 'Maturity', 'Progress', 'Status', ''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {investments.map(inv => {
                    const pct = progressPct(inv.start_date, inv.maturity_date);
                    const statusCls = inv.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : inv.status === 'matured' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-500 border-slate-200';
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{getInitials(inv.user_name)}</div>
                            <div>
                              <p className="font-semibold text-slate-800 text-xs truncate max-w-[120px]" title={inv.user_name}>{inv.user_name}</p>
                              <p className="text-xs text-slate-400 truncate max-w-[120px]" title={inv.user_email}>{inv.user_email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full">{inv.package_name}</span>
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-900 tabular-nums">${fmt(inv.invested_amount)}</td>
                        <td className="px-4 py-3.5 font-bold text-emerald-600 tabular-nums">{inv.roi_pct}%</td>
                        <td className="px-4 py-3.5 font-bold text-slate-800 tabular-nums">${fmt(inv.total_payout)}</td>
                        <td className="px-4 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                          {new Date(inv.maturity_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{Math.round(pct)}%</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`text-xs font-bold border px-2.5 py-0.5 rounded-full capitalize ${statusCls}`}>{inv.status}</span>
                        </td>
                        <td className="px-4 py-3.5 relative">
                          <button onClick={() => setInvActionOpen(invActionOpen === inv.id ? null : inv.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {invActionOpen === inv.id && (
                            <div className="absolute right-4 top-10 z-20 bg-white border border-slate-200 rounded-xl shadow-xl w-44 py-1">
                              <button onClick={() => { showToast('Maturity extended by 7 days.'); setInvActionOpen(null); }}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-all">Extend Maturity</button>
                              <button onClick={() => { showToast('Investment force-matured.'); setInvActionOpen(null); }}
                                className="w-full text-left px-4 py-2 text-sm text-emerald-700 hover:bg-emerald-50 transition-all">Force Mature</button>
                              <button onClick={() => { showToast('Investment cancelled.', 'error'); setInvestments(prev => prev.filter(i => i.id !== inv.id)); setInvActionOpen(null); }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-all">Cancel</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {investments.map(inv => {
                const pct = progressPct(inv.start_date, inv.maturity_date);
                return (
                  <div key={inv.id} className="bg-white rounded-xl border border-slate-200 shadow-card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">{getInitials(inv.user_name)}</div>
                        <div>
                          <p className="font-semibold text-sm text-slate-800 truncate max-w-[160px]" title={inv.user_name}>{inv.user_name}</p>
                          <p className="text-xs text-slate-400 truncate max-w-[160px]" title={inv.user_email}>{inv.user_email}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-bold border px-2 py-0.5 rounded-full capitalize ${inv.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>{inv.status}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div><p className="text-slate-400">Invested</p><p className="font-bold text-slate-900 tabular-nums">${fmt(inv.invested_amount)}</p></div>
                      <div><p className="text-slate-400">Payout</p><p className="font-bold text-emerald-600 tabular-nums">${fmt(inv.total_payout)}</p></div>
                      <div><p className="text-slate-400">Package</p><p className="font-semibold text-slate-700">{inv.package_name}</p></div>
                      <div><p className="text-slate-400">Matures</p><p className="font-semibold text-slate-700">{new Date(inv.maturity_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p></div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{Math.round(pct)}% complete</p>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB: PACKAGE MANAGER
        ══════════════════════════════════════════════════════════ */}
        {activeTab === 'packages' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-500">{packages.length} packages configured</p>
              <button
                onClick={() => { setPkgForm({ risk_level: 'medium', duration_unit: 'days', active: true }); setPkgModal('new'); }}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm transition-all">
                <Plus className="w-4 h-4" /> Create Package
              </button>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {['Name', 'Duration', 'ROI', 'Risk', 'Min. Amount', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {packages.map(pkg => {
                    const r = riskCfg[pkg.risk_level];
                    return (
                      <tr key={pkg.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4 font-semibold text-slate-800">{pkg.name}</td>
                        <td className="px-5 py-4 text-slate-600">{pkg.duration_value} {pkg.duration_unit}</td>
                        <td className="px-5 py-4 font-bold text-emerald-600 tabular-nums">{pkg.roi_percentage}%</td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-bold border px-2.5 py-0.5 rounded-full ${r.bg} ${r.text} ${r.border}`}>{r.label}</span>
                        </td>
                        <td className="px-5 py-4 tabular-nums text-slate-700">${fmt(pkg.min_amount)}</td>
                        <td className="px-5 py-4">
                          <Toggle checked={pkg.active} onChange={v => setPackages(prev => prev.map(p => p.id === pkg.id ? { ...p, active: v } : p))} />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button onClick={() => { setPkgForm({ ...pkg }); setPkgModal(pkg); }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => handleDeletePackage(pkg.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {packages.map(pkg => {
                const r = riskCfg[pkg.risk_level];
                return (
                  <div key={pkg.id} className="bg-white rounded-xl border border-slate-200 shadow-card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold text-slate-800">{pkg.name}</p>
                      <Toggle checked={pkg.active} onChange={v => setPackages(prev => prev.map(p => p.id === pkg.id ? { ...p, active: v } : p))} />
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs mb-3">
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">{pkg.duration_value} {pkg.duration_unit}</span>
                      <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">{pkg.roi_percentage}% ROI</span>
                      <span className={`${r.bg} ${r.text} ${r.border} border px-2 py-0.5 rounded-full font-bold`}>{r.label}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-500">Min: <span className="font-bold text-slate-800 tabular-nums">${fmt(pkg.min_amount)}</span></p>
                      <div className="flex gap-2">
                        <button onClick={() => { setPkgForm({ ...pkg }); setPkgModal(pkg); }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDeletePackage(pkg.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ═══ APPROVE MODAL ════════════════════════════════════════════════ */}
      <Modal open={!!approveApp} onClose={() => setApproveApp(null)} title="Approve Application">
        {approveApp && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">{getInitials(approveApp.user_name)}</div>
              <div>
                <p className="font-bold text-slate-900">{approveApp.user_name}</p>
                <p className="text-xs text-slate-400">{approveApp.user_email} · {approveApp.package_name}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Investment Amount (USD)</label>
                <input type="number" value={approveAmt} onChange={e => setApproveAmt(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-bold tabular-nums text-slate-900 bg-slate-50 focus:bg-white focus:border-blue-400 transition-all outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Custom Maturity Date</label>
                <input type="date" value={approveMaturity} onChange={e => setApproveMaturity(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 bg-slate-50 focus:bg-white focus:border-blue-400 transition-all outline-none" />
              </div>
            </div>
            {/* Live ROI Calc */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Estimated Profit</p>
              <p className="text-3xl font-extrabold text-emerald-700 tabular-nums mt-1">+${fmt(approveEst)}</p>
              <p className="text-xs text-slate-500 mt-0.5">Total payout: ${fmt(Number(approveAmt) + approveEst)}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setApproveApp(null)} className="flex-1 py-3 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all">Cancel</button>
              <button onClick={handleConfirmApprove} className="flex-1 py-3 text-sm font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-all">
                ✓ Approve
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ═══ REJECT MODAL ════════════════════════════════════════════════ */}
      <Modal open={!!rejectApp} onClose={() => { setRejectApp(null); setRejectReason(''); }} title="Reject Application">
        {rejectApp && (
          <div className="space-y-4">
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm font-semibold text-red-800">Rejecting: <span className="font-bold">{rejectApp.user_name}</span></p>
              <p className="text-xs text-red-600">{rejectApp.package_name} · ${fmt(rejectApp.amount)}</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Reason for Rejection <span className="text-red-500">*</span>
              </label>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={4} required
                placeholder="e.g. Insufficient KYC documentation. Please reapply with valid ID."
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 bg-slate-50 focus:bg-white focus:border-red-400 resize-none outline-none transition-all" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setRejectApp(null); setRejectReason(''); }} className="flex-1 py-3 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all">Cancel</button>
              <button onClick={handleConfirmReject} disabled={!rejectReason.trim()}
                className="flex-1 py-3 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all">
                ✗ Reject
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ═══ PACKAGE MODAL ═══════════════════════════════════════════════ */}
      <Modal open={pkgModal !== null} onClose={() => { setPkgModal(null); setPkgForm({ risk_level: 'medium', duration_unit: 'days', active: true }); }}
        title={pkgModal === 'new' ? 'Create Package' : 'Edit Package'} maxW="max-w-xl">
        <div className="space-y-4">
          {/* 2-col form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Package Name *</label>
              <input type="text" value={pkgForm.name || ''} onChange={e => setPkgForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. 14-Day Premium Pool"
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 bg-slate-50 focus:bg-white focus:border-blue-400 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Duration *</label>
              <div className="flex gap-2">
                <input type="number" value={pkgForm.duration_value || ''} onChange={e => setPkgForm(f => ({ ...f, duration_value: Number(e.target.value) }))}
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 bg-slate-50 focus:bg-white focus:border-blue-400 outline-none transition-all" placeholder="7" />
                <select value={pkgForm.duration_unit || 'days'} onChange={e => setPkgForm(f => ({ ...f, duration_unit: e.target.value as any }))}
                  className="border border-slate-200 rounded-lg px-2 py-2.5 text-sm text-slate-900 bg-slate-50 focus:border-blue-400 outline-none">
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">ROI % *</label>
              <div className="relative">
                <input type="number" value={pkgForm.roi_percentage || ''} onChange={e => setPkgForm(f => ({ ...f, roi_percentage: Number(e.target.value) }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 pr-8 text-sm text-slate-900 bg-slate-50 focus:bg-white focus:border-blue-400 outline-none transition-all" placeholder="24" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">%</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Min. Amount (USD) *</label>
              <input type="number" value={pkgForm.min_amount || ''} onChange={e => setPkgForm(f => ({ ...f, min_amount: Number(e.target.value) }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 bg-slate-50 focus:bg-white focus:border-blue-400 outline-none transition-all" placeholder="500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Max. Amount (USD)</label>
              <input type="number" value={pkgForm.max_amount || ''} onChange={e => setPkgForm(f => ({ ...f, max_amount: Number(e.target.value) || undefined }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 bg-slate-50 focus:bg-white focus:border-blue-400 outline-none transition-all" placeholder="Unlimited" />
            </div>
          </div>

          {/* Risk Level Cards */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Risk Level *</label>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as const).map(lvl => {
                const r = riskCfg[lvl];
                const selected = pkgForm.risk_level === lvl;
                return (
                  <button key={lvl} type="button" onClick={() => setPkgForm(f => ({ ...f, risk_level: lvl }))}
                    className={`py-3 rounded-xl text-sm font-bold border-2 transition-all capitalize ${selected ? `${r.bg} ${r.text} ${r.border}` : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => { setPkgModal(null); setPkgForm({ risk_level: 'medium', duration_unit: 'days', active: true }); }}
              className="flex-1 py-3 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all">Cancel</button>
            <button onClick={handleSavePackage}
              className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all">
              {pkgModal === 'new' ? 'Create Package' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
