import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, ShieldCheck, ShieldAlert, Edit3, KeyRound, 
  MessageSquare, Send, Lock, Unlock, LogOut, Trash2, Clock, CheckCircle2, X
} from 'lucide-react';

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

export function AccountManagementPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');

  // Toast / Status messages
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [vipRequested, setVipRequested] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const mockUser: UserProfile = {
          id: 'usr_78912',
          name: 'Alex Vance',
          email: 'alex.vance@forexelites.com',
          phone: '+255712345678',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
          email_verified: true,
          vip_status: 'none',
          vip_group_url: 'https://t.me/+ForexElitesVIPCommunity',
          active_pool_trades_count: 3,
          total_invested: 2450.00,
          total_withdrawn: 890.50,
          account_tier: 'Standard Member',
          last_login: new Date().toLocaleString(),
        };
        setProfile(mockUser);
        setEditName(mockUser.name);
        setEditPhone(mockUser.phone);
        setEditAvatar(mockUser.avatar_url || '');
      } catch (err) {
        showToast('Failed to load user profile.');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setProfile({
      ...profile,
      name: editName,
      phone: editPhone,
      avatar_url: editAvatar
    });
    setIsEditProfileOpen(false);
    showToast('Profile updated successfully!');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match!');
      return;
    }
    setIsChangePasswordOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showToast('Password changed successfully!');
  };

  const handleVipRequest = () => {
    if (!profile) return;
    setVipRequested(true);
    setProfile({ ...profile, vip_status: 'pending' });
    showToast('Request submitted. Admin will review shortly.');
  };

  const handleResendVerification = () => {
    showToast('Verification email has been sent!');
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmationInput !== 'DELETE') {
      showToast('Please type DELETE exactly to confirm account deletion.');
      return;
    }
    setIsDeleteModalOpen(false);
    showToast('Account scheduled for deletion. Logging out...');
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] text-slate-600 flex items-center justify-center p-6 font-sans">
        <div className="flex items-center space-x-3 text-blue-600 font-semibold">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading Account Details...</span>
        </div>
      </div>
    );
  }

  const adminWhatsappNumber = '255700000000';
  const whatsappUrl = `https://wa.me/${adminWhatsappNumber}?text=${encodeURIComponent(
    `Hi, I'm ${profile.name} from Forex Elites. My email is ${profile.email}. I need help with account management.`
  )}`;
  const telegramUsername = 'ForexElitesAdmin';
  const telegramUrl = `https://t.me/${telegramUsername}`;

  return (
    <div className="text-slate-700 space-y-0 md:space-y-6 md:p-0 font-sans pb-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-blue-600 text-white font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 animate-bounce text-sm">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── PAGE HEADER ─────────────────────────────── */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl md:text-3xl font-bold text-slate-900 tracking-tight">Account Management</h1>
        <p className="text-slate-500 text-xs md:text-sm mt-0.5">Manage your profile and settings</p>
      </div>

      {/* 1.1 PROFILE SECTION */}
      <section className="bg-white border-t border-b border-slate-200 md:border md:rounded-2xl p-4 md:p-8 shadow-card relative overflow-hidden md:mx-0">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            <div className="relative group">
              <img
                src={profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                alt={profile.name}
                className="w-24 h-24 rounded-full object-cover border-2 border-blue-500/20 p-1 shadow-sm"
              />
              <button 
                onClick={() => setIsEditProfileOpen(true)}
                className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-md hover:bg-blue-700 transition"
                title="Edit Photo"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-center sm:justify-start space-x-3">
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">{profile.name}</h1>
                {profile.email_verified ? (
                  <span className="inline-flex items-center space-x-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verified</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 text-xs font-semibold bg-red-50 text-red-700 border border-red-200 px-2.5 py-0.5 rounded-full">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Unverified</span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-slate-500 font-medium">
                <div className="flex items-center space-x-1.5">
                  <Mail className="w-4 h-4 text-blue-500" />
                  <span>{profile.email}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Phone className="w-4 h-4 text-blue-500" />
                  <span className="tabular-nums">{profile.phone}</span>
                </div>
              </div>

              {!profile.email_verified && (
                <button
                  onClick={handleResendVerification}
                  className="mt-2 text-xs text-blue-600 underline hover:text-blue-700 font-semibold inline-block"
                >
                  Resend Verification Email
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button
              onClick={() => setIsEditProfileOpen(true)}
              className="flex items-center justify-center space-x-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-4 py-2.5 rounded-xl font-bold transition text-sm"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>

            <button
              onClick={() => setIsChangePasswordOpen(true)}
              className="flex items-center justify-center space-x-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl font-bold transition text-sm"
            >
              <KeyRound className="w-4 h-4 text-blue-600" />
              <span>Change Password</span>
            </button>
          </div>
        </div>
      </section>

      {/* 1.2 ACCOUNT MANAGEMENT CONTACT CARDS */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-6 border-t border-slate-200 md:border-none">
        {/* WhatsApp Card */}
        <div className="bg-white border-b border-slate-200 md:border md:rounded-2xl p-4 md:p-6 relative overflow-hidden transition-all duration-200 md:shadow-card hover:border-emerald-300 group">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">WhatsApp Support</h3>
              <p className="text-sm text-slate-500">Direct 24/7 priority messaging with our account manager.</p>
              <p className="text-xs font-mono text-emerald-600 font-semibold pt-1 tabular-nums">+{adminWhatsappNumber}</p>
            </div>
          </div>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center justify-center space-x-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-sm transition duration-200 text-sm"
          >
            <span>Contact on WhatsApp</span>
            <Send className="w-4 h-4" />
          </a>
        </div>

        {/* Telegram Card */}
        <div className="bg-white border-b border-slate-200 md:border md:rounded-2xl p-4 md:p-6 relative overflow-hidden transition-all duration-200 md:shadow-card hover:border-sky-300 group">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-sky-50 border border-sky-200 rounded-xl flex items-center justify-center text-sky-600 group-hover:scale-105 transition-transform">
                <Send className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Telegram Channel</h3>
              <p className="text-sm text-slate-500">Connect with Forex Elites official admin profile.</p>
              <p className="text-xs font-mono text-sky-600 font-semibold pt-1">@{telegramUsername}</p>
            </div>
          </div>
          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center justify-center space-x-2 w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 rounded-xl shadow-sm transition duration-200 text-sm"
          >
            <span>Contact on Telegram</span>
            <Send className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* 1.3 VIP COMMUNITY ACCESS SECTION */}
      <section className="bg-white border-t border-b border-slate-200 md:border md:rounded-2xl p-4 md:p-8 relative overflow-hidden md:shadow-card">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-5 text-center md:text-left">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
              profile.vip_status === 'active' 
                ? 'bg-blue-50 border-blue-200 text-blue-600' 
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}>
              {profile.vip_status === 'active' ? <Unlock className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
            </div>
            <div>
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <h3 className="text-xl font-bold text-slate-900">VIP Trading Community</h3>
                {profile.vip_status === 'active' ? (
                  <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">Active</span>
                ) : (
                  <span className="text-xs bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-0.5 rounded-full font-semibold">Locked</span>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-1 max-w-xl">
                Get high-probability trade setups, institutional market analyses, and direct private signals from master traders.
              </p>
            </div>
          </div>

          <div className="w-full md:w-auto">
            {profile.vip_status === 'active' ? (
              <a
                href={profile.vip_group_url || 'https://t.me'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full md:w-auto inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3.5 rounded-xl shadow-blue-glow transition text-sm"
              >
                <span>Enter VIP Community</span>
                <Send className="w-4 h-4" />
              </a>
            ) : (
              <button
                onClick={handleVipRequest}
                disabled={vipRequested || profile.vip_status === 'pending'}
                className={`w-full md:w-auto inline-flex items-center justify-center space-x-2 font-bold px-6 py-3.5 rounded-xl transition text-sm ${
                  vipRequested || profile.vip_status === 'pending'
                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-glow'
                }`}
              >
                <span>{vipRequested || profile.vip_status === 'pending' ? 'Request Submitted' : 'Request VIP Access'}</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 1.4 ACCOUNT STATUS OVERVIEW */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-0 md:gap-6 border-t border-slate-200 md:border-none">
        <div className="bg-white border-b border-r border-slate-200 md:border md:rounded-2xl p-4 md:p-5 md:shadow-card space-y-1">
          <p className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider font-bold">Pool Trades</p>
          <p className="text-2xl md:text-3xl font-extrabold text-slate-900 tabular-nums">{profile.active_pool_trades_count}</p>
        </div>

        <div className="bg-white border-b border-slate-200 md:border md:rounded-2xl p-4 md:p-5 md:shadow-card space-y-1">
          <p className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider font-bold">Total Invested</p>
          <p className="text-2xl md:text-3xl font-extrabold text-blue-600 tabular-nums">${profile.total_invested.toFixed(2)}</p>
        </div>

        <div className="bg-white border-b border-r border-slate-200 md:border md:rounded-2xl p-4 md:p-5 md:shadow-card space-y-1">
          <p className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider font-bold">Withdrawn</p>
          <p className="text-2xl md:text-3xl font-extrabold text-emerald-600 tabular-nums">${profile.total_withdrawn.toFixed(2)}</p>
        </div>

        <div className="bg-white border-b border-slate-200 md:border md:rounded-2xl p-4 md:p-5 md:shadow-card space-y-1">
          <p className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider font-bold">Account Status</p>
          <span className="inline-block mt-1 bg-blue-50 border border-blue-200 text-blue-700 font-bold px-3 py-1 rounded-xl text-xs">
            {profile.account_tier}
          </span>
        </div>
      </section>

      {/* 1.5 SESSION & SECURITY */}
      <section className="bg-white border-t border-b border-slate-200 md:border md:rounded-2xl p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 md:shadow-card">
        <div className="flex items-center space-x-2 text-xs md:text-sm text-slate-500">
          <Clock className="w-4 h-4 text-blue-600" />
          <span>Last Login: <strong className="text-slate-800 tabular-nums">{profile.last_login}</strong></span>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <button
            onClick={() => showToast('Logged out successfully.')}
            className="flex-1 md:flex-none inline-flex items-center justify-center space-x-2 bg-slate-50 hover:bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold transition"
          >
            <LogOut className="w-4 h-4 text-slate-500" />
            <span>Log Out</span>
          </button>

          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex-1 md:flex-none inline-flex items-center justify-center space-x-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2.5 rounded-xl border border-red-200 text-sm font-bold transition"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
            <span>Delete Account</span>
          </button>
        </div>
      </section>

      {/* EDIT PROFILE MODAL */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Edit Profile</h3>
              <button onClick={() => setIsEditProfileOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm font-medium focus:outline-none focus:border-blue-500 focus:bg-white tabular-nums"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Avatar Image URL</label>
                <input
                  type="text"
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                  placeholder="https://..."
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 shadow-blue-glow"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Change Password</h3>
              <button onClick={() => setIsChangePasswordOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 shadow-blue-glow"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE ACCOUNT MODAL */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl relative">
            <div className="flex items-center space-x-3 text-red-600">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-lg font-bold">Delete Account Permanently</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              This action cannot be undone. All your investment history, active trade logs, and wallet balances will be permanently removed.
            </p>

            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
              Please type <strong className="font-mono text-red-900">DELETE</strong> below to confirm.
            </div>

            <input
              type="text"
              value={deleteConfirmationInput}
              onChange={(e) => setDeleteConfirmationInput(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm font-mono focus:outline-none focus:border-red-500 focus:bg-white"
              placeholder="Type DELETE"
            />

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmationInput !== 'DELETE'}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition"
              >
                Confirm Deletion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

