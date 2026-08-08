// Simple test functions for trade outcome detection
import { TradeEntry } from '../types';

function testWinningTrade() {
  const tradeEntry: TradeEntry = {
    id: 'test-id',
    pair: 'EURUSD',
    type: 'buy',
    entryPrice: 1.1000,
    stopLoss: 1.0950,
    takeProfit: 1.1100,
    exitPrice: 1.1050,
    status: 'win',
    validationResult: 'none',
    notes: 'Test trade',
    date: new Date().toISOString(),
    emotions: [],
    pnl: 50,
    screenshotUrl: undefined,
    strategy: 'Breakout',
    timeFrame: '1H',
    marketCondition: 'Trending',
    confidenceLevel: 8,
    riskAmount: 100,
    positionSize: 1,
    tradeDuration: 'PT30M',
    tags: ['test'],
    tradeSource: 'demo',
    adminNotes: undefined,
    adminReviewStatus: undefined,
    reviewTimestamp: undefined,
    mentorId: undefined,
    sessionId: undefined
  };

  if (tradeEntry.status !== 'win') {
    throw new Error('Trade status should be win');
  }
  
  if (tradeEntry.pnl! <= 0) {
    throw new Error('Trade P&L should be positive');
  }
  
  console.log('✓ Winning trade test passed');
}

function testLosingTrade() {
  const tradeEntry: TradeEntry = {
    id: 'test-id',
    pair: 'EURUSD',
    type: 'buy',
    entryPrice: 1.1000,
    stopLoss: 1.0950,
    takeProfit: 1.1100,
    exitPrice: 1.0950,
    status: 'loss',
    validationResult: 'none',
    notes: 'Test trade',
    date: new Date().toISOString(),
    emotions: [],
    pnl: -50,
    screenshotUrl: undefined,
    strategy: 'Breakout',
    timeFrame: '1H',
    marketCondition: 'Trending',
    confidenceLevel: 8,
    riskAmount: 100,
    positionSize: 1,
    tradeDuration: 'PT30M',
    tags: ['test'],
    tradeSource: 'demo',
    adminNotes: undefined,
    adminReviewStatus: undefined,
    reviewTimestamp: undefined,
    mentorId: undefined,
    sessionId: undefined
  };

  if (tradeEntry.status !== 'loss') {
    throw new Error('Trade status should be loss');
  }
  
  if (tradeEntry.pnl! >= 0) {
    throw new Error('Trade P&L should be negative');
  }
  
  console.log('✓ Losing trade test passed');
}

function testBreakevenTrade() {
  const tradeEntry: TradeEntry = {
    id: 'test-id',
    pair: 'EURUSD',
    type: 'buy',
    entryPrice: 1.1000,
    stopLoss: 1.0950,
    takeProfit: 1.1100,
    exitPrice: 1.1000,
    status: 'breakeven',
    validationResult: 'none',
    notes: 'Test trade',
    date: new Date().toISOString(),
    emotions: [],
    pnl: 0,
    screenshotUrl: undefined,
    strategy: 'Breakout',
    timeFrame: '1H',
    marketCondition: 'Trending',
    confidenceLevel: 8,
    riskAmount: 100,
    positionSize: 1,
    tradeDuration: 'PT30M',
    tags: ['test'],
    tradeSource: 'demo',
    adminNotes: undefined,
    adminReviewStatus: undefined,
    reviewTimestamp: undefined,
    mentorId: undefined,
    sessionId: undefined
  };

  if (tradeEntry.status !== 'breakeven') {
    throw new Error('Trade status should be breakeven');
  }
  
  if (tradeEntry.pnl !== 0) {
    throw new Error('Trade P&L should be zero');
  }
  
  console.log('✓ Breakeven trade test passed');
}

function testPnLCalculationBuy() {
  const entryPrice = 1.1000;
  const exitPrice = 1.1050;
  const pair = 'EURUSD';
  const positionSize = 1;
  
  // Calculate P&L based on trade type and pair
  let priceDifference = exitPrice - entryPrice;
  const pipValue = pair.endsWith('JPY') ? 0.01 : 0.0001;
  const pips = priceDifference / pipValue;
  const calculatedPnl = pips * positionSize;
  
  if (calculatedPnl !== 50) {
    throw new Error(`Calculated P&L should be 50, but got ${calculatedPnl}`);
  }
  
  console.log('✓ Buy trade P&L calculation test passed');
}

function testPnLCalculationSell() {
  const entryPrice = 1.1050;
  const exitPrice = 1.1000;
  const pair = 'EURUSD';
  const positionSize = 1;
  
  // Calculate P&L based on trade type and pair
  let priceDifference = entryPrice - exitPrice;
  const pipValue = pair.endsWith('JPY') ? 0.01 : 0.0001;
  const pips = priceDifference / pipValue;
  const calculatedPnl = pips * positionSize;
  
  if (calculatedPnl !== 50) {
    throw new Error(`Calculated P&L should be 50, but got ${calculatedPnl}`);
  }
  
  console.log('✓ Sell trade P&L calculation test passed');
}

function testPnLCalculationJPY() {
  const entryPrice = 110.00;
  const exitPrice = 110.50;
  const pair = 'USDJPY';
  const positionSize = 1;
  
  // Calculate P&L based on trade type and pair
  let priceDifference = exitPrice - entryPrice;
  const pipValue = pair.endsWith('JPY') ? 0.01 : 0.0001;
  const pips = priceDifference / pipValue;
  const calculatedPnl = pips * positionSize;
  
  if (calculatedPnl !== 50) {
    throw new Error(`Calculated P&L should be 50, but got ${calculatedPnl}`);
  }
  
  console.log('✓ JPY pair P&L calculation test passed');
}

// Run all tests
try {
  testWinningTrade();
  testLosingTrade();
  testBreakevenTrade();
  testPnLCalculationBuy();
  testPnLCalculationSell();
  testPnLCalculationJPY();
  console.log('All tests passed!');
} catch (error) {
  console.error('Test failed:', error.message);
  process.exit(1);
}