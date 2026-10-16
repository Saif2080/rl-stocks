import React from 'react';
import { Brain, Sparkles, TrendingUp, ShieldCheck, HelpCircle, FileText } from 'lucide-react';
import { EGX_STOCKS } from '../rl/egx_data.ts';

interface NavbarProps {
  onOpenAudit: () => void;
  onOpenChat: () => void;
  onOpenCloud: () => void;
  onOpenManual: () => void;
  selectedStockSymbol: string;
  isAutoPlaying: boolean;
  totalEpisodesTrained: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAudit,
  onOpenChat,
  onOpenCloud,
  onOpenManual,
  selectedStockSymbol,
  isAutoPlaying,
  totalEpisodesTrained,
}) => {
  return (
    <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-40 text-slate-100">
      {/* Top Ticker Marquee */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 px-4 py-1.5 overflow-x-auto text-xs flex items-center gap-6 whitespace-nowrap scrollbar-none">
        <div className="flex items-center gap-1.5 text-emerald-400 font-semibold uppercase tracking-wider shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          EGX LIVE MARKET (Egyptian Exchange)
        </div>
        {EGX_STOCKS.map((stock) => {
          const lastCandle = stock.candles[stock.candles.length - 1];
          const prevCandle = stock.candles[stock.candles.length - 2] || lastCandle;
          const change = lastCandle.close - prevCandle.close;
          const changePct = ((change / prevCandle.close) * 100).toFixed(2);
          const isUp = change >= 0;

          return (
            <div
              key={stock.symbol}
              className={`flex items-center gap-2 cursor-pointer transition-colors ${
                selectedStockSymbol === stock.symbol
                  ? 'text-cyan-400 font-bold bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/50'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span className="font-mono">{stock.symbol}</span>
              <span className="font-semibold text-white">{lastCandle.close.toFixed(2)} EGP</span>
              <span className={`text-[11px] ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isUp ? '+' : ''}{changePct}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Main App Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-950/50 ring-1 ring-emerald-400/30">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                Estethmer RL
                <span className="text-xs bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 rounded-full font-medium">
                  Estethmer
                </span>
              </h1>
              <span className="text-[10px] bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 px-1.5 py-0.5 rounded font-mono font-medium">
                EGX Q-LEARNING AGENT
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Autonomous Buy / Sell / Hold Execution with Gemini High Thinking Audit
            </p>
          </div>
        </div>

        {/* Center status indicators */}
        <div className="hidden md:flex items-center gap-3 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isAutoPlaying ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
            <span className="text-slate-400">Policy:</span>
            <span className="font-semibold text-slate-200">
              {isAutoPlaying ? 'Live Auto-Trading' : 'Manual / Ready'}
            </span>
          </div>
          <div className="w-px h-4 bg-slate-800" />
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Trained:</span>
            <span className="font-semibold text-cyan-400">{totalEpisodesTrained} Episodes</span>
          </div>
          <div className="w-px h-4 bg-slate-800" />
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Currency:</span>
            <span className="font-bold text-amber-300">EGP (Egyptian Pound)</span>
          </div>
        </div>

        {/* Action Buttons & Cloud Drawer */}
        <div className="flex items-center gap-2">
          {/* Cloud Persistence & Auth Button */}
          <button
            onClick={onOpenCloud}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-800 text-emerald-300 text-xs font-semibold transition active:scale-95 shadow-sm"
            title="Google Sign-In & Firestore Persistence"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Firebase Cloud</span>
          </button>

          {/* Downloadable Institutional PDF Manual Button */}
          <button
            onClick={onOpenManual}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/80 text-indigo-300 text-xs font-semibold transition active:scale-95 shadow-sm"
            title="Download or Read Complete Institutional PDF Manual"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>PDF Manual</span>
          </button>

          <button
            onClick={onOpenAudit}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md shadow-emerald-950 transition active:scale-95"
            aria-label="Open Estethmer Gemini Deep Audit"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Estethmer Deep Audit</span>
          </button>

          <button
            onClick={onOpenChat}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition active:scale-95"
            aria-label="Open Estethmer Copilot Chat"
          >
            <Brain className="w-3.5 h-3.5 text-cyan-400" />
            <span>Estethmer Copilot</span>
          </button>
        </div>
      </div>
    </header>
  );
};
