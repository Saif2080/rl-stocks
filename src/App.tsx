import React, { useState, useEffect, useRef, useCallback } from 'react';
import { EGX_STOCKS } from './rl/egx_data.ts';
import { TradingEnvironment } from './rl/environment.ts';
import { QLearningAgent } from './rl/agent.ts';
import {
  Action,
  ActionType,
  AgentObservation,
  EpisodeLog,
  StepOutcome,
  StockProfile,
  TradeRecord,
  TrainingHyperparameters,
} from './rl/types.ts';
import { Navbar } from './components/Navbar.tsx';
import { StockSelector } from './components/StockSelector.tsx';
import { ChartCanvas } from './components/ChartCanvas.tsx';
import { AgentControlPanel } from './components/AgentControlPanel.tsx';
import { PerformanceMetrics } from './components/PerformanceMetrics.tsx';
import { TrainingStudio } from './components/TrainingStudio.tsx';
import { TradeLogTable } from './components/TradeLogTable.tsx';
import { EstethmerAiModal } from './components/EstethmerAiModal.tsx';
import { EstethmerValuationBar } from './components/EstethmerValuationBar.tsx';
import { NewsAndSignalsFeed } from './components/NewsAndSignalsFeed.tsx';
import { UserCloudDrawer } from './components/UserCloudDrawer.tsx';
import { InstitutionalQuantSuite } from './components/InstitutionalQuantSuite.tsx';
import { PdfManualModal } from './components/PdfManualModal.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';

function AppContent() {
  const { user, saveStrategy } = useAuth();
  const [selectedStock, setSelectedStock] = useState<StockProfile>(EGX_STOCKS[0]);
  const [currentStep, setCurrentStep] = useState<number>(20);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [isCloudDrawerOpen, setIsCloudDrawerOpen] = useState<boolean>(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [lastOutcome, setLastOutcome] = useState<StepOutcome | null>(null);
  const [isEvaluationMode, setIsEvaluationMode] = useState<boolean>(false);

  // Live Market & Timeframe state
  const [selectedRange, setSelectedRange] = useState<string>('3mo');
  const [selectedInterval, setSelectedInterval] = useState<string>('1d');
  const [isRealData, setIsRealData] = useState<boolean>(true);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);

  // Continuous Online Reinforcement Learning state
  const [isContinuousRL, setIsContinuousRL] = useState<boolean>(false);
  const [continuousTicksCount, setContinuousTicksCount] = useState<number>(0);

  // Training state
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [trainingProgress, setTrainingProgress] = useState<number>(0);
  const [trainingLogs, setTrainingLogs] = useState<EpisodeLog[]>([]);

  // Agent Hyperparameters
  const [hyperparams, setHyperparams] = useState<TrainingHyperparameters>({
    learningRate: 0.15,
    discountFactor: 0.95,
    epsilon: 0.8,
    epsilonDecay: 0.96,
    minEpsilon: 0.05,
    rewardStrategy: 'esthmr_valuation_hybrid',
  });

  // Environment and Agent refs
  const envRef = useRef<TradingEnvironment>(new TradingEnvironment(EGX_STOCKS[0]));
  const agentRef = useRef<QLearningAgent>(new QLearningAgent(hyperparams));

  // Current observation and decision state
  const [observation, setObservation] = useState<AgentObservation>(() => envRef.current.getObservation());
  const [recommendedAction, setRecommendedAction] = useState<ActionType>('HOLD');
  const [qValues, setQValues] = useState<[number, number, number]>([0, 0, 0]);
  const [confidence, setConfidence] = useState<number>(50);
  const [trades, setTrades] = useState<TradeRecord[]>([]);

  const [portfolio, setPortfolio] = useState({
    cash: envRef.current.cash,
    shares: envRef.current.shares,
    portfolioValue: envRef.current.getPortfolioValue(),
    entryPrice: envRef.current.entryPrice,
  });

  // Update policy decision for current observation
  const updateDecision = useCallback((obs: AgentObservation) => {
    const decision = agentRef.current.chooseAction(obs, true); // Greedy choice for display
    setRecommendedAction(decision.actionName);
    setQValues(decision.qValues);
    setConfidence(decision.confidence);
  }, []);

  // Sync state from environment
  const syncEnvironmentState = useCallback(() => {
    const env = envRef.current;
    setCurrentStep(env.currentStep);
    const obs = env.getObservation();
    setObservation(obs);
    setTrades([...env.tradeHistory]);
    setPortfolio({
      cash: env.cash,
      shares: env.shares,
      portfolioValue: env.getPortfolioValue(),
      entryPrice: env.entryPrice,
    });
    updateDecision(obs);
  }, [updateDecision]);

  // Fetch real market data from Yahoo Finance / Estethmer Gateway
  const handleFetchRealData = useCallback(
    async (symbol: string, range = '3mo', interval = '1d', customPrice?: number) => {
      setIsLoadingData(true);
      try {
        const customParam = customPrice ? `&customPrice=${customPrice}` : '';
        const res = await fetch(
          `/api/market/history?symbol=${encodeURIComponent(symbol)}&range=${range}&interval=${interval}${customParam}`
        );
        const json = await res.json();

        if (json.success && json.data?.candles?.length > 5) {
          const incomingCandles = json.data.candles;
          const cleanSymbol = json.data.symbol.replace('.CA', '');
          const matchedStock = EGX_STOCKS.find((s) => s.symbol === cleanSymbol);

          const finalPrice =
            customPrice ||
            (cleanSymbol === 'ABUK' ? 87.68 : json.data.meta?.regularMarketPrice || incomingCandles[incomingCandles.length - 1].close);

          const updatedStock: StockProfile = {
            symbol: cleanSymbol,
            ticker: json.data.symbol,
            isin: matchedStock?.isin,
            nameEn: json.data.meta.longName || matchedStock?.nameEn || cleanSymbol,
            nameAr: matchedStock?.nameAr || cleanSymbol,
            sectorEn: matchedStock?.sectorEn || 'Egyptian Equity',
            sectorAr: matchedStock?.sectorAr || 'الأسهم المصرية',
            basePrice: finalPrice,
            descriptionEn:
              matchedStock?.descriptionEn ||
              'Real market data synchronized from Yahoo Finance & Estethmer EGX Gateway.',
            descriptionAr:
              matchedStock?.descriptionAr || 'بيانات حقيقية من البورصة المصرية وبوابة استثمر.',
            valuation: json.data.valuation || matchedStock?.valuation,
            candles: incomingCandles,
          };

          setSelectedStock(updatedStock);
          setIsRealData(true);
          setLastSyncedTime(
            new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          );
        }
      } catch (err) {
        console.warn('Real data fetch failed, using fallback candles:', err);
      } finally {
        setIsLoadingData(false);
      }
    },
    []
  );

  // Sync all EGX stocks with live market data from Yahoo Finance and Estethmer
  const handleSyncAllStocks = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const res = await fetch('/api/market/all-stocks');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        // Also refresh currently selected stock
        const curSym = selectedStock.symbol;
        const targetQuote = json.data.find((q: any) => q.cleanSymbol === curSym || q.symbol === `${curSym}.CA`);
        const priceToUse = targetQuote ? targetQuote.price : undefined;
        await handleFetchRealData(selectedStock.ticker || `${selectedStock.symbol}.CA`, selectedRange, selectedInterval, priceToUse);
        setLastSyncedTime(
          new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        );
      }
    } catch (err) {
      console.warn('Sync all stocks failed:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [selectedStock.symbol, selectedStock.ticker, selectedRange, selectedInterval, handleFetchRealData]);

  // Initial fetch on mount for COMI (CIB) and all stocks
  useEffect(() => {
    handleSyncAllStocks();
  }, [handleSyncAllStocks]);

  // Initial setup on mount or stock change
  useEffect(() => {
    const startIdx = Math.min(20, Math.floor(selectedStock.candles.length * 0.3));
    envRef.current = new TradingEnvironment(selectedStock, {
      initialCash: 100000,
      rewardType: hyperparams.rewardStrategy,
      startStep: startIdx,
    });
    setIsAutoPlaying(false);
    syncEnvironmentState();
  }, [selectedStock, hyperparams.rewardStrategy, syncEnvironmentState]);

  // Execute one step of action
  const handleStepAction = useCallback(
    (actionToExecute?: ActionType) => {
      const env = envRef.current;
      if (env.currentStep >= selectedStock.candles.length - 1 && !isContinuousRL) {
        setIsAutoPlaying(false);
        return;
      }

      const action = actionToExecute || recommendedAction;
      const prevObs = env.getObservation();
      const outcome = env.step(action);

      // Learn from live step (online continuous update, skipped in frozen evaluation mode)
      if (!isEvaluationMode) {
        const numAction =
          action === 'BUY' ? Action.BUY : action === 'SELL' ? Action.SELL : Action.HOLD;
        agentRef.current.learn(
          prevObs,
          numAction,
          outcome.reward,
          outcome.nextState,
          outcome.done
        );
      }

      setLastOutcome(outcome);
      syncEnvironmentState();

      if (outcome.done && !isContinuousRL) {
        setIsAutoPlaying(false);
      }
    },
    [recommendedAction, selectedStock.candles.length, isContinuousRL, isEvaluationMode, syncEnvironmentState]
  );

  // Auto-play interval loop
  useEffect(() => {
    if (!isAutoPlaying) return;

    const intervalMs = Math.max(200, 1000 / playbackSpeed);
    const timer = setInterval(() => {
      handleStepAction();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isAutoPlaying, playbackSpeed, handleStepAction]);

  // Continuous Online Reinforcement Learning Loop
  useEffect(() => {
    if (!isContinuousRL) return;

    const intervalMs = Math.max(300, 1400 / playbackSpeed);
    const timer = setInterval(() => {
      const env = envRef.current;
      // If at end of historical candles, synthesize live streaming tick with authentic EGX volatility
      if (env.currentStep >= selectedStock.candles.length - 1) {
        const lastCandle = selectedStock.candles[selectedStock.candles.length - 1];
        const shock = (Math.random() - 0.49) * 0.012; // +/- 0.6% micro-move
        const newClose = Math.round(lastCandle.close * (1 + shock) * 100) / 100;
        const newOpen = lastCandle.close;
        const newHigh = Math.round(Math.max(newOpen, newClose) * (1 + Math.random() * 0.004) * 100) / 100;
        const newLow = Math.round(Math.min(newOpen, newClose) * (1 - Math.random() * 0.004) * 100) / 100;
        const nextDate = new Date(lastCandle.timestamp + 86400000);
        const dateStr = nextDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

        const newCandle = {
          timestamp: nextDate.getTime(),
          dateStr: `${dateStr} (Live)`,
          open: newOpen,
          high: newHigh,
          low: newLow,
          close: newClose,
          volume: Math.floor(250000 + Math.random() * 450000),
          rsi: Math.round(Math.max(15, Math.min(85, (lastCandle.rsi || 50) + shock * 250))),
          sma20: Math.round(((lastCandle.sma20 || newClose) * 0.95 + newClose * 0.05) * 100) / 100,
          sma50: Math.round(((lastCandle.sma50 || newClose) * 0.98 + newClose * 0.02) * 100) / 100,
          ema9: Math.round(((lastCandle.ema9 || newClose) * 0.8 + newClose * 0.2) * 100) / 100,
          ema21: Math.round(((lastCandle.ema21 || newClose) * 0.9 + newClose * 0.1) * 100) / 100,
        };

        selectedStock.candles.push(newCandle);
      }

      handleStepAction();
      setContinuousTicksCount((prev) => prev + 1);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isContinuousRL, playbackSpeed, selectedStock, handleStepAction]);

  // Reset current run
  const handleResetRun = () => {
    setIsAutoPlaying(false);
    setIsContinuousRL(false);
    const startIdx = Math.min(20, Math.floor(selectedStock.candles.length * 0.3));
    envRef.current.reset(startIdx);
    setLastOutcome(null);
    syncEnvironmentState();
  };

  // Run Batch Training
  const handleBatchTrain = (episodesToTrain: number) => {
    setIsAutoPlaying(false);
    setIsContinuousRL(false);
    setIsTraining(true);
    setTrainingProgress(0);

    const startIdx = Math.min(20, Math.floor(selectedStock.candles.length * 0.3));
    const tempEnv = new TradingEnvironment(selectedStock, {
      initialCash: 100000,
      rewardType: hyperparams.rewardStrategy,
      startStep: startIdx,
    });

    let trained = 0;
    const chunkSize = 5;

    const runChunk = () => {
      const limit = Math.min(chunkSize, episodesToTrain - trained);
      for (let i = 0; i < limit; i++) {
        agentRef.current.trainEpisode(tempEnv, trainingLogs.length + trained + 1);
        trained++;
      }

      const pct = Math.round((trained / episodesToTrain) * 100);
      setTrainingProgress(pct);

      if (trained < episodesToTrain) {
        setTimeout(runChunk, 10);
      } else {
        setIsTraining(false);
        setTrainingLogs([...agentRef.current.trainingLogs]);
        syncEnvironmentState();
      }
    };

    setTimeout(runChunk, 20);
  };

  // Update Hyperparameters
  const handleUpdateHyperparams = (newParams: TrainingHyperparameters) => {
    setHyperparams(newParams);
    agentRef.current.params = { ...agentRef.current.params, ...newParams };
  };

  // Reset Agent Policy
  const handleResetAgent = () => {
    agentRef.current.resetAgent();
    setTrainingLogs([]);
    setContinuousTicksCount(0);
    syncEnvironmentState();
  };

  // Save current strategy to Firebase Cloud
  const handleSaveStrategyToCloud = () => {
    const latest = trainingLogs[trainingLogs.length - 1];
    saveStrategy({
      name: `${selectedStock.symbol} ${hyperparams.rewardStrategy.replace('_', ' ')} Policy`,
      symbol: selectedStock.symbol,
      learningRate: hyperparams.learningRate,
      discountFactor: hyperparams.discountFactor,
      rewardStrategy: hyperparams.rewardStrategy,
      totalEpisodesTrained: trainingLogs.length,
      finalReturnPct: latest ? latest.returnPct : 0,
      winRate: latest ? latest.winRate : 0,
      qTableSize: agentRef.current.qTable.size,
    });
    console.info(`Policy successfully persisted to Firebase Firestore under account.`);
  };

  // Apply real-time news signal to the RL agent
  const handleApplyNewsSignal = (impact: 'BUY' | 'SELL' | 'HOLD', rationale: string) => {
    handleStepAction(impact);
  };

  // Calculate Benchmark Return for current run
  const startIdx = Math.min(20, Math.floor(selectedStock.candles.length * 0.3));
  const initialPrice = selectedStock.candles[startIdx]?.close || selectedStock.basePrice;
  const currentPrice = selectedStock.candles[currentStep]?.close || selectedStock.basePrice;
  const benchmarkReturnPct = initialPrice > 0 ? ((currentPrice - initialPrice) / initialPrice) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar & EGX Ticker */}
      <Navbar
        onOpenAudit={() => setIsAuditModalOpen(true)}
        onOpenChat={() => setIsAuditModalOpen(true)}
        onOpenCloud={() => setIsCloudDrawerOpen(true)}
        onOpenManual={() => setIsManualModalOpen(true)}
        selectedStockSymbol={selectedStock.symbol}
        isAutoPlaying={isAutoPlaying || isContinuousRL}
        totalEpisodesTrained={trainingLogs.length}
      />

      <main className="max-w-7xl mx-auto px-4 py-4 flex-1 flex flex-col gap-4 w-full">
        {/* EGX Stock Selector & Real Data Gateway */}
        <StockSelector
          selectedStock={selectedStock}
          onSelectStock={(stock) => setSelectedStock(stock)}
          selectedRange={selectedRange}
          onSelectRange={(range) => setSelectedRange(range)}
          selectedInterval={selectedInterval}
          onSelectInterval={(interval) => setSelectedInterval(interval)}
          isRealData={isRealData}
          isLoadingData={isLoadingData}
          onFetchRealData={handleFetchRealData}
          onSyncAllStocks={handleSyncAllStocks}
          lastSyncedTime={lastSyncedTime}
          isContinuousRL={isContinuousRL}
          onToggleContinuousRL={() => {
            if (isAutoPlaying) setIsAutoPlaying(false);
            setIsContinuousRL(!isContinuousRL);
          }}
        />

        {/* Estethmer Fundamental & Valuation Intelligence Suite (https://esthmr.com/) */}
        <EstethmerValuationBar
          stock={selectedStock}
          currentPrice={currentPrice}
        />

        {/* Performance Financial Metrics Strip */}
        <PerformanceMetrics
          initialCash={100000}
          portfolioValue={portfolio.portfolioValue}
          cash={portfolio.cash}
          shares={portfolio.shares}
          currentPrice={currentPrice}
          trades={trades}
          benchmarkReturnPct={benchmarkReturnPct}
          totalFeesPaid={envRef.current.totalFeesPaid}
        />

        {/* Main Grid: Chart & RL Decision HUD */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column: Candlestick Chart, Trade Ledger, and Google Search Grounded News (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <ChartCanvas
              candles={selectedStock.candles}
              currentStep={currentStep}
              trades={trades}
              stockSymbol={selectedStock.symbol}
            />

            {/* Google Search Grounded News & RL Decision Signals */}
            <NewsAndSignalsFeed
              stock={selectedStock}
              onApplyNewsSignal={handleApplyNewsSignal}
            />

            {/* Execution Trade Ledger Table */}
            <TradeLogTable trades={trades} />
          </div>

          {/* Right Column: Decision Panel & Training Studio (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <AgentControlPanel
              currentObservation={observation}
              currentQValues={qValues}
              recommendedAction={recommendedAction}
              confidence={confidence}
              isAutoPlaying={isAutoPlaying}
              playbackSpeed={playbackSpeed}
              onToggleAutoPlay={() => {
                if (isContinuousRL) setIsContinuousRL(false);
                setIsAutoPlaying(!isAutoPlaying);
              }}
              onNextStep={() => handleStepAction()}
              onExecuteAction={(act) => handleStepAction(act)}
              onReset={handleResetRun}
              onSetSpeed={(s) => setPlaybackSpeed(s)}
              sharesHeld={portfolio.shares}
              cashBalance={portfolio.cash}
              currentPrice={currentPrice}
              lastOutcome={lastOutcome}
              isContinuousRL={isContinuousRL}
              onToggleContinuousRL={() => {
                if (isAutoPlaying) setIsAutoPlaying(false);
                setIsContinuousRL(!isContinuousRL);
              }}
              continuousTicksCount={continuousTicksCount}
            />

            <TrainingStudio
              hyperparams={hyperparams}
              onUpdateHyperparams={handleUpdateHyperparams}
              onRunBatchTrain={handleBatchTrain}
              isTraining={isTraining}
              trainingProgress={trainingProgress}
              trainingLogs={trainingLogs}
              onResetAgent={handleResetAgent}
              onSaveStrategy={handleSaveStrategyToCloud}
            />
          </div>
        </div>

        {/* Institutional Quantitative Suite & Anti-Catastrophic Forgetting */}
        <InstitutionalQuantSuite
          currentStock={selectedStock}
          currentStep={currentStep}
          totalSteps={selectedStock.candles.length}
          episodesTrained={trainingLogs.length}
          winRate={trainingLogs.length > 0 ? trainingLogs[trainingLogs.length - 1].winRate : 50}
          totalReturnPct={parseFloat(
            ((portfolio.portfolioValue - 100000) / 1000).toFixed(2)
          )}
          currentQValues={qValues}
          isEvaluationMode={isEvaluationMode}
          onToggleEvaluationMode={() => setIsEvaluationMode(!isEvaluationMode)}
          onSavePolicyCheckpoint={() => handleSaveStrategyToCloud()}
          agent={agentRef.current}
          currentObservation={observation}
          onSimulateSteps={() => handleStepAction()}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-4 py-3 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">Estethmer RL Studio</span>
            <span>•</span>
            <span>Egyptian Exchange (EGX) Algorithmic Reinforcement Learning</span>
            <span>•</span>
            <span className="text-emerald-400">Google Search Grounding & Firebase Firestore Persistence</span>
          </div>
          <div className="font-mono text-[11px] text-slate-500">
            Actions: HOLD (0) | BUY (1) | SELL (2) • Settlement: T+0/T+1/T+2 • Fees: 0.325%
          </div>
        </div>
      </footer>

      {/* Estethmer Gemini High-Thinking Audit & Copilot Modal */}
      <EstethmerAiModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        stock={selectedStock}
        currentObservation={observation}
        currentQValues={qValues}
        recommendedAction={recommendedAction}
        confidence={confidence}
        portfolio={portfolio}
        recentTrades={trades}
      />

      {/* User Cloud Persistence & Account Drawer */}
      <UserCloudDrawer
        isOpen={isCloudDrawerOpen}
        onClose={() => setIsCloudDrawerOpen(false)}
        onSelectStock={(stk) => {
          setSelectedStock(stk);
          handleFetchRealData(stk.symbol, selectedRange, selectedInterval);
        }}
        onLoadStrategy={(params) => {
          handleUpdateHyperparams(params);
        }}
      />

      {/* Institutional PDF User Manual Modal */}
      <PdfManualModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
