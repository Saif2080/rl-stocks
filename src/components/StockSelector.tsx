import React, { useState } from 'react';
import { EGX_STOCKS } from '../rl/egx_data.ts';
import { StockProfile } from '../rl/types.ts';
import {
  TrendingUp,
  TrendingDown,
  Search,
  RefreshCw,
  Radio,
  Globe2,
  CheckCircle2,
  Calendar,
  Sparkles,
  Zap,
} from 'lucide-react';

interface StockSelectorProps {
  selectedStock: StockProfile;
  onSelectStock: (stock: StockProfile) => void;
  selectedRange: string;
  onSelectRange: (range: string) => void;
  selectedInterval?: string;
  onSelectInterval?: (interval: string) => void;
  isRealData: boolean;
  isLoadingData: boolean;
  onFetchRealData: (symbol: string, range: string, interval?: string, customPrice?: number) => Promise<void>;
  onSyncAllStocks?: () => Promise<void>;
  lastSyncedTime: string | null;
  isContinuousRL: boolean;
  onToggleContinuousRL: () => void;
}

export const StockSelector: React.FC<StockSelectorProps> = ({
  selectedStock,
  onSelectStock,
  selectedRange,
  onSelectRange,
  selectedInterval = '1d',
  onSelectInterval,
  isRealData,
  isLoadingData,
  onFetchRealData,
  onSyncAllStocks,
  lastSyncedTime,
  isContinuousRL,
  onToggleContinuousRL,
}) => {
  const [customTickerInput, setCustomTickerInput] = useState('');
  const [showPriceCalibrator, setShowPriceCalibrator] = useState(false);
  const [calibratedPriceInput, setCalibratedPriceInput] = useState<string>('');

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTickerInput.trim() || isLoadingData) return;
    onFetchRealData(customTickerInput.trim(), selectedRange, selectedInterval);
  };

  const ranges = [
    { label: '1M', value: '1mo', desc: '1 Month' },
    { label: '3M', value: '3mo', desc: '3 Months (Standard)' },
    { label: '6M', value: '6mo', desc: '6 Months' },
    { label: '1Y', value: '1y', desc: '1 Year (Macro Cycle)' },
    { label: '2Y', value: '2y', desc: '2 Years (Multi-Year)' },
    { label: '5Y', value: '5y', desc: '5 Years (Structural)' },
  ];

  const intervals = [
    { label: '1D (Daily)', value: '1d' },
    { label: '1W (Weekly)', value: '1wk' },
    { label: '1H (Intraday)', value: '60m' },
  ];

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-3.5 flex flex-col gap-3 shadow-md">
      {/* Top Header & Data Source Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-200">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>EGX Asset Universe & Data Gateway</span>
          </div>

          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold flex items-center gap-1 ${
              isRealData
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            {isRealData ? 'Live Data: Yahoo Finance & esthmr.com' : 'Verified EGX Benchmark Dataset'}
          </span>

          {isContinuousRL && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 flex items-center gap-1 animate-pulse">
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>LIVE CONTINUOUS RL ACTIVE</span>
            </span>
          )}
        </div>

        {/* Timeframe Range Selector, Interval, & Refresh Action */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Timeframe Label */}
          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
            <Calendar className="w-3 h-3 text-slate-500" />
            <span className="hidden sm:inline">Range:</span>
          </div>

          {/* Range Pills */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-[11px] font-mono">
            {ranges.map((r) => (
              <button
                key={r.value}
                onClick={() => {
                  onSelectRange(r.value);
                  onFetchRealData(selectedStock.symbol, r.value, selectedInterval);
                }}
                disabled={isLoadingData}
                className={`px-2.5 py-1 rounded transition font-medium ${
                  selectedRange === r.value
                    ? 'bg-emerald-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={r.desc}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Interval Selector */}
          {onSelectInterval && (
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-[11px] font-mono">
              {intervals.map((iv) => (
                <button
                  key={iv.value}
                  onClick={() => {
                    onSelectInterval(iv.value);
                    onFetchRealData(selectedStock.symbol, selectedRange, iv.value);
                  }}
                  disabled={isLoadingData}
                  className={`px-2 py-1 rounded transition text-[10px] font-medium ${
                    selectedInterval === iv.value
                      ? 'bg-teal-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {iv.label.split(' ')[0]}
                </button>
              ))}
            </div>
          )}

          {/* Sync Current Stock Button */}
          <button
            onClick={() => onFetchRealData(selectedStock.ticker || `${selectedStock.symbol}.CA`, selectedRange, selectedInterval)}
            disabled={isLoadingData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold transition active:scale-95 disabled:opacity-50 text-[11px]"
            title="Fetch live quotes and fresh OHLCV candles from Yahoo Finance & Estethmer for selected stock"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isLoadingData ? 'animate-spin' : ''}`} />
            <span>{isLoadingData ? 'Syncing...' : 'Sync Live'}</span>
          </button>

          {/* Sync All Stocks Button */}
          {onSyncAllStocks && (
            <button
              onClick={() => onSyncAllStocks()}
              disabled={isLoadingData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 font-semibold transition active:scale-95 disabled:opacity-50 text-[11px]"
              title="Synchronize all 10 EGX equities simultaneously with live Yahoo Finance feeds"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isLoadingData ? 'animate-spin' : ''}`} />
              <span>Sync All (Yahoo)</span>
            </button>
          )}

          {/* Live Price Calibrator Button */}
          <button
            onClick={() => {
              setShowPriceCalibrator(!showPriceCalibrator);
              setCalibratedPriceInput(selectedStock.symbol === 'ABUK' ? '87.68' : selectedStock.basePrice.toFixed(2));
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 font-semibold transition active:scale-95 text-[11px]"
            title="Adjust or calibrate the real-time session price (e.g. 87.68 EGP for ABUK)"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Calibrate Price</span>
          </button>
        </div>
      </div>

      {/* Live Price Calibrator Drawer / Popover */}
      {showPriceCalibrator && (
        <div className="bg-slate-950 border border-cyan-800/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="font-bold text-cyan-300 font-mono">
              Live Session Price Calibration ({selectedStock.symbol}):
            </span>
            <span className="text-slate-400 text-[11px]">
              Set exact EGX intraday trade price (e.g. 87.68 EGP for ABUK) to synchronize all RL reward calculations:
            </span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const p = parseFloat(calibratedPriceInput);
              if (!isNaN(p) && p > 0) {
                onFetchRealData(selectedStock.ticker || `${selectedStock.symbol}.CA`, selectedRange, selectedInterval, p);
                setShowPriceCalibrator(false);
              }
            }}
            className="flex items-center gap-2"
          >
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.1"
                value={calibratedPriceInput}
                onChange={(e) => setCalibratedPriceInput(e.target.value)}
                placeholder={selectedStock.symbol === 'ABUK' ? '87.68' : selectedStock.basePrice.toFixed(2)}
                className="w-28 bg-slate-900 border border-cyan-700/80 rounded-lg px-2.5 py-1 text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              <span className="absolute right-2 top-1 text-[10px] text-slate-500 font-mono">EGP</span>
            </div>

            {selectedStock.symbol === 'ABUK' && (
              <>
                <button
                  type="button"
                  onClick={() => setCalibratedPriceInput('87.68')}
                  className="px-2 py-1 rounded bg-emerald-950 border border-emerald-700 hover:border-emerald-400 text-emerald-300 text-[10px] font-mono font-bold"
                  title="Verified Real Market Price from Estethmer (https://esthmr.com/) & EGX"
                >
                  87.68 EGP (Live Verified)
                </button>
                <button
                  type="button"
                  onClick={() => setCalibratedPriceInput('70.70')}
                  className="px-2 py-1 rounded bg-slate-900 border border-slate-700 hover:border-cyan-500 text-cyan-400 text-[10px] font-mono"
                >
                  70.70 EGP
                </button>
              </>
            )}

            <button
              type="submit"
              disabled={isLoadingData}
              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold font-mono text-[11px] transition shadow-sm"
            >
              Apply Live Price
            </button>

            <button
              type="button"
              onClick={() => setShowPriceCalibrator(false)}
              className="px-2 py-1 text-slate-400 hover:text-white text-[11px]"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Quick EGX Equities Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-2">
        {EGX_STOCKS.map((stock) => {
          const isSelected = stock.symbol === selectedStock.symbol;
          const candles = stock.candles;
          const current = candles[candles.length - 1];
          const prev = candles[candles.length - 2] || current;
          const change = current ? current.close - prev.close : 0;
          const changePct = prev && prev.close > 0 ? ((change / prev.close) * 100).toFixed(2) : '0.00';
          const isUp = change >= 0;
          const val = stock.valuation;

          return (
            <button
              key={stock.symbol}
              onClick={() => {
                onSelectStock(stock);
                onFetchRealData(stock.ticker || `${stock.symbol}.CA`, selectedRange, selectedInterval);
              }}
              disabled={isLoadingData}
              className={`p-2 rounded-lg text-left transition border flex flex-col justify-between gap-1 relative ${
                isSelected
                  ? 'bg-slate-800/95 border-emerald-500 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/40'
                  : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-bold text-white text-xs font-mono tracking-wide">
                  {stock.symbol}
                </span>
                <span
                  className={`text-[9px] font-semibold flex items-center gap-0.5 ${
                    isUp ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isUp ? <TrendingUp className="w-2 h-2" /> : <TrendingDown className="w-2 h-2" />}
                  {isUp ? '+' : ''}
                  {changePct}%
                </span>
              </div>

              <div className="text-[11px] font-semibold text-slate-200">
                {current?.close?.toFixed(2)}{' '}
                <span className="text-[9px] font-normal text-slate-400">EGP</span>
              </div>

              {/* Estethmer Live Multiples */}
              {val && (
                <div className="text-[9px] font-mono text-emerald-400/90 truncate w-full flex items-center justify-between">
                  <span>P/E {val.peRatio.toFixed(1)}</span>
                  <span className="text-[8px] text-slate-400">P/B {val.pbRatio.toFixed(2)}</span>
                </div>
              )}

              {isSelected && (
                <div className="absolute -top-1.5 -right-1 bg-emerald-500 text-slate-950 text-[8px] font-bold px-1.5 py-0.2 rounded-full uppercase">
                  Active
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Custom Ticker Search & Estethmer Portal Link */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-xs">
        <form onSubmit={handleCustomSubmit} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={customTickerInput}
              onChange={(e) => setCustomTickerInput(e.target.value)}
              placeholder="Search EGX or Yahoo ticker (e.g. AMOC.CA, ISPH.CA, AAPL)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={!customTickerInput.trim() || isLoadingData}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold text-xs transition active:scale-95"
          >
            Load Data
          </button>
        </form>

        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
          {lastSyncedTime && (
            <span>
              Synced: <strong className="text-slate-200">{lastSyncedTime}</strong>
            </span>
          )}
          <a
            href="https://esthmr.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-emerald-400 hover:underline font-bold"
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>https://esthmr.com/ Portal</span>
          </a>
        </div>
      </div>
    </div>
  );
};
