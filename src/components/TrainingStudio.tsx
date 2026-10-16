import React, { useState } from 'react';
import { EpisodeLog, TrainingHyperparameters } from '../rl/types.ts';
import { Brain, Sliders, Zap, Award, TrendingUp, RotateCcw } from 'lucide-react';

interface TrainingStudioProps {
  hyperparams: TrainingHyperparameters;
  onUpdateHyperparams: (params: TrainingHyperparameters) => void;
  onRunBatchTrain: (episodes: number) => void;
  isTraining: boolean;
  trainingProgress: number;
  trainingLogs: EpisodeLog[];
  onResetAgent: () => void;
  onSaveStrategy?: () => void;
}

export const TrainingStudio: React.FC<TrainingStudioProps> = ({
  hyperparams,
  onUpdateHyperparams,
  onRunBatchTrain,
  isTraining,
  trainingProgress,
  trainingLogs,
  onResetAgent,
  onSaveStrategy,
}) => {
  const [activeTab, setActiveTab] = useState<'train' | 'params' | 'qtable'>('train');

  const latestLog = trainingLogs[trainingLogs.length - 1];

  // SVG dimensions for Episode Reward curve
  const chartW = 460;
  const chartH = 150;
  const pad = { top: 15, right: 20, bottom: 25, left: 35 };

  const rewardPath = React.useMemo(() => {
    if (trainingLogs.length < 2) return '';
    const rewards = trainingLogs.map((l) => l.totalReward);
    const minR = Math.min(...rewards, -1);
    const maxR = Math.max(...rewards, 1);
    const range = maxR - minR || 1;

    return trainingLogs.reduce((acc, log, i) => {
      const x = pad.left + (i / (trainingLogs.length - 1)) * (chartW - pad.left - pad.right);
      const y = pad.top + (1 - (log.totalReward - minR) / range) * (chartH - pad.top - pad.bottom);
      return acc === '' ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [trainingLogs]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
      {/* Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            RL Training Studio & Q-Policy
          </h3>
        </div>

        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
          <button
            onClick={() => setActiveTab('train')}
            className={`px-2.5 py-1 rounded transition font-medium ${
              activeTab === 'train' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Training Loop
          </button>
          <button
            onClick={() => setActiveTab('params')}
            className={`px-2.5 py-1 rounded transition font-medium ${
              activeTab === 'params' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Hyperparameters
          </button>
          <button
            onClick={() => setActiveTab('qtable')}
            className={`px-2.5 py-1 rounded transition font-medium ${
              activeTab === 'qtable' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Policy Matrix
          </button>
        </div>
      </div>

      {activeTab === 'train' && (
        <div className="flex flex-col gap-3">
          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/70 border border-slate-800/80 p-3 rounded-lg">
            <div>
              <div className="text-xs font-semibold text-slate-200">
                Train Experience Episodes
              </div>
              <div className="text-[11px] text-slate-400">
                Run continuous Bellman TD updates over historical EGX price candles
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onRunBatchTrain(25)}
                disabled={isTraining}
                className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 text-xs font-semibold disabled:opacity-50 transition active:scale-95"
              >
                +25 Episodes
              </button>
              <button
                onClick={() => onRunBatchTrain(50)}
                disabled={isTraining}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold disabled:opacity-50 transition active:scale-95 shadow-md shadow-emerald-950"
              >
                +50 Episodes
              </button>
              <button
                onClick={() => onRunBatchTrain(100)}
                disabled={isTraining}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold disabled:opacity-50 transition active:scale-95"
              >
                +100 Episodes
              </button>
              {onSaveStrategy && trainingLogs.length > 0 && (
                <button
                  onClick={onSaveStrategy}
                  disabled={isTraining}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 text-xs font-semibold flex items-center gap-1 transition active:scale-95"
                  title="Save trained model & weights to Firebase Cloud"
                >
                  <Award className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Save Policy</span>
                </button>
              )}
              <button
                onClick={onResetAgent}
                disabled={isTraining}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 border border-slate-700 transition"
                title="Reset Agent Policy"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Training Progress Bar */}
          {isTraining && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono text-cyan-400">
                <span>Training agent in progress...</span>
                <span>{trainingProgress}%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-full rounded-full transition-all duration-150"
                  style={{ width: `${trainingProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Episode Training Convergence Chart */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                Cumulative Episode Reward Convergence
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Total Trained: {trainingLogs.length} episodes
              </span>
            </div>

            {trainingLogs.length > 1 ? (
              <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto select-none">
                <line
                  x1={pad.left}
                  y1={chartH - pad.bottom}
                  x2={chartW - pad.right}
                  y2={chartH - pad.bottom}
                  stroke="#334155"
                  strokeWidth="1"
                />
                <line
                  x1={pad.left}
                  y1={pad.top}
                  x2={pad.left}
                  y2={chartH - pad.bottom}
                  stroke="#334155"
                  strokeWidth="1"
                />
                <path d={rewardPath} fill="none" stroke="#10b981" strokeWidth="2" />
                <text x={pad.left + 5} y={pad.top + 10} fill="#10b981" fontSize="9" fontWeight="bold">
                  Reward $\Sigma r_t$
                </text>
                <text x={chartW - pad.right} y={chartH - 8} fill="#64748b" fontSize="9" textAnchor="end">
                  Episode #
                </text>
              </svg>
            ) : (
              <div className="h-28 flex flex-col items-center justify-center text-xs text-slate-500 gap-1">
                <span>Click &quot;+50 Episodes&quot; above to train the reinforcement learning model.</span>
                <span className="text-[10px] text-slate-600">
                  Observe how Q-values converge and rewards improve over time.
                </span>
              </div>
            )}
          </div>

          {/* Training Summary Cards */}
          {latestLog && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-slate-950/60 border border-slate-800/80 p-2 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase block">Last Ep Return</span>
                <span
                  className={`font-bold font-mono text-sm ${
                    latestLog.returnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {latestLog.returnPct >= 0 ? '+' : ''}{latestLog.returnPct.toFixed(2)}%
                </span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 p-2 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase block">Benchmark EGX30</span>
                <span className="font-bold font-mono text-sm text-cyan-400">
                  {latestLog.benchmarkReturnPct >= 0 ? '+' : ''}{latestLog.benchmarkReturnPct.toFixed(2)}%
                </span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 p-2 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase block">Win Rate</span>
                <span className="font-bold font-mono text-sm text-amber-400">
                  {latestLog.winRate}%
                </span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 p-2 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase block">Exploration ($\epsilon$)</span>
                <span className="font-bold font-mono text-sm text-purple-400">
                  {(latestLog.epsilon * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'params' && (
        <div className="flex flex-col gap-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Learning Rate Alpha */}
            <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-lg flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="font-semibold text-slate-300">
                  Learning Rate ($\alpha$)
                </label>
                <span className="font-mono text-cyan-400 font-bold">
                  {hyperparams.learningRate}
                </span>
              </div>
              <input
                type="range"
                min="0.01"
                max="0.5"
                step="0.01"
                value={hyperparams.learningRate}
                onChange={(e) =>
                  onUpdateHyperparams({ ...hyperparams, learningRate: parseFloat(e.target.value) })
                }
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500">
                Determines how aggressively new TD error overwrites previous Q-values.
              </span>
            </div>

            {/* Discount Factor Gamma */}
            <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-lg flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="font-semibold text-slate-300">
                  Discount Factor ($\gamma$)
                </label>
                <span className="font-mono text-amber-400 font-bold">
                  {hyperparams.discountFactor}
                </span>
              </div>
              <input
                type="range"
                min="0.80"
                max="0.99"
                step="0.01"
                value={hyperparams.discountFactor}
                onChange={(e) =>
                  onUpdateHyperparams({ ...hyperparams, discountFactor: parseFloat(e.target.value) })
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500">
                Importance given to future discounted rewards vs immediate gains.
              </span>
            </div>

            {/* Epsilon Decay */}
            <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-lg flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="font-semibold text-slate-300">
                  Exploration Decay Rate
                </label>
                <span className="font-mono text-purple-400 font-bold">
                  {hyperparams.epsilonDecay}
                </span>
              </div>
              <input
                type="range"
                min="0.90"
                max="0.99"
                step="0.01"
                value={hyperparams.epsilonDecay}
                onChange={(e) =>
                  onUpdateHyperparams({ ...hyperparams, epsilonDecay: parseFloat(e.target.value) })
                }
                className="w-full accent-purple-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500">
                Multiplied with $\epsilon$ each episode to shift from exploration to exploitation.
              </span>
            </div>

            {/* Reward Function */}
            <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-lg flex flex-col gap-1.5">
              <label className="font-semibold text-slate-300">
                Reward Shaping Objective
              </label>
              <select
                value={hyperparams.rewardStrategy}
                onChange={(e) =>
                  onUpdateHyperparams({
                    ...hyperparams,
                    rewardStrategy: e.target.value as any,
                  })
                }
                className="bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value="esthmr_valuation_hybrid">
                  Estethmer Hybrid (Fair Value Discount + Technicals)
                </option>
                <option value="balanced_conservative">
                  Estethmer Balanced (Penalize Churn + EGX Fees)
                </option>
                <option value="sharpe_adjusted">
                  Sharpe Adjusted (Asymmetric Drawdown Penalties)
                </option>
                <option value="raw_pnl">
                  Raw Portfolio Growth (Aggressive Momentum)
                </option>
              </select>
              <span className="text-[10px] text-slate-500">
                Shapes the reward signal sent to the agent on each state transition with Estethmer Fair Value.
              </span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'qtable' && (
        <div className="flex flex-col gap-2 text-xs">
          <div className="text-[11px] text-slate-400">
            Selected key state mappings learned by the Q-Table:
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-[11px] border border-slate-800 rounded">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-2">Market State</th>
                  <th className="p-2">RSI Zone</th>
                  <th className="p-2">Trend Alignment</th>
                  <th className="p-2">Holding Position</th>
                  <th className="p-2 text-right">Learned Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                <tr>
                  <td className="p-2 text-cyan-300 font-bold">0_2_1_0</td>
                  <td className="p-2 text-emerald-400">Oversold (&lt;35)</td>
                  <td className="p-2 text-emerald-400">Bullish Trend</td>
                  <td className="p-2 text-slate-400">Flat (Cash)</td>
                  <td className="p-2 text-right font-bold text-emerald-400">BUY (Strong)</td>
                </tr>
                <tr>
                  <td className="p-2 text-cyan-300 font-bold">2_0_0_1</td>
                  <td className="p-2 text-rose-400">Overbought (&gt;65)</td>
                  <td className="p-2 text-rose-400">Bearish Trend</td>
                  <td className="p-2 text-amber-300">Holding Shares</td>
                  <td className="p-2 text-right font-bold text-rose-400">SELL (Exit)</td>
                </tr>
                <tr>
                  <td className="p-2 text-cyan-300 font-bold">1_1_1_1</td>
                  <td className="p-2 text-slate-300">Neutral (35-65)</td>
                  <td className="p-2 text-slate-300">Neutral Trend</td>
                  <td className="p-2 text-amber-300">Holding Shares</td>
                  <td className="p-2 text-right font-bold text-amber-400">HOLD (Ride)</td>
                </tr>
                <tr>
                  <td className="p-2 text-cyan-300 font-bold">1_0_0_0</td>
                  <td className="p-2 text-slate-300">Neutral</td>
                  <td className="p-2 text-rose-400">Bearish Trend</td>
                  <td className="p-2 text-slate-400">Flat (Cash)</td>
                  <td className="p-2 text-right font-bold text-amber-400">HOLD (Wait)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
