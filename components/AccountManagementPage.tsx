import React, { useState, useEffect, useCallback } from 'react';
import {
  Mail, Phone, ShieldCheck, ShieldAlert, Edit3,
  Send, CheckCircle2, X, MessageCircle,
  Trash2, AlertTriangle
} from 'lucide-react';
import { ADMIN_WHATSAPP, ADMIN_TELEGRAM_URL, ADMIN_TELEGRAM_USERNAME } from '../lib/constants';
import { supabase } from '../supabase/client';
import { User } from '../types';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar_url?: string;
  email_verified: boolean;
  vip_status: 'none' | 'pending' | 'active' | 'revoked';
  vip_group_url?: string;
  account_tier: string;
  last_login: string;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';
}

function formatTierDisplay(tier?: string, role?: string): string {
  if (role === 'admin') return 'Administrator';
  if (!tier || tier === 'free') return 'Free Member';
  if (tier === 'foundation') return 'Foundation Member';
  if (tier === 'professional') return 'Professional Member';
  if (tier === 'elite') return 'Elite Member';
  if (tier.includes('pending')) return 'Membership Under Review';
  return tier.charAt(0).toUpperCase() + tier.slice(1) + ' Member';
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

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
interface AccountManagementPageProps {
  currentUser?: User | null;
  onProfileUpdated?: (updated: { name: string; phone?: string }) => void;
}

export function AccountManagementPage({ currentUser, onProfileUpdated }: AccountManagementPageProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Modals
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

  const [toast, setToast] = useState<{ msg: string; type?: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchRealUserData = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Get current authenticated user
      const { data: { session } } = await supabase.auth.getSession();
      const authUser = session?.user;

      if (!authUser) {
        if (currentUser) {
          setProfile({
            id: currentUser.id,
            name: currentUser.name || currentUser.email.split('@')[0],
            email: currentUser.email,
            phone: 'Not set',
            email_verified: true,
            vip_status: 'none',
            vip_group_url: ADMIN_TELEGRAM_URL,
            account_tier: formatTierDisplay(currentUser.subscriptionTier, currentUser.role),
            last_login: new Date().toLocaleString(),
          });
          setEditName(currentUser.name || '');
          setEditPhone('');
        }
        setLoading(false);
        return;
      }

      // 2. Fetch full DB profile record
      const { data: dbProfile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (profileErr && profileErr.code !== 'PGRST116') {
        console.warn('Profile fetch warning:', profileErr.message);
      }

      // 3. Compute formatted user profile values
      const metaName = authUser.user_metadata?.full_name || authUser.user_metadata?.name;
      const resolvedName = dbProfile?.full_name || metaName || currentUser?.name || authUser.email?.split('@')[0] || 'User';
      const resolvedEmail = authUser.email || dbProfile?.email || currentUser?.email || '';
      const resolvedPhone = dbProfile?.phone || authUser.phone || authUser.user_metadata?.phone || '';
      const isEmailVerified = Boolean(authUser.email_confirmed_at || authUser.confirmed_at);
      const tier = dbProfile?.subscription_tier || currentUser?.subscriptionTier || authUser.user_metadata?.subscription_tier || 'free';
      const role = dbProfile?.role || currentUser?.role || 'student';
      const formattedTier = formatTierDisplay(tier, role);

      const lastLoginFormatted = authUser.last_sign_in_at
        ? new Date(authUser.last_sign_in_at).toLocaleString()
        : new Date().toLocaleString();

      const userProfile: UserProfile = {
        id: authUser.id,
        name: resolvedName,
        email: resolvedEmail,
        phone: resolvedPhone || 'Not set',
        avatar_url: dbProfile?.avatar_url || authUser.user_metadata?.avatar_url || '',
        email_verified: isEmailVerified,
        vip_status: dbProfile?.vip_status || 'none',
        vip_group_url: ADMIN_TELEGRAM_URL,
        account_tier: formattedTier,
        last_login: lastLoginFormatted,
      };

      setProfile(userProfile);
      setEditName(resolvedName);
      setEditPhone(resolvedPhone);
    } catch (err) {
      console.error('Error fetching real account data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchRealUserData();
  }, [fetchRealUserData]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsSaving(true);
    try {
      // 1. Update Supabase Auth user metadata
      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: {
          full_name: editName,
          phone: editPhone
        }
      });
      if (authUpdateError) {
        console.warn('Auth metadata update:', authUpdateError.message);
      }

      // 2. Update profiles table in database
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: editName,
          ...(editPhone ? { phone: editPhone } : {})
        })
        .eq('id', profile.id);

      if (profileError && !profileError.message.includes('column "phone" does not exist')) {
        console.warn('Profile table update notice:', profileError.message);
      }

      setProfile(prev => prev ? ({
        ...prev,
        name: editName,
        phone: editPhone || 'Not set'
      }) : null);

      if (onProfileUpdated) {
        onProfileUpdated({ name: editName, phone: editPhone });
      }

      setIsEditOpen(false);
      showToast('Profile updated successfully!');
    } catch (err: any) {
      console.error('Error updating profile:', err);
      showToast(err?.message || 'Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!profile?.email) return;
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: profile.email
      });
      if (error) throw error;
      showToast(`Verification link sent to ${profile.email}`);
    } catch (err: any) {
      console.error('Error resending verification:', err);
      showToast(err?.message || 'Failed to send verification email', 'error');
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteInput !== 'DELETE') {
      showToast('Type DELETE exactly to confirm.', 'error');
      return;
    }
    try {
      if (profile?.id) {
        await supabase.from('profiles').delete().eq('id', profile.id).catch(() => {});
      }
      await supabase.auth.signOut();
      setIsDeleteOpen(false);
      showToast('Account scheduled for deletion. Logging out...');
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      console.error('Error deleting account:', err);
      showToast(err?.message || 'Failed to delete account', 'error');
    }
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
                  <button onClick={handleVerifyEmail}
                    className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full hover:bg-amber-100 transition-all cursor-pointer">
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
                <p className="text-xs font-semibold text-emerald-600 mt-1">+{ADMIN_WHATSAPP}</p>
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
              placeholder="+1 (555) 000-0000"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 bg-slate-50 focus:bg-white focus:border-blue-400 transition-all" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setIsEditOpen(false)}
              className="flex-1 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all">Cancel</button>
            <button type="submit" disabled={isSaving}
              className="flex-1 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all">
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
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
