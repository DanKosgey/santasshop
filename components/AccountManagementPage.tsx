import React, { useState, useEffect } from 'react';
import {
  User, Mail, Phone, ShieldCheck, ShieldAlert, Edit3, KeyRound,
  Send, Lock, LogOut, CheckCircle2, X, MessageCircle,
  TrendingUp, DollarSign, Activity, Eye, EyeOff, Trash2, AlertTriangle
} from 'lucide-react';
import { ADMIN_WHATSAPP, ADMIN_TELEGRAM_URL, ADMIN_TELEGRAM_USERNAME } from '../lib/constants';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar_url?: string;
  email_verified: boolean;
  vip_status: 'none' | 'pending' | 'active' | 'revoked';
  vip_group_url?: string;
  active_pool_trades_count: number;
  total_invested: number;
  total_withdrawn: number;
  account_tier: string;
  last_login: string;
}

const fmt = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/* ─── Reusable Modal Wrapper ─────────────────────────────────────────────── */
function Modal({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        style={{ animation: 'modalIn 0.18s ease' }}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
      <style>{`
        @keyframes modalIn { from { opacity:0; transform:scale(0.95) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
      `}</style>
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
      <style>{`@keyframes slideIn { from { opacity:0; transform:translateX(24px); } to { opacity:1; transform:translateX(0); } }`}</style>
    </div>
  );
}

