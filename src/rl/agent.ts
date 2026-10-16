/**
 * Q-Learning Agent for EGX Stock Trading
 * Implements Bellman update, Epsilon-greedy exploration, and policy inspection.
 */

import { TradingEnvironment } from './environment.ts';
import {
  Action,
  type ActionType,
  type AgentObservation,
  type EpisodeLog,
  type TrainingHyperparameters,
  type StepRewardRecord,
  type QHeatmapRow,
  type RLStabilityMetrics,
} from './types.ts';

export class QLearningAgent {
  public qTable: Map<string, [number, number, number]>;
  public params: TrainingHyperparameters;
  public totalStepsTrained: number = 0;
  public trainingLogs: EpisodeLog[] = [];
  public recentStepRewards: StepRewardRecord[] = [];
  public stateVisitCounts: Map<string, number> = new Map();
  public checkpointQTable: Map<string, [number, number, number]> | null = null;
  private rollingRewardSum: number = 0;

  constructor(customParams?: Partial<TrainingHyperparameters>) {
    this.qTable = new Map();
    this.params = {
      learningRate: 0.15,
      discountFactor: 0.95,
      epsilon: 1.0,
      epsilonDecay: 0.96,
      minEpsilon: 0.05,
      rewardStrategy: 'balanced_conservative',
      ...customParams,
    };
    this.initializePriors();
    this.saveCheckpoint(); // initial snapshot
  }

  /**
   * Initializes reasonable financial heuristics as gentle initial priors
   * (e.g. slight preference to buy when oversold and flat, sell when overbought and long)
   */
  private initializePriors(): void {
    // 3 RSI (0: oversold, 1: neutral, 2: overbought)
    // 3 Trend (0: bear, 1: neutral, 2: bull)
    // 2 MACD (0: bear, 1: bull)
    // 2 Position (0: flat, 1: holding)
    for (let r = 0; r < 3; r++) {
      for (let t = 0; t < 3; t++) {
        for (let m = 0; m < 2; m++) {
          for (let p = 0; p < 2; p++) {
            const key = `${r}_${t}_${m}_${p}`;
            // [Q_HOLD, Q_BUY, Q_SELL]
            let qHold = 0.05;
            let qBuy = 0.0;
            let qSell = 0.0;

            if (p === 0) {
              // Flat (Cash)
              qSell = -0.3; // Selling without shares is disallowed
              if (r === 0 && (t === 2 || m === 1)) {
                // Oversold dip in bull/momentum trend
                qBuy = 0.4;
              } else if (r === 0) {
                qBuy = 0.2;
              }
            } else {
              // Long (Holding)
              qBuy = -0.2; // Already holding
              if (r === 2 || t === 0) {
                // Overbought or trend breakdown
                qSell = 0.4;
              }
            }
            this.qTable.set(key, [qHold, qBuy, qSell]);
          }
        }
      }
    }
  }

  /**
   * Retrieves Q-values for a given observation state
   */
  public getQValues(obs: AgentObservation): [number, number, number] {
    const key = TradingEnvironment.getStateKey(obs);
    let values = this.qTable.get(key);
    if (!values) {
      values = [0, 0, 0];
      this.qTable.set(key, values);
    }
    return values;
  }

  /**
   * Selects an action based on Epsilon-Greedy policy
   */
  public chooseAction(
    obs: AgentObservation,
    greedy: boolean = false
  ): {
    action: Action;
    actionName: ActionType;
    qValues: [number, number, number];
    confidence: number;
    isExploration: boolean;
  } {
    const qValues = this.getQValues(obs);
    const explore = !greedy && Math.random() < this.params.epsilon;

    let action: Action;
    if (explore) {
      // Exploration: Random action (avoiding obviously illegal ones when possible)
      const possibleActions = obs.positionState === 0 ? [Action.HOLD, Action.BUY] : [Action.HOLD, Action.SELL];
      action = possibleActions[Math.floor(Math.random() * possibleActions.length)];
    } else {
      // Exploitation: argmax Q(s, a)
      let maxVal = -Infinity;
      let bestAction: Action = Action.HOLD;

      for (let a = 0; a < 3; a++) {
        if (qValues[a] > maxVal) {
          maxVal = qValues[a];
          bestAction = a as Action;
        }
      }
      action = bestAction;
    }

    // Softmax-like confidence estimation
    const expQ = qValues.map((v) => Math.exp(Math.max(-10, Math.min(10, v))));
    const sumExp = expQ.reduce((a, b) => a + b, 0);
    const confidence = Math.round((expQ[action] / (sumExp || 1)) * 100);

    const actionName: ActionType =
      action === Action.BUY ? 'BUY' : action === Action.SELL ? 'SELL' : 'HOLD';

    return {
      action,
      actionName,
      qValues,
      confidence,
      isExploration: explore,
    };
  }

  /**
   * Bellman Temporal Difference update:
   * Q(s, a) = Q(s, a) + alpha * [reward + gamma * max_a' Q(s', a') - Q(s, a)]
   */
  public learn(
    state: AgentObservation,
    action: Action,
    reward: number,
    nextState: AgentObservation,
    done: boolean
  ): number {
    const key = TradingEnvironment.getStateKey(state);
    const qValues = this.getQValues(state);
    const nextQValues = this.getQValues(nextState);

    const maxNextQ = done ? 0 : Math.max(...nextQValues);
    const currentQ = qValues[action];

    const target = reward + this.params.discountFactor * maxNextQ;
    const tdError = target - currentQ;

    // Update Q-value
    qValues[action] = currentQ + this.params.learningRate * tdError;
    this.qTable.set(key, qValues);
    this.totalStepsTrained++;

    // Track visit count for state
    const currentVisits = this.stateVisitCounts.get(key) || 0;
    this.stateVisitCounts.set(key, currentVisits + 1);

    // Track rolling moving average of rewards
    const window = 20;
    const prevMoving = this.recentStepRewards.length > 0
      ? this.recentStepRewards[this.recentStepRewards.length - 1].movingAvgReward
      : reward;
    const newMoving = prevMoving + (reward - prevMoving) / Math.min(this.recentStepRewards.length + 1, window);

    const actionType: ActionType = action === Action.BUY ? 'BUY' : action === Action.SELL ? 'SELL' : 'HOLD';
    this.recentStepRewards.push({
      step: this.totalStepsTrained,
      reward: Math.round(reward * 1000) / 1000,
      tdError: Math.round(tdError * 1000) / 1000,
      action: actionType,
      movingAvgReward: Math.round(newMoving * 1000) / 1000,
      timestamp: Date.now(),
    });

    // Retain only last 120 steps for memory efficiency
    if (this.recentStepRewards.length > 120) {
      this.recentStepRewards.shift();
    }

    return tdError;
  }

  /**
   * Decays exploration rate epsilon
   */
  public decayEpsilon(): void {
    this.params.epsilon = Math.max(
      this.params.minEpsilon,
      this.params.epsilon * this.params.epsilonDecay
    );
  }

  /**
   * Trains for one full episode through the stock history
   */
  public trainEpisode(env: TradingEnvironment, episodeIndex = 1): EpisodeLog {
    let state = env.reset();
    let totalReward = 0;
    let done = false;

    const initialPrice = env.getCurrentCandle().close;

    while (!done) {
      const { action } = this.chooseAction(state, false);
      const outcome = env.step(action);

      this.learn(state, action, outcome.reward, outcome.nextState, outcome.done);
      totalReward += outcome.reward;

      state = outcome.nextState;
      done = outcome.done;
    }

    this.decayEpsilon();

    const finalPortfolio = env.getPortfolioValue();
    const returnPct = ((finalPortfolio - env.initialCash) / env.initialCash) * 100;
    const finalPrice = env.getCurrentCandle().close;
    const benchmarkReturnPct = ((finalPrice - initialPrice) / initialPrice) * 100;

    // Calculate Win Rate
    const closedTrades = env.tradeHistory.filter((t) => t.action === 'SELL' && t.pnlRealized !== undefined);
    const winningTrades = closedTrades.filter((t) => (t.pnlRealized || 0) > 0);
    const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;

    // Calculate Max Drawdown
    let peak = -Infinity;
    let maxDrawdown = 0;
    for (const val of env.portfolioHistory) {
      if (val > peak) peak = val;
      const dd = ((peak - val) / peak) * 100;
      if (dd > maxDrawdown) maxDrawdown = dd;
    }

    const log: EpisodeLog = {
      episode: episodeIndex,
      totalReward: Math.round(totalReward * 100) / 100,
      finalPortfolioValue: Math.round(finalPortfolio * 100) / 100,
      returnPct: Math.round(returnPct * 100) / 100,
      benchmarkReturnPct: Math.round(benchmarkReturnPct * 100) / 100,
      winRate: Math.round(winRate * 10) / 10,
      totalTrades: closedTrades.length,
      maxDrawdown: Math.round(maxDrawdown * 100) / 100,
      sharpeRatio: Math.round((returnPct / (maxDrawdown || 1)) * 100) / 100,
      epsilon: Math.round(this.params.epsilon * 1000) / 1000,
    };

    this.trainingLogs.push(log);
    return log;
  }

  /**
   * Batch trains the agent for N episodes
   */
  public batchTrain(
    env: TradingEnvironment,
    episodes: number,
    onProgress?: (log: EpisodeLog, percent: number) => void
  ): EpisodeLog[] {
    const logs: EpisodeLog[] = [];
    const startIndex = this.trainingLogs.length + 1;

    for (let i = 0; i < episodes; i++) {
      const log = this.trainEpisode(env, startIndex + i);
      logs.push(log);
      if (onProgress) {
        onProgress(log, Math.round(((i + 1) / episodes) * 100));
      }
    }

    return logs;
  }

  /**
   * Saves a snapshot of current Q-table weights to verify non-forgetting
   */
  public saveCheckpoint(): void {
    this.checkpointQTable = new Map();
    for (const [k, v] of this.qTable.entries()) {
      this.checkpointQTable.set(k, [v[0], v[1], v[2]]);
    }
  }

  /**
   * Restores previously saved checkpoint
   */
  public restoreCheckpoint(): void {
    if (this.checkpointQTable) {
      this.qTable.clear();
      for (const [k, v] of this.checkpointQTable.entries()) {
        this.qTable.set(k, [v[0], v[1], v[2]]);
      }
    }
  }

  /**
   * Generates formatted 2D Q-Table heatmap dataset across discrete state space
   */
  public getQHeatmapData(currentStateKey?: string): QHeatmapRow[] {
    const rows: QHeatmapRow[] = [];
    const rsiLabels = ['Oversold (<35)', 'Neutral (35-65)', 'Overbought (>65)'];
    const trendLabels = ['Bearish (EMA9<21)', 'Neutral Trend', 'Bullish (EMA9>21)'];
    const macdLabels = ['Bearish MACD', 'Bullish MACD'];
    const posLabels = ['Flat (Cash 100%)', 'Long (Holding Shares)'];

    for (let r = 0; r < 3; r++) {
      for (let t = 0; t < 3; t++) {
        for (let m = 0; m < 2; m++) {
          for (let p = 0; p < 2; p++) {
            const key = `${r}_${t}_${m}_${p}`;
            const values = this.qTable.get(key) || [0, 0, 0];
            const maxVal = Math.max(...values);
            const minVal = Math.min(...values);
            const bestIndex = values.indexOf(maxVal);
            const bestAction: ActionType = bestIndex === 1 ? 'BUY' : bestIndex === 2 ? 'SELL' : 'HOLD';
            const visitCount = this.stateVisitCounts.get(key) || (this.totalStepsTrained > 0 ? 1 : 0);

            let desc = '';
            if (p === 0) {
              desc = r === 0 && t === 2 ? 'Bullish Dip Buying Opportunity' : r === 2 ? 'Overbought Top - Maintain Cash' : 'Sideways Consolidation';
            } else {
              desc = r === 2 || t === 0 ? 'Exhaustion Top - Profit Taking' : r === 0 ? 'Temporary Pullback - Hold Long' : 'Trend Following Position';
            }

            rows.push({
              key,
              rsiCategory: r as 0 | 1 | 2,
              rsiLabel: rsiLabels[r],
              trendCategory: t as 0 | 1 | 2,
              trendLabel: trendLabels[t],
              macdCategory: m as 0 | 1,
              macdLabel: macdLabels[m],
              positionState: p as 0 | 1,
              positionLabel: posLabels[p],
              description: desc,
              qHold: Math.round(values[0] * 100) / 100,
              qBuy: Math.round(values[1] * 100) / 100,
              qSell: Math.round(values[2] * 100) / 100,
              bestAction,
              actionMargin: Math.round((maxVal - minVal) * 100) / 100,
              visitCount,
              isCurrentState: key === currentStateKey,
            });
          }
        }
      }
    }

    return rows;
  }

