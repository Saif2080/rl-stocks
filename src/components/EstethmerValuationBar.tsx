import React from 'react';
import { StockProfile } from '../rl/types.ts';
import {
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Percent,
  Award,
  Sparkles,
  BarChart3,
  HelpCircle,
} from 'lucide-react';

interface EstethmerValuationBarProps {
  stock: StockProfile;
  currentPrice: number;
}

export const EstethmerValuationBar: React.FC<EstethmerValuationBarProps> = ({
  stock,
  currentPrice,
}) => {
  const valuation = stock.valuation;

  if (!valuation) {
    return null;
  }

  const fairValue = valuation.fairValue;
  const discountPct =
    fairValue > 0
      ? Math.round(((fairValue - currentPrice) / fairValue) * 1000) / 10
      : 0;
  const isDiscounted = discountPct > 0;

  // Compute live dynamic P/E, P/B, and dividend yield from actual market price
  const livePE = (valuation.eps && valuation.eps > 0 && currentPrice > 0)
    ? Math.round((currentPrice / valuation.eps) * 10) / 10
    : valuation.peRatio;

  const livePB = (valuation.bvps && valuation.bvps > 0 && currentPrice > 0)
    ? Math.round((currentPrice / valuation.bvps) * 100) / 100
    : valuation.pbRatio;

  const liveYield = (valuation.dps && valuation.dps > 0 && currentPrice > 0)
    ? Math.round((valuation.dps / currentPrice) * 1000) / 10
    : valuation.dividendYieldPct;

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900 border border-emerald-900/40 rounded-xl p-3.5 shadow-sm text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-slate-800">
        {/* Brand & Portal Direct Link */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold font-mono text-[11px]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ESTETHMER QUANT INTELLIGENCE</span>
          </div>

          <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>Live Multiples Active</span>
          </span>

          <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">
            {valuation.sectorRank}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Rating Badge */}
          <span
            className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
              valuation.rating === 'Strong Buy'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                : valuation.rating === 'Accumulate'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/50'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
            }`}
          >
            {valuation.rating}
          </span>

          {/* Direct Link to esthmr.com */}
          <a
            href={valuation.portalUrl || 'https://esthmr.com/'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] transition shadow-sm active:scale-95"
            title="Open comprehensive financial statements & valuation on esthmr.com"
          >
            <span>Research on esthmr.com</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Valuation Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-2.5">
        {/* Fair Value vs Price */}
        <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/80 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-sans flex items-center justify-between">
            <span>Fair Value (القيمة العادلة)</span>
            <span title="Estethmer DCF and peer relative valuation">
              <HelpCircle className="w-2.5 h-2.5 text-slate-500" />
            </span>
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-bold text-white text-sm font-mono">{fairValue.toFixed(2)}</span>
            <span className="text-[10px] text-slate-400">EGP</span>
          </div>
          <div className="mt-1">
            <span
              className={`text-[10px] font-bold font-mono px-1.5 py-0.2 rounded inline-flex items-center gap-0.5 ${
                isDiscounted
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/80'
                  : 'bg-rose-950 text-rose-400 border border-rose-800/80'
              }`}
            >
              {isDiscounted ? `+${discountPct}% Undervalued` : `${Math.abs(discountPct)}% Premium`}
            </span>
          </div>
        </div>

        {/* P/E Ratio */}
        <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/80 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-sans">P/E Ratio (مضاعف الربحية)</span>
          <div className="font-bold text-white text-sm font-mono mt-0.5">
            {livePE.toFixed(1)}x
          </div>
          <span className="text-[9px] text-slate-500">
            {livePE < 10 ? 'Undervalued multiple' : 'Growth multiple'}
          </span>
        </div>

        {/* P/B Ratio */}
        <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/80 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-sans">P/B Ratio (مضاعف الدفترية)</span>
          <div className="font-bold text-white text-sm font-mono mt-0.5">
            {livePB.toFixed(2)}x
          </div>
          <span className="text-[9px] text-slate-500">Book value multiple</span>
        </div>

        {/* Dividend Yield */}
        <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/80 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-sans flex items-center justify-between">
            <span>Dividend Yield (عائد الأرباح)</span>
            <Percent className="w-2.5 h-2.5 text-emerald-400" />
          </span>
          <div className="font-bold text-emerald-400 text-sm font-mono mt-0.5">
            {liveYield.toFixed(1)}%
          </div>
          <span className="text-[9px] text-slate-500">Annual cash distribution</span>
        </div>

        {/* Return on Equity (ROE) */}
        <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/80 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-sans flex items-center justify-between">
            <span>ROE (العائد على الملكية)</span>
            <TrendingUp className="w-2.5 h-2.5 text-cyan-400" />
          </span>
          <div className="font-bold text-cyan-400 text-sm font-mono mt-0.5">
            {valuation.roePct.toFixed(1)}%
          </div>
          <span className="text-[9px] text-slate-500">Capital compounding rate</span>
        </div>

        {/* Solvency & Health Score */}
        <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/80 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-sans flex items-center justify-between">
            <span>Health Score (السلامة المالية)</span>
            <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
          </span>
          <div className="font-bold text-emerald-400 text-sm font-mono mt-0.5">
            {valuation.healthScore.toFixed(1)} / 10
          </div>
          <span className="text-[9px] text-slate-500">
            Foreign Inst. Flow: {valuation.foreignOwnershipPct}%
          </span>
        </div>
      </div>

      {/* Key Investment Catalyst Note */}
      <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5 flex-1 min-w-[280px]">
          <span className="text-emerald-400 font-semibold font-mono text-[10px] uppercase">Estethmer Catalyst:</span>
          <span className="text-slate-300">{valuation.keyCatalystEn}</span>
        </div>
        <div className="text-slate-400 text-[11px] font-sans" dir="rtl">
          {valuation.keyCatalystAr}
        </div>
      </div>
    </div>
  );
};
