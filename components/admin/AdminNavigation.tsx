import React from 'react';
import { useAdminPortal } from './AdminPortalContext';

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
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
      <div className="flex overflow-x-auto no-scrollbar gap-2 bg-gray-800/50 p-2 rounded-xl border border-gray-700/50 backdrop-blur-sm shadow-lg w-full lg:w-auto snap-x">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex-shrink-0 snap-start ${activeTab === tab.id
                  ? 'bg-trade-neon text-black shadow-md scale-105'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
            >
              <Icon className="h-4 w-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      <button
        onClick={refreshData}
        disabled={isRefreshing}
        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50"
      >
        {isRefreshing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
            Refreshing...
          </>
        ) : (
          'Refresh Data'
        )}
      </button>
    </div>
  );
};

export default AdminNavigation;