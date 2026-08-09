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

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent" />
        <p className="mt-3 text-slate-500 text-sm">Loading rules…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 flex items-center justify-center">
        <div className="text-center p-6 bg-red-50 border border-red-200 rounded-xl max-w-md">
          <p className="text-red-700 font-semibold text-base mb-2">Error Loading Rules</p>
          <p className="text-slate-600 text-sm mb-4">{error}</p>
          <button
            onClick={loadRules}
            className="btn btn-sm btn-danger"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0 animate-slide-up">
      <div className="page-header">
        <h2 className="section-title">Trading Rule Engine</h2>
        <p className="section-desc">Define and manage trading rules and risk parameter limits.</p>
      </div>
      <div className="page-section">
        <RuleBuilder
          userId={user.id}
          rules={tradeRules}
          onRulesChange={handleRulesChange}
        />
      </div>
      <div className="h-10" />
    </div>
  );
};

export default RulesTab;