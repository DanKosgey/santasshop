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
          className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 text-[#111111] hover:text-[#D4A24C] rounded-lg transition text-sm border border-gray-200 shadow-sm"
        >
          <ArrowLeft className="h-4 w-4 text-[#D4A24C]" />
          Back
        </button>
      )}
      
      {showRefresh && (
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 text-[#111111] hover:text-[#D4A24C] rounded-lg transition text-sm border border-gray-200 shadow-sm"
        >
          <RefreshCw className="h-4 w-4 text-[#D4A24C]" />
          Refresh
        </button>
      )}
    </div>
  );
};

export default NavigationButtons;