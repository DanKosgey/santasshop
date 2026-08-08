import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, GraduationCap, Cpu as Bot, BookOpen, Users, LogOut, Settings, ShieldAlert, Layers, PieChart as PieIcon, CheckSquare, X, Menu, Zap } from 'lucide-react';
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

  const handleRefresh = () => {
    window.location.reload();
  };

  // Strict separation of portals
  let menuItems: { id: string; label: string; icon: React.ElementType; premium?: boolean }[] = [];

  if (user.role === 'admin') {
    menuItems = [
      { id: 'overview', label: 'Command', icon: ShieldAlert },
      { id: 'directory', label: 'Directory', icon: Users },
      { id: 'trades', label: 'Trades', icon: Layers },
      { id: 'analytics', label: 'Analytics', icon: PieIcon },
      { id: 'content', label: 'Courses', icon: GraduationCap },
      { id: 'rules', label: 'Rules', icon: Settings },
      { id: 'bot-inquiries', label: 'Bot Inquiries', icon: Zap },
    ];
  } else {
    menuItems = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'courses', label: 'Courses', icon: GraduationCap },
      { id: 'journal', label: 'Journal', icon: BookOpen },
      { id: 'todos', label: 'Tasks', icon: CheckSquare },
      { id: 'community', label: 'Community', icon: Users },
    ];
  }

  // Bottom nav items (mobile) — max 5 for clean look
  const bottomNavItems = menuItems.slice(0, 5);

  const isAdmin = user.role === 'admin';
  const accentColor = isAdmin ? 'purple' : 'trade-neon';
  const accentClassBg = isAdmin ? 'bg-purple-500' : 'bg-trade-neon';
  const accentClassText = isAdmin ? 'text-purple-400' : 'text-trade-neon';
  const accentClassBorder = isAdmin ? 'border-purple-500/20' : 'border-trade-accent/20';
  const accentClassBgLight = isAdmin ? 'bg-purple-500/10' : 'bg-trade-accent/10';

  return (
    <div className="flex min-h-screen bg-trade-black relative">

      {/* ─── Mobile Top Header ─────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-trade-dark/95 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 z-50 shadow-lg">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-7 rounded-full ${accentClassBg}`} style={{ boxShadow: isAdmin ? '0 0 8px rgba(168,85,247,0.6)' : '0 0 8px rgba(0,255,148,0.6)' }} />
          <span className="text-white font-black text-lg tracking-tight">
            {APP_DISPLAY_NAMES.short}
            <span className={accentClassText}>{APP_DISPLAY_NAMES.full.split(' ')[1]}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* User avatar */}
          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${isAdmin ? 'bg-purple-600' : 'bg-gray-700'}`}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          {/* Overflow menu toggle (for items beyond bottom nav) */}
          {menuItems.length > 5 && (
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-400 hover:text-white transition rounded-lg hover:bg-gray-800"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}
        </div>
      </div>

      {/* ─── Mobile Overlay Menu (extra items) ──────────── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            {/* Slide-down menu with remaining items */}
            <motion.div
              key="menu"
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed top-14 right-2 z-50 bg-trade-dark border border-gray-700 rounded-2xl p-3 shadow-2xl min-w-[200px] md:hidden"
            >
              {menuItems.slice(5).map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm font-medium mb-1 last:mb-0 ${isActive
                      ? `${accentClassBgLight} ${accentClassText} border ${accentClassBorder}`
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {item.label}
                    {item.premium && (
                      <span className="ml-auto text-[10px] bg-gradient-to-r from-purple-500 to-pink-500 text-white px-1.5 py-0.5 rounded font-bold">
                        PRO
                      </span>
                    )}
                  </button>
                );
              })}
              <div className="border-t border-gray-700 mt-2 pt-2">
                <div className="flex items-center gap-2 px-4 py-2 mb-1">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${isAdmin ? 'bg-purple-600' : 'bg-gray-600'}`}>
                    {user.name.charAt(0)}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-medium text-white truncate">{user.name}</p>
                    <p className="text-[10px] text-gray-500 capitalize">{user.role}</p>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-2 text-gray-400 hover:text-red-400 text-sm px-4 py-2 transition rounded-lg hover:bg-red-500/10"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Desktop Sidebar ─────────────────────────────── */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-64 bg-trade-dark border-r border-gray-800/60 flex-shrink-0 flex-col shadow-2xl">
        {/* Logo */}
        <div className="p-5 border-b border-gray-800/60">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-8 rounded-full ${accentClassBg}`} style={{ boxShadow: isAdmin ? '0 0 10px rgba(168,85,247,0.5)' : '0 0 10px rgba(0,255,148,0.5)' }} />
            <div>
              <h1 className="text-lg font-black text-white tracking-tight leading-none">
                {isAdmin ? APP_DISPLAY_NAMES.adminPortal : APP_DISPLAY_NAMES.full}
              </h1>
              <p className="text-[10px] text-gray-500 mt-0.5 tracking-wider uppercase">{isAdmin ? 'Admin Portal' : 'Trading Platform'}</p>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item, i) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium relative group ${isActive
                  ? `${accentClassBgLight} ${accentClassText} border ${accentClassBorder}`
                  : 'text-gray-400 hover:bg-gray-800/60 hover:text-white'
                  }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full ${accentClassBg}`}
                  />
                )}
                <Icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
                {item.premium && (
                  <span className="ml-auto text-[10px] bg-gradient-to-r from-purple-500 to-pink-500 text-white px-1.5 py-0.5 rounded font-bold">
                    PRO
                  </span>
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-gray-800/60">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-800/40 mb-2">
            <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${isAdmin ? 'bg-gradient-to-br from-purple-600 to-purple-800' : 'bg-gradient-to-br from-gray-600 to-gray-800'}`}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <p className="text-[11px] text-gray-500 truncate capitalize">{user.role} Account</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 text-gray-500 hover:text-red-400 text-sm px-3 py-2 transition rounded-xl hover:bg-red-500/10 group"
          >
            <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─────────────────────────────────── */}
      <main className="flex-1 md:ml-64 overflow-y-auto min-h-screen pt-14 md:pt-0 pb-24 md:pb-0 w-full">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <NavigationButtons onRefresh={handleRefresh} />
          {children}
        </div>
      </main>

      {/* ─── Mobile Bottom Navigation Bar ────────────────── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        {/* Glassmorphism background */}
        <div className="absolute inset-0 bg-trade-dark/90 backdrop-blur-xl border-t border-white/5" />
        {/* Safe area gradient fade */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

        <nav className="relative flex items-center justify-around px-2 pt-2 pb-safe" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 px-1 min-w-0 relative"
              >
                {/* Active background pill */}
                {isActive && (
                  <motion.div
                    layoutId="bottomNavPill"
                    className={`absolute inset-x-1 top-0.5 bottom-0.5 rounded-2xl ${accentClassBgLight}`}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}

                {/* Icon with glow when active */}
                <motion.div
                  className="relative z-10"
                  animate={{ scale: isActive ? 1.15 : 1 }}
                  transition={{ type: 'spring', stiffness: 600, damping: 30 }}
                >
                  <Icon
                    className={`h-5 w-5 transition-colors duration-200 ${isActive ? accentClassText : 'text-gray-500'
                      }`}
                  />
                  {/* Glow effect */}
                  {isActive && (
                    <div
                      className={`absolute inset-0 blur-md opacity-50 ${accentClassText}`}
                      style={{ filter: 'blur(4px)' }}
                    />
                  )}
                </motion.div>

                <span
                  className={`relative z-10 text-[10px] font-semibold leading-none transition-colors duration-200 ${isActive ? accentClassText : 'text-gray-600'
                    }`}
                >
                  {item.label}
                </span>

                {/* PRO badge */}
                {item.premium && !isActive && (
                  <span className="absolute top-0.5 right-1.5 w-1.5 h-1.5 bg-purple-500 rounded-full" />
                )}
              </button>
            );
          })}

          {/* Logout button at end on mobile if no overflow menu */}
          {menuItems.length <= 5 && (
            <button
              onClick={onLogout}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 px-1 min-w-0"
            >
              <LogOut className="h-5 w-5 text-gray-500" />
              <span className="text-[10px] font-semibold text-gray-600">Logout</span>
            </button>
          )}
        </nav>
      </div>
    </div>
  );
};

export default Layout;