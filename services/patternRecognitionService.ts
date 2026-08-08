// Service for advanced trade pattern recognition and visualization

// Function to identify common trading patterns
export const identifyTradingPatterns = (trades: any[]) => {
  if (!trades || trades.length === 0) {
    return {
      patterns: [],
      statistics: {}
    };
  }

  // Sort trades by date
  const sortedTrades = [...trades].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Pattern recognition logic
  const patterns: any[] = [];
  const statistics: any = {
    totalTrades: sortedTrades.length,
    winRate: 0,
    lossRate: 0,
    avgWin: 0,
    avgLoss: 0,
    profitFactor: 0,
    maxConsecutiveWins: 0,
    maxConsecutiveLosses: 0,
    mostTradedPair: '',
    mostUsedStrategy: '',
    bestTimeOfDay: '',
    bestDayOfWeek: ''
  };

  // Calculate basic statistics
  const wins = sortedTrades.filter(t => t.status === 'win');
  const losses = sortedTrades.filter(t => t.status === 'loss');
  
  statistics.winRate = wins.length / sortedTrades.length;
  statistics.lossRate = losses.length / sortedTrades.length;
  
  const totalWins = wins.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  const totalLosses = Math.abs(losses.reduce((sum, trade) => sum + (trade.pnl || 0), 0));
  
  statistics.avgWin = wins.length > 0 ? totalWins / wins.length : 0;
  statistics.avgLoss = losses.length > 0 ? totalLosses / losses.length : 0;
  statistics.profitFactor = totalLosses > 0 ? totalWins / totalLosses : 0;

  // Find consecutive wins/losses
  let currentWinStreak = 0;
  let currentLossStreak = 0;
  let maxWinStreak = 0;
  let maxLossStreak = 0;

  sortedTrades.forEach(trade => {
    if (trade.status === 'win') {
      currentWinStreak++;
      currentLossStreak = 0;
      maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
    } else if (trade.status === 'loss') {
      currentLossStreak++;
      currentWinStreak = 0;
      maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
    } else {
      currentWinStreak = 0;
      currentLossStreak = 0;
    }
  });

  statistics.maxConsecutiveWins = maxWinStreak;
  statistics.maxConsecutiveLosses = maxLossStreak;

  // Find most traded pair
  const pairCounts: Record<string, number> = {};
  sortedTrades.forEach(trade => {
    pairCounts[trade.pair] = (pairCounts[trade.pair] || 0) + 1;
  });
  statistics.mostTradedPair = Object.keys(pairCounts).reduce((a, b) => 
    pairCounts[a] > pairCounts[b] ? a : b, 
    Object.keys(pairCounts)[0]
  );

  // Find most used strategy
  const strategyCounts: Record<string, number> = {};
  sortedTrades.forEach(trade => {
    if (trade.strategy) {
      strategyCounts[trade.strategy] = (strategyCounts[trade.strategy] || 0) + 1;
    }
  });
  statistics.mostUsedStrategy = Object.keys(strategyCounts).reduce((a, b) => 
    strategyCounts[a] > strategyCounts[b] ? a : b, 
    Object.keys(strategyCounts)[0]
  );

  // Find best time of day
  const hourCounts: Record<string, { wins: number, losses: number }> = {};
  sortedTrades.forEach(trade => {
    const hour = new Date(trade.date).getHours();
    const hourKey = `${hour}:00`;
    
    if (!hourCounts[hourKey]) {
      hourCounts[hourKey] = { wins: 0, losses: 0 };
    }
    
    if (trade.status === 'win') {
      hourCounts[hourKey].wins++;
    } else if (trade.status === 'loss') {
      hourCounts[hourKey].losses++;
    }
  });
  
  let bestHour = '';
  let bestHourWinRate = 0;
  
  Object.entries(hourCounts).forEach(([hour, data]) => {
    const total = data.wins + data.losses;
    if (total > 0) {
      const winRate = data.wins / total;
      if (winRate > bestHourWinRate) {
        bestHourWinRate = winRate;
        bestHour = hour;
      }
    }
  });
  
  statistics.bestTimeOfDay = bestHour;

  // Find best day of week
  const dayCounts: Record<string, { wins: number, losses: number }> = {};
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  sortedTrades.forEach(trade => {
    const dayIndex = new Date(trade.date).getDay();
    const day = days[dayIndex];
    
    if (!dayCounts[day]) {
      dayCounts[day] = { wins: 0, losses: 0 };
    }
    
    if (trade.status === 'win') {
      dayCounts[day].wins++;
    } else if (trade.status === 'loss') {
      dayCounts[day].losses++;
    }
  });
  
  let bestDay = '';
  let bestDayWinRate = 0;
  
  Object.entries(dayCounts).forEach(([day, data]) => {
    const total = data.wins + data.losses;
    if (total > 0) {
      const winRate = data.wins / total;
      if (winRate > bestDayWinRate) {
        bestDayWinRate = winRate;
        bestDay = day;
      }
    }
  });
  
  statistics.bestDayOfWeek = bestDay;

  // Identify specific patterns
  // 1. Revenge trading pattern (loss followed by high-risk trade)
  for (let i = 1; i < sortedTrades.length; i++) {
    const prevTrade = sortedTrades[i - 1];
    const currentTrade = sortedTrades[i];
    
    if (prevTrade.status === 'loss' && currentTrade.riskAmount && prevTrade.pnl) {
      const riskIncrease = currentTrade.riskAmount > Math.abs(prevTrade.pnl * 0.2); // 20% of previous loss
      if (riskIncrease) {
        patterns.push({
          type: 'Revenge Trading',
          description: 'High-risk trade after a loss, potentially indicating emotional trading',
          tradeIndex: i,
          severity: 'High',
          recommendation: 'Consider taking a break after losses and stick to your risk management plan'
        });
      }
    }
  }

  // 2. Overtrading pattern (many trades in short time)
  const tradesByDay: Record<string, number> = {};
  sortedTrades.forEach(trade => {
    const date = new Date(trade.date).toISOString().split('T')[0];
    tradesByDay[date] = (tradesByDay[date] || 0) + 1;
  });
  
  Object.entries(tradesByDay).forEach(([date, count]) => {
    if (count > 5) { // More than 5 trades in a day
      patterns.push({
        type: 'Overtrading',
        description: `High number of trades (${count}) in a single day`,
        date: date,
        severity: 'Medium',
        recommendation: 'Consider reducing trade frequency to maintain quality'
      });
    }
  });

  // 3. Chasing pattern (increasing position size after losses)
  let prevPositionSize = 0;
  for (let i = 0; i < sortedTrades.length; i++) {
    const trade = sortedTrades[i];
    
    if (trade.positionSize && trade.positionSize > prevPositionSize && i > 0) {
      const prevTrade = sortedTrades[i - 1];
      if (prevTrade.status === 'loss') {
        patterns.push({
          type: 'Chasing Losses',
          description: 'Increasing position size after a loss',
          tradeIndex: i,
          severity: 'High',
          recommendation: 'Avoid increasing position size after losses to recover quickly'
        });
      }
    }
    
    prevPositionSize = trade.positionSize || 0;
  }

  // 4. Consistent winner pattern
  if (statistics.winRate > 0.6) {
    patterns.push({
      type: 'Consistent Winner',
      description: 'Maintaining a high win rate over time',
      severity: 'Positive',
      recommendation: 'Continue with current approach and risk management'
    });
  }

  // 5. Consistent loser pattern
  if (statistics.winRate < 0.4) {
    patterns.push({
      type: 'Consistent Loser',
      description: 'Maintaining a low win rate over time',
      severity: 'High',
      recommendation: 'Review trading plan and consider taking a break for reevaluation'
    });
  }

  return {
    patterns,
    statistics
  };
};

// Function to generate visualization data for trade patterns
export const generatePatternVisualizationData = (trades: any[]) => {
  if (!trades || trades.length === 0) {
    return {
      equityCurve: [],
      drawdownCurve: [],
      winLossDistribution: [],
      pairPerformance: [],
      strategyPerformance: []
    };
  }

  // Sort trades by date
  const sortedTrades = [...trades].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Generate equity curve
  let runningPnL = 0;
  const equityCurve = sortedTrades.map((trade, index) => {
    runningPnL += trade.pnl || 0;
    return {
      index: index + 1,
      date: trade.date,
      equity: runningPnL,
      pnl: trade.pnl || 0
    };
  });

  // Generate drawdown curve
  let peak = 0;
  const drawdownCurve = equityCurve.map(point => {
    peak = Math.max(peak, point.equity);
    const drawdown = peak > 0 ? ((peak - point.equity) / peak) * 100 : 0;
    return {
      ...point,
      drawdown
    };
  });

  // Win/Loss distribution
  const winLossDistribution = [
    { name: 'Wins', value: sortedTrades.filter(t => t.status === 'win').length },
    { name: 'Losses', value: sortedTrades.filter(t => t.status === 'loss').length },
    { name: 'Breakeven', value: sortedTrades.filter(t => t.status === 'breakeven').length }
  ];

  // Pair performance
  const pairPerformance: any[] = [];
  const pairStats: Record<string, { wins: number, losses: number, totalPnL: number }> = {};
  
  sortedTrades.forEach(trade => {
    if (!pairStats[trade.pair]) {
      pairStats[trade.pair] = { wins: 0, losses: 0, totalPnL: 0 };
    }
    
    pairStats[trade.pair].totalPnL += trade.pnl || 0;
    
    if (trade.status === 'win') {
      pairStats[trade.pair].wins++;
    } else if (trade.status === 'loss') {
      pairStats[trade.pair].losses++;
    }
  });
  
  Object.entries(pairStats).forEach(([pair, stats]) => {
    const totalTrades = stats.wins + stats.losses;
    const winRate = totalTrades > 0 ? (stats.wins / totalTrades) * 100 : 0;
    
    pairPerformance.push({
      pair,
      winRate,
      totalPnL: stats.totalPnL,
      totalTrades
    });
  });

  // Strategy performance
  const strategyPerformance: any[] = [];
  const strategyStats: Record<string, { wins: number, losses: number, totalPnL: number }> = {};
  
  sortedTrades.forEach(trade => {
    if (trade.strategy) {
      if (!strategyStats[trade.strategy]) {
        strategyStats[trade.strategy] = { wins: 0, losses: 0, totalPnL: 0 };
      }
      
      strategyStats[trade.strategy].totalPnL += trade.pnl || 0;
      
      if (trade.status === 'win') {
        strategyStats[trade.strategy].wins++;
      } else if (trade.status === 'loss') {
        strategyStats[trade.strategy].losses++;
      }
    }
  });
  
  Object.entries(strategyStats).forEach(([strategy, stats]) => {
    const totalTrades = stats.wins + stats.losses;
    const winRate = totalTrades > 0 ? (stats.wins / totalTrades) * 100 : 0;
    
    strategyPerformance.push({
      strategy,
      winRate,
      totalPnL: stats.totalPnL,
      totalTrades
    });
  });

  return {
    equityCurve,
    drawdownCurve,
    winLossDistribution,
    pairPerformance,
    strategyPerformance
  };
};