import React from 'react';
import { useAdminPortal } from './AdminPortalContext';
import { RefreshCw } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
}

interface AdminNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const AdminNavigation: React.FC<AdminNavigationProps> = ({ tabs, activeTab, onTabChange }) => {
  const { isRefreshing, refreshData } = useAdminPortal();

  return (
    <div className="flex items-center gap-2 w-full overflow-hidden">
      {/* Scrollable icon tab bar */}
      <div className="flex-1 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1 py-1.5">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                title={tab.label}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition shrink-0 ${
                  isActive
                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Refresh */}
      <button
        onClick={refreshData}
        disabled={isRefreshing}
        title="Refresh data"
        className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        <span className="hidden sm:inline">{isRefreshing ? 'Refreshing…' : 'Refresh'}</span>
      </button>
    </div>
  );
};

export default AdminNavigation;