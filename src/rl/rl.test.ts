import assert from 'node:assert/strict';
import test from 'node:test';
import { QLearningAgent } from './agent.ts';
import { EGX_FEE_RATE, EGX_STOCKS } from './egx_data.ts';
import { TradingEnvironment } from './environment.ts';
import { calculateEMA, calculateMACD, calculateRSI, calculateSMA } from './indicators.ts';
import { Action } from './types.ts';

test('Technical Indicators: calculateSMA calculates correct rolling average', () => {
  const data = [10, 20, 30, 40, 50];
  const sma3 = calculateSMA(data, 3);
  assert.equal(sma3.length, 5);
  // for window of 3: (10)/1=10, (10+20)/2=15, (10+20+30)/3=20, (20+30+40)/3=30, (30+40+50)/3=40
  assert.equal(sma3[2], 20);
  assert.equal(sma3[3], 30);
  assert.equal(sma3[4], 40);
});

test('Technical Indicators: calculateEMA returns correct length and values', () => {
  const data = [10, 11, 12, 13, 14, 15, 16];
  const ema = calculateEMA(data, 3);
  assert.equal(ema.length, data.length);
  assert.ok(ema[ema.length - 1] > 10, 'EMA should trend upward with data');
});

test('Technical Indicators: calculateRSI produces bounded values [0, 100]', () => {
  const prices = [10, 12, 11, 14, 16, 15, 17, 19, 21, 20, 22, 25, 27, 26, 28, 30];
  const rsi = calculateRSI(prices, 5);
  assert.equal(rsi.length, prices.length);
  for (const val of rsi) {
    assert.ok(val >= 0 && val <= 100, `RSI ${val} out of bounds`);
  }
});

test('Technical Indicators: calculateMACD produces macd, signal, and hist lines', () => {
  const prices = Array.from({ length: 40 }, (_, i) => 50 + Math.sin(i / 3) * 5);
  const macd = calculateMACD(prices, 12, 26, 9);
  assert.equal(macd.macd.length, 40);
  assert.equal(macd.signal.length, 40);
  assert.equal(macd.hist.length, 40);
});

test('Environment: Execution of BUY action acquires shares and deducts EGX fees', () => {
  const comi = EGX_STOCKS.find((s) => s.symbol === 'COMI')!;
  const env = new TradingEnvironment(comi, { initialCash: 100000 });

  assert.equal(env.cash, 100000);
  assert.equal(env.shares, 0);

  const candlePrice = env.getCurrentCandle().close;
  const outcome = env.step(Action.BUY);

  assert.ok(env.shares > 0, 'Shares should be greater than 0 after BUY');
  assert.ok(env.cash < 100000, 'Cash should be reduced after BUY');
  assert.ok(env.totalFeesPaid > 0, 'EGX transaction fee should be charged');
  assert.ok(outcome.info.feesPaid > 0, 'Step info should report fees paid');
  assert.equal(outcome.info.action, 'BUY');
});

test('Environment: Execution of SELL action liquidates shares and realizes PnL', () => {
  const comi = EGX_STOCKS.find((s) => s.symbol === 'COMI')!;
  const env = new TradingEnvironment(comi, { initialCash: 100000 });

  // Buy first
  env.step(Action.BUY);
  const sharesBeforeSell = env.shares;
  assert.ok(sharesBeforeSell > 0);

  // Sell
  const sellOutcome = env.step(Action.SELL);
  assert.equal(env.shares, 0, 'Shares should be 0 after SELL');
  assert.ok(env.cash > 0, 'Cash should be restored after SELL');
  assert.equal(sellOutcome.info.action, 'SELL');
  assert.equal(typeof sellOutcome.info.pnlRealized, 'number');
});

test('Environment: Short selling is prevented with negative penalty', () => {
  const comi = EGX_STOCKS.find((s) => s.symbol === 'COMI')!;
  const env = new TradingEnvironment(comi, { initialCash: 100000 });

  // Try to sell with 0 shares
  const outcome = env.step(Action.SELL);
  assert.equal(env.shares, 0);
  assert.ok(outcome.reward < 0, 'Illegal shorting attempt should incur negative reward');
});

test('Agent: Q-Learning updates state Q-values with Bellman equation', () => {
  const agent = new QLearningAgent({ learningRate: 0.2, discountFactor: 0.9 });
  const comi = EGX_STOCKS.find((s) => s.symbol === 'COMI')!;
  const env = new TradingEnvironment(comi);

  const s0 = env.getObservation();
  const q0Before = [...agent.getQValues(s0)];

  const outcome = env.step(Action.BUY);
  agent.learn(s0, Action.BUY, outcome.reward, outcome.nextState, outcome.done);

  const q0After = agent.getQValues(s0);
  assert.notDeepEqual(q0Before, q0After, 'Q-values should update after learning step');
});

test('Agent: Episode training completes and decays epsilon exploration', () => {
  const agent = new QLearningAgent({ epsilon: 1.0, epsilonDecay: 0.9 });
  const comi = EGX_STOCKS.find((s) => s.symbol === 'COMI')!;
  const env = new TradingEnvironment(comi);

  const initialEps = agent.params.epsilon;
  const log = agent.trainEpisode(env, 1);

  assert.ok(agent.params.epsilon < initialEps, 'Epsilon should decay after an episode');
  assert.equal(log.episode, 1);
  assert.ok(typeof log.finalPortfolioValue === 'number');
  assert.ok(typeof log.returnPct === 'number');
});
