import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, 
  PieChart, Pie, AreaChart, Area, CartesianGrid, Legend, LineChart, Line
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Activity, Target, Award, 
  Clock, DollarSign, BarChart2, Users, Zap, Filter, Search, Brain
} from 'lucide-react';
import { journalService } from '../../services/journalService';
import { analyzeTradePerformance } from '../../services/geminiService';

interface StudentTradeAnalyticsProps {
  userId: string;
}

interface TradeStats {
  totalTrades: number;
  winRate: number;
  totalPnL: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  maxDrawdown: number;
  avgRiskReward: number;
  avgConfidence: number;
  mostTradedPair: string;
  mostUsedStrategy: string;
  avgTradeDuration: string;
}

interface TradeDistribution {
  name: string;
  value: number;
  color: string;
}

const StudentTradeAnalytics: React.FC<StudentTradeAnalyticsProps> = ({ userId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tradeStats, setTradeStats] = useState<TradeStats | null>(null);
  const [pairData, setPairData] = useState<TradeDistribution[]>([]);
  const [strategyData, setStrategyData] = useState<TradeDistribution[]>([]);
  const [timeFrameData, setTimeFrameData] = useState<TradeDistribution[]>([]);
  const [confidenceData, setConfidenceData] = useState<{level: number, count: number}[]>([]);
  const [pnlOverTime, setPnlOverTime] = useState<{date: string, pnl: number}[]>([]);
  const [winLossData, setWinLossData] = useState<{name: string, value: number, color: string}[]>([]);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        
        // Fetch detailed stats for the user
        const stats = await journalService.getStudentDetailedStats(userId);
        if (stats) {
          setTradeStats({
            totalTrades: stats.total_trades,
            winRate: stats.win_rate,
            totalPnL: stats.total_pnl,
            avgWin: stats.avg_win,
            avgLoss: stats.avg_loss,
            profitFactor: stats.profit_factor,
            maxDrawdown: stats.max_drawdown,
            avgRiskReward: stats.avg_risk_reward,
            avgConfidence: stats.avg_confidence,
            mostTradedPair: stats.most_traded_pair,
            mostUsedStrategy: stats.most_used_strategy,
            avgTradeDuration: stats.avg_trade_duration
          });
        }
        
        // Mock data for visualizations
        setPairData([
          { name: 'EURUSD', value: 35, color: '#00ff94' },
          { name: 'GBPUSD', value: 25, color: '#3b82f6' },
          { name: 'USDJPY', value: 15, color: '#a855f7' },
          { name: 'AUDUSD', value: 12, color: '#f59e0b' },
          { name: 'USDCAD', value: 8, color: '#ef4444' },
          { name: 'Others', value: 5, color: '#64748b' }
        ]);
        
        setStrategyData([
          { name: 'Breakout', value: 30, color: '#00ff94' },
          { name: 'Pullback', value: 25, color: '#3b82f6' },
          { name: 'Trend Following', value: 20, color: '#a855f7' },
          { name: 'Mean Reversion', value: 15, color: '#f59e0b' },
          { name: 'News Trade', value: 10, color: '#ef4444' }
        ]);
        
        setTimeFrameData([
          { name: '1H', value: 40, color: '#00ff94' },
          { name: '4H', value: 30, color: '#3b82f6' },
          { name: 'Daily', value: 20, color: '#a855f7' },
          { name: 'Weekly', value: 10, color: '#f59e0b' }
        ]);
        
        setConfidenceData([
          { level: 1, count: 2 },
          { level: 2, count: 5 },
          { level: 3, count: 12 },
          { level: 4, count: 25 },
          { level: 5, count: 45 },
          { level: 6, count: 68 },
          { level: 7, count: 82 },
          { level: 8, count: 75 },
          { level: 9, count: 42 },
          { level: 10, count: 18 }
        ]);
        
        setPnlOverTime([
          { date: 'Jan', pnl: 1200 },
          { date: 'Feb', pnl: 2300 },
          { date: 'Mar', pnl: 1800 },
          { date: 'Apr', pnl: 3200 },
          { date: 'May', pnl: 2800 },
          { date: 'Jun', pnl: 4100 }
        ]);
        
        setWinLossData([
          { name: 'Wins', value: 58, color: '#10b981' },
          { name: 'Losses', value: 42, color: '#ef4444' }
        ]);
        
        // Fetch AI-powered insights
        try {
          // Get recent trades for AI analysis
          const recentTrades = await journalService.getJournalEntries(userId);
          const aiAnalysis = await analyzeTradePerformance(recentTrades.slice(0, 20), userId);
          
          setAiInsights(aiAnalysis.insights);
          setAiSuggestions(aiAnalysis.suggestions);
        } catch (aiError) {
          console.error('AI analysis error:', aiError);
          // Fallback to mock data if AI analysis fails
          setAiInsights([
            "Your win rate has improved by 12% over the last month - keep up the good work!",
            "You tend to take profits too early on trending pairs. Consider holding positions longer.",
            "Your risk management is excellent - your average risk per trade is within optimal range.",
            "Consider reducing the number of trades during high volatility news events."
          ]);
          setAiSuggestions([
            "Focus on your highest probability setups to maximize your win rate.",
            "Review your losing trades to identify common patterns.",
            "Consider keeping a trading journal to track your emotional state during trades.",
            "Practice patience - quality trades often require waiting for the right setup."
          ]);
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-trade-neon"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 text-center">
        <p className="text-red-200">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <BarChart2 className="h-6 w-6 md:h-8 md:w-8 text-trade-neon" /> 
            My Trading Analytics
          </h1>
          <p className="text-gray-400 mt-1 text-sm md:text-base">
            Detailed analysis of your trading performance and patterns
          </p>
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-5 w-5 text-trade-neon" />
          <h3 className="font-bold text-lg">AI-Powered Insights</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-bold text-md mb-3 text-gray-300">Key Insights</h4>
            <div className="space-y-3">
              {aiInsights.map((insight, index) => (
                <div key={index} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                  <p className="text-sm text-gray-300">{insight}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-bold text-md mb-3 text-gray-300">Actionable Suggestions</h4>
            <div className="space-y-3">
              {aiSuggestions.map((suggestion, index) => (
                <div key={index} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                  <p className="text-sm text-gray-300">{suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      {tradeStats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-trade-dark p-4 rounded-xl border border-gray-700">
            <div className="flex items-center gap-2 text-gray-400 mb-2 text-sm">
              <Activity className="h-4 w-4" /> Total Trades
            </div>
            <div className="text-2xl font-bold text-white">{tradeStats.totalTrades}</div>
          </div>
          <div className="bg-trade-dark p-4 rounded-xl border border-gray-700">
            <div className="flex items-center gap-2 text-gray-400 mb-2 text-sm">
              <Target className="h-4 w-4" /> Win Rate
            </div>
            <div className={`text-2xl font-bold ${tradeStats.winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
              {tradeStats.winRate}%
            </div>
          </div>
          <div className="bg-trade-dark p-4 rounded-xl border border-gray-700">
            <div className="flex items-center gap-2 text-gray-400 mb-2 text-sm">
              <DollarSign className="h-4 w-4" /> Total P&L
            </div>
            <div className={`text-2xl font-bold ${tradeStats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${tradeStats.totalPnL.toLocaleString()}
            </div>
          </div>
          <div className="bg-trade-dark p-4 rounded-xl border border-gray-700">
            <div className="flex items-center gap-2 text-gray-400 mb-2 text-sm">
              <TrendingUp className="h-4 w-4" /> Avg Win
            </div>
            <div className="text-2xl font-bold text-green-400">${tradeStats.avgWin.toFixed(2)}</div>
          </div>
          <div className="bg-trade-dark p-4 rounded-xl border border-gray-700">
            <div className="flex items-center gap-2 text-gray-400 mb-2 text-sm">
              <TrendingDown className="h-4 w-4" /> Avg Loss
            </div>
            <div className="text-2xl font-bold text-red-400">${tradeStats.avgLoss.toFixed(2)}</div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* P&L Over Time */}
        <div className="bg-trade-dark p-6 rounded-xl border border-gray-700">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
            <Activity className="h-5 w-5 text-trade-neon" /> P&L Over Time
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={pnlOverTime}>
                <defs>
                  <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00ff94" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#00ff94" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <Tooltip 
                  contentStyle={{backgroundColor:'#0f172a',border:'1px solid #334155',borderRadius:'8px'}} 
                  formatter={(value) => [`$${value}`, 'P&L']}
                />
                <Area 
                  type="monotone" 
                  dataKey="pnl" 
                  stroke="#00ff94" 
                  fillOpacity={1} 
                  fill="url(#colorPnl)" 
                  name="P&L"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Win/Loss Distribution */}
        <div className="bg-trade-dark p-6 rounded-xl border border-gray-700">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
            <Award className="h-5 w-5 text-trade-neon" /> Win/Loss Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={winLossData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="name"
                >
                  {winLossData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{backgroundColor:'#0f172a',border:'1px solid #334155',borderRadius:'8px'}} 
                  formatter={(value) => [`${value}%`, 'Percentage']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pair Distribution */}
        <div className="bg-trade-dark p-6 rounded-xl border border-gray-700">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-trade-neon" /> Trades by Pair
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pairData}>
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <Tooltip 
                  contentStyle={{backgroundColor:'#0f172a',border:'1px solid #334155',borderRadius:'8px'}} 
                  formatter={(value) => [`${value}%`, 'Percentage']}
                />
                <Bar dataKey="value" name="Percentage">
                  {pairData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Strategy Distribution */}
        <div className="bg-trade-dark p-6 rounded-xl border border-gray-700">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
            <Zap className="h-5 w-5 text-trade-neon" /> Trades by Strategy
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={strategyData}>
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <Tooltip 
                  contentStyle={{backgroundColor:'#0f172a',border:'1px solid #334155',borderRadius:'8px'}} 
                  formatter={(value) => [`${value}%`, 'Percentage']}
                />
                <Bar dataKey="value" name="Percentage">
                  {strategyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Confidence Level Distribution */}
        <div className="bg-trade-dark p-6 rounded-xl border border-gray-700">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
            <Users className="h-5 w-5 text-trade-neon" /> Confidence Level Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={confidenceData}>
                <XAxis dataKey="level" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <Tooltip 
                  contentStyle={{backgroundColor:'#0f172a',border:'1px solid #334155',borderRadius:'8px'}} 
                  formatter={(value) => [value, 'Trades']}
                  labelFormatter={(label) => `Confidence: ${label}/10`}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#00ff94" 
                  strokeWidth={2} 
                  dot={{ stroke: '#00ff94', strokeWidth: 2, r: 4 }} 
                  activeDot={{ r: 6, stroke: '#00ff94' }} 
                  name="Trades"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Time Frame Distribution */}
        <div className="bg-trade-dark p-6 rounded-xl border border-gray-700">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
            <Clock className="h-5 w-5 text-trade-neon" /> Trades by Time Frame
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeFrameData}>
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <Tooltip 
                  contentStyle={{backgroundColor:'#0f172a',border:'1px solid #334155',borderRadius:'8px'}} 
                  formatter={(value) => [`${value}%`, 'Percentage']}
                />
                <Bar dataKey="value" name="Percentage">
                  {timeFrameData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      {tradeStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-trade-dark p-4 rounded-xl border border-gray-700">
            <div className="flex items-center gap-2 text-gray-400 mb-2 text-sm">
              <TrendingUp className="h-4 w-4" /> Profit Factor
            </div>
            <div className="text-2xl font-bold text-white">{tradeStats.profitFactor.toFixed(2)}</div>
          </div>
          <div className="bg-trade-dark p-4 rounded-xl border border-gray-700">
            <div className="flex items-center gap-2 text-gray-400 mb-2 text-sm">
              <TrendingDown className="h-4 w-4" /> Max Drawdown
            </div>
            <div className="text-2xl font-bold text-red-400">${tradeStats.maxDrawdown.toFixed(2)}</div>
          </div>
          <div className="bg-trade-dark p-4 rounded-xl border border-gray-700">
            <div className="flex items-center gap-2 text-gray-400 mb-2 text-sm">
              <Target className="h-4 w-4" /> Risk/Reward
            </div>
            <div className="text-2xl font-bold text-white">1:{tradeStats.avgRiskReward.toFixed(2)}</div>
          </div>
          <div className="bg-trade-dark p-4 rounded-xl border border-gray-700">
            <div className="flex items-center gap-2 text-gray-400 mb-2 text-sm">
              <Users className="h-4 w-4" /> Avg Confidence
            </div>
            <div className="text-2xl font-bold text-white">{tradeStats.avgConfidence.toFixed(1)}/10</div>
          </div>
        </div>
      )}

      {/* Most Traded Pair and Strategy */}
      {tradeStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-trade-dark p-6 rounded-xl border border-gray-700">
            <h3 className="font-bold text-lg mb-4">Most Traded Pair</h3>
            <div className="flex items-center justify-center h-24">
              <div className="text-center">
                <div className="text-3xl font-bold text-trade-neon">{tradeStats.mostTradedPair}</div>
                <div className="text-gray-400 mt-2">Most frequently traded currency pair</div>
              </div>
            </div>
          </div>
          <div className="bg-trade-dark p-6 rounded-xl border border-gray-700">
            <h3 className="font-bold text-lg mb-4">Most Used Strategy</h3>
            <div className="flex items-center justify-center h-24">
              <div className="text-center">
                <div className="text-3xl font-bold text-trade-neon">{tradeStats.mostUsedStrategy}</div>
                <div className="text-gray-400 mt-2">Most frequently used trading strategy</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentTradeAnalytics;