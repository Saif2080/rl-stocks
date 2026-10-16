/**
 * Reinforcement Learning Types for Egypt Stock Market (EGX)
 * Supports actions: HOLD (0), BUY (1), SELL (2)
 */

export type ActionType = 'HOLD' | 'BUY' | 'SELL';

export const Action = {
  HOLD: 0,
  BUY: 1,
  SELL: 2,
} as const;

export type Action = (typeof Action)[keyof typeof Action];

export interface MarketCandle {
  timestamp: number;
  dateStr: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  rsi?: number;
  macd?: number;
  macdSignal?: number;
  ema9?: number;
  ema21?: number;
  ema50?: number;
  sma20?: number;
  sma50?: number;
  bbUpper?: number;
  bbLower?: number;
  atr?: number;
}

export interface EstethmerValuationData {
  symbol: string;
  ticker: string;
  nameEn: string;
  nameAr: string;
  fairValue: number;
  marketPrice: number;
  discountPct: number;
  peRatio: number;
  pbRatio: number;
  dividendYieldPct: number;
  roePct: number;
  healthScore: number;
  sentimentScore: number;
  rating: 'Strong Buy' | 'Accumulate' | 'Fair Value' | 'Trim / Overvalued';
  sectorRank: string;
  foreignOwnershipPct: number;
  portalUrl: string;
  keyCatalystEn: string;
  keyCatalystAr: string;
}

export interface StockProfile {
  symbol: string;
  ticker: string;
  isin?: string;
  nameEn: string;
  nameAr: string;
  sectorEn: string;
  sectorAr: string;
  basePrice: number;
  descriptionEn: string;
  descriptionAr: string;
  valuation?: EstethmerValuationData;
  candles: MarketCandle[];
}

export interface AgentObservation {
  normalizedPrice: number; // relative to moving average
  rsiCategory: 0 | 1 | 2; // 0: Oversold (<35), 1: Neutral (35-65), 2: Overbought (>65)
  trendCategory: 0 | 1 | 2; // 0: Bearish (EMA9 < EMA21), 1: Neutral, 2: Bullish (EMA9 > EMA21)
  macdCategory: 0 | 1; // 0: Bearish, 1: Bullish
  positionState: 0 | 1; // 0: Flat (Cash), 1: Long (Holding stock)
  rawValues: {
    rsi: number;
    close: number;
    ema9: number;
    ema21: number;
    macdHist: number;
    unrealizedPnlPct: number;
  };
}

export interface StepOutcome {
  nextState: AgentObservation;
  reward: number;
  done: boolean;
  info: {
    step: number;
    action: ActionType;
    price: number;
    cash: number;
    shares: number;
    portfolioValue: number;
    pnlRealized: number;
    feesPaid: number;
    reason: string;
  };
}

export interface TradeRecord {
  id: string;
  step: number;
  date: string;
  symbol: string;
  action: ActionType;
  price: number;
  shares: number;
  fees: number;
  totalCostOrProceeds: number;
  cashAfter: number;
  portfolioValue: number;
  pnlRealized?: number;
  pnlPct?: number;
  rationale: string;
}

export interface TrainingHyperparameters {
  learningRate: number; // alpha (e.g. 0.1)
  discountFactor: number; // gamma (e.g. 0.95)
  epsilon: number; // exploration rate (e.g. 1.0 down to 0.05)
  epsilonDecay: number; // e.g. 0.97
  minEpsilon: number; // e.g. 0.05
  rewardStrategy: 'balanced_conservative' | 'sharpe_adjusted' | 'raw_pnl' | 'esthmr_valuation_hybrid';
}

export interface EpisodeLog {
  episode: number;
  totalReward: number;
  finalPortfolioValue: number;
  returnPct: number;
  benchmarkReturnPct: number;
  winRate: number;
  totalTrades: number;
  maxDrawdown: number;
  sharpeRatio: number;
  epsilon: number;
}

export interface StepRewardRecord {
  step: number;
  reward: number;
  tdError: number;
  action: ActionType;
  movingAvgReward: number;
  timestamp: number;
}

export interface QHeatmapRow {
  key: string;
  rsiCategory: 0 | 1 | 2;
  rsiLabel: string;
  trendCategory: 0 | 1 | 2;
  trendLabel: string;
  macdCategory: 0 | 1;
  macdLabel: string;
  positionState: 0 | 1;
  positionLabel: string;
  description: string;
  qHold: number;
  qBuy: number;
  qSell: number;
  bestAction: ActionType;
  actionMargin: number;
  visitCount: number;
  isCurrentState?: boolean;
}

export interface RLStabilityMetrics {
  tdConvergence: number;
  rewardSlope: number;
  policyEntropy: number;
  memoryStabilityPct: number;
  visitedStatesCount: number;
  totalStatesCount: number;
  stateCoveragePct: number;
  forgettingRisk: 'ZERO' | 'LOW' | 'ELEVATED';
}

