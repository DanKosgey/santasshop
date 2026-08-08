import React from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';

interface NavigationButtonsProps {
  onBack?: () => void;
  onRefresh?: () => void;
  showBack?: boolean;
  showRefresh?: boolean;
}

const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  onBack,
  onRefresh,
  showBack = true,
  showRefresh = true
}) => {
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="flex gap-2 mb-4">
      {showBack && onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition text-sm border border-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      )}
      
      {showRefresh && (
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition text-sm border border-gray-700"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      )}
    </div>
  );
};

export default NavigationButtons;