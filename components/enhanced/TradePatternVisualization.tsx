import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, 
  PieChart, Pie, AreaChart, Area, CartesianGrid, Legend, LineChart, Line
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Activity, Target, Award, 
  Clock, DollarSign, BarChart2, Users, Zap, Filter, Search, Brain, AlertTriangle
} from 'lucide-react';
import { identifyTradingPatterns, generatePatternVisualizationData } from '../../services/patternRecognitionService';

interface TradePatternVisualizationProps {
  trades: any[];
  userId?: string;
}

interface Pattern {
  type: string;
  description: string;
  severity: 'High' | 'Medium' | 'Low' | 'Positive';
  recommendation: string;
  tradeIndex?: number;
  date?: string;
}

const TradePatternVisualization: React.FC<TradePatternVisualizationProps> = ({ trades, userId }) => {
  const [loading, setLoading] = useState(true);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [statistics, setStatistics] = useState<any>({});
  const [visualizationData, setVisualizationData] = useState<any>({});
  const [activeTab, setActiveTab] = useState<'patterns' | 'performance' | 'analytics'>('patterns');

  useEffect(() => {
    const analyzePatterns = async () => {
      try {
        setLoading(true);
        
        // Identify trading patterns
        const patternAnalysis = identifyTradingPatterns(trades);
        setPatterns(patternAnalysis.patterns);
        setStatistics(patternAnalysis.statistics);
        
        // Generate visualization data
        const vizData = generatePatternVisualizationData(trades);
        setVisualizationData(vizData);
      } catch (error) {
        console.error('Error analyzing trade patterns:', error);
      } finally {
        setLoading(false);
      }
    };

    if (trades && trades.length > 0) {
      analyzePatterns();
    } else {
      setLoading(false);
    }
  }, [trades]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-trade-neon"></div>
      </div>
    );
  }

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High': return 'bg-red-900/30 border-red-500/30 text-red-400';
      case 'Medium': return 'bg-yellow-900/30 border-yellow-500/30 text-yellow-400';
      case 'Low': return 'bg-blue-900/30 border-blue-500/30 text-blue-400';
      case 'Positive': return 'bg-green-900/30 border-green-500/30 text-green-400';
      default: return 'bg-gray-900/30 border-gray-500/30 text-gray-400';
    }
  };

  // Get severity icon
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'High': return <AlertTriangle className="h-5 w-5 text-red-400" />;
      case 'Medium': return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      case 'Low': return <AlertTriangle className="h-5 w-5 text-blue-400" />;
      case 'Positive': return <Award className="h-5 w-5 text-green-400" />;
      default: return <Activity className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6 text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <Brain className="h-6 w-6 md:h-8 md:w-8 text-trade-neon" /> 
            Trade Pattern Analysis
          </h1>
          <p className="text-gray-400 mt-1 text-sm md:text-base">
            Advanced analytics and pattern recognition for your trading performance
          </p>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2 bg-gray-900/50 p-1 rounded-lg border border-gray-700">
          <button 
            onClick={() => setActiveTab('patterns')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              activeTab === 'patterns' 
                ? 'bg-gray-700 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Patterns
          </button>
          <button 
            onClick={() => setActiveTab('performance')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              activeTab === 'performance' 
                ? 'bg-gray-700 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Performance
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              activeTab === 'analytics' 
                ? 'bg-gray-700 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Analytics
          </button>
        </div>
      </div>

      {/* Patterns Tab */}
      {activeTab === 'patterns' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Activity className="h-5 w-5 text-trade-neon" /> 
            Identified Patterns
          </h2>
          
          {patterns.length === 0 ? (
            <div className="bg-trade-dark rounded-xl border border-gray-700 p-8 text-center">
              <Activity className="h-12 w-12 mx-auto text-gray-600 mb-4" />
              <h3 className="text-lg font-bold text-gray-400">No Patterns Identified</h3>
              <p className="text-gray-500 mt-2">We couldn't identify any significant patterns in your trading data.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {patterns.map((pattern, index) => (
                <div 
                  key={index} 
                  className={`p-5 rounded-xl border ${getSeverityColor(pattern.severity)}`}
                >
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(pattern.severity)}
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg">{pattern.type}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          pattern.severity === 'High' ? 'bg-red-500/20 text-red-400' :
                          pattern.severity === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          pattern.severity === 'Low' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {pattern.severity}
                        </span>
                      </div>
                      <p className="mt-2 text-gray-300">{pattern.description}</p>
                      <div className="mt-3 p-3 bg-black/20 rounded-lg">
                        <p className="text-sm text-gray-400">Recommendation:</p>
                        <p className="text-sm mt-1">{pattern.recommendation}</p>
                      </div>
                      {pattern.tradeIndex !== undefined && (
                        <p className="text-xs text-gray-500 mt-2">Trade #{pattern.tradeIndex + 1}</p>
                      )}
                      {pattern.date && (
                        <p className="text-xs text-gray-500 mt-1">Date: {new Date(pattern.date).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-trade-neon" /> 
            Performance Metrics
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-trade-dark p-4 rounded-xl border border-gray-700">
              <div className="flex items-center gap-2 text-gray-400 mb-2 text-sm">
                <Target className="h-4 w-4" /> Win Rate
              </div>
              <div className={`text-2xl font-bold ${statistics.winRate >= 0.5 ? 'text-green-400' : 'text-red-400'}`}>
                {(statistics.winRate * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-trade-dark p-4 rounded-xl border border-gray-700">
              <div className="flex items-center gap-2 text-gray-400 mb-2 text-sm">
                <TrendingUp className="h-4 w-4" /> Avg Win
              </div>
              <div className="text-2xl font-bold text-green-400">${statistics.avgWin?.toFixed(2) || '0.00'}</div>
            </div>
            <div className="bg-trade-dark p-4 rounded-xl border border-gray-700">
              <div className="flex items-center gap-2 text-gray-400 mb-2 text-sm">
                <TrendingDown className="h-4 w-4" /> Avg Loss
              </div>
              <div className="text-2xl font-bold text-red-400">${statistics.avgLoss?.toFixed(2) || '0.00'}</div>
            </div>
            <div className="bg-trade-dark p-4 rounded-xl border border-gray-700">
              <div className="flex items-center gap-2 text-gray-400 mb-2 text-sm">
                <DollarSign className="h-4 w-4" /> Profit Factor
              </div>
              <div className="text-2xl font-bold text-white">{statistics.profitFactor?.toFixed(2) || '0.00'}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Equity Curve */}
            <div className="bg-trade-dark p-6 rounded-xl border border-gray-700">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-trade-neon" /> Equity Curve
              </h3>
              <div className="h-64">
                {visualizationData.equityCurve && visualizationData.equityCurve.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={visualizationData.equityCurve}>
                      <defs>
                        <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00ff94" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#00ff94" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="index" 
                        stroke="#64748b" 
                        tickFormatter={(value) => `#${value}`}
                      />
                      <YAxis stroke="#64748b" />
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                      <Tooltip 
                        contentStyle={{backgroundColor:'#0f172a',border:'1px solid #334155',borderRadius:'8px'}} 
                        formatter={(value) => [`$${value}`, 'Equity']}
                        labelFormatter={(value) => `Trade #${value}`}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="equity" 
                        stroke="#00ff94" 
                        fillOpacity={1} 
                        fill="url(#colorEquity)" 
                        name="Equity"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Not enough data to display equity curve
                  </div>
                )}
              </div>
            </div>
            
            {/* Drawdown Curve */}
            <div className="bg-trade-dark p-6 rounded-xl border border-gray-700">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-trade-neon" /> Drawdown Curve
              </h3>
              <div className="h-64">
                {visualizationData.drawdownCurve && visualizationData.drawdownCurve.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={visualizationData.drawdownCurve}>
                      <defs>
                        <linearGradient id="colorDrawdown" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="index" 
                        stroke="#64748b" 
                        tickFormatter={(value) => `#${value}`}
                      />
                      <YAxis 
                        stroke="#64748b" 
                        tickFormatter={(value) => `${value}%`}
                      />
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                      <Tooltip 
                        contentStyle={{backgroundColor:'#0f172a',border:'1px solid #334155',borderRadius:'8px'}} 
                        formatter={(value) => [`${value}%`, 'Drawdown']}
                        labelFormatter={(value) => `Trade #${value}`}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="drawdown" 
                        stroke="#ef4444" 
                        fillOpacity={1} 
                        fill="url(#colorDrawdown)" 
                        name="Drawdown"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Not enough data to display drawdown curve
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-trade-neon" /> 
            Detailed Analytics
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Win/Loss Distribution */}
            <div className="bg-trade-dark p-6 rounded-xl border border-gray-700">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-trade-neon" /> Win/Loss Distribution
              </h3>
              <div className="h-64">
                {visualizationData.winLossDistribution && visualizationData.winLossDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={visualizationData.winLossDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="name"
                      >
                        {visualizationData.winLossDistribution.map((entry: any, index: number) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={
                              entry.name === 'Wins' ? '#10b981' : 
                              entry.name === 'Losses' ? '#ef4444' : 
                              '#64748b'
                            } 
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{backgroundColor:'#0f172a',border:'1px solid #334155',borderRadius:'8px'}} 
                        formatter={(value) => [value, 'Trades']}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Not enough data to display distribution
                  </div>
                )}
              </div>
            </div>
            
            {/* Pair Performance */}
            <div className="bg-trade-dark p-6 rounded-xl border border-gray-700">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-trade-neon" /> Pair Performance
              </h3>
              <div className="h-64">
                {visualizationData.pairPerformance && visualizationData.pairPerformance.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={visualizationData.pairPerformance}>
                      <XAxis dataKey="pair" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                      <Tooltip 
                        contentStyle={{backgroundColor:'#0f172a',border:'1px solid #334155',borderRadius:'8px'}} 
                        formatter={(value, name) => {
                          if (name === 'winRate') return [`${value}%`, 'Win Rate'];
                          if (name === 'totalPnL') return [`$${value}`, 'P&L'];
                          return [value, name];
                        }}
                      />
                      <Bar dataKey="winRate" name="Win Rate" fill="#00ff94" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Not enough data to display pair performance
                  </div>
                )}
              </div>
            </div>
            
            {/* Strategy Performance */}
            <div className="bg-trade-dark p-6 rounded-xl border border-gray-700">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-trade-neon" /> Strategy Performance
              </h3>
              <div className="h-64">
                {visualizationData.strategyPerformance && visualizationData.strategyPerformance.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={visualizationData.strategyPerformance}>
                      <XAxis dataKey="strategy" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                      <Tooltip 
                        contentStyle={{backgroundColor:'#0f172a',border:'1px solid #334155',borderRadius:'8px'}} 
                        formatter={(value, name) => {
                          if (name === 'winRate') return [`${value}%`, 'Win Rate'];
                          if (name === 'totalPnL') return [`$${value}`, 'P&L'];
                          return [value, name];
                        }}
                      />
                      <Bar dataKey="winRate" name="Win Rate" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Not enough data to display strategy performance
                  </div>
                )}
              </div>
            </div>
            
            {/* Additional Stats */}
            <div className="bg-trade-dark p-6 rounded-xl border border-gray-700">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-trade-neon" /> Additional Insights
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
                  <span className="text-gray-400">Most Traded Pair</span>
                  <span className="font-bold text-white">{statistics.mostTradedPair || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
                  <span className="text-gray-400">Most Used Strategy</span>
                  <span className="font-bold text-white">{statistics.mostUsedStrategy || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
                  <span className="text-gray-400">Best Time of Day</span>
                  <span className="font-bold text-white">{statistics.bestTimeOfDay || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
                  <span className="text-gray-400">Best Day of Week</span>
                  <span className="font-bold text-white">{statistics.bestDayOfWeek || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
                  <span className="text-gray-400">Max Consecutive Wins</span>
                  <span className="font-bold text-green-400">{statistics.maxConsecutiveWins || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
                  <span className="text-gray-400">Max Consecutive Losses</span>
                  <span className="font-bold text-red-400">{statistics.maxConsecutiveLosses || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradePatternVisualization;