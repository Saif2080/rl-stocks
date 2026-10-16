import React, { useState } from 'react';
import {
  FileText,
  Download,
  CheckCircle2,
  BookOpen,
  Sparkles,
  Layers,
  Brain,
  TrendingUp,
  Activity,
  Sliders,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  X,
  Printer,
} from 'lucide-react';
import { generateInstitutionalPdfManual } from '../lib/pdfManualGenerator.ts';

interface PdfManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PdfManualModal: React.FC<PdfManualModalProps> = ({ isOpen, onClose }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [activeChapter, setActiveChapter] = useState<string>('ch1');

  if (!isOpen) return null;

  const handleDownloadPdf = () => {
    setIsGenerating(true);
    setDownloadSuccess(false);

    try {
      setTimeout(() => {
        const doc = generateInstitutionalPdfManual();
        doc.save('Estethmer_EGX_RL_Institutional_Manual.pdf');
        setIsGenerating(false);
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 4000);
      }, 300);
    } catch (err) {
      console.error('Failed to generate PDF manual:', err);
      setIsGenerating(false);
    }
  };

  const chapters = [
    {
      id: 'ch1',
      title: '1. Executive Overview & Architecture',
      icon: <Brain className="w-4 h-4 text-emerald-400" />,
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-slate-300">
          <p>
            The <strong>Estethmer Quant RL</strong> platform is an institutional algorithmic execution suite designed specifically for the Egyptian Exchange (EGX). It unites mathematical reinforcement learning (Q-Learning with Bellman optimality guarantees) with modern machine learning alphas, statistical arbitrage, and macroeconomic regime analysis.
          </p>
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg space-y-1.5">
            <span className="font-bold text-white text-xs block text-emerald-400">Core Architecture Stack:</span>
            <ul className="list-disc list-inside space-y-1 text-slate-400 font-mono text-[11px]">
              <li><strong>RL Engine:</strong> Tabular Q-Learning, Softmax policy distributions, temporal-difference updates.</li>
              <li><strong>Market Data:</strong> Live Yahoo Finance & Estethmer gateway for all 10 liquid EGX equities.</li>
              <li><strong>Charting:</strong> Real-time Japanese Candlesticks (OHLC) and Regular Continuous Line/Area diagrams.</li>
              <li><strong>Telemetry:</strong> Bellman TD-error loss curves, rolling reward trajectories, and Q-value heatmaps.</li>
              <li><strong>Persistence:</strong> Firebase Cloud authentication and database syncing across devices.</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'ch2',
      title: '2. EGX Live Data & Valuation Multiples',
      icon: <TrendingUp className="w-4 h-4 text-cyan-400" />,
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-slate-300">
          <p>
            The application maintains live synchronization for all 10 liquid Egyptian Exchange (EGX) equities. Unlike systems that hardcode prices, our gateway dynamically calculates fundamentals:
          </p>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <strong className="text-white">ABUK (Abu Qir Fertilizers):</strong>
              <div className="text-emerald-400 font-bold">87.68 EGP (Live Verified)</div>
              <div className="text-slate-400">P/E: 8.2x • P/B: 2.30x • Div Yield: 7.2%</div>
            </div>
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <strong className="text-white">COMI (CIB Egypt):</strong>
              <div className="text-emerald-400 font-bold">81.20 EGP (Live)</div>
              <div className="text-slate-400">P/E: 6.8x • P/B: 1.45x • Div Yield: 5.9%</div>
            </div>
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <strong className="text-white">TMGH (Talaat Moustafa):</strong>
              <div className="text-emerald-400 font-bold">58.00 EGP (Live)</div>
              <div className="text-slate-400">P/E: 9.4x • P/B: 1.82x • Div Yield: 3.2%</div>
            </div>
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <strong className="text-white">SWDY (Elsewedy Electric):</strong>
              <div className="text-emerald-400 font-bold">47.69 EGP (Live)</div>
              <div className="text-slate-400">P/E: 7.1x • P/B: 1.58x • Div Yield: 4.8%</div>
            </div>
          </div>
          <p className="text-slate-400">
            <strong>Dynamic Multiples Formula:</strong> Live P/E = <code className="text-cyan-300 font-mono">MarketPrice / EPS</code>, Live P/B = <code className="text-cyan-300 font-mono">MarketPrice / BVPS</code>, and Live Yield = <code className="text-cyan-300 font-mono">DPS / MarketPrice</code>.
          </p>
        </div>
      ),
    },
    {
      id: 'ch3',
      title: '3. Charting: Candles vs Regular Diagram',
      icon: <Activity className="w-4 h-4 text-amber-400" />,
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-slate-300">
          <p>
            The SVG Chart Canvas supports dual visualization modes and a minimizable floating metric overlay:
          </p>
          <div className="space-y-2">
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <span className="font-bold text-white block">Candlesticks Mode:</span>
              <span className="text-slate-400">
                Displays Japanese Candlesticks with open-to-close bodies and high-low wicks. Green denotes bullish periods, red denotes bearish periods.
              </span>
            </div>
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <span className="font-bold text-white block">Regular Line / Area Diagram Mode:</span>
              <span className="text-slate-400">
                Draws a continuous price line in vibrant cyan with an area gradient fill underneath. Offers a clean view of macroeconomic trend structures.
              </span>
            </div>
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <span className="font-bold text-white block">Minimizing the Rectangular OHLC Box:</span>
              <span className="text-slate-400">
                Click <strong>"Minimize Info"</strong> in the chart toolbar or the <strong>"-"</strong> icon on the window header. The box smoothly collapses into a docked pill, ensuring zero visual obstruction of the price candles.
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'ch4',
      title: '4. Reinforcement Learning & Bellman Optimality',
      icon: <Sliders className="w-4 h-4 text-purple-400" />,
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-slate-300">
          <p>
            The tabular RL agent learns an optimal policy through temporal-difference (TD) value iteration:
          </p>
          <div className="bg-slate-950 p-3 rounded-lg border border-emerald-800 font-mono text-[11px] text-emerald-300">
            Q(s, a) ← Q(s, a) + α * [ r + γ * max Q(s', a') - Q(s, a) ]
          </div>
          <ul className="list-disc list-inside space-y-1 text-slate-400">
            <li><strong>Action Space:</strong> Action 0 (BUY 100 shares), Action 1 (HOLD current position), Action 2 (SELL position).</li>
            <li><strong>Hyperparameters:</strong> Learning Rate (α = 0.10), Discount Factor (γ = 0.95), Epsilon Exploration (ε decays from 0.30 to 0.01).</li>
            <li><strong>Reward Strategies:</strong> Differential Sharpe Ratio, Sortino Ratio, Realized PnL, Benchmark Excess Return.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'ch5',
      title: '5. Anti-Forgetting Telemetry & Heatmaps',
      icon: <Layers className="w-4 h-4 text-rose-400" />,
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-slate-300">
          <p>
            To eliminate catastrophic forgetting when market conditions shift from bull to bear regimes, the platform equips quants with real-time stability verification:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-400">
            <li><strong>Rolling Reward Trajectory:</strong> Step-by-step reward curve with 50-step moving average filter.</li>
            <li><strong>Bellman TD-Loss:</strong> Tracks gradient convergence to confirm stable policy learning.</li>
            <li><strong>2D Q-Value Heatmap:</strong> Visual matrix mapping states against actions with color-intensity gradients.</li>
            <li><strong>Softmax Policy Shares:</strong> Probability breakdown for BUY, HOLD, and SELL in the active state.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'ch6',
      title: '6. Institutional Quant Suite (4 Pillars)',
      icon: <Sparkles className="w-4 h-4 text-amber-300" />,
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-slate-300">
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <strong className="text-white block">Pillar 1: LightGBM Ranker</strong>
              <span className="text-slate-400">Multi-factor alpha model scoring momentum, quality, and liquidity.</span>
            </div>
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <strong className="text-white block">Pillar 2: Kalman Arbitrage</strong>
              <span className="text-slate-400">Dynamic hedge ratios & pairs trading (ABUK vs MFPC).</span>
            </div>
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <strong className="text-white block">Pillar 3: HMM Regime Detector</strong>
              <span className="text-slate-400">Unsupervised clustering: Bull, Neutral, Volatile, Inflation Hedge.</span>
            </div>
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <strong className="text-white block">Pillar 4: Event-Driven NLP</strong>
              <span className="text-slate-400">Real-time sentiment scoring with Google Search grounding.</span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-cyan-600 flex items-center justify-center shadow-md shadow-emerald-950">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Estethmer Quant RL • Institutional User Manual
                <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                  PDF Edition 3.8
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Complete technical reference, formulas, charting guide, and operational instructions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg active:scale-95 ${
                downloadSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white'
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>PDF Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download PDF Manual</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[420px]">
          {/* Chapter Navigation Sidebar */}
          <div className="md:col-span-4 border-r border-slate-800 bg-slate-950/40 p-3 overflow-y-auto space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
              Table of Chapters
            </div>
            {chapters.map((ch) => (
              <button
                key={ch.id}
                onClick={() => setActiveChapter(ch.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition ${
                  activeChapter === ch.id
                    ? 'bg-emerald-950/70 border border-emerald-800 text-emerald-300 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {ch.icon}
                  <span className="truncate">{ch.title}</span>
                </div>
                <ChevronRight className="w-3 h-3 shrink-0 opacity-60" />
              </button>
            ))}

            {/* Direct Quick PDF Download Box */}
            <div className="mt-4 p-3 rounded-xl bg-slate-900 border border-slate-800/80 text-xs space-y-2">
              <span className="font-bold text-white flex items-center gap-1.5 text-[11px]">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span>Instant Offline Documentation</span>
              </span>
              <p className="text-[11px] text-slate-400 leading-normal">
                Generates a multi-page PDF with table of contents, exact equations, indicator setups, and risk guidelines.
              </p>
              <button
                onClick={handleDownloadPdf}
                disabled={isGenerating}
                className="w-full py-1.5 px-3 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 rounded-lg font-bold font-mono text-[11px] flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-3 h-3" />
                <span>Save PDF (Institutional Edition)</span>
              </button>
            </div>
          </div>

          {/* Active Chapter Details */}
          <div className="md:col-span-8 p-6 overflow-y-auto space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                {chapters.find((c) => c.id === activeChapter)?.icon}
                <span>{chapters.find((c) => c.id === activeChapter)?.title}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 uppercase">
                Section Overview
              </span>
            </div>

            {chapters.find((c) => c.id === activeChapter)?.content}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>EGX Live Verified Gateway (https://esthmr.com/)</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Full Document (.pdf)</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
