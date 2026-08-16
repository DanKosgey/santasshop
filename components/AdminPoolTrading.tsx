import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TrendingUp, CheckCircle2, XCircle, Search, Plus, Edit2, Trash2,
  X, ChevronDown, MoreVertical, Users, Clock, DollarSign,
  ShieldCheck, ShieldAlert, Layers, AlertTriangle, Check,
  RefreshCw, Wallet, ArrowUpRight, CheckSquare, Sparkles, Filter,
  Bell, Send, Key, Lock, Eye, EyeOff
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import {
  poolTradingService,
  PoolPackage,
  PoolApplication,
  PoolInvestment,
  WithdrawalRequest,
  VipRequest,
  AdminNotificationSettings,
  DEFAULT_PACKAGES
} from '../services/poolTradingService';
import { User } from '../types';

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function getInitials(name: string) {
  if (!name) return 'TR';
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
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
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className={`bg-white w-full ${maxW} rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-y-auto`}
        style={{ animation: 'modalIn 0.18s ease', maxHeight: 'calc(90vh - env(safe-area-inset-bottom, 0px))' }}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Extra bottom padding on mobile so content clears the fixed bottom nav bar */}
        <div className="px-6 py-5 pb-[calc(1.25rem+60px)] sm:pb-5">{children}</div>
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
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-slate-300'}`}>
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   APPLICATION QUEUE CARD
═══════════════════════════════════════════════════════════════════════════ */
function AppCard({ app, onApprove, onReject }: {
  app: PoolApplication; onApprove: (a: PoolApplication) => void; onReject: (a: PoolApplication) => void;
}) {
  const hoursAgo = Math.max(0, Math.floor((Date.now() - new Date(app.created_at).getTime()) / 3600000));

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden transition-all hover:border-slate-300">
      <div className="p-4 sm:p-5 flex flex-col gap-3">
        {/* Top row: Avatar, Name, Email, Time */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0 select-none shadow-sm">
              {getInitials(app.user_name || 'Trader')}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-slate-900 truncate" title={app.user_name}>{app.user_name || 'Anonymous Trader'}</p>
              <p className="text-xs text-slate-400 truncate" title={app.user_email}>{app.user_email || 'student@platform.com'}</p>
              {app.transaction_reference && (
                <p className="text-[11px] font-mono text-blue-600 font-bold truncate">Ref: {app.transaction_reference}</p>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {hoursAgo < 1 ? 'Just now' : `${hoursAgo}h ago`}
            </span>
          </div>
        </div>

        {/* Middle row: Package & Amount details */}
        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div>
            <span className="text-xs font-extrabold bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full inline-block mb-1">
              {app.package_name || 'Pool Plan'}
            </span>
            <p className="text-xs text-slate-500">Method: {app.payment_method || 'Crypto'}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Applied Amount</span>
            <p className="text-base sm:text-lg font-black text-slate-900 tabular-nums">${fmt(app.amount)}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button onClick={() => onApprove(app)}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition-all min-h-[42px] shadow-sm">
            <Check className="w-4 h-4" /> Approve & Activate
          </button>
          <button onClick={() => onReject(app)}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-red-600 bg-white border border-red-200 hover:bg-red-50 active:scale-[0.98] transition-all min-h-[42px]">
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
export function AdminPoolTrading({ currentUser }: { currentUser?: User }) {
  const [activeTab, setActiveTab] = useState<'applications' | 'investments' | 'packages' | 'withdrawals' | 'telegram'>('applications');
  const [apps, setApps] = useState<PoolApplication[]>([]);
  const [investments, setInvestments] = useState<PoolInvestment[]>([]);
  const [packages, setPackages] = useState<PoolPackage[]>(DEFAULT_PACKAGES);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Telegram settings state
  const [telegramSettings, setTelegramSettings] = useState<AdminNotificationSettings>({
    telegram_bot_token: '',
    telegram_chat_id: '',
    notify_pool_application: true,
    notify_withdrawal_request: true,
    notify_vip_request: true,
  });
  const [showToken, setShowToken] = useState(false);
  const [savingTelegram, setSavingTelegram] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [investFilter, setInvestFilter] = useState<'all' | 'active' | 'matured' | 'withdrawn' | 'cancelled'>('all');

  // Approve modal
  const [approveApp, setApproveApp] = useState<PoolApplication | null>(null);
  const [approveAmt, setApproveAmt] = useState('');
  const [approveMaturity, setApproveMaturity] = useState('');
  const [approving, setApproving] = useState<string | null>(null);

  // Reject modal
  const [rejectApp, setRejectApp] = useState<PoolApplication | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Package modal
  const [pkgModal, setPkgModal] = useState<PoolPackage | null | 'new'>(null);
  const [pkgForm, setPkgForm] = useState<Partial<PoolPackage>>({ risk_level: 'medium', duration_unit: 'days', is_active: true });

  // Extend Investment Modal
  const [extendInv, setExtendInv] = useState<PoolInvestment | null>(null);
  const [extendDays, setExtendDays] = useState(7);
  const [extendReason, setExtendReason] = useState('');

  // Process Withdrawal Modal
  const [procWd, setProcWd] = useState<WithdrawalRequest | null>(null);
  const [txHash, setTxHash] = useState('');

  // Investment action dropdown
  const [invActionOpen, setInvActionOpen] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ msg: string; type?: 'success' | 'error' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const adminId = currentUser?.id;

  // Load all live data
  const loadAdminData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [pkgs, allApps, allInvs, allWds, tgSettings] = await Promise.all([
        poolTradingService.getPackages(),
        poolTradingService.getApplications(),
        poolTradingService.getInvestments(),
        poolTradingService.getWithdrawalRequests(),
        poolTradingService.getNotificationSettings(),
      ]);

      setPackages(pkgs.length > 0 ? pkgs : DEFAULT_PACKAGES);
      setApps(allApps.filter(a => a.status === 'pending'));
      setInvestments(allInvs);
      setWithdrawals(allWds);
      if (tgSettings) setTelegramSettings(tgSettings);
    } catch (err: any) {
      console.error('Error loading admin pool trading data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Telegram handlers
  const handleSaveTelegramSettings = async () => {
    try {
      setSavingTelegram(true);
      const updated = await poolTradingService.updateNotificationSettings(telegramSettings);
      setTelegramSettings(updated);
      showToast('Telegram notification settings saved successfully!');
    } catch (err: any) {
      showToast('Failed to save settings: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setSavingTelegram(false);
    }
  };

  const handleTestTelegram = async () => {
    if (!telegramSettings.telegram_bot_token || !telegramSettings.telegram_chat_id) {
      showToast('Please enter Bot Token and Chat ID first.', 'error');
      return;
    }
    try {
      setTestingTelegram(true);
      setTestResult(null);
      const res = await poolTradingService.testTelegramConnection(
        telegramSettings.telegram_bot_token,
        telegramSettings.telegram_chat_id
      );
      if (res.success) {
        setTestResult({ success: true, msg: 'Test message sent! Check your Telegram chat.' });
        showToast('Telegram test message delivered successfully!');
      } else {
        setTestResult({ success: false, msg: res.error || 'Failed to send test message' });
        showToast('Telegram test failed: ' + (res.error || 'API error'), 'error');
      }
    } catch (err: any) {
      setTestResult({ success: false, msg: err.message || 'Network error' });
      showToast('Test failed: ' + err.message, 'error');
    } finally {
      setTestingTelegram(false);
    }
  };

  // Subscriptions
  useEffect(() => {
    loadAdminData();

    const unsubPkgs = poolTradingService.subscribePackages(async () => {
      const pkgs = await poolTradingService.getPackages();
      if (pkgs.length > 0) setPackages(pkgs);
    });

    const unsubApps = poolTradingService.subscribeApplications(async () => {
      const allApps = await poolTradingService.getApplications();
      setApps(allApps.filter(a => a.status === 'pending'));
    });

    const unsubInvs = poolTradingService.subscribeInvestments(async () => {
      const allInvs = await poolTradingService.getInvestments();
      setInvestments(allInvs);
    });

    const unsubWds = poolTradingService.subscribeWithdrawals(async () => {
      const allWds = await poolTradingService.getWithdrawalRequests();
      setWithdrawals(allWds);
    });

    return () => {
      unsubPkgs();
      unsubApps();
      unsubInvs();
      unsubWds();
    };
  }, [loadAdminData]);

  // Derived Stats
  const pendingCount = apps.length;
  const pendingWithdrawalCount = withdrawals.filter(w => w.status === 'pending' || w.status === 'processing').length;
  const totalFUM = investments.filter(i => i.status === 'active').reduce((s, i) => s + i.invested_amount, 0);
  const activeCount = investments.filter(i => i.status === 'active').length;
  const maturedCount = investments.filter(i => i.status === 'matured' || i.status === 'withdrawal_pending').length;

  /* ── Approve Logic ──────────────────────────────────────────────── */
  const handleOpenApprove = (app: PoolApplication) => {
    setApproveApp(app);
    setApproveAmt(String(app.amount || 500));

    // Calculate default maturity date based on package
    const pkg = packages.find(p => p.id === app.package_id);
    const durVal = pkg?.duration_value || 7;
    const durUnit = pkg?.duration_unit || 'days';
    const d = new Date();
    if (durUnit === 'hours') {
      d.setHours(d.getHours() + durVal);
    } else {
      d.setDate(d.getDate() + durVal);
    }
    setApproveMaturity(d.toISOString().split('T')[0]);
  };

  const handleConfirmApprove = async () => {
    if (!approveApp) return;
    try {
      setApproving(approveApp.id);
      const pkg = packages.find(p => p.id === approveApp.package_id);

      await poolTradingService.approveApplication({
        applicationId: approveApp.id,
        userId: approveApp.user_id,
        packageId: approveApp.package_id,
        amount: Number(approveAmt),
        durationValue: pkg?.duration_value || 7,
        durationUnit: pkg?.duration_unit || 'days',
        roiPercentage: pkg?.roi_percentage || 800,
        customMaturityDate: approveMaturity || undefined,
        adminId,
      });

      setApps(prev => prev.filter(a => a.id !== approveApp.id));
      showToast(`Approved ${approveApp.user_name || 'Applicant'} successfully! Investment is now LIVE.`);
    } catch (err: any) {
      showToast(`Approval failed: ${err.message}`, 'error');
    } finally {
      setApproving(null);
      setApproveApp(null);
    }
  };

  /* ── Reject Logic ───────────────────────────────────────────────── */
  const handleConfirmReject = async () => {
    if (!rejectApp || !rejectReason.trim()) return;
    try {
      await poolTradingService.rejectApplication(rejectApp.id, rejectReason, adminId);
      setApps(prev => prev.filter(a => a.id !== rejectApp.id));
      showToast(`Application from ${rejectApp.user_name} rejected.`, 'error');
    } catch (err: any) {
      showToast(`Rejection failed: ${err.message}`, 'error');
    } finally {
      setRejectApp(null);
      setRejectReason('');
    }
  };

  /* ── Package CRUD ───────────────────────────────────────────────── */
  const handleSavePackage = async () => {
    if (!pkgForm.name || !pkgForm.roi_percentage || !pkgForm.min_amount) {
      showToast('Please fill all required fields.', 'error');
      return;
    }

    try {
      if (pkgModal === 'new') {
        const created = await poolTradingService.createPackage({
          name: pkgForm.name!,
          description: pkgForm.description || '',
          duration_value: pkgForm.duration_value || 24,
          duration_unit: pkgForm.duration_unit || 'hours',
          roi_percentage: Number(pkgForm.roi_percentage),
          min_amount: Number(pkgForm.min_amount),
          max_amount: pkgForm.max_amount ? Number(pkgForm.max_amount) : null,
          risk_level: pkgForm.risk_level || 'low',
          recommended: pkgForm.recommended || false,
          is_active: pkgForm.is_active !== undefined ? pkgForm.is_active : true,
          sort_order: pkgForm.sort_order || packages.length + 1,
        });
        setPackages(prev => [...prev, created]);
        showToast(`Package "${created.name}" created and synced to students!`);
      } else if (pkgModal && typeof pkgModal === 'object') {
        const updated = await poolTradingService.updatePackage(pkgModal.id, {
          name: pkgForm.name,
          description: pkgForm.description,
          duration_value: pkgForm.duration_value,
          duration_unit: pkgForm.duration_unit,
          roi_percentage: Number(pkgForm.roi_percentage),
          min_amount: Number(pkgForm.min_amount),
          max_amount: pkgForm.max_amount ? Number(pkgForm.max_amount) : null,
          risk_level: pkgForm.risk_level,
          recommended: pkgForm.recommended,
          is_active: pkgForm.is_active,
        });
        setPackages(prev => prev.map(p => (p.id === updated.id ? updated : p)));
        showToast(`Package "${updated.name}" updated successfully.`);
      }
      setPkgModal(null);
      setPkgForm({ risk_level: 'medium', duration_unit: 'days', is_active: true });
    } catch (err: any) {
      showToast(`Failed to save package: ${err.message}`, 'error');
    }
  };

  const handleTogglePackage = async (pkg: PoolPackage, newActiveState: boolean) => {
    try {
      await poolTradingService.togglePackageActive(pkg.id, newActiveState);
      setPackages(prev => prev.map(p => (p.id === pkg.id ? { ...p, is_active: newActiveState } : p)));
      showToast(`Package "${pkg.name}" is now ${newActiveState ? 'ACTIVE' : 'DISABLED'}.`);
    } catch (err: any) {
      showToast('Toggle failed: ' + err.message, 'error');
    }
  };

  const handleDeletePackage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this package?')) return;
    try {
      await poolTradingService.deletePackage(id);
      setPackages(prev => prev.filter(p => p.id !== id));
      showToast('Package deleted from platform.', 'error');
    } catch (err: any) {
      showToast('Delete failed: ' + err.message, 'error');
    }
  };

  /* ── Investment Operations ──────────────────────────────────────── */
  const handleExtendConfirm = async () => {
    if (!extendInv) return;
    try {
      await poolTradingService.extendInvestment(extendInv.id, extendDays, extendReason);
      showToast(`Maturity extended by ${extendDays} days.`);
      loadAdminData();
    } catch (err: any) {
      showToast('Extension failed: ' + err.message, 'error');
    } finally {
      setExtendInv(null);
      setExtendReason('');
    }
  };

  const handleStatusChange = async (invId: string, status: any) => {
    try {
      await poolTradingService.updateInvestmentStatus(invId, status);
      setInvestments(prev => prev.map(i => (i.id === invId ? { ...i, status } : i)));
      showToast(`Investment marked as ${status}.`);
      setInvActionOpen(null);
    } catch (err: any) {
      showToast('Status update failed: ' + err.message, 'error');
    }
  };

  /* ── Withdrawal Operations ──────────────────────────────────────── */
  const handleProcessWithdrawal = async (status: 'completed' | 'declined') => {
    if (!procWd) return;
    try {
      await poolTradingService.processWithdrawalRequest({
        requestId: procWd.id,
        investmentId: procWd.investment_id,
        status,
        transactionHash: txHash || undefined,
        adminId,
      });
      showToast(`Withdrawal marked as ${status}!`);
      setWithdrawals(prev => prev.map(w => (w.id === procWd.id ? { ...w, status } : w)));
    } catch (err: any) {
      showToast('Processing failed: ' + err.message, 'error');
    } finally {
      setProcWd(null);
      setTxHash('');
    }
  };

  // Filtered lists
  const filteredApps = useMemo(() => {
    return apps.filter(a =>
      (a.user_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.user_email || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.package_name || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [apps, search]);

  const filteredInvs = useMemo(() => {
    return investments.filter(i => {
      const matchesSearch =
        (i.user_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (i.user_email || '').toLowerCase().includes(search.toLowerCase()) ||
        (i.package_name || '').toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;
      if (investFilter === 'all') return true;
      return i.status === investFilter;
    });
  }, [investments, search, investFilter]);

  const TABS = [
    { id: 'applications', label: 'Applications Queue', count: pendingCount },
    { id: 'investments', label: 'Active Pools', count: activeCount },
    { id: 'packages', label: 'Package Manager', count: packages.length },
    { id: 'withdrawals', label: 'Withdrawals Queue', count: pendingWithdrawalCount },
    { id: 'telegram', label: 'Telegram Bot Alerts', count: undefined },
  ] as const;

  return (
    <div className="min-h-screen bg-[#F5F7FA] font-sans pb-24 sm:pb-16">
      <style>{globalCSS}</style>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 pt-3 sm:pt-6">
        {/* ── PAGE HEADER ────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-2 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                Pool Trading Command Center
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Real-Time Database Connected
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Review real-time applications, configure high-yield liquidity packages, and dispatch payouts.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('telegram')}
              className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
                telegramSettings.telegram_bot_token && telegramSettings.telegram_chat_id
                  ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                  : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
              title="Configure Telegram Bot Notification Alerts"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>
                {telegramSettings.telegram_bot_token && telegramSettings.telegram_chat_id
                  ? 'Telegram Active'
                  : 'Setup Telegram'}
              </span>
            </button>

            <button
              onClick={loadAdminData}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-slate-700 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
              <span>Sync Live</span>
            </button>
          </div>
        </div>

        {/* ── TAB BAR ────────────────────────────────────────────────── */}
        <div className="flex gap-1.5 bg-white border border-slate-200 rounded-xl p-1.5 mb-5 shadow-sm overflow-x-auto scrollbar-none flex-nowrap">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 flex items-center gap-2 ${
                activeTab === t.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span>{t.label}</span>
              {t.count !== undefined && t.count > 0 && (
                <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                  activeTab === t.id ? 'bg-white/25 text-white' : 'bg-blue-100 text-blue-700'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════
            TAB 1: APPLICATIONS QUEUE
        ══════════════════════════════════════════════════════════ */}
        {activeTab === 'applications' && (
          <>
            {/* Stats Strip */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
              <StatChip label="Pending Applications" value={pendingCount} color="bg-amber-50 border-amber-200 text-amber-700" />
              <StatChip label="Active Pools" value={activeCount} color="bg-emerald-50 border-emerald-200 text-emerald-700" />
              <StatChip label="Total Managed FUM" value={`$${fmt(totalFUM)}`} color="bg-blue-50 border-blue-200 text-blue-700" />
            </div>

            {/* Search Bar */}
            <div className="flex gap-2 sm:gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search applications by student name, email, or plan..."
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl bg-white focus:border-blue-500 outline-none shadow-sm transition-all"
                />
              </div>
            </div>

            {/* Application Cards */}
            {filteredApps.length === 0 ? (
              <div className="text-center py-14 sm:py-20 bg-white rounded-2xl border border-slate-200 p-6 shadow-card">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <p className="text-base sm:text-lg font-black text-slate-700 mb-1">Queue is clear! 🎉</p>
                <p className="text-xs sm:text-sm text-slate-400">All student pool applications have been processed in real-time.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredApps.map(app => (
                  <div key={app.id} className={approving === app.id ? 'approve-optimistic pointer-events-none' : ''}>
                    <AppCard app={app} onApprove={handleOpenApprove} onReject={setRejectApp} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 2: ACTIVE INVESTMENTS
        ══════════════════════════════════════════════════════════ */}
        {activeTab === 'investments' && (
          <>
            {/* Stats Header */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-5">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-3 sm:p-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Active FUM</p>
                  <p className="text-sm sm:text-xl font-black text-slate-900 tabular-nums">${fmt(totalFUM)}</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-3 sm:p-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Active Pools</p>
                  <p className="text-sm sm:text-xl font-black text-slate-900">{activeCount}</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-3 sm:p-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 flex-shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Matured / Pending</p>
                  <p className="text-sm sm:text-xl font-black text-slate-900">{maturedCount}</p>
                </div>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-none flex-nowrap">
              {(['all', 'active', 'matured', 'withdrawn', 'cancelled'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setInvestFilter(f)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap ${
                    investFilter === f
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Investments Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      {['Student', 'Plan', 'Invested', 'Profit Return', 'Total Payout', 'Maturity', 'Progress', 'Status', 'Actions'].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredInvs.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-10 text-center text-slate-400 text-xs font-semibold">
                          No investments found for this filter.
                        </td>
                      </tr>
                    ) : (
                      filteredInvs.map(inv => {
                        const pct = progressPct(inv.start_date, inv.maturity_date);
                        const statusCls =
                          inv.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : inv.status === 'matured'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : inv.status === 'withdrawal_pending'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200';

                        return (
                          <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                  {getInitials(inv.user_name || 'Trader')}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 text-xs truncate max-w-[130px]">{inv.user_name}</p>
                                  <p className="text-[11px] text-slate-400 truncate max-w-[130px]">{inv.user_email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100 whitespace-nowrap">
                                {inv.package_name}
                              </span>
                            </td>
                            <td className="px-5 py-4 font-extrabold text-slate-900 tabular-nums whitespace-nowrap">
                              ${fmt(inv.invested_amount)}
                            </td>
                            <td className="px-5 py-4 font-bold text-emerald-600 tabular-nums whitespace-nowrap">
                              +${fmt(inv.expected_return)}
                            </td>
                            <td className="px-5 py-4 font-black text-slate-800 tabular-nums whitespace-nowrap">
                              ${fmt(inv.total_payout)}
                            </td>
                            <td className="px-5 py-4 text-xs text-slate-600 whitespace-nowrap">
                              {new Date(inv.maturity_date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-5 py-4">
                              <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5">{Math.round(pct)}%</p>
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap">
                              <span className={`text-xs font-bold border px-2.5 py-0.5 rounded-full capitalize ${statusCls}`}>
                                {inv.status}
                              </span>
                            </td>
                            <td className="px-5 py-4 relative whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => setExtendInv(inv)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
                                  title="Extend Maturity"
                                >
                                  Extend
                                </button>
                                {inv.status === 'active' && (
                                  <button
                                    onClick={() => handleStatusChange(inv.id, 'matured')}
                                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 transition-all"
                                  >
                                    Mature
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 3: PACKAGE MANAGER
        ══════════════════════════════════════════════════════════ */}
        {activeTab === 'packages' && (
          <>
            <div className="flex items-center justify-between mb-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Configured Pool Packages</h3>
                <p className="text-xs text-slate-500">Enable, disable, edit ROI, or launch new institutional plans.</p>
              </div>
              <button
                onClick={() => {
                  setPkgForm({
                    risk_level: 'low',
                    duration_value: 24,
                    duration_unit: 'hours',
                    is_active: true,
                    min_amount: 500,
                    roi_percentage: 840,
                  });
                  setPkgModal('new');
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all"
              >
                <Plus className="w-4 h-4" /> Create New Package
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      {['Package Name', 'Duration', 'ROI %', 'Fixed Deposit', 'Recommended', 'Live Active', 'Actions'].map(h => (
                        <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {packages.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-2 text-blue-600">
                            <Plus className="w-6 h-6" />
                          </div>
                          <p className="text-sm font-bold text-slate-700">No packages created yet</p>
                          <p className="text-xs text-slate-400 mt-1">Click "Create New Package" above to add your first pool trading plan for clients.</p>
                        </td>
                      </tr>
                    ) : (
                      packages.map(pkg => (
                        <tr key={pkg.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-4">
                            <p className="font-extrabold text-slate-900 text-sm">{pkg.name}</p>
                            <p className="text-xs text-slate-400 truncate max-w-xs">{pkg.description}</p>
                          </td>
                          <td className="px-5 py-4 text-slate-700 font-semibold whitespace-nowrap">
                            {pkg.duration_value} {pkg.duration_unit}
                          </td>
                          <td className="px-5 py-4 font-black text-emerald-600 tabular-nums whitespace-nowrap">
                            +{pkg.roi_percentage}%
                          </td>
                          <td className="px-5 py-4 tabular-nums font-extrabold text-slate-900 whitespace-nowrap">
                            ${fmt(pkg.min_amount)}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            {pkg.recommended ? (
                              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">★ Yes</span>
                            ) : (
                              <span className="text-xs text-slate-400">No</span>
                            )}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <Toggle
                              checked={pkg.is_active}
                              onChange={v => handleTogglePackage(pkg, v)}
                            />
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setPkgForm({ ...pkg });
                                  setPkgModal(pkg);
                                }}
                                className="p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
                                title="Edit Package"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePackage(pkg.id)}
                                className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all"
                                title="Delete Package"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 4: WITHDRAWALS QUEUE
        ══════════════════════════════════════════════════════════ */}
        {activeTab === 'withdrawals' && (
          <>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Student Withdrawal Queue</h3>
                  <p className="text-xs text-slate-500">Review and dispatch payouts requested from matured pools.</p>
                </div>
                <span className="text-xs font-bold bg-amber-50 text-amber-700 px-3 py-1 rounded-full border border-amber-200">
                  {pendingWithdrawalCount} Pending Dispatches
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      {['Student', 'Payout Amount', 'Payment Method', 'Destination Address', 'Requested At', 'Status', 'Actions'].map(h => (
                        <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {withdrawals.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-slate-400 text-xs font-semibold">
                          No withdrawal requests found.
                        </td>
                      </tr>
                    ) : (
                      withdrawals.map(w => (
                        <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-4">
                            <p className="font-extrabold text-slate-900 text-xs">{w.user_name}</p>
                            <p className="text-[11px] text-slate-400">{w.user_email}</p>
                          </td>
                          <td className="px-5 py-4 font-black text-emerald-600 text-base tabular-nums whitespace-nowrap">
                            ${fmt(w.amount)}
                          </td>
                          <td className="px-5 py-4 text-xs font-bold text-slate-700 whitespace-nowrap">
                            {w.payment_method}
                          </td>
                          <td className="px-5 py-4 font-mono text-xs text-slate-800 break-all max-w-xs">
                            {w.wallet_address}
                          </td>
                          <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                            {new Date(w.created_at).toLocaleString()}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className={`text-xs font-bold border px-2.5 py-0.5 rounded-full capitalize ${
                              w.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : w.status === 'pending'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}>
                              {w.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            {w.status === 'pending' || w.status === 'processing' ? (
                              <button
                                onClick={() => setProcWd(w)}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                              >
                                Process Payout
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400">Processed</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 5: TELEGRAM NOTIFICATION SETTINGS
        ══════════════════════════════════════════════════════════ */}
        {activeTab === 'telegram' && (
          <div className="space-y-6">
            {/* Header banner */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="bg-blue-500/20 text-blue-300 text-[11px] font-bold px-3 py-1 rounded-full border border-blue-400/30 flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5" /> Telegram Bot Automation
                    </span>
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${
                      telegramSettings.telegram_bot_token && telegramSettings.telegram_chat_id
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                    }`}>
                      {telegramSettings.telegram_bot_token && telegramSettings.telegram_chat_id
                        ? '● Connected & Active'
                        : '○ Configuration Needed'}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                    Real-Time Telegram Alerts
                  </h2>
                  <p className="text-sm text-slate-300 max-w-2xl mt-1">
                    Receive instant notifications in your Telegram chat whenever a user applies for a Pool Trading Package, submits a deposit, or requests a payout.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleTestTelegram}
                    disabled={testingTelegram || !telegramSettings.telegram_bot_token || !telegramSettings.telegram_chat_id}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    {testingTelegram ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 text-blue-300" />
                    )}
                    <span>{testingTelegram ? 'Sending Test...' : 'Send Test Alert'}</span>
                  </button>

                  <button
                    onClick={handleSaveTelegramSettings}
                    disabled={savingTelegram}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg hover:shadow-blue-500/25"
                  >
                    {savingTelegram ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    <span>{savingTelegram ? 'Saving...' : 'Save Settings'}</span>
                  </button>
                </div>
              </div>

              {testResult && (
                <div className={`mt-4 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  testResult.success
                    ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30'
                    : 'bg-red-500/20 text-red-200 border border-red-500/30'
                }`}>
                  {testResult.success ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
                  <span>{testResult.msg}</span>
                </div>
              )}
            </div>

            {/* Two-column layout: Form & Preview / Guide */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Form & Toggles */}
              <div className="lg:col-span-7 space-y-6">
                {/* Bot Credentials Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-card space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        <Key className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">Bot Credentials</h3>
                        <p className="text-xs text-slate-400">Telegram Bot Token & Destination Chat/Channel ID</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Telegram Bot Token <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showToken ? 'text' : 'password'}
                        value={telegramSettings.telegram_bot_token || ''}
                        onChange={e => setTelegramSettings(prev => ({ ...prev, telegram_bot_token: e.target.value }))}
                        placeholder="e.g. 7123456789:AAHKs... (from @BotFather)"
                        className="w-full border border-slate-200 rounded-xl pl-4 pr-11 py-2.5 text-sm font-mono text-slate-900 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                      >
                        {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Obtained from <strong>@BotFather</strong> on Telegram via the <code>/newbot</code> command.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Telegram Chat ID / Channel ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={telegramSettings.telegram_chat_id || ''}
                      onChange={e => setTelegramSettings(prev => ({ ...prev, telegram_chat_id: e.target.value }))}
                      placeholder="e.g. 123456789 (user) or -100123456789 (channel/group)"
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-900 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Your personal numeric Chat ID (from <strong>@userinfobot</strong>) or Group/Channel ID (e.g. <code>-100...</code>).
                    </p>
                  </div>
                </div>

                {/* Event Notification Toggles */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-card space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">Notification Triggers</h3>
                        <p className="text-xs text-slate-400">Choose which events dispatch instant Telegram messages</p>
                      </div>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100">
                    <div className="py-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-800">Pool Package Applications</p>
                        <p className="text-[11px] text-slate-400">Receive alert when a user submits an investment application</p>
                      </div>
                      <Toggle
                        checked={telegramSettings.notify_pool_application}
                        onChange={v => setTelegramSettings(prev => ({ ...prev, notify_pool_application: v }))}
                      />
                    </div>

                    <div className="py-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-800">Withdrawal Requests</p>
                        <p className="text-[11px] text-slate-400">Receive alert when an investor requests payout of matured funds</p>
                      </div>
                      <Toggle
                        checked={telegramSettings.notify_withdrawal_request}
                        onChange={v => setTelegramSettings(prev => ({ ...prev, notify_withdrawal_request: v }))}
                      />
                    </div>

                    <div className="py-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-800">VIP Syndicate Inquiries</p>
                        <p className="text-[11px] text-slate-400">Receive alert when a user applies for VIP syndicate status</p>
                      </div>
                      <Toggle
                        checked={telegramSettings.notify_vip_request}
                        onChange={v => setTelegramSettings(prev => ({ ...prev, notify_vip_request: v }))}
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleSaveTelegramSettings}
                      disabled={savingTelegram}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      {savingTelegram ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      <span>Save & Apply Settings</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Telegram Live Preview Mockup & Setup Guide */}
              <div className="lg:col-span-5 space-y-6">
                {/* Telegram Message Preview Card */}
                <div className="bg-[#17212B] text-white rounded-2xl p-5 shadow-xl border border-slate-800">
                  <div className="flex items-center gap-2.5 pb-3 mb-3 border-b border-slate-700/60">
                    <div className="w-7 h-7 rounded-full bg-[#2481CC] flex items-center justify-center text-white text-xs font-bold">
                      <Send className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#64B5F6]">Forex Royal Alert Bot</p>
                      <p className="text-[10px] text-slate-400">Live Telegram Alert Format</p>
                    </div>
                  </div>

                  <div className="bg-[#242F3D] rounded-xl p-4 text-xs font-sans space-y-2.5 text-slate-200 border border-slate-700/40">
                    <p className="font-bold text-white text-sm">🏊 NEW POOL TRADING APPLICATION</p>
                    <p className="text-[11px] text-slate-400">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</p>
                    <div>
                      <p className="font-bold text-blue-300">📦 PACKAGE DETAILS</p>
                      <p className="pl-2">• Plan: <strong>7-Day VIP Liquidity Pool</strong></p>
                      <p className="pl-2">• Target ROI: <strong className="text-emerald-400">+800%</strong></p>
                      <p className="pl-2">• Duration: <strong>7 days</strong></p>
                    </div>
                    <div>
                      <p className="font-bold text-emerald-300">💰 FINANCIAL BREAKDOWN</p>
                      <p className="pl-2">• Invested Capital: <strong>$1,000.00</strong></p>
                      <p className="pl-2">• Est. Profit: <strong className="text-emerald-400">+$8,000.00</strong></p>
                      <p className="pl-2">• Total Return: <strong>$9,000.00</strong></p>
                      <p className="pl-2">• Method: <strong>Crypto (USDT TRC20)</strong></p>
                      <p className="pl-2 font-mono text-[10px] text-slate-400">• Tx Ref: 0x9f83...a42</p>
                    </div>
                    <div>
                      <p className="font-bold text-amber-300">👤 INVESTOR INFORMATION</p>
                      <p className="pl-2">• Name: <strong>Trader John</strong></p>
                      <p className="pl-2 font-mono text-[10px] text-slate-300">• Email: john@example.com</p>
                    </div>
                    <p className="text-[11px] text-slate-400">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</p>
                    <p className="text-[11px] text-blue-200 font-bold">⚡ ACTION: Review & approve in Admin Command Center.</p>
                  </div>
                </div>

                {/* Setup Steps Guide */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    Quick Bot Setup:
                  </h4>
                  <ol className="text-xs text-slate-600 space-y-2.5 list-decimal pl-4">
                    <li>
                      Open Telegram and search for <strong>@BotFather</strong>.
                    </li>
                    <li>
                      Send <code>/newbot</code>, give your bot a name and username, then copy the <strong>Bot Token</strong>.
                    </li>
                    <li>
                      Search for <strong>@userinfobot</strong> on Telegram and send <code>/start</code> to view your numeric <strong>Id</strong>.
                    </li>
                    <li>
                      Open your new bot and click <strong>/start</strong> so it has permission to message you.
                    </li>
                    <li>
                      Paste your token and ID into the fields on the left and click <strong>Send Test Alert</strong>.
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══ APPROVE APPLICATION MODAL ═════════════════════════════════════ */}
      <Modal open={!!approveApp} onClose={() => setApproveApp(null)} title="Approve Application & Activate Slot">
        {approveApp && (() => {
          const pkg = packages.find(p => p.id === approveApp.package_id);
          const roiPct = pkg?.roi_percentage || 800;
          const profit = (Number(approveAmt) * roiPct) / 100;
          const totalPayout = Number(approveAmt) + profit;

          return (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-sm">
                  {getInitials(approveApp.user_name || 'Trader')}
                </div>
                <div>
                  <p className="font-extrabold text-slate-900">{approveApp.user_name}</p>
                  <p className="text-xs text-slate-400">{approveApp.user_email} · {approveApp.package_name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Deposit Amount ($)
                  </label>
                  <input
                    type="number"
                    value={approveAmt}
                    onChange={e => setApproveAmt(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold tabular-nums text-slate-900 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Maturity Date
                  </label>
                  <input
                    type="date"
                    value={approveMaturity}
                    onChange={e => setApproveMaturity(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Calculated profit */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Calculated Return ({roiPct}%)</p>
                <p className="text-3xl font-black text-emerald-700 tabular-nums mt-1">+${fmt(profit)}</p>
                <p className="text-xs text-slate-500 mt-1">Total payout at maturity: ${fmt(totalPayout)}</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setApproveApp(null)}
                  className="flex-1 py-3 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmApprove}
                  className="flex-1 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md"
                >
                  Confirm & Activate
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ═══ REJECT MODAL ════════════════════════════════════════════════ */}
      <Modal open={!!rejectApp} onClose={() => { setRejectApp(null); setRejectReason(''); }} title="Reject Application">
        {rejectApp && (
          <div className="space-y-4">
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl">
              <p className="text-sm font-bold text-red-900">Rejecting: {rejectApp.user_name}</p>
              <p className="text-xs text-red-600">{rejectApp.package_name} · ${fmt(rejectApp.amount)}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Reason for Rejection *
              </label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={3}
                required
                placeholder="e.g. Deposit reference not verified on-chain. Please re-check."
                className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-900 bg-slate-50 focus:bg-white focus:border-red-400 outline-none resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setRejectApp(null); setRejectReason(''); }}
                className="flex-1 py-3 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={!rejectReason.trim()}
                className="flex-1 py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 rounded-xl transition-all shadow-md"
              >
                Reject Application
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ═══ PACKAGE CREATE / EDIT MODAL ══════════════════════════════════ */}
      <Modal
        open={pkgModal !== null}
        onClose={() => setPkgModal(null)}
        title={pkgModal === 'new' ? 'Create New Pool Package' : 'Edit Package'}
        maxW="max-w-xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Package Name *</label>
              <input
                type="text"
                value={pkgForm.name || ''}
                onChange={e => setPkgForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. 24H · $500 Plan"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Description</label>
              <input
                type="text"
                value={pkgForm.description || ''}
                onChange={e => setPkgForm(f => ({ ...f, description: e.target.value }))}
                placeholder="e.g. Quick 24-hour institutional pool plan."
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Duration *</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={pkgForm.duration_value || ''}
                  onChange={e => setPkgForm(f => ({ ...f, duration_value: Number(e.target.value) }))}
                  className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none"
                  placeholder="24"
                />
                <select
                  value={pkgForm.duration_unit || 'hours'}
                  onChange={e => setPkgForm(f => ({ ...f, duration_unit: e.target.value as any }))}
                  className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 bg-slate-50 focus:border-blue-500 outline-none"
                >
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">ROI Percentage (%) *</label>
              <input
                type="number"
                value={pkgForm.roi_percentage || ''}
                onChange={e => setPkgForm(f => ({ ...f, roi_percentage: Number(e.target.value) }))}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-sm font-bold text-emerald-600 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none"
                placeholder="840"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Fixed / Min Amount ($) *</label>
              <input
                type="number"
                value={pkgForm.min_amount || ''}
                onChange={e => setPkgForm(f => ({ ...f, min_amount: Number(e.target.value) }))}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-slate-900 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none"
                placeholder="500"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={pkgForm.recommended || false}
                onChange={e => setPkgForm(f => ({ ...f, recommended: e.target.checked }))}
                className="rounded text-blue-600"
              />
              Mark as Recommended
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={pkgForm.is_active !== undefined ? pkgForm.is_active : true}
                onChange={e => setPkgForm(f => ({ ...f, is_active: e.target.checked }))}
                className="rounded text-blue-600"
              />
              Active on Student Portal
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setPkgModal(null)}
              className="flex-1 py-3 min-h-[44px] text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSavePackage}
              className="flex-1 py-3 min-h-[44px] text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md"
            >
              Save Package
            </button>
          </div>
        </div>
      </Modal>

      {/* ═══ EXTEND MATURITY MODAL ════════════════════════════════════════ */}
      <Modal open={!!extendInv} onClose={() => setExtendInv(null)} title="Extend Maturity Date">
        {extendInv && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Extending pool for <strong className="text-slate-900">{extendInv.user_name}</strong> ({extendInv.package_name}).
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Additional Days</label>
              <input
                type="number"
                value={extendDays}
                onChange={e => setExtendDays(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-sm font-bold text-slate-900 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Extension Reason</label>
              <input
                type="text"
                value={extendReason}
                onChange={e => setExtendReason(e.target.value)}
                placeholder="e.g. Market compounding cycle extension"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-slate-900 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setExtendInv(null)}
                className="flex-1 py-3 min-h-[44px] text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleExtendConfirm}
                className="flex-1 py-3 min-h-[44px] text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md"
              >
                Confirm Extension
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ═══ PROCESS WITHDRAWAL MODAL ═════════════════════════════════════ */}
      <Modal open={!!procWd} onClose={() => setProcWd(null)} title="Process & Dispatch Payout">
        {procWd && (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
              <p className="text-xs font-bold text-emerald-700 uppercase">Payout to {procWd.user_name}</p>
              <p className="text-3xl font-black text-emerald-800 mt-1">${fmt(procWd.amount)}</p>
              <p className="text-xs text-slate-600 mt-1">
                Method: <strong>{procWd.payment_method}</strong>
              </p>
              <p className="text-xs font-mono text-slate-800 break-all mt-1 bg-white p-2 rounded-lg border border-emerald-100">
                {procWd.wallet_address}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Transaction Hash / Reference Code
              </label>
              <input
                type="text"
                value={txHash}
                onChange={e => setTxHash(e.target.value)}
                placeholder="e.g. 0xabc... or M-Pesa Tx Code"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-sm font-mono text-slate-900 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => handleProcessWithdrawal('declined')}
                className="flex-1 py-3 min-h-[44px] text-sm font-bold text-red-600 border border-red-200 hover:bg-red-50 rounded-xl transition-all"
              >
                Decline
              </button>
              <button
                onClick={() => handleProcessWithdrawal('completed')}
                className="flex-1 py-3 min-h-[44px] text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md"
              >
                Mark as Dispatched (Paid)
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