/* ─── Stat Card ──────────────────────────────────────────────────────────── */
function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-lg font-bold text-slate-900 tabular-nums">{value}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export function AccountManagementPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  const [isPwOpen, setIsPwOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

  const [toast, setToast] = useState<{ msg: string; type?: 'success' | 'error' } | null>(null);
  const [vipRequested, setVipRequested] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    setTimeout(() => {
      const mock: UserProfile = {
        id: 'usr_78912',
        name: 'Francesco Battista',
        email: 'francesco.battista@forexelites.com',
        phone: '+1 (208) 969-5688',
        email_verified: true,
        vip_status: 'none',
        vip_group_url: 'https://t.me/SIRLEONARD1',
        active_pool_trades_count: 3,
        total_invested: 5250.00,
        total_withdrawn: 1890.50,
        account_tier: 'Professional Member',
        last_login: new Date().toLocaleString(),
      };
      setProfile(mock);
      setEditName(mock.name);
      setEditPhone(mock.phone);
      setLoading(false);
    }, 600);
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setProfile({ ...profile, name: editName, phone: editPhone });
    setIsEditOpen(false);
    showToast('Profile updated successfully!');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) { showToast('New passwords do not match!', 'error'); return; }
    if (newPw.length < 8) { showToast('Password must be at least 8 characters.', 'error'); return; }
    setIsPwOpen(false);
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
    showToast('Password changed successfully!');
  };

  const handleDeleteAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteInput !== 'DELETE') { showToast('Type DELETE exactly to confirm.', 'error'); return; }
    setIsDeleteOpen(false);
    showToast('Account scheduled for deletion. Logging out...');
  };

  if (loading || !profile) {
    return (
      <div className="min-h-[60vh] bg-[#F5F7FA] flex items-center justify-center font-sans">
        <div className="flex items-center gap-3 text-blue-600 font-semibold">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          Loading Account Details...
        </div>
      </div>
    );
  }

  const whatsappUrl = `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(
    `Hi, I'm ${profile.name} (${profile.email}). I need help with my Forex Royal account.`
  )}`;
  const telegramUrl = ADMIN_TELEGRAM_URL;

  return (
    <div className="min-h-screen bg-[#F5F7FA] font-sans pb-16">
      {/* Global CSS */}
      <style>{`
        .shadow-card { box-shadow: 0 4px 6px -1px rgba(15,23,42,0.06), 0 2px 4px -2px rgba(15,23,42,0.04); }
        .shadow-card-hover:hover { box-shadow: 0 10px 15px -3px rgba(15,23,42,0.07), 0 4px 6px -4px rgba(15,23,42,0.05); }
        .contact-card:hover { box-shadow: 0 10px 15px -3px rgba(15,23,42,0.09); transform: translateY(-2px); }
        .contact-card { transition: all 0.2s ease; }
        .tabular-nums { font-variant-numeric: tabular-nums; }
        input, textarea, select { outline: none; }
        input:focus, textarea:focus, select:focus { ring: none; }
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div className="max-w-3xl mx-auto px-4 pt-6 space-y-5">

        {/* ── PAGE HEADER ──────────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Account Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your profile, security, and support access.</p>
        </div>

        {/* ── PROFILE HERO CARD ─────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-blue-100" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xl select-none">
                  {getInitials(profile.name)}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
                <h2 className="text-xl font-bold text-slate-900">{profile.name}</h2>
                {profile.email_verified ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified
                  </span>
                ) : (
                  <button onClick={() => showToast('Verification email sent!')}
                    className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full hover:bg-amber-100 transition-all">
                    <ShieldAlert className="w-3.5 h-3.5" /> Unverified — Verify Now
                  </button>
                )}
              </div>
              <div className="mt-2 flex flex-wrap justify-center sm:justify-start gap-3 text-sm text-slate-500">
                <span className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-blue-400" />{profile.email}</span>
                <span className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-blue-400" />{profile.phone}</span>
              </div>
              <p className="mt-1.5 text-xs text-slate-400">{profile.account_tier} · Last login: {profile.last_login}</p>
            </div>

            {/* Edit button */}
            <button onClick={() => setIsEditOpen(true)}
              className="self-start flex items-center gap-2 text-sm font-semibold text-blue-600 border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-50 transition-all flex-shrink-0">
              <Edit3 className="w-4 h-4" /> Edit Profile
            </button>
          </div>
        </div>

        {/* ── STATS STRIP ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard label="Active Trades" value={`${profile.active_pool_trades_count}`}
            icon={Activity} color="bg-blue-50 text-blue-600" />
          <StatCard label="Total Invested" value={`$${fmt(profile.total_invested)}`}
            icon={TrendingUp} color="bg-emerald-50 text-emerald-600" />
          <StatCard label="Total Withdrawn" value={`$${fmt(profile.total_withdrawn)}`}
            icon={DollarSign} color="bg-purple-50 text-purple-600" />
        </div>

        {/* ── SECURITY & SESSION ────────────────────────────────────────── */}
        <div>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Security & Session</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Password Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Password</p>
                  <p className="text-xs text-slate-400">••••••••••••</p>
                </div>
              </div>
              <button onClick={() => setIsPwOpen(true)}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-all">
                Change
              </button>
            </div>

            {/* Session Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Active Session</p>
                  <p className="text-xs text-slate-400 truncate max-w-[140px]" title={profile.last_login}>{profile.last_login}</p>
                </div>
              </div>
              <button onClick={() => showToast('Logged out from all sessions.')}
                className="text-xs font-bold text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all">
                Log Out
              </button>
            </div>
          </div>
        </div>

        {/* ── SUPPORT CONTACT ───────────────────────────────────────────── */}
        <div>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Need Help?</h3>
          <p className="text-sm text-slate-500 mb-3">Contact your dedicated account manager directly.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* WhatsApp */}
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
              className="contact-card bg-white rounded-xl border border-slate-200 shadow-card p-5 flex items-center gap-4 no-underline group"
              style={{ borderLeft: '4px solid #25D366' }}>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900">Chat on WhatsApp</p>
                <p className="text-xs text-slate-500 mt-0.5">Instant replies, usually within minutes.</p>
                <p className="text-xs font-semibold text-emerald-600 mt-1">+1 (208) 969-5688</p>
              </div>
              <svg className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-all flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>

            {/* Telegram */}
            <a href={telegramUrl} target="_blank" rel="noopener noreferrer"
              className="contact-card bg-white rounded-xl border border-slate-200 shadow-card p-5 flex items-center gap-4 no-underline group"
              style={{ borderLeft: '4px solid #0088CC' }}>
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Send className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900">Message on Telegram</p>
                <p className="text-xs text-slate-500 mt-0.5">Join our private VIP community channel.</p>
                <p className="text-xs font-semibold text-blue-600 mt-1">@{ADMIN_TELEGRAM_USERNAME}</p>
              </div>
              <svg className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-all flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>

        {/* ── DANGER ZONE ───────────────────────────────────────────────── */}
        <div className="bg-red-50 rounded-xl border border-red-200 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-red-800">Delete Account</p>
              <p className="text-xs text-red-600 mt-0.5">Permanently remove your account and all trading data. This action cannot be undone.</p>
            </div>
            <button onClick={() => setIsDeleteOpen(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-red-600 border border-red-300 px-3 py-2 rounded-lg hover:bg-red-100 transition-all flex-shrink-0">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>
      </div>

      {/* ═══ MODALS ═══════════════════════════════════════════════════════ */}

      {/* Edit Profile Modal */}
      <Modal open={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Profile">
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
            <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 bg-slate-50 focus:bg-white focus:border-blue-400 transition-all" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phone Number</label>
            <input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 bg-slate-50 focus:bg-white focus:border-blue-400 transition-all" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setIsEditOpen(false)}
              className="flex-1 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all">Cancel</button>
            <button type="submit"
              className="flex-1 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all">Save Changes</button>
          </div>
        </form>
      </Modal>

      {/* Change Password Modal */}
      <Modal open={isPwOpen} onClose={() => setIsPwOpen(false)} title="Change Password">
        <form onSubmit={handleChangePassword} className="space-y-4">
          {[
            { label: 'Current Password', val: currentPw, set: setCurrentPw },
            { label: 'New Password', val: newPw, set: setNewPw },
            { label: 'Confirm New Password', val: confirmPw, set: setConfirmPw },
          ].map(({ label, val, set }) => (
            <div key={label}>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={val} onChange={e => set(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 pr-10 text-sm text-slate-900 bg-slate-50 focus:bg-white focus:border-blue-400 transition-all" required />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setIsPwOpen(false)}
              className="flex-1 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all">Cancel</button>
            <button type="submit"
              className="flex-1 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all">Update Password</button>
          </div>
        </form>
      </Modal>

      {/* Delete Account Modal */}
      <Modal open={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Account">
        <form onSubmit={handleDeleteAccount} className="space-y-4">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <p className="font-bold mb-1">⚠️ This is irreversible</p>
            <p className="text-xs">All your trading data, investments, and profile will be permanently deleted.</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Type <span className="text-red-600 font-mono">DELETE</span> to confirm
            </label>
            <input type="text" value={deleteInput} onChange={e => setDeleteInput(e.target.value)}
              placeholder="DELETE" className="w-full border border-red-200 rounded-lg px-3 py-2.5 text-sm font-mono text-red-900 bg-red-50 focus:bg-white focus:border-red-400 transition-all" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setIsDeleteOpen(false); setDeleteInput(''); }}
              className="flex-1 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all">Cancel</button>
            <button type="submit" disabled={deleteInput !== 'DELETE'}
              className="flex-1 py-2.5 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all">
              Delete Account
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
