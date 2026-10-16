import React from 'react';
import { Award, DollarSign, TrendingUp, TrendingDown, Percent, ShieldCheck, Scale } from 'lucide-react';
import { TradeRecord } from '../rl/types.ts';

interface PerformanceMetricsProps {
  initialCash: number;
  portfolioValue: number;
  cash: number;
  shares: number;
  currentPrice: number;
  trades: TradeRecord[];
  benchmarkReturnPct: number;
  totalFeesPaid: number;
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({
  initialCash,
  portfolioValue,
  cash,
  shares,
  currentPrice,
  trades,
  benchmarkReturnPct,
  totalFeesPaid,
}) => {
  const netProfit = portfolioValue - initialCash;
  const returnPct = ((portfolioValue - initialCash) / initialCash) * 100;
  const alpha = returnPct - benchmarkReturnPct;

  // Win rate calculation
  const closedTrades = trades.filter((t) => t.action === 'SELL' && t.pnlRealized !== undefined);
  const winningTrades = closedTrades.filter((t) => (t.pnlRealized || 0) > 0);
  const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;

  // Total Realized Profit
  const totalRealizedPnl = closedTrades.reduce((acc, t) => acc + (t.pnlRealized || 0), 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
      {/* Portfolio Total Valuation */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
        <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
          <span>PORTFOLIO VALUE</span>
          <span className="text-[10px] text-amber-400 font-bold">EGP</span>
        </div>
        <div className="text-lg font-black font-mono text-white tracking-tight my-1">
          {portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="text-[10px] text-slate-500 font-mono">
          Cash: {cash.toLocaleString()} EGP
        </div>
      </div>

      {/* Net Return % */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
        <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
          <span>AGENT NET RETURN</span>
          {returnPct >= 0 ? (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
          )}
        </div>
        <div
          className={`text-lg font-black font-mono tracking-tight my-1 ${
            returnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {returnPct >= 0 ? '+' : ''}{returnPct.toFixed(2)}%
        </div>
        <div className="text-[10px] text-slate-400 font-mono">
          PnL: {netProfit >= 0 ? '+' : ''}{netProfit.toFixed(0)} EGP
        </div>
      </div>

      {/* Alpha vs Benchmark EGX30 */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
        <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
          <span>ALPHA (VS EGX 30)</span>
          <Award className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <div
          className={`text-lg font-black font-mono tracking-tight my-1 ${
            alpha >= 0 ? 'text-cyan-400' : 'text-slate-400'
          }`}
        >
          {alpha >= 0 ? '+' : ''}{alpha.toFixed(2)}%
        </div>
        <div className="text-[10px] text-slate-500 font-mono">
          EGX 30: {benchmarkReturnPct >= 0 ? '+' : ''}{benchmarkReturnPct.toFixed(2)}%
        </div>
      </div>

      {/* Win Rate */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
        <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
          <span>WIN RATE</span>
          <Percent className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div className="text-lg font-black font-mono text-white tracking-tight my-1">
          {winRate.toFixed(1)}%
        </div>
        <div className="text-[10px] text-slate-500 font-mono">
          {winningTrades.length}/{closedTrades.length} Winning Trades
        </div>
      </div>

      {/* Realized PnL */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
        <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
          <span>REALIZED GAIN</span>
          <Scale className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div
          className={`text-lg font-black font-mono tracking-tight my-1 ${
            totalRealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {totalRealizedPnl >= 0 ? '+' : ''}{totalRealizedPnl.toFixed(0)} EGP
        </div>
        <div className="text-[10px] text-slate-500 font-mono">
          {closedTrades.length} closed cycles
        </div>
      </div>

      {/* EGX Stamp & Brokerage Fees */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
        <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
          <span>EGX FEES PAID</span>
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
        </div>
        <div className="text-lg font-black font-mono text-slate-300 tracking-tight my-1">
          {totalFeesPaid.toFixed(2)} <span className="text-xs text-slate-500">EGP</span>
        </div>
        <div className="text-[10px] text-slate-500 font-mono">
          0.325% total friction
        </div>
      </div>
    </div>
  );
};
