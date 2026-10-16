/**
 * Reinforcement Learning Trading Environment for Egyptian Exchange (EGX)
 * Gym-style step/reset mechanics with Egyptian market fee structures and state discretization.
 */

import { EGX_FEE_RATE } from './egx_data.ts';
import { Action, type ActionType, type AgentObservation, type StepOutcome, type StockProfile, type TradeRecord } from './types.ts';

export interface EnvironmentConfig {
  initialCash?: number;
  feeRate?: number;
  startStep?: number;
  rewardType?: 'sharpe_adjusted' | 'raw_pnl' | 'balanced_conservative' | 'esthmr_valuation_hybrid';
}

export class TradingEnvironment {
  public stock: StockProfile;
  public initialCash: number;
  public feeRate: number;
  public startStep: number;
  public rewardType: 'sharpe_adjusted' | 'raw_pnl' | 'balanced_conservative' | 'esthmr_valuation_hybrid';

  public currentStep: number = 0;
  public cash: number = 0;
  public shares: number = 0;
  public entryPrice: number = 0;
  public portfolioHistory: number[] = [];
  public tradeHistory: TradeRecord[] = [];
  public totalFeesPaid: number = 0;

  constructor(stock: StockProfile, config?: EnvironmentConfig) {
    this.stock = stock;
    this.initialCash = config?.initialCash ?? 100000;
    this.feeRate = config?.feeRate ?? EGX_FEE_RATE;
    this.startStep = config?.startStep ?? 20; // Allow 20 periods for indicators to warm up
    this.rewardType = config?.rewardType ?? 'balanced_conservative';
    this.reset();
  }

  /**
   * Resets the environment to initial conditions
   */
  public reset(customStartStep?: number): AgentObservation {
    this.currentStep = customStartStep !== undefined ? customStartStep : this.startStep;
    this.cash = this.initialCash;
    this.shares = 0;
    this.entryPrice = 0;
    this.totalFeesPaid = 0;
    this.tradeHistory = [];
    this.portfolioHistory = [this.initialCash];
    return this.getObservation();
  }

  /**
   * Returns current portfolio valuation in Egyptian Pounds (EGP)
   */
  public getPortfolioValue(): number {
    const currentPrice = this.getCurrentCandle().close;
    return Math.round((this.cash + this.shares * currentPrice) * 100) / 100;
  }

  /**
   * Returns current active candle
   */
  public getCurrentCandle() {
    const idx = Math.min(this.currentStep, this.stock.candles.length - 1);
    return this.stock.candles[idx];
  }

  /**
   * Generates discrete state representation for the RL agent
   */
  public getObservation(): AgentObservation {
    const candle = this.getCurrentCandle();
    const close = candle.close;
    const rsi = candle.rsi ?? 50;
    const ema9 = candle.ema9 ?? close;
    const ema21 = candle.ema21 ?? close;
    const macd = candle.macd ?? 0;
    const macdSignal = candle.macdSignal ?? 0;
    const macdHist = macd - macdSignal;

    // RSI Category
    let rsiCat: 0 | 1 | 2 = 1;
    if (rsi < 35) rsiCat = 0; // Oversold
    else if (rsi > 65) rsiCat = 2; // Overbought

    // Trend Category based on EMA crossover & price location
    let trendCat: 0 | 1 | 2 = 1;
    if (close > ema21 && ema9 > ema21) trendCat = 2; // Bullish
    else if (close < ema21 && ema9 < ema21) trendCat = 0; // Bearish

    // MACD Histogram Category
    const macdCat: 0 | 1 = macdHist >= 0 ? 1 : 0;

    // Position State
    const posState: 0 | 1 = this.shares > 0 ? 1 : 0;

    // Unrealized return
    let unrealizedPnlPct = 0;
    if (this.shares > 0 && this.entryPrice > 0) {
      unrealizedPnlPct = (close - this.entryPrice) / this.entryPrice;
    }

    return {
      normalizedPrice: close / (ema21 || 1) - 1,
      rsiCategory: rsiCat,
      trendCategory: trendCat,
      macdCategory: macdCat,
      positionState: posState,
      rawValues: {
        rsi,
        close,
        ema9,
        ema21,
        macdHist,
        unrealizedPnlPct,
      },
    };
  }

