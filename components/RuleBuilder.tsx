import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { TradeRule } from '../types';
import { 
  Plus, Trash2, Edit2, CheckCircle, ArrowDown, 
  Save, X, Zap, RefreshCw, Settings, PlayCircle, GripVertical, AlertCircle 
} from 'lucide-react';
import { fetchUserRules, createTradeRule, updateTradeRule, deleteTradeRule, reorderTradeRules } from '../services/adminService';
import { supabase } from '../supabase/client';

interface RuleBuilderProps {
  userId: string;
  rules: TradeRule[];
  onRulesChange: (rules: TradeRule[]) => void;
}

const RuleBuilderComponent: React.FC<RuleBuilderProps> = ({ userId, rules, onRulesChange }) => {
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editType, setEditType] = useState<'buy' | 'sell'>('buy');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Drag & Drop State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  // Simulation State
  const [testScenario, setTestScenario] = useState('');
  const [simulatedResult, setSimulatedResult] = useState<'approved' | 'rejected' | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Filter rules by active tab using useMemo for performance
  const activeRules = useMemo(() => {
    return rules
      .filter(r => r.type === activeTab)
      .sort((a, b) => (a.order_number || 0) - (b.order_number || 0));
  }, [rules, activeTab]);

  // Load rules function (now only called externally)
  const loadRules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const userRules = await fetchUserRules(userId);
      const formattedRules: TradeRule[] = (userRules || []).map((rule: any) => ({
        id: rule.id,
        text: rule.text || '',
        type: rule.type || 'buy',
        required: rule.required ?? true,
        order_number: rule.order_number || 0
      }));
      onRulesChange(formattedRules);
    } catch (err) {
      console.error('Error loading rules:', err);
      setError('Failed to load rules. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userId, onRulesChange]);

  // Setup realtime subscription only once on mount
  useEffect(() => {
    // Only setup realtime subscription if WebSocket connection is available
    let channel: any = null;
    
    try {
      channel = supabase
        .channel(`rule-changes-${userId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'trade_rules' }, () => {
          // Debounce the reload to prevent rapid successive calls
          const timeoutId = setTimeout(() => {
            loadRules();
          }, 300);
          
          // Cleanup timeout on unmount or when dependencies change
          return () => clearTimeout(timeoutId);
        })
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') {
            console.warn('Realtime channel error, falling back to manual refresh');
          }
        });
    } catch (error) {
      console.warn('Failed to setup realtime subscription, falling back to manual refresh:', error);
    }

    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (error) {
          console.warn('Error removing channel:', error);
        }
      }
    };
  }, [userId, loadRules]);

  // Edit handlers
  const handleStartEdit = (rule: TradeRule) => {
    setEditingId(rule.id);
    setEditText(rule.text);
    setEditType(rule.type);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editText.trim()) return;
    
    try {
      setSaving(true);
      await updateTradeRule(editingId, { 
        text: editText.trim(), 
        type: editType,
        updated_at: new Date().toISOString()
      });
      setEditingId(null);
      setEditText('');
      
      if (editType !== activeTab) {
        setActiveTab(editType);
      }
      
      await loadRules();
    } catch (err) {
      console.error('Error saving rule:', err);
      setError('Failed to save rule.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
    setEditType('buy');
  };

  const handleAddNew = async () => {
    try {
      setSaving(true);
      const maxOrder = activeRules.length > 0 
        ? Math.max(...activeRules.map(r => r.order_number || 0)) 
        : 0;
        
      await createTradeRule({
        text: 'New validation criteria...',
        type: activeTab,
        required: true,
        order_number: maxOrder + 1,
        created_by: userId
      });
      
      await loadRules();
    } catch (err) {
      console.error('Error adding rule:', err);
      setError('Failed to add rule.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ruleId: string) => {
    if (!window.confirm('Are you sure you want to delete this rule?')) return;
    
    try {
      setSaving(true);
      await deleteTradeRule(ruleId);
      await loadRules();
    } catch (err) {
      console.error('Error deleting rule:', err);
      setError('Failed to delete rule.');
    } finally {
      setSaving(false);
    }
  };

  const toggleRequired = async (rule: TradeRule) => {
    try {
      setSaving(true);
      await updateTradeRule(rule.id, { 
        required: !rule.required,
        updated_at: new Date().toISOString()
      });
      await loadRules();
    } catch (err) {
      console.error('Error updating rule:', err);
      setError('Failed to update rule.');
    } finally {
      setSaving(false);
    }
  };

  // Drag & Drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragEnter = (index: number) => {
    if (draggedIndex === null) return;
    setDragOverIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null || dragOverIndex === null || draggedIndex === dragOverIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newActiveRules = [...activeRules];
    const [draggedItem] = newActiveRules.splice(draggedIndex, 1);
    newActiveRules.splice(dragOverIndex, 0, draggedItem);

    try {
      setSaving(true);
      const ruleIds = newActiveRules.map(r => r.id);
      await reorderTradeRules(ruleIds);
      await loadRules();
    } catch (err) {
      console.error('Error reordering rules:', err);
      setError('Failed to reorder rules.');
    } finally {
      setSaving(false);
      setDraggedIndex(null);
      setDragOverIndex(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Simulation
  const runSimulation = () => {
    if (!testScenario.trim()) return;
    
    setIsSimulating(true);
    
    setTimeout(() => {
      const scenarioLower = testScenario.toLowerCase();
      const requiredRules = activeRules.filter(r => r.required);
      
      const allRequiredPassed = requiredRules.every(r => {
        const keywords = r.text.toLowerCase().split(' ').filter(w => w.length > 3);
        return keywords.some(k => scenarioLower.includes(k));
      });
      
      setSimulatedResult(allRequiredPassed ? 'approved' : 'rejected');
      setIsSimulating(false);
    }, 500);
  };

  const clearSimulation = () => {
    setSimulatedResult(null);
    setTestScenario('');
  };

  // Loading state
  if (loading) {
    return (
      <div className="text-white h-64 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-purple-500" />
          <p className="mt-2 text-gray-400">Loading rules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-white h-full flex flex-col pb-10">
      {/* Error Banner */}
      {error && (
        <div className="mb-4 p-4 bg-red-900/20 border border-red-500/30 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <Settings className="h-6 w-6 md:h-8 md:w-8 text-purple-500" /> 
            Protocol Logic Engine
          </h1>
          <p className="text-gray-400 mt-1 text-sm md:text-base">Design and prioritize the brain of your AI Trade Assistant.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center">
          <div className="flex bg-gray-800 p-1 rounded-lg border border-gray-700">
            <button 
              onClick={() => setActiveTab('buy')}
              className={`px-4 md:px-6 py-2 rounded-md text-sm font-bold transition ${
                activeTab === 'buy' 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Long (BUY)
            </button>
            <button 
              onClick={() => setActiveTab('sell')}
              className={`px-4 md:px-6 py-2 rounded-md text-sm font-bold transition ${
                activeTab === 'sell' 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Short (SELL)
            </button>
          </div>
          <button 
            onClick={loadRules}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg border border-gray-700 text-sm transition disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 flex-1">
        {/* Logic Flow Builder */}
        <div className="lg:col-span-2 bg-trade-dark border border-gray-700 rounded-2xl p-4 md:p-8 relative overflow-hidden flex flex-col">
          {/* Background Grid */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4b5563 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

          <div className="relative z-10 flex-1 flex flex-col items-center max-w-2xl mx-auto w-full">
            {/* Start Node */}
            <div className="mb-6 md:mb-8">
              <div className="bg-gray-800 border-2 border-gray-600 rounded-full px-4 md:px-8 py-2 md:py-3 font-bold text-gray-300 shadow-lg flex items-center gap-2 text-sm md:text-base">
                <PlayCircle className="h-4 w-4 md:h-5 md:w-5" /> Trade Signal Detected
              </div>
              <div className="h-6 md:h-8 w-0.5 bg-gray-600 mx-auto" />
              <ArrowDown className="h-4 w-4 text-gray-600 mx-auto -mt-1" />
            </div>

            {/* Rules List */}
            <div className="w-full space-y-3 md:space-y-4">
              {activeRules.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-base md:text-lg font-medium mb-2">No rules configured</p>
                  <p className="text-sm mb-4">Add your first rule to get started with validation logic.</p>
                  <button 
                    onClick={handleAddNew}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition disabled:opacity-50"
                  >
                    {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add First Rule
                  </button>
                </div>
              ) : (
                activeRules.map((rule, index) => (
                  <div 
                    key={rule.id} 
                    draggable={editingId !== rule.id}
                    onDragStart={() => handleDragStart(index)}
                    onDragEnter={() => handleDragEnter(index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    className={`relative group ${editingId !== rule.id ? 'cursor-move' : ''} ${
                      dragOverIndex === index ? 'opacity-50' : ''
                    }`}
                  >
                    {/* Connecting Line */}
                    {index !== activeRules.length - 1 && (
                      <div className="absolute left-1/2 top-full h-3 md:h-4 w-0.5 bg-gray-700 -ml-[1px] z-0" />
                    )}

                    <div className={`relative z-10 bg-gray-900 border rounded-xl p-3 md:p-4 shadow-xl transition-all duration-300 ${
                      rule.required 
                        ? 'border-l-4 border-l-red-500 border-y-gray-700 border-r-gray-700' 
                        : 'border-l-4 border-l-yellow-500 border-y-gray-700 border-r-gray-700'
                    } hover:shadow-2xl hover:border-gray-500`}>
                      
                      {editingId === rule.id ? (
                        <div className="flex flex-col gap-3" onClick={e => e.stopPropagation()}>
                          <input 
                            type="text" 
                            autoFocus
                            value={editText}
                            onChange={e => setEditText(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
                            className="w-full bg-black border border-gray-600 rounded px-3 py-2 outline-none focus:border-purple-500 text-sm md:text-base"
                            placeholder="Enter rule text..."
                          />
                          
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-33 border-t border-gray-800 pt-3">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-gray-500 text-xs font-bold uppercase">Type:</span>
                              <div className="flex gap-1 bg-gray-950 p-1 rounded border border-gray-800">
                                <button 
                                  onClick={() => setEditType('buy')}
                                  className={`px-3 py-1 rounded text-[10px] font-bold transition ${
                                    editType === 'buy' ? 'bg-green-500/20 text-green-400' : 'text-gray-500 hover:text-gray-300'
                                  }`}
                                >
                                  BUY
                                </button>
                                <button 
                                  onClick={() => setEditType('sell')}
                                  className={`px-3 py-1 rounded text-[10px] font-bold transition ${
                                    editType === 'sell' ? 'bg-red-500/20 text-red-400' : 'text-gray-500 hover:text-gray-300'
                                  }`}
                                >
                                  SELL
                                </button>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button onClick={handleCancelEdit} className="px-3 py-1.5 bg-gray-800 text-gray-400 rounded hover:text-white text-xs">
                                Cancel
                              </button>
                              <button 
                                onClick={handleSaveEdit} 
                                disabled={saving || !editText.trim()}
                                className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-xs font-bold"
                              >
                                {saving ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center gap-2">
                          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                            <div className="cursor-move text-gray-600 hover:text-gray-400 flex-shrink-0">
                              <GripVertical className="h-4 w-4 md:h-5 md:w-5" />
                            </div>
                            <div className="h-6 w-6 md:h-8 md:w-8 rounded-lg flex items-center justify-center bg-gray-800 font-mono text-xs text-gray-500 flex-shrink-0">
                              {index + 1}
                            </div>
                            <span className="font-medium text-gray-200 text-sm md:text-base truncate">{rule.text}</span>
                          </div>
                          
                          <div className="flex items-center gap-1 md:gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <button 
                              onClick={() => toggleRequired(rule)}
                              disabled={saving}
                              className={`text-[10px] md:text-xs font-bold px-1.5 md:px-2 py-1 rounded border whitespace-nowrap ${
                                rule.required 
                                  ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20' 
                                  : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/20'
                              }`}
                            >
                              {rule.required ? 'CRITICAL' : 'GUIDE'}
                            </button>
                            <button onClick={() => handleStartEdit(rule)} className="p-1 md:p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded">
                              <Edit2 className="h-3 w-3 md:h-4 md:w-4" />
                            </button>
                            <button onClick={() => handleDelete(rule.id)} disabled={saving} className="p-1 md:p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded disabled:opacity-50">
                              <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}

              {/* Add New Button */}
              <div className="flex justify-center pt-2">
                <button 
                  onClick={handleAddNew}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 border-dashed rounded-lg text-gray-400 hover:text-white transition disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add Logic Node
                </button>
              </div>
            </div>

            {/* Final Outcome Node */}
            <div className="mt-6 md:mt-8 text-center w-full">
              <ArrowDown className="h-5 w-5 md:h-6 md:w-6 text-gray-600 mx-auto mb-2" />
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="bg-green-900/20 border border-green-500/30 p-3 md:p-4 rounded-xl">
                  <div className="font-bold text-green-400 mb-1 text-sm md:text-base">PASSED</div>
                  <p className="text-[10px] md:text-xs text-gray-400">Trade Approved</p>
                </div>
                <div className="bg-red-900/20 border border-red-500/30 p-3 md:p-4 rounded-xl">
                  <div className="font-bold text-red-400 mb-1 text-sm md:text-base">FAILED</div>
                  <p className="text-[10px] md:text-xs text-gray-400">Trade Rejected</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Simulation Panel */}
        <div className="bg-trade-dark border border-gray-700 rounded-2xl p-4 md:p-6 flex flex-col">
          <h3 className="font-bold text-lg md:text-xl mb-3 md:mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-400" /> Simulation Lab
          </h3>
          <p className="text-xs md:text-sm text-gray-400 mb-4 md:mb-6">Test your rule logic against hypothetical scenarios.</p>

          <div className="flex-1 flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Mock Input</label>
              <textarea 
                className="w-full h-24 md:h-32 bg-black border border-gray-600 rounded-xl p-3 text-white text-sm outline-none focus:border-purple-500 resize-none"
                placeholder={`Describe a ${activeTab} setup scenario...`}
                value={testScenario}
                onChange={e => { setTestScenario(e.target.value); setSimulatedResult(null); }}
              />
            </div>
            
            <button 
              onClick={runSimulation}
              disabled={!testScenario.trim() || isSimulating || activeRules.length === 0}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 disabled:cursor-not-allowed text-white font-bold py-2.5 md:py-3 rounded-xl flex items-center justify-center gap-2 transition text-sm md:text-base"
            >
              {isSimulating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} 
              {isSimulating ? 'Testing...' : 'Run Test'}
            </button>

            {/* Simulation Results */}
            {simulatedResult && (
              <div className={`p-3 md:p-4 rounded-xl border animate-in fade-in slide-in-from-bottom-2 ${
                simulatedResult === 'approved' 
                  ? 'bg-green-500/10 border-green-500/30' 
                  : 'bg-red-500/10 border-red-500/30'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 md:gap-3">
                    {simulatedResult === 'approved' 
                      ? <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-green-500" />
                      : <X className="h-5 w-5 md:h-6 md:w-6 text-red-500" />
                    }
                    <span className={`font-bold text-sm md:text-lg ${
                      simulatedResult === 'approved' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {simulatedResult === 'approved' ? 'APPROVED' : 'BLOCKED'}
                    </span>
                  </div>
                  <button onClick={clearSimulation} className="text-gray-500 hover:text-gray-300">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-[10px] md:text-xs text-gray-400">
                  Based on keyword analysis of {activeTab.toUpperCase()} rules.
                </p>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="mt-6 md:mt-8 p-3 md:p-4 bg-gray-800/50 rounded-xl border border-gray-700">
            <h4 className="font-bold text-xs md:text-sm text-gray-300 mb-2">Stats</h4>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Active Rules:</span>
                <span className="text-white font-mono">{activeRules.length}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Critical:</span>
                <span className="text-red-400 font-mono">{activeRules.filter(r => r.required).length}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Guidelines:</span>
                <span className="text-yellow-400 font-mono">{activeRules.filter(r => !r.required).length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Create a properly typed component with React.memo
const RuleBuilder = React.memo(RuleBuilderComponent);

export default RuleBuilder;