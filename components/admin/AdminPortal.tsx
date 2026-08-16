import React, { useEffect } from 'react';
import { User, CourseModule } from '../../types';
import {
  Users, Layers, PieChart as PieIcon,
  BookOpen, Zap, DollarSign, Settings, BarChart3, UserCog, Sliders
} from 'lucide-react';
import { useAdminPortal } from './AdminPortalContext';
import AdminHeader from './AdminHeader';
import AdminNavigation from './AdminNavigation';
import DirectoryTab from './tabs/DirectoryTab';
import StudentManagementTab from './tabs/StudentManagementTab';
import TradesTab from './tabs/TradesTab';
import AnalyticsTab from './tabs/AnalyticsTab';
import ContentTab from './tabs/ContentTab';
import RulesTab from './tabs/RulesTab';
import JournalTab from './tabs/JournalTab';
import AdminAnalyticsTab from './tabs/AdminAnalyticsTab';
import SettingsTab from './tabs/SettingsTab';
import BotInquiriesTab from './tabs/BotInquiriesTab';

interface AdminPortalProps {
  courses: CourseModule[];
  initialTab?: string;
  user: User;
}

const VALID_TABS = [
  'directory', 'trades', 'analytics',
  'content', 'rules', 'journal', 'admin-analytics', 'settings', 'student-management', 'bot-inquiries'
];

const isValidTab = (tab: string) => VALID_TABS.includes(tab);

const AdminPortal: React.FC<AdminPortalProps> = ({ courses, initialTab = 'directory', user }) => {
  const { activeTab, setActiveTab } = useAdminPortal();

  // If initialTab is overview or invalid, fall back to directory
  const defaultTab = (initialTab && initialTab !== 'overview' && isValidTab(initialTab)) ? initialTab : 'directory';

  useEffect(() => {
    if (activeTab === 'overview' || !isValidTab(activeTab)) {
      setActiveTab(defaultTab);
    } else if (initialTab && initialTab !== 'overview' && isValidTab(initialTab) && activeTab !== initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get('page') !== activeTab || url.searchParams.get('tab') !== activeTab) {
        url.searchParams.set('page', activeTab);
        url.searchParams.set('tab', activeTab);
        window.history.replaceState({}, '', url.toString());
      }
      localStorage.setItem('forex_elites_active_view', activeTab);
      localStorage.setItem('adminPortalActiveTab', activeTab);
    } catch (e) {
      console.error('Error updating URL in AdminPortal:', e);
    }
  }, [activeTab]);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'directory':
        return <DirectoryTab />;
      case 'student-management':
        return <StudentManagementTab />;
      case 'trades':
        return <TradesTab />;
      case 'analytics':
        return <AnalyticsTab />;
      case 'content':
        return <ContentTab user={user} courses={courses} />;
      case 'rules':
        return <RulesTab user={user} />;
      case 'journal':
        return <JournalTab user={user} />;
      case 'admin-analytics':
        return <AdminAnalyticsTab />;
      case 'settings':
        return <SettingsTab />;
      case 'bot-inquiries':
        return <BotInquiriesTab />;
      default:
        return <DirectoryTab />;
    }
  };

  const tabs = [
    { id: 'directory', label: 'Directory', icon: Users },
    { id: 'student-management', label: 'Student Mgmt', icon: UserCog },
    { id: 'trades', label: 'Trade Analysis', icon: Layers },
    { id: 'analytics', label: 'Analytics', icon: PieIcon },
    { id: 'content', label: 'Content Mgmt', icon: BookOpen },
    { id: 'rules', label: 'Rule Engine', icon: Sliders },
    { id: 'journal', label: 'My Trades', icon: DollarSign },
    { id: 'admin-analytics', label: 'Admin Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'bot-inquiries', label: 'Bot Inquiries', icon: Zap },
  ];

  return (
    <div className="admin-portal font-sans text-slate-700 pb-6">
      {/* ── Sub-header: title + nav tab bar ─────────────── */}
      <div className="bg-white border-b border-slate-200 shadow-xs">
        {/* Title row */}
        <div className="px-4 pt-3 pb-1 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1.5 bg-purple-50 rounded-lg shrink-0">
              <Users className="h-4 w-4 text-purple-600" />
            </span>
            <div className="min-w-0">
              <h1 className="text-base md:text-xl font-bold text-slate-900 tracking-tight leading-tight">Admin Portal</h1>
              <p className="text-slate-400 text-[10px] md:text-xs font-normal hidden sm:block">Manage students, trades & platform</p>
            </div>
          </div>
          <AdminNavigation tabs={tabs} activeTab={activeTab === 'overview' ? 'directory' : activeTab} onTabChange={setActiveTab} />
        </div>
      </div>

      {/* ── Tab Content ─────────────────────────────────── */}
      <div className="px-4 pt-4 md:px-6 md:pt-6 animate-slide-up">
        {renderActiveTab()}
      </div>
    </div>
  );
};

export default AdminPortal;