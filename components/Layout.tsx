import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, GraduationCap, Cpu as Bot, BookOpen, Users, LogOut, Settings, ShieldAlert, Layers, PieChart as PieIcon, CheckSquare, X, Menu, Zap, ChevronRight, UserCog, Sliders } from 'lucide-react';
import { User } from '../types';
import NavigationButtons from './NavigationButtons';
import { APP_DISPLAY_NAMES } from '../lib/constants';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onChangeView: (view: string) => void;
  onLogout: () => void;
  user: User;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, onChangeView, onLogout, user }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = (viewId: string) => {
    onChangeView(viewId);
    setIsMobileMenuOpen(false);
  };

  const handleRefresh = () => window.location.reload();

  let menuItems: { id: string; label: string; icon: React.ElementType; premium?: boolean }[] = [];

  if (user.role === 'admin') {
    menuItems = [
      { id: 'directory',          label: 'Directory',    icon: Users },
      { id: 'student-management', label: 'Students',     icon: UserCog },
      { id: 'signals',            label: 'Trade',        icon: Zap },
      { id: 'trades',             label: 'Trade Audit',  icon: Layers },
      { id: 'analytics',          label: 'Analytics',    icon: PieIcon },
      { id: 'content',            label: 'Courses',      icon: GraduationCap },
      { id: 'rules',              label: 'Rules',        icon: Sliders },
      { id: 'bot-inquiries',      label: 'Bot Orders',   icon: Bot },
      { id: 'settings',           label: 'Settings',     icon: Settings },
    ];
  } else {
    menuItems = [
      { id: 'dashboard',   label: 'Home',               icon: LayoutDashboard },
      { id: 'signals',     label: 'Trade',              icon: Zap },
      { id: 'courses',     label: 'Courses',            icon: GraduationCap },
      { id: 'journal',     label: 'Journal',            icon: BookOpen },
      { id: 'todos',       label: 'Tasks',              icon: CheckSquare },
      { id: 'community',   label: 'Community',          icon: Users },
    ];
  }

  const bottomNavItems = menuItems.slice(0, 5);
  const overflowItems = menuItems.slice(5);

  const isAdmin = user.role === 'admin';
  // Gold/Black theme — consistent for all roles
  const accentBg      = 'bg-[#D4A24C]';
  const accentText    = 'text-[#9A6D1E]';
  const accentBorder  = 'border-[#E8CC9A]';
  const accentBgLight = 'bg-[#FAF5EB]';
  const accentRing    = 'ring-[#E8CC9A]';

  // Find current page label for mobile header
  const currentPage = menuItems.find(m => m.id === currentView);
  const pageLabel   = currentPage?.label ?? APP_DISPLAY_NAMES.short;

  return (
    <div className="flex min-h-screen bg-[#F7F7F8] text-[#111111] relative font-sans">

      {/* â”€â”€â”€ Mobile Top Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="h-14 bg-[#0B0B0C] backdrop-blur-xl border-b border-black/40 shadow-sm flex items-center justify-between px-4">
          {/* Left: Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-6 rounded-full bg-[#D4A24C]" />
            <div>
              <span className="text-white font-bold text-base tracking-tight leading-none">
                {APP_DISPLAY_NAMES.short}
              </span>
              {currentPage && (
                <div className="text-[10px] font-semibold tracking-wide uppercase text-[#D4A24C] leading-none mt-0.5">
                  {pageLabel}
                </div>
              )}
            </div>
          </div>

          {/* Right: Avatar + overflow */}
          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${accentBg} ring-2 ${accentRing}`}>
              {(user.name || user.email || 'U').charAt(0).toUpperCase()}
            </div>
            {overflowItems.length > 0 && (
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-white hover:bg-white/10 transition min-w-[44px] min-h-[44px]"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ─── Mobile Overflow Menu ────────────────────────────────────────── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              key="menu"
              initial={{ opacity: 0, y: -12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.97 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-[60px] right-3 z-50 bg-white border border-slate-200/80 rounded-2xl shadow-xl overflow-hidden w-56 md:hidden"
            >
              {/* User info */}
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-100">
                <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${accentBg}`}>
                  {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{user.name || 'Trader'}</p>
                  <p className="text-[11px] text-slate-400 capitalize">{user.role}</p>
                </div>
              </div>

              {/* Extra nav items */}
              <div className="py-1.5">
                {overflowItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition ${
                        isActive
                          ? `${accentBgLight} ${accentText} font-semibold`
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {isActive && <ChevronRight className={`h-3.5 w-3.5 ${accentText}`} />}
                    </button>
                  );
                })}
              </div>

              {/* Sign out */}
              <div className="border-t border-slate-100 py-1.5">
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* â”€â”€â”€ Desktop Sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-[#E5E7EB] flex-shrink-0 flex-col shadow-sm">
        {/* Logo */}
        <div className="p-5 border-b border-[#E5E7EB] bg-[#0B0B0C]">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 rounded-full bg-[#D4A24C]" />
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight leading-none">
                {isAdmin ? APP_DISPLAY_NAMES.adminPortal : APP_DISPLAY_NAMES.full}
              </h1>
              <p className="text-[11px] font-semibold text-[#D4A24C]/70 mt-1 tracking-wider uppercase">
                {isAdmin ? 'Admin Portal' : 'Trading Platform'}
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {menuItems.map((item, i) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03, duration: 0.2 }}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm font-medium relative group ${
                  isActive
                    ? `bg-[#FAF5EB] text-[#9A6D1E] font-semibold border border-[#E8CC9A]`
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full ${accentBg}`}
                  />
                )}
                <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? accentText : 'text-slate-400 group-hover:text-slate-600'}`} />
                {item.label}
                {item.premium && (
                  <span className="ml-auto text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-bold">PRO</span>
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-[#E5E7EB]">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#FAF5EB] mb-1.5 border border-[#E8CC9A]">
            <div className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold text-[#111] flex-shrink-0 bg-[#D4A24C]">
              {(user.name || user.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{user.name || 'Trader'}</p>
              <p className="text-[11px] text-slate-400 truncate capitalize">{user.role} Account</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 text-slate-500 hover:text-red-600 text-sm px-3 py-2 transition rounded-xl hover:bg-red-50 group font-medium"
          >
            <LogOut className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* â”€â”€â”€ Main Content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <main
        className="flex-1 md:ml-64 overflow-y-auto w-full"
        style={{
          paddingTop: 'var(--header-height, 56px)',
          paddingBottom: 'calc(var(--nav-height, 64px) + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Desktop wrapper: centered + padded */}
        {/* Mobile: zero padding â€” children control their own px */}
        <div className="md:p-8 md:max-w-7xl md:mx-auto min-h-full">
          <div className="hidden md:block mb-6">
            <NavigationButtons onRefresh={handleRefresh} />
          </div>
          {children}
        </div>
      </main>

      {/* â”€â”€â”€ Mobile Bottom Navigation Bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Frosted glass background */}
        <div className="absolute inset-0 bg-white/97 backdrop-blur-2xl border-t border-[#E5E7EB]/80 shadow-[0_-2px_20px_rgba(0,0,0,0.06)]" />

        <nav className="relative flex items-stretch h-[60px]">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                aria-label={item.label}
                className="flex flex-col items-center justify-center flex-1 min-w-0 relative px-0.5 gap-0.5 min-h-[44px]"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {/* Active background pill */}
                {isActive && (
                  <motion.div
                    layoutId="bottomNavActive"
                    className={`absolute inset-x-1.5 top-1 bottom-1 rounded-2xl ${accentBgLight}`}
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  />
                )}

                {/* Icon */}
                <motion.div
                  className="relative z-10"
                  animate={{ scale: isActive ? 1.12 : 1, y: isActive ? -1 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                >
                  <Icon
                    strokeWidth={isActive ? 2.2 : 1.7}
                    className={`h-[22px] w-[22px] transition-colors duration-150 ${isActive ? accentText : 'text-slate-400'}`}
                  />
                </motion.div>

                {/* Label */}
                <span className={`relative z-10 text-[9.5px] font-semibold tracking-wide truncate w-full text-center px-0.5 transition-colors duration-150 ${isActive ? accentText : 'text-slate-400'}`}>
                  {item.label}
                </span>

                {/* Premium dot */}
                {item.premium && !isActive && (
                  <span className="absolute top-1.5 right-2.5 w-1.5 h-1.5 bg-amber-500 rounded-full" />
                )}
              </button>
            );
          })}

          {/* Logout button when 5 or fewer items */}
          {menuItems.length <= 5 && (
            <button
              onClick={onLogout}
              aria-label="Log Out"
              className="flex flex-col items-center justify-center flex-1 min-w-0 gap-0.5 px-0.5 min-h-[44px]"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <LogOut strokeWidth={1.7} className="h-[22px] w-[22px] text-slate-400" />
              <span className="text-[9.5px] font-semibold text-slate-400 tracking-wide">Logout</span>
            </button>
          )}
        </nav>
      </div>
    </div>
  );
};

export default Layout;
