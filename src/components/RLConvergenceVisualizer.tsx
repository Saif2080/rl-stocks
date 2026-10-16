import React, { useState } from 'react';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  Info,
  Maximize2,
  Minimize2,
  Filter,
  BarChart3,
  RefreshCw,
  Sparkles,
  Zap,
} from 'lucide-react';
import { QLearningAgent } from '../rl/agent.ts';
import { AgentObservation, QHeatmapRow, RLStabilityMetrics } from '../rl/types.ts';
import { TradingEnvironment } from '../rl/environment.ts';

interface RLConvergenceVisualizerProps {
  agent: QLearningAgent;
  currentObservation?: AgentObservation | null;
  currentStep: number;
  episodesTrained: number;
  isEvaluationMode: boolean;
  onToggleEvaluationMode: () => void;
  onSavePolicyCheckpoint?: () => void;
  onSimulateSteps?: () => void;
}

export const RLConvergenceVisualizer: React.FC<RLConvergenceVisualizerProps> = ({
  agent,
  currentObservation,
  currentStep,
  episodesTrained,
  isEvaluationMode,
  onToggleEvaluationMode,
  onSavePolicyCheckpoint,
  onSimulateSteps,
}) => {
  const [filterCategory, setFilterCategory] = useState<'all' | 'oversold' | 'overbought' | 'cash' | 'long'>('all');
  const [hoveredPoint, setHoveredPoint] = useState<{
    step: number;
    reward: number;
    tdError: number;
    movingAvgReward: number;
    action: string;
  } | null>(null);

  const currentStateKey = currentObservation ? TradingEnvironment.getStateKey(currentObservation) : undefined;
  const heatmapRows = agent.getQHeatmapData(currentStateKey);
  const stability: RLStabilityMetrics = agent.getStabilityMetrics();
  const recentRewards = agent.recentStepRewards;

  // Filter heatmap rows
  const filteredRows = heatmapRows.filter((row) => {
    if (filterCategory === 'oversold') return row.rsiCategory === 0;
    if (filterCategory === 'overbought') return row.rsiCategory === 2;
    if (filterCategory === 'cash') return row.positionState === 0;
    if (filterCategory === 'long') return row.positionState === 1;
    return true;
  });

  // SVG Chart Dimensions
  const chartWidth = 600;
  const chartHeight = 160;
  const padding = { top: 20, right: 30, bottom: 25, left: 40 };

  // Generate SVG paths for rewards and moving average
  let rewardPoints = '';
  let movingAvgPoints = '';
  let tdErrorBars: { x: number; y: number; h: number; positive: boolean }[] = [];

  if (recentRewards.length > 1) {
    const minReward = Math.min(-1.5, ...recentRewards.map((r) => r.reward));
    const maxReward = Math.max(1.5, ...recentRewards.map((r) => r.reward));
    const range = Math.max(0.1, maxReward - minReward);

    const getX = (idx: number) =>
      padding.left + (idx / (recentRewards.length - 1)) * (chartWidth - padding.left - padding.right);
    const getY = (val: number) =>
      chartHeight - padding.bottom - ((val - minReward) / range) * (chartHeight - padding.top - padding.bottom);
    const zeroY = getY(0);

    recentRewards.forEach((pt, idx) => {
      const x = getX(idx);
      const yR = getY(pt.reward);
      const yM = getY(pt.movingAvgReward);

      if (idx === 0) {
        rewardPoints = `M ${x} ${yR}`;
        movingAvgPoints = `M ${x} ${yM}`;
      } else {
        rewardPoints += ` L ${x} ${yR}`;
        movingAvgPoints += ` L ${x} ${yM}`;
      }

      // TD error mini-bar
      const barY = getY(Math.abs(pt.tdError));
      tdErrorBars.push({
        x,
        y: Math.min(zeroY, barY),
        h: Math.max(2, Math.abs(zeroY - barY)),
        positive: pt.tdError >= 0,
      });
    });
  }

  // Helper for heatmap cell color
  const getCellBg = (q: number) => {
    if (q > 0.8) return 'bg-emerald-950/90 text-emerald-300 font-bold border-emerald-500/60';
    if (q > 0.2) return 'bg-emerald-950/50 text-emerald-400 border-emerald-800/40';
    if (q > -0.05) return 'bg-slate-900/80 text-slate-300 border-slate-800';
    if (q > -0.4) return 'bg-rose-950/40 text-rose-300 border-rose-900/40';
    return 'bg-rose-950/80 text-rose-400 font-bold border-rose-600/60';
  };

  return (
    <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 text-xs font-sans">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800">
            <Brain className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 text-sm">
                RL Learning Convergence & Non-Forgetting Monitor
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 ${
                  stability.forgettingRisk === 'ZERO'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Forgetting Risk: {stability.forgettingRisk}</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Live Bellman Temporal-Difference Loss • Rolling Reward EMA • Q-Value Action State Heatmap
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {onSimulateSteps && (
            <button
              onClick={onSimulateSteps}
              className="px-2.5 py-1 rounded-lg bg-cyan-950/90 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-[11px] font-mono font-semibold flex items-center gap-1 transition"
              title="Simulate active trading ticks to observe real-time policy updates"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Step Update</span>
            </button>
          )}

          <button
            onClick={onToggleEvaluationMode}
            className={`px-3 py-1 rounded-lg border text-[11px] font-mono font-bold flex items-center gap-1.5 transition ${
              isEvaluationMode
                ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title="Freeze learning (alpha=0, epsilon=0) to verify non-forgetting across past states"
          >
            {isEvaluationMode ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            <span>{isEvaluationMode ? 'Evaluation Mode (Frozen Weights)' : 'Active Learning (Updating)'}</span>
          </button>

          {onSavePolicyCheckpoint && (
            <button
              onClick={onSavePolicyCheckpoint}
              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] font-mono flex items-center gap-1 shadow-sm transition"
              title="Persist current Q-matrix snapshot to Firebase Firestore"
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Snapshot to Cloud</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Quantitative Telemetry Gauges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-mono">Bellman TD Error (δ)</span>
            <span className="text-[9px] px-1 rounded bg-emerald-950 text-emerald-400 font-mono">Loss</span>
          </div>
          <div className="text-base font-bold font-mono text-emerald-400 mt-1">
            {stability.tdConvergence}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Decreases toward 0 as Q-values reach optimal fixed point.
          </p>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-mono">Reward Slope (EMAΔ)</span>
            <span className="text-[9px] px-1 rounded bg-cyan-950 text-cyan-400 font-mono">Trend</span>
          </div>
          <div className="text-base font-bold font-mono text-cyan-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{stability.rewardSlope >= 0 ? `+${stability.rewardSlope}` : stability.rewardSlope}</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Monotonic upward climb verifies policy learning gains.
          </p>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-mono">Weight Retention</span>
            <span className="text-[9px] px-1 rounded bg-indigo-950 text-indigo-400 font-mono">Memory</span>
          </div>
          <div className="text-base font-bold font-mono text-indigo-300 mt-1">
            {stability.memoryStabilityPct}%
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Cosine similarity against checkpoint prevents catastrophic forgetting.
          </p>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-mono">State Space Coverage</span>
            <span className="text-[9px] px-1 rounded bg-amber-950 text-amber-400 font-mono">Replay</span>
          </div>
          <div className="text-base font-bold font-mono text-amber-300 mt-1">
            {stability.visitedStatesCount} / {stability.totalStatesCount} ({stability.stateCoveragePct}%)
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Balanced visit counts across bull, bear, and consolidation regimes.
          </p>
        </div>
      </div>

      {/* SECTION 1: Real-Time Reward Trends Chart */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3.5 flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h4 className="font-bold text-slate-200 text-xs">
              Recent Step Reward Trajectory & Bellman Convergence Curve
            </h4>
          </div>

          <div className="flex items-center gap-3 text-[10px] font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
              <span className="text-slate-400">Step Reward r(t)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-400 inline-block" />
              <span className="text-emerald-300 font-bold">20-Step Moving Avg EMA</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-1.5 bg-amber-500/70 inline-block" />
              <span className="text-amber-400">TD Error |δ|</span>
            </div>
          </div>
        </div>

        {/* SVG Curve */}
        <div className="relative w-full overflow-hidden bg-slate-950 border border-slate-800/80 rounded-lg">
          {recentRewards.length > 2 ? (
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-36"
              preserveAspectRatio="none"
            >
              {/* Zero Baseline */}
              <line
                x1={padding.left}
                y1={chartHeight / 2}
                x2={chartWidth - padding.right}
                y2={chartHeight / 2}
                stroke="#334155"
                strokeDasharray="3 3"
                strokeWidth="1"
              />

              {/* TD Error Bars */}
              {tdErrorBars.map((bar, i) => (
                <rect
                  key={i}
                  x={bar.x - 1.5}
                  y={bar.y}
                  width="3"
                  height={bar.h}
                  fill="#f59e0b"
                  opacity="0.25"
                />
              ))}

              {/* Step Reward Polyline */}
              <path
                d={rewardPoints}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.2"
                strokeOpacity="0.65"
              />

              {/* Moving Average Line (Smoothed Learning Curve) */}
              <path
                d={movingAvgPoints}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Data points for hover */}
              {recentRewards.map((pt, idx) => {
                const minR = Math.min(-1.5, ...recentRewards.map((r) => r.reward));
                const maxR = Math.max(1.5, ...recentRewards.map((r) => r.reward));
                const range = Math.max(0.1, maxR - minR);
                const x = padding.left + (idx / (recentRewards.length - 1)) * (chartWidth - padding.left - padding.right);
                const y = chartHeight - padding.bottom - ((pt.reward - minR) / range) * (chartHeight - padding.top - padding.bottom);

                return (
                  <circle
                    key={idx}
                    cx={x}
                    cy={y}
                    r={hoveredPoint?.step === pt.step ? 4 : 2}
                    fill={hoveredPoint?.step === pt.step ? '#38bdf8' : '#0284c7'}
                    className="cursor-pointer transition-all"
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                );
              })}
            </svg>
          ) : (
            <div className="h-36 flex flex-col items-center justify-center text-slate-500 font-mono text-[11px] gap-1">
              <Activity className="w-5 h-5 text-slate-600 animate-spin" />
              <span>Accumulating online execution steps... Run Auto-Play or Batch Train to view live curve.</span>
            </div>
          )}

          {/* Hover Tooltip */}
          {hoveredPoint && (
            <div className="absolute top-2 right-3 bg-slate-900 border border-cyan-500/80 rounded-lg p-2 text-[10px] font-mono text-slate-200 shadow-xl pointer-events-none">
              <div className="font-bold text-cyan-400">Step #{hoveredPoint.step}</div>
              <div>Action: <strong className="text-white">{hoveredPoint.action}</strong></div>
              <div>Reward: <strong className="text-emerald-400">+{hoveredPoint.reward}</strong></div>
              <div>Moving Avg: <strong className="text-emerald-300">+{hoveredPoint.movingAvgReward}</strong></div>
              <div>TD Loss: <strong className="text-amber-400">{hoveredPoint.tdError}</strong></div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: Dynamic 2D Q-Value Heatmap (State vs Action) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3.5 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h4 className="font-bold text-slate-200 text-xs">
              2D Action-Value Q(s, a) Heatmap Matrix across EGX Market Conditions
            </h4>
            {currentStateKey && (
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700 text-[10px] font-mono">
                Current Tick State: {currentStateKey}
              </span>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-[10px] font-mono">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-2 py-0.5 rounded transition ${
                filterCategory === 'all' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All States ({heatmapRows.length})
            </button>
            <button
              onClick={() => setFilterCategory('oversold')}
              className={`px-2 py-0.5 rounded transition ${
                filterCategory === 'oversold' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Oversold (Dip Buy)
            </button>
            <button
              onClick={() => setFilterCategory('overbought')}
              className={`px-2 py-0.5 rounded transition ${
                filterCategory === 'overbought' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Overbought (Exhaustion)
            </button>
            <button
              onClick={() => setFilterCategory('cash')}
              className={`px-2 py-0.5 rounded transition ${
                filterCategory === 'cash' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Cash Position
            </button>
            <button
              onClick={() => setFilterCategory('long')}
              className={`px-2 py-0.5 rounded transition ${
                filterCategory === 'long' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Holding Long
            </button>
          </div>
        </div>

        {/* Heatmap Table */}
        <div className="overflow-x-auto border border-slate-800 rounded-lg max-h-80 overflow-y-auto">
          <table className="w-full text-left font-mono text-[11px] border-collapse">
            <thead className="bg-slate-950 text-slate-400 sticky top-0 z-10 border-b border-slate-800">
              <tr>
                <th className="py-2 px-3">State Key</th>
                <th className="py-2 px-3">RSI Condition</th>
                <th className="py-2 px-3">Trend & MACD</th>
                <th className="py-2 px-3">Portfolio Position</th>
                <th className="py-2 px-3 text-center bg-slate-900/60">Q(HOLD)</th>
                <th className="py-2 px-3 text-center bg-slate-900/60">Q(BUY)</th>
                <th className="py-2 px-3 text-center bg-slate-900/60">Q(SELL)</th>
                <th className="py-2 px-3 text-center">Best Policy Action</th>
                <th className="py-2 px-3 text-right">Spread Margin (ΔQ)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/70">
              {filteredRows.map((row) => {
                const isCurrent = row.key === currentStateKey;
                return (
                  <tr
                    key={row.key}
                    className={`transition hover:bg-slate-900/80 ${
                      isCurrent ? 'bg-cyan-950/50 ring-1 ring-cyan-500/80 font-semibold' : ''
                    }`}
                  >
                    <td className="py-2 px-3 text-slate-300 font-bold flex items-center gap-1.5">
                      {isCurrent && (
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
                      )}
                      <span>{row.key}</span>
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] ${
                          row.rsiCategory === 0
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : row.rsiCategory === 2
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-slate-900 text-slate-400'
                        }`}
                      >
                        {row.rsiLabel}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-300 text-[10px]">
                      {row.trendLabel} • {row.macdLabel}
                    </td>
                    <td className="py-2 px-3 text-slate-300 text-[10px]">
                      {row.positionLabel}
                    </td>

                    {/* Q(HOLD) */}
                    <td className="py-1.5 px-2 text-center">
                      <div className={`px-2 py-1 rounded border ${getCellBg(row.qHold)} font-mono text-[10px]`}>
                        {row.qHold >= 0 ? `+${row.qHold.toFixed(2)}` : row.qHold.toFixed(2)}
                      </div>
                    </td>

                    {/* Q(BUY) */}
                    <td className="py-1.5 px-2 text-center">
                      <div className={`px-2 py-1 rounded border ${getCellBg(row.qBuy)} font-mono text-[10px]`}>
                        {row.qBuy >= 0 ? `+${row.qBuy.toFixed(2)}` : row.qBuy.toFixed(2)}
                      </div>
                    </td>

                    {/* Q(SELL) */}
                    <td className="py-1.5 px-2 text-center">
                      <div className={`px-2 py-1 rounded border ${getCellBg(row.qSell)} font-mono text-[10px]`}>
                        {row.qSell >= 0 ? `+${row.qSell.toFixed(2)}` : row.qSell.toFixed(2)}
                      </div>
                    </td>

                    {/* Best Policy Action */}
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] font-mono ${
                          row.bestAction === 'BUY'
                            ? 'bg-emerald-900/90 text-emerald-200 border border-emerald-500'
                            : row.bestAction === 'SELL'
                            ? 'bg-rose-900/90 text-rose-200 border border-rose-500'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {row.bestAction}
                      </span>
                    </td>

                    {/* Action Spread Margin */}
                    <td className="py-2 px-3 text-right font-mono text-cyan-300 font-bold">
                      +{row.actionMargin.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