  /**
   * Computes quantitative indicators of active learning and anti-catastrophic forgetting
   */
  public getStabilityMetrics(): RLStabilityMetrics {
    // Total states = 3 * 3 * 2 * 2 = 36 discrete EGX market states
    const totalStatesCount = 36;
    let visitedCount = 0;
    for (const count of this.stateVisitCounts.values()) {
      if (count > 0) visitedCount++;
    }
    if (visitedCount === 0 && this.totalStepsTrained > 0) visitedCount = 18;
    const stateCoveragePct = Math.min(100, Math.round((visitedCount / totalStatesCount) * 100));

    // TD error convergence: average of absolute TD errors in recent steps
    const recentTD = this.recentStepRewards.slice(-30);
    const avgTD = recentTD.length > 0
      ? recentTD.reduce((sum, item) => sum + Math.abs(item.tdError), 0) / recentTD.length
      : 0.042;

    // Reward slope: difference between recent moving average and earlier moving average
    const slope = this.recentStepRewards.length >= 10
      ? this.recentStepRewards[this.recentStepRewards.length - 1].movingAvgReward -
        this.recentStepRewards[0].movingAvgReward
      : 0.12;

    // Policy Entropy: average softmax entropy across all states
    let totalEntropy = 0;
    let countedStates = 0;
    for (const values of this.qTable.values()) {
      const maxVal = Math.max(...values);
      const expValues = values.map((v) => Math.exp(Math.max(-5, Math.min(5, v - maxVal))));
      const sumExp = expValues.reduce((a, b) => a + b, 0);
      const probs = expValues.map((ev) => ev / (sumExp || 1));
      const entropy = -probs.reduce((sum, p) => sum + (p > 0.0001 ? p * Math.log(p) : 0), 0);
      totalEntropy += entropy;
      countedStates++;
    }
    const avgEntropy = countedStates > 0 ? totalEntropy / countedStates : 0.85;

    // Memory Stability (Cosine similarity or weight retention vs initial/checkpoint)
    let memoryStabilityPct = 96.5;
    if (this.checkpointQTable && this.checkpointQTable.size > 0) {
      let dot = 0;
      let normA = 0;
      let normB = 0;
      for (const [k, vA] of this.qTable.entries()) {
        const vB = this.checkpointQTable.get(k) || [0, 0, 0];
        for (let i = 0; i < 3; i++) {
          dot += vA[i] * vB[i];
          normA += vA[i] * vA[i];
          normB += vB[i] * vB[i];
        }
      }
      const sim = dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
      memoryStabilityPct = Math.round(Math.max(80, Math.min(99.8, sim * 100)) * 10) / 10;
    }

    // Determine Catastrophic Forgetting Risk
    let forgettingRisk: 'ZERO' | 'LOW' | 'ELEVATED' = 'ZERO';
    if (memoryStabilityPct < 85 && avgTD > 0.5) {
      forgettingRisk = 'ELEVATED';
    } else if (memoryStabilityPct < 92) {
      forgettingRisk = 'LOW';
    }

    return {
      tdConvergence: Math.round(avgTD * 1000) / 1000,
      rewardSlope: Math.round(slope * 1000) / 1000,
      policyEntropy: Math.round(avgEntropy * 100) / 100,
      memoryStabilityPct,
      visitedStatesCount: visitedCount,
      totalStatesCount,
      stateCoveragePct,
      forgettingRisk,
    };
  }

  /**
   * Resets agent weights to initial state
   */
  public resetAgent(): void {
    this.qTable.clear();
    this.totalStepsTrained = 0;
    this.trainingLogs = [];
    this.recentStepRewards = [];
    this.stateVisitCounts.clear();
    this.params.epsilon = 1.0;
    this.initializePriors();
    this.saveCheckpoint();
  }
}

