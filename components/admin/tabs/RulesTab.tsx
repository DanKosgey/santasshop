import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../../../types';
import RuleBuilder from '../../../components/RuleBuilder';
import { fetchUserRules } from '../../../services/adminService';

interface RulesTabProps {
  user: User;
}

const RulesTab: React.FC<RulesTabProps> = ({ user }) => {
  const [tradeRules, setTradeRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const loadRules = useCallback(async () => {
    try {
      setLoading(true);
      const rules = await fetchUserRules(user.id);
      setTradeRules(rules || []);
      setError(null);
    } catch (error) {
      console.error('Error loading rules:', error);
      setError('Failed to load rules. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user.id]);
  
  useEffect(() => {
    loadRules();
  }, [loadRules]);
  
  const handleRulesChange = (rules: any[]) => {
    setTradeRules(rules);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
          <p className="mt-2 text-gray-400">Loading rules...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center p-4 bg-red-900/20 border border-red-500/30 rounded-xl max-w-md">
          <div className="text-red-400 font-bold text-lg mb-2">Error Loading Rules</div>
          <p className="text-gray-300 mb-4">{error}</p>
          <button 
            onClick={loadRules}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <RuleBuilder 
        userId={user.id}
        rules={tradeRules} 
        onRulesChange={handleRulesChange} 
      />
    </div>
  );
};

export default RulesTab;