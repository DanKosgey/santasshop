import React, { useState, useEffect } from 'react';
import { User, CourseModule } from '../../types';
import {
  LayoutDashboard, Users, Layers, PieChart as PieIcon,
  BookOpen, Zap, DollarSign, CreditCard, BarChart3, ShieldAlert, UserCog
} from 'lucide-react';
import { useAdminPortal } from './AdminPortalContext';
import AdminHeader from './AdminHeader';
import AdminNavigation from './AdminNavigation';
import OverviewTab from './tabs/OverviewTab';
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

const AdminPortal: React.FC<AdminPortalProps> = ({ courses, initialTab = 'overview', user }) => {
  const { activeTab, setActiveTab } = useAdminPortal();

  // Set initial tab from prop only if not already set by provider (e.g. from localStorage)
  useEffect(() => {
    if (initialTab && isValidTab(initialTab) && activeTab === 'overview') {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Update URL search param when tab changes, but don't force it back on every render
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('tab') !== activeTab) {
      url.searchParams.set('tab', activeTab);
      window.history.replaceState({}, '', url);
    }
  }, [activeTab]);

  const isValidTab = (tab: string): tab is typeof activeTab => {
    return [
      'overview', 'directory', 'trades', 'analytics',
      'content', 'rules', 'journal', 'admin-analytics', 'settings', 'student-management', 'bot-inquiries'
    ].includes(tab);
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'directory':
        return <DirectoryTab />;
      case 'student-management':
        return <StudentManagementTab />;
      case 'trades':
        return <TradesTab />;
      case 'analytics':
        return <AnalyticsTab />;
      // Applications tab removed
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
        return <OverviewTab />;
    }
  };

  const tabs = [
    { id: 'overview', label: 'Command Center', icon: LayoutDashboard },
    { id: 'directory', label: 'Directory', icon: Users },
    { id: 'student-management', label: 'Student Mgmt', icon: UserCog },
    { id: 'trades', label: 'Trade Analysis', icon: Layers },
    { id: 'analytics', label: 'Analytics', icon: PieIcon },
    { id: 'content', label: 'Content Mgmt', icon: BookOpen },
    { id: 'rules', label: 'Rule Engine', icon: Zap },
    { id: 'journal', label: 'My Trades', icon: DollarSign },
    { id: 'admin-analytics', label: 'Admin Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: CreditCard },
    { id: 'bot-inquiries', label: 'Bot Inquiries', icon: Zap },
  ];

  return (
    <div className="space-y-8 text-white min-h-screen bg-gradient-to-br from-gray-900 to-black p-6 md:p-8">
      <AdminHeader />
      <AdminNavigation tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="animate-slide-up">
        {renderActiveTab()}
      </div>
    </div>
  );
};

export default AdminPortal;