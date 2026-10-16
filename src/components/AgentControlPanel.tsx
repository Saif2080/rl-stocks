import React from 'react';
import { Action, ActionType, AgentObservation, StepOutcome } from '../rl/types.ts';
import { Play, Pause, SkipForward, RotateCcw, Brain, Activity, Zap, CheckCircle2, ShieldAlert } from 'lucide-react';

interface AgentControlPanelProps {
  currentObservation: AgentObservation;
  currentQValues: [number, number, number];
  recommendedAction: ActionType;
  confidence: number;
  isAutoPlaying: boolean;
  playbackSpeed: number;
  onToggleAutoPlay: () => void;
  onNextStep: () => void;
  onExecuteAction: (action: ActionType) => void;
  onReset: () => void;
  onSetSpeed: (speed: number) => void;
  sharesHeld: number;
  cashBalance: number;
  currentPrice: number;
  lastOutcome: StepOutcome | null;
  isContinuousRL: boolean;
  onToggleContinuousRL: () => void;
  continuousTicksCount: number;
}

export const AgentControlPanel: React.FC<AgentControlPanelProps> = ({
  currentObservation,
  currentQValues,
  recommendedAction,
  confidence,
  isAutoPlaying,
  playbackSpeed,
  onToggleAutoPlay,
  onNextStep,
  onExecuteAction,
  onReset,
  onSetSpeed,
  sharesHeld,
  cashBalance,
  currentPrice,
  lastOutcome,
  isContinuousRL,
  onToggleContinuousRL,
  continuousTicksCount,
}) => {
  const [qHold, qBuy, qSell] = currentQValues;

  // Compute Q-value normalization for relative bar lengths
  const maxQ = Math.max(Math.abs(qHold), Math.abs(qBuy), Math.abs(qSell), 0.1);
  const holdPct = Math.max(10, Math.min(100, (Math.abs(qHold) / maxQ) * 100));
  const buyPct = Math.max(10, Math.min(100, (Math.abs(qBuy) / maxQ) * 100));
  const sellPct = Math.max(10, Math.min(100, (Math.abs(qSell) / maxQ) * 100));

  const actionColors: Record<ActionType, { bg: string; text: string; border: string; desc: string }> = {
    BUY: {
      bg: 'bg-emerald-950/80',
      text: 'text-emerald-400',
      border: 'border-emerald-600',
      desc: 'Signal to enter or allocate Egyptian capital into stock',
    },
    SELL: {
      bg: 'bg-rose-950/80',
      text: 'text-rose-400',
      border: 'border-rose-600',
      desc: 'Signal to liquidate shares, lock profit or cut downside loss',
    },
    HOLD: {
      bg: 'bg-amber-950/80',
      text: 'text-amber-400',
      border: 'border-amber-600',
      desc: 'Maintain current posture, avoid EGX fees, wait for optimal setup',
    },
  };

  const currentTheme = actionColors[recommendedAction];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col gap-4">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Reinforcement Learning Decision Engine
          </h2>
        </div>
        <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/70 border border-cyan-800/50 px-2 py-0.5 rounded">
          Bellman Policy v2.4
        </span>
      </div>

      {/* Main Action Banner */}
      <div
        className={`p-4 rounded-xl border ${currentTheme.border} ${currentTheme.bg} transition-all duration-300 relative overflow-hidden`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl font-mono shadow-inner ${
                recommendedAction === 'BUY'
                  ? 'bg-emerald-600 text-white shadow-emerald-900'
                  : recommendedAction === 'SELL'
                    ? 'bg-rose-600 text-white shadow-rose-900'
                    : 'bg-amber-600 text-white shadow-amber-900'
              }`}
            >
              {recommendedAction}
            </div>

            <div>
              <div className="text-xs text-slate-300 uppercase font-semibold">
                Agent Optimal Action
              </div>
              <div className={`text-xl font-black tracking-tight ${currentTheme.text}`}>
                {recommendedAction === 'BUY'
                  ? 'BUY ORDER • Capital Allocation'
                  : recommendedAction === 'SELL'
                    ? 'SELL ORDER • Position Liquidation'
                    : 'HOLD POSTURE • Capital Preservation'}
              </div>
              <div className="text-[11px] text-slate-300 max-w-sm mt-0.5">
                {currentTheme.desc}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-xs text-slate-400">Policy Confidence</span>
            <span className="text-2xl font-bold font-mono text-white flex items-center gap-1">
              {confidence}%
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
            </span>
            <span className="text-[10px] text-slate-400">
              Softmax Q-Distribution
            </span>
          </div>
        </div>

        {lastOutcome?.info?.reason && (
          <div className="mt-3 pt-2.5 border-t border-slate-800/60 text-xs text-slate-300 flex items-center gap-1.5 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">{lastOutcome.info.reason}</span>
          </div>
        )}
      </div>

      {/* Q-Values Gauge Breakdown */}
      <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5 text-cyan-400" />
            Expected Value Q(s, a)
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            Discounted Future Utility ($\gamma = 0.95$)
          </span>
        </div>

        {/* HOLD */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-amber-400 font-semibold flex items-center gap-1">
              HOLD (Wait / Neutral)
            </span>
            <span className="text-slate-300 font-bold">{qHold.toFixed(3)}</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${holdPct}%` }}
            />
          </div>
        </div>

        {/* BUY */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              BUY (Enter / Long)
            </span>
            <span className="text-slate-300 font-bold">{qBuy.toFixed(3)}</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${buyPct}%` }}
            />
          </div>
        </div>

        {/* SELL */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-rose-400 font-semibold flex items-center gap-1">
              SELL (Exit / Realize PnL)
            </span>
            <span className="text-slate-300 font-bold">{qSell.toFixed(3)}</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className="bg-rose-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${sellPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Discretized State Features */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="bg-slate-950/60 border border-slate-800/80 p-2.5 rounded-lg">
          <span className="text-[10px] text-slate-500 uppercase block">RSI (14) State</span>
          <span className="font-semibold text-slate-200">
            {currentObservation.rsiCategory === 0
              ? 'Oversold (<35)'
              : currentObservation.rsiCategory === 2
                ? 'Overbought (>65)'
                : 'Neutral (35-65)'}
          </span>
          <span className="text-[10px] text-slate-400 block font-mono">
            Val: {currentObservation.rawValues.rsi}
          </span>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 p-2.5 rounded-lg">
          <span className="text-[10px] text-slate-500 uppercase block">Trend (EMA9/21)</span>
          <span className="font-semibold text-slate-200">
            {currentObservation.trendCategory === 2
              ? 'Bullish Above'
              : currentObservation.trendCategory === 0
                ? 'Bearish Below'
                : 'Neutral Crossing'}
          </span>
          <span className="text-[10px] text-slate-400 block font-mono">
            EMA9: {currentObservation.rawValues.ema9.toFixed(1)}
          </span>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 p-2.5 rounded-lg">
          <span className="text-[10px] text-slate-500 uppercase block">MACD Hist</span>
          <span className="font-semibold text-slate-200">
            {currentObservation.macdCategory === 1 ? 'Positive Momentum' : 'Negative Momentum'}
          </span>
          <span className="text-[10px] text-slate-400 block font-mono">
            Hist: {currentObservation.rawValues.macdHist.toFixed(2)}
          </span>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 p-2.5 rounded-lg">
          <span className="text-[10px] text-slate-500 uppercase block">Current Holding</span>
          <span className="font-semibold text-slate-200">
            {sharesHeld > 0 ? `${sharesHeld} Shares` : '100% Cash EGP'}
          </span>
          <span className="text-[10px] text-slate-400 block font-mono">
            {sharesHeld > 0
              ? `Unrealized: ${(currentObservation.rawValues.unrealizedPnlPct * 100).toFixed(1)}%`
              : `Cash: ${cashBalance.toLocaleString()} EGP`}
          </span>
        </div>
      </div>

      {/* Interactive Step & Continuous Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Step Button */}
          <button
            onClick={onNextStep}
            disabled={isAutoPlaying || isContinuousRL}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold border border-slate-700 transition active:scale-95 shadow-sm"
          >
            <SkipForward className="w-3.5 h-3.5 text-cyan-400" />
            <span>Next Bar (+1)</span>
          </button>

          {/* Auto-Play Toggle */}
          <button
            onClick={onToggleAutoPlay}
            disabled={isContinuousRL}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition active:scale-95 shadow-md ${
              isAutoPlaying
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950 disabled:opacity-50'
            }`}
          >
            {isAutoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isAutoPlaying ? 'Pause Auto' : 'Auto Play'}</span>
          </button>

          {/* Live Continuous RL Toggle */}
          <button
            onClick={onToggleContinuousRL}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition active:scale-95 shadow-md ${
              isContinuousRL
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 animate-pulse shadow-emerald-900 ring-2 ring-emerald-400'
                : 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-800/80'
            }`}
            title="Continuous Online RL: Continuously processes live streaming market ticks and updates Q-learning policy in real time"
          >
            <Activity className={`w-3.5 h-3.5 ${isContinuousRL ? 'animate-spin' : ''}`} />
            <span>{isContinuousRL ? `Continuous RL (${continuousTicksCount})` : 'Continuous Live RL'}</span>
          </button>

          {/* Speed Selector */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-[11px] font-mono">
            {[1, 2, 5].map((s) => (
              <button
                key={s}
                onClick={() => onSetSpeed(s)}
                className={`px-2 py-1 rounded transition ${
                  playbackSpeed === s ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Manual Action Overrides */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-500 mr-1 hidden sm:inline">Manual:</span>
          <button
            onClick={() => onExecuteAction('BUY')}
            disabled={sharesHeld > 0 || isAutoPlaying}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-xs font-bold disabled:opacity-40 transition active:scale-95"
          >
            BUY
          </button>
          <button
            onClick={() => onExecuteAction('HOLD')}
            disabled={isAutoPlaying}
            className="px-2.5 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900 border border-amber-800 text-amber-300 text-xs font-bold disabled:opacity-40 transition active:scale-95"
          >
            HOLD
          </button>
          <button
            onClick={() => onExecuteAction('SELL')}
            disabled={sharesHeld === 0 || isAutoPlaying}
            className="px-2.5 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-bold disabled:opacity-40 transition active:scale-95"
          >
            SELL
          </button>
          <button
            onClick={onReset}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 ml-1 transition"
            title="Reset Simulation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
