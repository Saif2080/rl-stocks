import React, { useState, useMemo } from 'react';
import { MarketCandle, TradeRecord } from '../rl/types.ts';
import { Layers, Activity, TrendingUp, TrendingDown, Info, Maximize2, Minimize2, Eye, EyeOff, BarChart2 } from 'lucide-react';

interface ChartCanvasProps {
  candles: MarketCandle[];
  currentStep: number;
  trades: TradeRecord[];
  stockSymbol: string;
}

export const ChartCanvas: React.FC<ChartCanvasProps> = ({
  candles,
  currentStep,
  trades,
  stockSymbol,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [chartType, setChartType] = useState<'candles' | 'line'>('candles');
  const [isOhlcMinimized, setIsOhlcMinimized] = useState(false);
  const [showOhlcCard, setShowOhlcCard] = useState(true);
  const [showSMA, setShowSMA] = useState(true);
  const [showEMA, setShowEMA] = useState(false);
  const [showRSI, setShowRSI] = useState(true);
  const [showBB, setShowBB] = useState(false);
  const [showVolume, setShowVolume] = useState(true);
  const [showTrades, setShowTrades] = useState(true);

  // SVG dimensions
  const svgWidth = 860;
  const padding = { top: 25, right: 65, bottom: 30, left: 20 };
  const chartWidth = svgWidth - padding.left - padding.right;

  // Sub-panel heights
  const rsiHeight = showRSI ? 85 : 0;
  const volumeHeight = showVolume ? 55 : 0;
  const priceChartHeight = 290;
  const gap = 14;

  const priceTop = padding.top;
  const rsiTop = priceTop + priceChartHeight + (showRSI ? gap : 0);
  const volumeTop = rsiTop + rsiHeight + (showVolume ? gap : 0);
  const totalSvgHeight = volumeTop + volumeHeight + padding.bottom;

  // Compute price bounds
  const { minPrice, maxPrice, maxVolume } = useMemo(() => {
    if (candles.length === 0) return { minPrice: 0, maxPrice: 100, maxVolume: 1000000 };
    let min = Infinity;
    let max = -Infinity;
    let maxVol = 0;

    for (const c of candles) {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
      if (showBB && c.bbLower && c.bbLower < min) min = c.bbLower;
      if (showBB && c.bbUpper && c.bbUpper > max) max = c.bbUpper;
      if (showSMA && c.sma50 && c.sma50 < min) min = c.sma50;
      if (showSMA && c.sma50 && c.sma50 > max) max = c.sma50;
      if (c.volume > maxVol) maxVol = c.volume;
    }

    const margin = (max - min) * 0.08 || 2;
    return {
      minPrice: Math.max(0.1, min - margin),
      maxPrice: max + margin,
      maxVolume: maxVol || 1000000,
    };
  }, [candles, showBB, showSMA]);

  // Coordinate conversion functions
  const getX = (index: number) => {
    return padding.left + (index / Math.max(1, candles.length - 1)) * chartWidth;
  };

  const getY = (price: number) => {
    const range = maxPrice - minPrice || 1;
    return priceTop + (1 - (price - minPrice) / range) * priceChartHeight;
  };

  const getRsiY = (rsiVal: number) => {
    // RSI is bounded 0 to 100
    const clamped = Math.max(0, Math.min(100, rsiVal));
    return rsiTop + (1 - clamped / 100) * rsiHeight;
  };

  const getVolY = (volume: number) => {
    return volumeTop + volumeHeight - (volume / maxVolume) * volumeHeight;
  };

  const activeCandle = hoverIndex !== null ? candles[hoverIndex] : candles[currentStep] || candles[candles.length - 1];
  const activeTrade = trades.find((t) => t.step === (hoverIndex !== null ? hoverIndex : currentStep));

  // Generate Price Grid Lines (horizontal)
  const priceTicks = useMemo(() => {
    const ticks = [];
    const count = 5;
    for (let i = 0; i <= count; i++) {
      const price = minPrice + (i / count) * (maxPrice - minPrice);
      ticks.push({ price, y: getY(price) });
    }
    return ticks;
  }, [minPrice, maxPrice, priceChartHeight]);

  // Date Ticks (horizontal axis)
  const dateTicks = useMemo(() => {
    const ticks = [];
    const step = Math.max(1, Math.floor(candles.length / 6));
    for (let i = 0; i < candles.length; i += step) {
      ticks.push({ index: i, x: getX(i), label: candles[i].dateStr.split(' ')[0] + ' ' + (candles[i].dateStr.split(' ')[1] || '') });
    }
    return ticks;
  }, [candles, chartWidth]);

  // SVG Paths for SMA (Simple Moving Average 20 & 50)
  const sma20Path = useMemo(() => {
    if (!showSMA) return '';
    return candles.reduce((acc, c, idx) => {
      if (c.sma20 === undefined) return acc;
      const x = getX(idx);
      const y = getY(c.sma20);
      return acc === '' ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [candles, showSMA, minPrice, maxPrice]);

  const sma50Path = useMemo(() => {
    if (!showSMA) return '';
    return candles.reduce((acc, c, idx) => {
      if (c.sma50 === undefined) return acc;
      const x = getX(idx);
      const y = getY(c.sma50);
      return acc === '' ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [candles, showSMA, minPrice, maxPrice]);

  // Continuous Line & Area Diagram Paths
  const priceLinePath = useMemo(() => {
    if (candles.length === 0) return '';
    return candles.reduce((acc, c, idx) => {
      const x = getX(idx);
      const y = getY(c.close);
      return acc === '' ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [candles, minPrice, maxPrice, chartWidth]);

  const priceAreaPath = useMemo(() => {
    if (candles.length === 0) return '';
    const firstX = getX(0);
    const lastX = getX(candles.length - 1);
    const bottomY = priceTop + priceChartHeight;
    const linePart = candles.reduce((acc, c, idx) => {
      const x = getX(idx);
      const y = getY(c.close);
      return acc === '' ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
    return `${linePart} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [candles, minPrice, maxPrice, chartWidth, priceTop, priceChartHeight]);

  // SVG Paths for EMAs (9 & 21)
  const ema9Path = useMemo(() => {
    if (!showEMA) return '';
    return candles.reduce((acc, c, idx) => {
      if (c.ema9 === undefined) return acc;
      const x = getX(idx);
      const y = getY(c.ema9);
      return acc === '' ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [candles, showEMA, minPrice, maxPrice]);

  const ema21Path = useMemo(() => {
    if (!showEMA) return '';
    return candles.reduce((acc, c, idx) => {
      if (c.ema21 === undefined) return acc;
      const x = getX(idx);
      const y = getY(c.ema21);
      return acc === '' ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [candles, showEMA, minPrice, maxPrice]);

  // SVG Path for 14-day RSI Oscillator
  const rsiPath = useMemo(() => {
    if (!showRSI) return '';
    return candles.reduce((acc, c, idx) => {
      if (c.rsi === undefined) return acc;
      const x = getX(idx);
      const y = getRsiY(c.rsi);
      return acc === '' ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [candles, showRSI, rsiTop, rsiHeight]);

  // Bollinger Bands
  const bbAreaPath = useMemo(() => {
    if (!showBB) return '';
    const upperPoints: string[] = [];
    const lowerPoints: string[] = [];
    candles.forEach((c, idx) => {
      if (c.bbUpper !== undefined && c.bbLower !== undefined) {
        upperPoints.push(`${getX(idx)},${getY(c.bbUpper)}`);
        lowerPoints.unshift(`${getX(idx)},${getY(c.bbLower)}`);
      }
    });
    if (upperPoints.length === 0) return '';
    return `M ${upperPoints.join(' L ')} L ${lowerPoints.join(' L ')} Z`;
  }, [candles, showBB, minPrice, maxPrice]);

  const candleWidth = Math.max(2, Math.min(10, (chartWidth / candles.length) * 0.7));

  // Determine current technical setup for performance evaluation helper
  const rsiVal = activeCandle?.rsi ?? 50;
  const isOversold = rsiVal <= 35;
  const isOverbought = rsiVal >= 65;
  const priceAboveSma20 = activeCandle?.sma20 ? activeCandle.close >= activeCandle.sma20 : true;
  const priceAboveSma50 = activeCandle?.sma50 ? activeCandle.close >= activeCandle.sma50 : true;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
      {/* Top Header: Stock Symbol, Live Values, and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-bold text-white text-sm tracking-wide flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-emerald-400" />
            {stockSymbol} • Candlestick & Technical Indicators
          </span>
          <div className="hidden sm:flex items-center gap-3 text-[11px] font-mono">
            <span className="text-slate-400">
              O: <strong className="text-slate-200">{activeCandle?.open?.toFixed(2)}</strong>
            </span>
            <span className="text-slate-400">
              H: <strong className="text-slate-200">{activeCandle?.high?.toFixed(2)}</strong>
            </span>
            <span className="text-slate-400">
              L: <strong className="text-slate-200">{activeCandle?.low?.toFixed(2)}</strong>
            </span>
            <span className="text-slate-400">
              C: <strong className="text-emerald-400 font-bold">{activeCandle?.close?.toFixed(2)}</strong>
            </span>
          </div>
        </div>

        {/* Technical Indicators & View Options Toolbar */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Chart Style Toggle: Candlesticks vs Regular Line Diagram */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-[11px] font-mono mr-1 shadow-sm">
            <button
              onClick={() => setChartType('candles')}
              className={`px-3 py-1 rounded-md transition flex items-center gap-1.5 font-bold ${
                chartType === 'candles'
                  ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
              title="Japanese Candlestick Chart (Open, High, Low, Close Wicks)"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Candlesticks</span>
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1 rounded-md transition flex items-center gap-1.5 font-bold ${
                chartType === 'line'
                  ? 'bg-cyan-600 text-white shadow-sm ring-1 ring-cyan-400/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
              title="Regular Continuous Line / Area Price Diagram"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Regular Diagram</span>
            </button>
          </div>

          {/* Minimize / Expand OHLC Info Card Button */}
          <button
            onClick={() => {
              if (!showOhlcCard) {
                setShowOhlcCard(true);
                setIsOhlcMinimized(false);
              } else {
                setIsOhlcMinimized(!isOhlcMinimized);
              }
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition flex items-center gap-1.5 border shadow-sm ${
              showOhlcCard && !isOhlcMinimized
                ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700'
            }`}
            title={isOhlcMinimized ? 'Expand Floating OHLC Box' : 'Minimize Floating OHLC Box'}
          >
            {isOhlcMinimized ? (
              <>
                <Maximize2 className="w-3 h-3 text-cyan-400" />
                <span>Expand OHLC Box</span>
              </>
            ) : (
              <>
                <Minimize2 className="w-3 h-3 text-cyan-400" />
                <span>Minimize OHLC Box</span>
              </>
            )}
          </button>

          <button
            onClick={() => setShowSMA(!showSMA)}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition flex items-center gap-1.5 shadow-sm ${
              showSMA
                ? 'bg-amber-950 text-amber-300 border border-amber-700/80'
                : 'bg-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle Simple Moving Averages: SMA(20) Golden and SMA(50) Blue"
          >
            <span className="w-2 h-0.5 bg-amber-400 inline-block" />
            SMA 20/50
          </button>

          <button
            onClick={() => setShowRSI(!showRSI)}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition flex items-center gap-1.5 shadow-sm ${
              showRSI
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80'
                : 'bg-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle 14-Day Relative Strength Index (RSI) Oscillator Sub-Chart"
          >
            <span className="w-2 h-0.5 bg-cyan-400 inline-block" />
            14-Day RSI
          </button>

          <button
            onClick={() => setShowEMA(!showEMA)}
            className={`px-2 py-1 rounded text-[11px] font-medium transition flex items-center gap-1 ${
              showEMA
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                : 'bg-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            EMA 9/21
          </button>

          <button
            onClick={() => setShowBB(!showBB)}
            className={`px-2 py-1 rounded text-[11px] font-medium transition flex items-center gap-1 ${
              showBB
                ? 'bg-purple-950 text-purple-300 border border-purple-700'
                : 'bg-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            Bollinger
          </button>

          <button
            onClick={() => setShowVolume(!showVolume)}
            className={`px-2 py-1 rounded text-[11px] font-medium transition ${
              showVolume
                ? 'bg-slate-800 text-slate-200 border border-slate-700'
                : 'bg-slate-900 text-slate-600'
            }`}
          >
            Volume
          </button>

          <button
            onClick={() => setShowTrades(!showTrades)}
            className={`px-2 py-1 rounded text-[11px] font-medium transition flex items-center gap-1 ${
              showTrades
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : 'bg-slate-800 text-slate-500'
            }`}
          >
            Trades ({trades.length})
          </button>
        </div>
      </div>

      {/* Technical Evaluation Strip: Helps user evaluate Agent decisions against indicators */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg px-3 py-2 text-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 flex-wrap">
          {/* RSI Indicator Tag */}
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className="text-slate-400">RSI(14):</span>
            <span
              className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                isOversold
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                  : isOverbought
                    ? 'bg-rose-950 text-rose-300 border border-rose-700'
                    : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
              }`}
            >
              {rsiVal} • {isOversold ? 'Oversold (Buy Zone)' : isOverbought ? 'Overbought (Sell Zone)' : 'Neutral'}
            </span>
          </div>

          {/* SMA 20 / SMA 50 Values */}
          {activeCandle?.sma20 && (
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="text-amber-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                SMA(20): <strong className="text-slate-200">{activeCandle.sma20.toFixed(2)}</strong>
              </span>
              {activeCandle.sma50 && (
                <span className="text-blue-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                  SMA(50): <strong className="text-slate-200">{activeCandle.sma50.toFixed(2)}</strong>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Evaluation Insight Pill */}
        <div className="text-[11px] text-slate-300 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>
            {isOversold
              ? 'RSI indicates oversold dip — Ideal entry condition for RL BUY'
              : isOverbought
                ? 'RSI indicates overbought crest — Good condition for RL profit-taking SELL'
                : priceAboveSma50
                  ? 'Price trading above SMA 50 baseline — Bullish intermediate momentum'
                  : 'Price trading below SMA 50 — Defensive stance favored'}
          </span>
        </div>
      </div>

      {/* SVG Multi-Pane Chart */}
      <div className="relative w-full overflow-hidden bg-slate-950/90 rounded-lg border border-slate-800/80">
        <svg
          viewBox={`0 0 ${svgWidth} ${totalSvgHeight}`}
          className="w-full h-auto select-none"
          onMouseLeave={() => setHoverIndex(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clientX = e.clientX - rect.left;
            const relativeX = (clientX / rect.width) * svgWidth;
            const boundedX = Math.max(padding.left, Math.min(svgWidth - padding.right, relativeX));
            const ratio = (boundedX - padding.left) / chartWidth;
            const index = Math.round(ratio * (candles.length - 1));
            setHoverIndex(Math.max(0, Math.min(candles.length - 1, index)));
          }}
        >
          <defs>
            <linearGradient id="bbGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="rsiOverboughtGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.03" />
            </linearGradient>
            <linearGradient id="rsiOversoldGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.03" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.18" />
            </linearGradient>
            <linearGradient id="volumeGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.25" />
            </linearGradient>
            <linearGradient id="volumeRed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.25" />
            </linearGradient>
            <linearGradient id="priceAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.38" />
              <stop offset="65%" stopColor="#06b6d4" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* ================= PANE 1: PRICE & CANDLESTICKS ================= */}

          {/* Price Grid Lines */}
          {priceTicks.map((t, idx) => (
            <g key={idx}>
              <line
                x1={padding.left}
                y1={t.y}
                x2={svgWidth - padding.right}
                y2={t.y}
                stroke="#1e293b"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <text
                x={svgWidth - padding.right + 8}
                y={t.y + 4}
                fill="#64748b"
                fontSize="10"
                fontFamily="monospace"
              >
                {t.price.toFixed(1)}
              </text>
            </g>
          ))}

          {/* Date Axis Grid Lines across Price Chart */}
          {dateTicks.map((t, idx) => (
            <g key={idx}>
              <line
                x1={t.x}
                y1={priceTop}
                x2={t.x}
                y2={priceTop + priceChartHeight}
                stroke="#1e293b"
                strokeDasharray="2 4"
                strokeWidth="1"
              />
            </g>
          ))}

          {/* Bollinger Bands Shaded Area */}
          {showBB && bbAreaPath && (
            <path d={bbAreaPath} fill="url(#bbGradient)" stroke="none" />
          )}

          {/* Regular Line & Area Diagram */}
          {chartType === 'line' && (
            <g>
              {priceAreaPath && (
                <path d={priceAreaPath} fill="url(#priceAreaGrad)" />
              )}
              {priceLinePath && (
                <path
                  d={priceLinePath}
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {/* Glowing point on current step */}
              {candles[currentStep] && (
                <g>
                  <circle
                    cx={getX(currentStep)}
                    cy={getY(candles[currentStep].close)}
                    r="6"
                    fill="#06b6d4"
                    opacity="0.35"
                  />
                  <circle
                    cx={getX(currentStep)}
                    cy={getY(candles[currentStep].close)}
                    r="3.5"
                    fill="#ffffff"
                    stroke="#06b6d4"
                    strokeWidth="2"
                  />
                </g>
              )}
            </g>
          )}

          {/* Japanese Candlesticks */}
          {chartType === 'candles' &&
            candles.map((c, idx) => {
              const x = getX(idx);
              const isGreen = c.close >= c.open;
              const color = isGreen ? '#10b981' : '#f43f5e';
              const topY = getY(Math.max(c.open, c.close));
              const bottomY = getY(Math.min(c.open, c.close));
              const highY = getY(c.high);
              const lowY = getY(c.low);
              const height = Math.max(1.5, bottomY - topY);

              return (
                <g key={idx} opacity={idx > currentStep ? 0.35 : 1}>
                  {/* High-Low Wick */}
                  <line
                    x1={x}
                    y1={highY}
                    x2={x}
                    y2={lowY}
                    stroke={color}
                    strokeWidth="1.2"
                  />
                  {/* Body */}
                  <rect
                    x={x - candleWidth / 2}
                    y={topY}
                    width={candleWidth}
                    height={height}
                    fill={isGreen ? '#10b981' : '#f43f5e'}
                    rx="1"
                  />
                </g>
              );
            })}

          {/* SMA 20 Line (Amber) */}
          {showSMA && sma20Path && (
            <path
              d={sma20Path}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              opacity="0.9"
            />
          )}

          {/* SMA 50 Line (Blue) */}
          {showSMA && sma50Path && (
            <path
              d={sma50Path}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              opacity="0.85"
            />
          )}

          {/* EMA 9 / 21 Lines */}
          {showEMA && ema9Path && (
            <path
              d={ema9Path}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="1.6"
              opacity="0.85"
            />
          )}
          {showEMA && ema21Path && (
            <path
              d={ema21Path}
              fill="none"
              stroke="#ec4899"
              strokeWidth="1.6"
              opacity="0.85"
            />
          )}

          {/* Price Chart Indicator Legend (Top-Left inside Chart) */}
          <g transform={`translate(${padding.left + 8}, ${priceTop + 16})`}>
            {showSMA && (
              <>
                <circle cx="4" cy="0" r="3.5" fill="#f59e0b" />
                <text x="12" y="3" fill="#fbbf24" fontSize="9" fontWeight="bold" fontFamily="monospace">
                  SMA 20
                </text>
                <circle cx="64" cy="0" r="3.5" fill="#3b82f6" />
                <text x="72" y="3" fill="#60a5fa" fontSize="9" fontWeight="bold" fontFamily="monospace">
                  SMA 50
                </text>
              </>
            )}
            {showEMA && (
              <>
                <circle cx={showSMA ? 130 : 4} cy="0" r="3.5" fill="#06b6d4" />
                <text x={showSMA ? 138 : 12} y="3" fill="#22d3ee" fontSize="9" fontWeight="bold" fontFamily="monospace">
                  EMA 9
                </text>
                <circle cx={showSMA ? 180 : 54} cy="0" r="3.5" fill="#ec4899" />
                <text x={showSMA ? 188 : 62} y="3" fill="#f472b6" fontSize="9" fontWeight="bold" fontFamily="monospace">
                  EMA 21
                </text>
              </>
            )}
          </g>

          {/* Current Step Active Scrub Line */}
          {currentStep >= 0 && currentStep < candles.length && (
            <g>
              <line
                x1={getX(currentStep)}
                y1={priceTop}
                x2={getX(currentStep)}
                y2={priceTop + priceChartHeight}
                stroke="#10b981"
                strokeWidth="1.8"
                strokeDasharray="4 2"
              />
              <circle
                cx={getX(currentStep)}
                cy={getY(candles[currentStep].close)}
                r="4.5"
                fill="#10b981"
                stroke="#022c22"
                strokeWidth="2"
              />
            </g>
          )}

          {/* Trade Execution Markers on Price Chart */}
          {showTrades &&
            trades.map((t) => {
              if (t.step >= candles.length) return null;
              const x = getX(t.step);
              const candle = candles[t.step];
              const isBuy = t.action === 'BUY';
              const y = isBuy ? getY(candle.low) + 16 : getY(candle.high) - 16;

              return (
                <g key={t.id} className="cursor-pointer">
                  {isBuy ? (
                    // Green Arrow Up
                    <path
                      d={`M ${x} ${y - 12} L ${x - 6} ${y} L ${x + 6} ${y} Z`}
                      fill="#10b981"
                      stroke="#064e3b"
                      strokeWidth="1"
                    />
                  ) : (
                    // Red Arrow Down
                    <path
                      d={`M ${x} ${y + 12} L ${x - 6} ${y} L ${x + 6} ${y} Z`}
                      fill="#f43f5e"
                      stroke="#881337"
                      strokeWidth="1"
                    />
                  )}
                  <text
                    x={x}
                    y={isBuy ? y + 10 : y - 6}
                    fill={isBuy ? '#34d399' : '#fb7185'}
                    fontSize="9"
                    fontWeight="bold"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    {isBuy ? 'BUY' : 'SELL'}
                  </text>
                </g>
              );
            })}

          {/* ================= PANE 2: 14-DAY RSI OSCILLATOR ================= */}
          {showRSI && (
            <g>
              {/* Divider / Panel Frame */}
              <line
                x1={padding.left}
                y1={rsiTop}
                x2={svgWidth - padding.right}
                y2={rsiTop}
                stroke="#334155"
                strokeWidth="1"
              />

              {/* Shaded Overbought Zone (70 to 100) */}
              <rect
                x={padding.left}
                y={getRsiY(100)}
                width={chartWidth}
                height={getRsiY(70) - getRsiY(100)}
                fill="url(#rsiOverboughtGrad)"
              />

              {/* Shaded Oversold Zone (0 to 30) */}
              <rect
                x={padding.left}
                y={getRsiY(30)}
                width={chartWidth}
                height={getRsiY(0) - getRsiY(30)}
                fill="url(#rsiOversoldGrad)"
              />

              {/* Overbought Level 70 */}
              <line
                x1={padding.left}
                y1={getRsiY(70)}
                x2={svgWidth - padding.right}
                y2={getRsiY(70)}
                stroke="#f43f5e"
                strokeWidth="0.9"
                strokeDasharray="4 3"
                opacity="0.8"
              />
              <text
                x={svgWidth - padding.right + 8}
                y={getRsiY(70) + 3}
                fill="#f43f5e"
                fontSize="9"
                fontFamily="monospace"
              >
                70 OB
              </text>

              {/* Midline Level 50 */}
              <line
                x1={padding.left}
                y1={getRsiY(50)}
                x2={svgWidth - padding.right}
                y2={getRsiY(50)}
                stroke="#475569"
                strokeWidth="0.8"
                strokeDasharray="2 4"
              />
              <text
                x={svgWidth - padding.right + 8}
                y={getRsiY(50) + 3}
                fill="#64748b"
                fontSize="9"
                fontFamily="monospace"
              >
                50
              </text>

              {/* Oversold Level 30 */}
              <line
                x1={padding.left}
                y1={getRsiY(30)}
                x2={svgWidth - padding.right}
                y2={getRsiY(30)}
                stroke="#10b981"
                strokeWidth="0.9"
                strokeDasharray="4 3"
                opacity="0.8"
              />
              <text
                x={svgWidth - padding.right + 8}
                y={getRsiY(30) + 3}
                fill="#10b981"
                fontSize="9"
                fontFamily="monospace"
              >
                30 OS
              </text>

              {/* RSI Continuous Curve */}
              {rsiPath && (
                <path
                  d={rsiPath}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="1.8"
                />
              )}

              {/* Active Dot on RSI curve */}
              {currentStep < candles.length && candles[currentStep]?.rsi !== undefined && (
                <circle
                  cx={getX(currentStep)}
                  cy={getRsiY(candles[currentStep].rsi!)}
                  r="3.5"
                  fill="#06b6d4"
                  stroke="#083344"
                  strokeWidth="1.5"
                />
              )}

              {/* RSI Label */}
              <text
                x={padding.left + 5}
                y={rsiTop + 14}
                fill="#06b6d4"
                fontSize="9"
                fontWeight="bold"
                fontFamily="monospace"
              >
                14-DAY RSI ({activeCandle?.rsi ?? 50})
              </text>
            </g>
          )}

          {/* ================= PANE 3: VOLUME HISTOGRAM ================= */}
          {showVolume && (
            <g>
              <line
                x1={padding.left}
                y1={volumeTop}
                x2={svgWidth - padding.right}
                y2={volumeTop}
                stroke="#334155"
                strokeWidth="0.8"
              />
              <text
                x={padding.left + 5}
                y={volumeTop + 12}
                fill="#64748b"
                fontSize="9"
                fontFamily="monospace"
              >
                VOLUME
              </text>
              {candles.map((c, idx) => {
                const x = getX(idx);
                const isGreen = c.close >= c.open;
                const barY = getVolY(c.volume);
                const barHeight = volumeTop + volumeHeight - barY;
                return (
                  <rect
                    key={idx}
                    x={x - candleWidth / 2}
                    y={barY}
                    width={candleWidth}
                    height={Math.max(1, barHeight)}
                    fill={isGreen ? 'url(#volumeGreen)' : 'url(#volumeRed)'}
                    opacity={idx > currentStep ? 0.35 : 1}
                  />
                );
              })}
            </g>
          )}

          {/* Date Ticks on Bottom Axis */}
          {dateTicks.map((t, idx) => (
            <g key={idx}>
              <line
                x1={t.x}
                y1={totalSvgHeight - padding.bottom}
                x2={t.x}
                y2={totalSvgHeight - padding.bottom + 4}
                stroke="#475569"
                strokeWidth="1"
              />
              <text
                x={t.x}
                y={totalSvgHeight - 10}
                textAnchor="middle"
                fill="#64748b"
                fontSize="10"
                fontFamily="monospace"
              >
                {t.label}
              </text>
            </g>
          ))}

          {/* Crosshair Cursor on Hover */}
          {hoverIndex !== null && hoverIndex < candles.length && (
            <g>
              <line
                x1={getX(hoverIndex)}
                y1={priceTop}
                x2={getX(hoverIndex)}
                y2={totalSvgHeight - padding.bottom}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <line
                x1={padding.left}
                y1={getY(candles[hoverIndex].close)}
                x2={svgWidth - padding.right}
                y2={getY(candles[hoverIndex].close)}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
            </g>
          )}
        </svg>

        {/* Floating Tooltip Card (Minimizable & Dismissible) */}
        {showOhlcCard && activeCandle && (
          isOhlcMinimized ? (
            <div
              onClick={() => setIsOhlcMinimized(false)}
              className="absolute top-2 right-14 bg-slate-900/95 border border-cyan-800/80 hover:border-cyan-400 rounded-lg px-3 py-1.5 text-[11px] font-mono shadow-xl backdrop-blur-md z-10 flex items-center gap-2.5 cursor-pointer transition select-none group"
              title="Click to expand full Date, Close, Open, High, Low, Volume window"
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-slate-300 font-medium">OHLC Box:</span>
              <span className="text-emerald-400 font-bold">{activeCandle.close.toFixed(2)} EGP</span>
              <span className="text-slate-400 hidden sm:inline">({activeCandle.dateStr})</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOhlcMinimized(false);
                }}
                className="px-2 py-0.5 rounded bg-slate-800 group-hover:bg-cyan-950 text-cyan-400 text-[10px] font-bold flex items-center gap-1 transition"
                title="Expand OHLC Details"
              >
                <Maximize2 className="w-3 h-3" />
                <span>Expand</span>
              </button>
            </div>
          ) : (
            <div className="absolute top-2 right-14 bg-slate-900/95 border border-slate-700/80 rounded-xl p-3 text-[11px] shadow-2xl backdrop-blur-md z-10 w-64 font-mono">
              <div className="text-slate-300 font-bold border-b border-slate-800 pb-1.5 mb-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-white">{activeCandle.dateStr}</span>
                  <span className="text-cyan-400 text-[10px]">#s{hoverIndex !== null ? hoverIndex : currentStep}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsOhlcMinimized(true)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1 text-[10px] font-sans"
                    title="Minimize OHLC window"
                  >
                    <Minimize2 className="w-3 h-3 text-cyan-400" />
                    <span>Minimize</span>
                  </button>
                  <button
                    onClick={() => setShowOhlcCard(false)}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition"
                    title="Hide window"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-slate-400">
                <span>Close:</span>
                <span className="text-white font-bold text-right">{activeCandle.close.toFixed(2)} EGP</span>
                <span>Open:</span>
                <span className="text-right">{activeCandle.open.toFixed(2)}</span>
                <span>High:</span>
                <span className="text-right text-emerald-400">{activeCandle.high.toFixed(2)}</span>
                <span>Low:</span>
                <span className="text-right text-rose-400">{activeCandle.low.toFixed(2)}</span>
                <span>Volume:</span>
                <span className="text-right text-slate-300">{(activeCandle.volume / 1000).toFixed(0)}k</span>

                {/* Technical Indicator Values */}
                <span className="text-cyan-400 font-bold">14-Day RSI:</span>
                <span
                  className={`text-right font-bold ${
                    activeCandle.rsi && activeCandle.rsi > 65
                      ? 'text-rose-400'
                      : activeCandle.rsi && activeCandle.rsi < 35
                        ? 'text-emerald-400'
                        : 'text-cyan-300'
                  }`}
                >
                  {activeCandle.rsi}
                </span>

                {activeCandle.sma20 && (
                  <>
                    <span className="text-amber-400">SMA(20):</span>
                    <span className="text-right text-amber-300">{activeCandle.sma20.toFixed(2)}</span>
                  </>
                )}

                {activeCandle.sma50 && (
                  <>
                    <span className="text-blue-400">SMA(50):</span>
                    <span className="text-right text-blue-300">{activeCandle.sma50.toFixed(2)}</span>
                  </>
                )}
              </div>

              {activeTrade && (
                <div
                  className={`mt-1.5 pt-1.5 border-t border-slate-800 font-bold ${
                    activeTrade.action === 'BUY' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {activeTrade.action} {activeTrade.shares} shares @ {activeTrade.price.toFixed(2)} EGP
                  {activeTrade.pnlRealized !== undefined && (
                    <div className="text-[10px]">
                      PnL: {activeTrade.pnlRealized > 0 ? '+' : ''}{activeTrade.pnlRealized.toFixed(2)} EGP
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
};