  /**
   * Converts observation to a unique discrete state key for Q-learning
   */
  public static getStateKey(obs: AgentObservation): string {
    return `${obs.rsiCategory}_${obs.trendCategory}_${obs.macdCategory}_${obs.positionState}`;
  }

  /**
   * Executes one time step with given action
   */
  public step(action: Action | ActionType): StepOutcome {
    const numericAction =
      typeof action === 'number'
        ? action
        : action === 'BUY'
          ? Action.BUY
          : action === 'SELL'
            ? Action.SELL
            : Action.HOLD;

    const actionName: ActionType =
      numericAction === Action.BUY
        ? 'BUY'
        : numericAction === Action.SELL
          ? 'SELL'
          : 'HOLD';

    const currentCandle = this.getCurrentCandle();
    const price = currentCandle.close;
    const prevPortfolio = this.getPortfolioValue();

    let pnlRealized = 0;
    let feesPaidThisStep = 0;
    let actionReason = 'Holding position';
    let illegalAction = false;

    // 1. Process Action
    if (numericAction === Action.BUY) {
      if (this.shares > 0) {
        // Already fully invested; acts as hold
        actionReason = 'Already holding maximum position, staying invested';
      } else {
        // Buy shares with available cash (leaving 1% buffer for fee + slippage)
        const budget = this.cash * 0.985;
        const potentialShares = Math.floor(budget / price);

        if (potentialShares > 0) {
          const cost = potentialShares * price;
          const fees = cost * this.feeRate;
          if (this.cash >= cost + fees) {
            this.shares = potentialShares;
            this.cash = Math.round((this.cash - (cost + fees)) * 100) / 100;
            this.entryPrice = price;
            feesPaidThisStep = fees;
            this.totalFeesPaid += fees;
            actionReason = `Executed BUY ${potentialShares} shares @ ${price.toFixed(2)} EGP (Fee: ${fees.toFixed(2)} EGP)`;

            this.tradeHistory.push({
              id: `T-${this.currentStep}-${Date.now().toString(36)}`,
              step: this.currentStep,
              date: currentCandle.dateStr,
              symbol: this.stock.symbol,
              action: 'BUY',
              price,
              shares: potentialShares,
              fees,
              totalCostOrProceeds: cost + fees,
              cashAfter: this.cash,
              portfolioValue: this.getPortfolioValue(),
              rationale: `RSI=${currentCandle.rsi}, EMA9=${currentCandle.ema9}`,
            });
          }
        } else {
          illegalAction = true;
          actionReason = 'Insufficient funds for minimum order';
        }
      }
    } else if (numericAction === Action.SELL) {
      if (this.shares === 0) {
        illegalAction = true;
        actionReason = 'Attempted SELL with 0 shares held (Shorting not permitted)';
      } else {
        const proceeds = this.shares * price;
        const fees = proceeds * this.feeRate;
        const netProceeds = proceeds - fees;
        const costBasis = this.shares * this.entryPrice;
        pnlRealized = Math.round((netProceeds - costBasis) * 100) / 100;
        const pnlPct = costBasis > 0 ? (pnlRealized / costBasis) * 100 : 0;

        feesPaidThisStep = fees;
        this.totalFeesPaid += fees;
        this.cash = Math.round((this.cash + netProceeds) * 100) / 100;

        actionReason = `Executed SELL ${this.shares} shares @ ${price.toFixed(2)} EGP | Net PnL: ${pnlRealized > 0 ? '+' : ''}${pnlRealized.toFixed(2)} EGP (${pnlPct.toFixed(1)}%)`;

        this.tradeHistory.push({
          id: `T-${this.currentStep}-${Date.now().toString(36)}`,
          step: this.currentStep,
          date: currentCandle.dateStr,
          symbol: this.stock.symbol,
          action: 'SELL',
          price,
          shares: this.shares,
          fees,
          totalCostOrProceeds: netProceeds,
          cashAfter: this.cash,
          portfolioValue: this.getPortfolioValue(),
          pnlRealized,
          pnlPct,
          rationale: `Exited position @ ${price.toFixed(2)} EGP`,
        });

        this.shares = 0;
        this.entryPrice = 0;
      }
    } else {
      // HOLD
      if (this.shares > 0) {
        const changeFromEntry = ((price - this.entryPrice) / this.entryPrice) * 100;
        actionReason = `Holding ${this.shares} shares (${changeFromEntry >= 0 ? '+' : ''}${changeFromEntry.toFixed(1)}% unrealized)`;
      } else {
        actionReason = 'Waiting in cash for optimal entry signal';
      }
    }

    // 2. Advance time step
    this.currentStep++;
    const done = this.currentStep >= this.stock.candles.length - 1;

    const nextPortfolio = this.getPortfolioValue();
    this.portfolioHistory.push(nextPortfolio);

    // 3. Compute Shaped Reward
    let reward = 0;
    const portfolioDeltaPct = (nextPortfolio - prevPortfolio) / prevPortfolio;

    if (this.rewardType === 'sharpe_adjusted') {
      // Reward portfolio growth, penalize volatility & fees heavily
      reward = portfolioDeltaPct * 10.0;
      if (feesPaidThisStep > 0) {
        reward -= 0.05; // transaction friction penalty
      }
      if (pnlRealized > 0) {
        reward += (pnlRealized / this.initialCash) * 15.0; // Bonus for taking profit
      } else if (pnlRealized < 0) {
        reward += (pnlRealized / this.initialCash) * 20.0; // Asymmetric penalty for losses
      }
    } else if (this.rewardType === 'raw_pnl') {
      reward = portfolioDeltaPct * 20.0;
    } else if (this.rewardType === 'esthmr_valuation_hybrid') {
      // Estethmer Hybrid: Combines portfolio growth with fundamental valuation margins
      reward = portfolioDeltaPct * 8.0;
      if (feesPaidThisStep > 0) reward -= 0.03;
      if (illegalAction) reward -= 0.08;
      if (pnlRealized > 0) reward += 0.25;
      if (pnlRealized < 0) reward -= 0.35;

      // Valuation shaping bonus/penalty from Estethmer Fair Value
      if (this.stock.valuation) {
        const fairVal = this.stock.valuation.fairValue;
        const discountPct = (fairVal - price) / fairVal; // > 0 means stock is cheap/discounted

        if (actionName === 'BUY') {
          if (discountPct > 0.1) {
            // Good value entry bonus
            reward += 0.15 * Math.min(2, discountPct * 5);
          } else if (discountPct < -0.15) {
            // Buying at overvalued froth penalty
            reward -= 0.15;
          }
        } else if (actionName === 'SELL') {
          if (discountPct <= 0.02) {
            // Selling near or above fair value bonus
            reward += 0.1;
          }
        }
      }
    } else {
      // balanced_conservative (Default Estethmer model)
      reward = portfolioDeltaPct * 8.0;
      if (feesPaidThisStep > 0) reward -= 0.03;
      if (illegalAction) reward -= 0.08;
      if (pnlRealized > 0) reward += 0.25;
      if (pnlRealized < 0) reward -= 0.4;
    }

    const nextState = this.getObservation();

    return {
      nextState,
      reward: Math.max(-2, Math.min(2, reward)), // Clip reward for numerical stability
      done,
      info: {
        step: this.currentStep,
        action: actionName,
        price,
        cash: this.cash,
        shares: this.shares,
        portfolioValue: nextPortfolio,
        pnlRealized,
        feesPaid: feesPaidThisStep,
        reason: actionReason,
      },
    };
  }
}
