import { jsPDF } from 'jspdf';

/**
 * Institutional PDF Manual Generator for Estethmer Quant RL Trading Platform
 * Generates a clean, comprehensive multi-page technical manual explaining every feature,
 * mathematical formula, charting tool, data sync mechanism, and operational workflow.
 */
export function generateInstitutionalPdfManual(): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Helper function to check page overflow and add footer
  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 18) {
      addPageFooter();
      doc.addPage();
      y = margin + 10;
      addPageHeader();
    }
  };

  const addPageHeader = () => {
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.setFont('helvetica', 'normal');
    doc.text('ESTETHMER QUANTITATIVE RL PLATFORM • OFFICIAL INSTITUTIONAL MANUAL', margin, 10);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, 12, pageWidth - margin, 12);
  };

  const addPageFooter = () => {
    const pageNum = doc.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate-400
    doc.setFont('helvetica', 'normal');
    doc.text(`Page ${pageNum}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
    doc.text('Confidential & Proprietary • Estethmer Research (https://esthmr.com/)', margin, pageHeight - 8);
  };

  const printSectionHeader = (numberStr: string, title: string) => {
    checkPageBreak(18);
    y += 4;
    doc.setFillColor(15, 23, 42); // Slate-900
    doc.roundedRect(margin, y, contentWidth, 9, 1.5, 1.5, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129); // Emerald-500
    doc.text(numberStr, margin + 4, y + 6);
    doc.setTextColor(255, 255, 255);
    doc.text(title, margin + 22, y + 6);
    y += 13;
  };

  const printSubHeader = (title: string) => {
    checkPageBreak(12);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(14, 116, 144); // Cyan-700
    doc.text(title, margin, y);
    y += 5;
  };

  const printParagraph = (text: string) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85); // Slate-700
    const lines = doc.splitTextToSize(text, contentWidth);
    checkPageBreak(lines.length * 4.5);
    doc.text(lines, margin, y);
    y += lines.length * 4.5 + 2.5;
  };

  const printBullet = (label: string, description: string) => {
    doc.setFontSize(9);
    const fullText = `• ${label}: ${description}`;
    const lines = doc.splitTextToSize(fullText, contentWidth - 4);
    checkPageBreak(lines.length * 4.5);

    // Draw bold label then normal description
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(`• ${label}: `, margin + 2, y);
    const labelWidth = doc.getTextWidth(`• ${label}: `);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const remainingLines = doc.splitTextToSize(description, contentWidth - 4 - labelWidth);
    if (remainingLines.length > 0) {
      doc.text(remainingLines[0], margin + 2 + labelWidth, y);
      for (let i = 1; i < remainingLines.length; i++) {
        y += 4.2;
        doc.text(remainingLines[i], margin + 6, y);
      }
    }
    y += 5;
  };

  const printCalloutBox = (text: string, title = 'KEY INSTITUTIONAL PRINCIPLE') => {
    const lines = doc.splitTextToSize(text, contentWidth - 10);
    const boxHeight = lines.length * 4.2 + 10;
    checkPageBreak(boxHeight + 4);
    doc.setFillColor(240, 253, 250); // Emerald-50
    doc.setDrawColor(52, 211, 153); // Emerald-400
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, 'FD');

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 150, 105); // Emerald-600
    doc.text(title, margin + 4, y + 5);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(lines, margin + 4, y + 9);
    y += boxHeight + 4;
  };

  // ==========================================
  // COVER PAGE / HEADER
  // ==========================================
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.rect(0, 0, pageWidth, 55, 'F');

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129); // Emerald-400
  doc.text('ESTETHMER QUANT RL', margin, 24);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240); // Slate-200
  doc.text('Autonomous Egyptian Exchange (EGX) Algorithmic Execution System', margin, 32);

  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // Slate-400
  doc.text('Complete Technical, Architectural & User Operations Manual • Version 3.8', margin, 40);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} • Estethmer Research Gateway`, margin, 46);

  y = 65;

  // Table of Contents Box
  doc.setFillColor(248, 250, 252); // Slate-50
  doc.setDrawColor(203, 213, 225); // Slate-300
  doc.roundedRect(margin, y, contentWidth, 38, 2, 2, 'FD');

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('TABLE OF CONTENTS', margin + 4, y + 6);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text('1. Executive Overview & System Architecture', margin + 4, y + 12);
  doc.text('2. Egyptian Exchange (EGX) Live Data Engine & Fundamentals', margin + 4, y + 17);
  doc.text('3. Interactive Visual Charting Studio (Candles vs Diagram)', margin + 4, y + 22);
  doc.text('4. Reinforcement Learning (RL) Engine & Bellman Updates', margin + 4, y + 27);
  doc.text('5. RL Convergence Verification & Anti-Forgetting Telemetry', margin + contentWidth / 2, y + 12);
  doc.text('6. The 4 Institutional Pillars (LightGBM, Kalman, HMM, NLP)', margin + contentWidth / 2, y + 17);
  doc.text('7. Risk Management, Trade Ledger & Performance Metrics', margin + contentWidth / 2, y + 22);
  doc.text('8. Operational Step-by-Step User Guide & FAQ', margin + contentWidth / 2, y + 27);

  y += 44;

  // ==========================================
  // SECTION 1: EXECUTIVE OVERVIEW
  // ==========================================
  printSectionHeader('SECTION 1', 'EXECUTIVE OVERVIEW & SYSTEM ARCHITECTURE');
  printParagraph(
    'The Estethmer Quant RL platform is an institutional-grade algorithmic trading environment engineered specifically for the Egyptian Exchange (EGX). It combines tabular Reinforcement Learning (Q-Learning with Bellman optimality guarantees) with modern machine learning alphas (LightGBM cross-sectional ranking), statistical arbitrage (Kalman Filter dynamic pairs trading), econometric regime clustering (Hidden Markov Models), and real-time event-driven news grounding.'
  );
  printParagraph(
    'Unlike black-box models that suffer from catastrophic forgetting when market conditions shift, this platform provides real-time telemetry: Bellman TD-error loss curves, rolling reward trajectories, policy entropy tracking, and interactive 2D Q-value heatmaps with Softmax action distributions.'
  );

  // ==========================================
  // SECTION 2: EGX LIVE DATA & FUNDAMENTALS
  // ==========================================
  printSectionHeader('SECTION 2', 'EGX LIVE DATA ENGINE & ESTETHMER FUNDAMENTALS');
  printParagraph(
    'The system connects dynamically to real-time EGX feeds and Yahoo Finance gateway endpoints, ensuring all 10 liquid Egyptian equities maintain live synchronization:'
  );

  printBullet('COMI (CIB)', '81.20 EGP • P/E: 6.8x • P/B: 1.45x • Top weight in EGX30 index with foreign institutional inflows.');
  printBullet('TMGH (Talaat Moustafa)', '58.00 EGP • P/E: 9.4x • P/B: 1.82x • Massive Ras El Hekma coastal revenue realization.');
  printBullet('SWDY (Elsewedy Electric)', '47.69 EGP • P/E: 7.1x • P/B: 1.58x • Over 65% of order backlog denominated in USD/EUR.');
  printBullet('ABUK (Abu Qir Fertilizers)', '87.68 EGP • P/E: 8.2x • P/B: 2.30x • Dollar export margins & defensive dividend yield (~7.2%).');
  printBullet('EAST (Eastern Company)', '21.80 EGP • P/E: 4.5x • P/B: 1.68x • Inelastic consumer demand, ~12% annual dividend distribution.');
  printBullet('FWRY (Fawry)', '6.82 EGP • P/E: 16.2x • P/B: 2.44x • Cashless payments network, microfinance loan growth.');
  printBullet('ETEL (Telecom Egypt)', '32.77 EGP • P/E: 6.4x • P/B: 1.01x • Monetization of Vodafone Egypt dividends & international cables.');
  printBullet('HRHO (EFG Holding)', '21.55 EGP • P/E: 7.4x • P/B: 1.06x • Pan-Arab investment banking, IPO advisory, and aiBANK.');
  printBullet('MFPC (MOPCO)', '43.80 EGP • P/E: 8.1x • P/B: 2.25x • Low production gas cost, global nitrogen fertilizer export pipeline.');
  printBullet('EGX30 Benchmark', '31,450.00 pts • Macro reference index tracking the top 30 capitalization constituents.');

  printSubHeader('Live Valuation Multiples Calculation');
  printParagraph(
    'Valuation ratios are not static text strings. As prices fluctuate or are calibrated, P/E ratio is dynamically computed as Price / EPS (Earnings Per Share), P/B ratio as Price / BVPS (Book Value Per Share), and Dividend Yield as DPS / Price. This ensures your RL agent and fundamental screening always evaluate true market multiples.'
  );

  printSubHeader('Live Price Calibration Drawer');
  printParagraph(
    'Users can click "Calibrate Price" in the Stock Selector toolbar to fine-tune or set an exact intraday execution price (for instance, setting ABUK to 87.68 EGP). The system instantly recalibrates all technical indicators, historical candle endpoints, and RL observation states.'
  );

  // ==========================================
  // SECTION 3: CHARTING STUDIO
  // ==========================================
  printSectionHeader('SECTION 3', 'INTERACTIVE VISUAL CHARTING STUDIO');
  printParagraph(
    'The Charting Studio offers institutional-grade technical visualization built with scalable vector graphics (SVG) to ensure crisp rendering at any resolution with zero latency.'
  );

  printSubHeader('Candlestick Chart vs. Regular Line Diagram');
  printBullet('Japanese Candlesticks Mode', 'Displays standard Open, High, Low, Close (OHLC) candles with wick shadows. Green candles indicate bullish closes (Close >= Open), while red candles highlight bearish sessions.');
  printBullet('Regular Diagram (Line/Area) Mode', 'Renders a continuous cyan price trajectory with a soft gradient fill underneath. Ideal for observing macroeconomic trends, smooth support/resistance levels, and current step scrub progression.');
  printBullet('How to Switch', 'Use the prominent switcher buttons located in the top toolbar of the chart: click "Candlesticks" or "Line Diagram" to instantly toggle views.');

  printSubHeader('Minimizing and Expanding the OHLC Floating Window');
  printParagraph(
    'The rectangular floating window displays Date, Close, Open, High, Low, Volume, 14-day RSI, SMA(20), and SMA(50). When analyzing tight price structures or lower charts, users have full control over this overlay:'
  );
  printBullet('Toolbar Minimize Button', 'Click the "Minimize Info" / "Expand Info" button in the chart toolbar.');
  printBullet('Window Header Minimize Icon', 'Click the "-" button in the header of the floating window to collapse it into a minimal pill docked in the top corner.');
  printBullet('Collapsed Pill State', 'When minimized, it displays a compact summary (e.g., "OHLC: 87.68 EGP • Click to Expand") without obstructing underlying candles.');

  printSubHeader('Supported Technical Indicators');
  printBullet('Simple Moving Averages', 'SMA(20) displayed in golden amber and SMA(50) displayed in royal blue for golden cross / death cross trend identification.');
  printBullet('Exponential Moving Averages', 'EMA(9) in cyan and EMA(21) in magenta for short-term momentum responsiveness.');
  printBullet('14-Day RSI Oscillator', 'Dedicated lower sub-panel with overbought (>=70) and oversold (<=30) reference thresholds.');
  printBullet('Bollinger Bands', '20-period moving average with 2-standard-deviation volatility envelope bands.');
  printBullet('Volume Histogram', 'Color-coded trading volume bars aligned with each price candle.');

  // ==========================================
  // SECTION 4: REINFORCEMENT LEARNING ENGINE
  // ==========================================
  printSectionHeader('SECTION 4', 'REINFORCEMENT LEARNING (RL) TRADING ENGINE');
  printParagraph(
    'The RL Agent operates as an autonomous decision engine learning optimal trading policies through interaction with simulated and live EGX market environments.'
  );

  printSubHeader('The Bellman Optimality Equation');
  printParagraph(
    'The agent implements tabular Q-Learning with temporal-difference updates governed by the classical Bellman equation:'
  );

  printCalloutBox(
    'Q(s, a)  <--  Q(s, a) + alpha * [ r + gamma * max_a\' Q(s\', a\') - Q(s, a) ]\n\n' +
    'Where:\n' +
    '• s: Current state observation vector\n' +
    '• a: Action chosen (0: BUY 100 shares, 1: HOLD, 2: SELL position)\n' +
    '• r: Immediate reward received based on portfolio return or differential Sharpe\n' +
    '• s\': Next state following environment transition\n' +
    '• alpha: Learning rate (0.01 to 0.30, default 0.10)\n' +
    '• gamma: Discount factor (0.80 to 0.99, default 0.95)',
    'MATHEMATICAL CORE: BELLMAN UPDATE'
  );

  printSubHeader('State Observation Discretization');
  printParagraph(
    'The continuous market state is mapped into discrete, robust feature representations: (1) RSI Category (Oversold <35, Neutral 35-65, Overbought >65), (2) Price vs SMA(20) trend relation, (3) Market Volatility regime via Average True Range (ATR), (4) Current portfolio position (Flat vs Long), and (5) Unrealized Profit/Loss bracket.'
  );

  printSubHeader('Exploration vs. Exploitation (Epsilon Decay)');
  printParagraph(
    'The agent utilizes an epsilon-greedy action selection rule: with probability epsilon, it explores random actions to discover new profitable strategies; with probability (1 - epsilon), it exploits the greedy action with the highest expected Q-value. Epsilon exponentially decays after each episode: epsilon_t = max(0.01, epsilon_0 * decay^t).'
  );

  printSubHeader('Institutional Reward Strategies');
  printBullet('Differential Sharpe Ratio', 'Penalizes variance and drawdown while rewarding consistent risk-adjusted returns.');
  printBullet('Sortino Ratio Reward', 'Specifically penalizes downside downside deviations without penalizing upside volatility.');
  printBullet('Realized Profit & Loss (PnL)', 'Direct cash accounting reward on trade closure with holding penalties.');
  printBullet('Benchmark Excess Alpha', 'Rewards performance strictly exceeding the concurrent EGX30 index benchmark return.');

  // ==========================================
  // SECTION 5: RL CONVERGENCE & ANTI-FORGETTING
  // ==========================================
  printSectionHeader('SECTION 5', 'RL CONVERGENCE & ANTI-FORGETTING TELEMETRY');
  printParagraph(
    'Catastrophic forgetting occurs when a neural network or RL policy trained on a new market regime abruptly overwrites and loses previously learned profitable behaviors. This platform implements rigorous telemetry to guarantee monotonic policy improvement:'
  );

  printBullet('Live Reward Trajectory & Rolling MA', 'Visualizes step-by-step rewards alongside a 50-step rolling moving average. A rising or stabilizing moving average confirms the agent is accumulating positive reinforcement.');
  printBullet('Bellman TD-Error Loss Monitoring', 'Tracks the magnitude of [r + gamma * max Q(s\') - Q(s)]. Decreasing TD-error over time demonstrates convergence toward the optimal value function Q*.');
  printBullet('Interactive 2D Q-Value Heatmap', 'Displays state rows against actions [BUY, HOLD, SELL] with color-coded intensities. The current active state is highlighted with an emerald indicator.');
  printBullet('Softmax Policy Action Shares', 'Converts raw Q-values into actionable probabilities: P(a|s) = exp(Q(s,a)/tau) / sum_j exp(Q(s,j)/tau), revealing policy conviction.');
  printBullet('Weight Stability & Cosine Drift', 'Computes vector similarity against baseline checkpoints to confirm weight retention exceeding 90%.');

  // ==========================================
  // SECTION 6: THE 4 INSTITUTIONAL PILLARS
  // ==========================================
  printSectionHeader('SECTION 6', 'THE 4 INSTITUTIONAL QUANTITATIVE PILLARS');
  printParagraph(
    'To complement the Reinforcement Learning agent, the Institutional Quant Suite provides 4 specialized quantitative engines:'
  );

  printSubHeader('Pillar 1: LightGBM / XGBoost Alpha Ranker');
  printParagraph(
    'A gradient-boosted cross-sectional ranking model that scores all 10 EGX equities every session across 14 multi-factor features: 20-day momentum, book-to-market multiple, operating cash-flow yield, foreign institutional liquidity delta, and realized volatility. Stocks in the top decile receive prioritized buy allocations.'
  );

  printSubHeader('Pillar 2: Kalman Filter & Statistical Arbitrage Pairs Trading');
  printParagraph(
    'A state-space control filter dynamically updating the cointegration hedge ratio (beta) between peer Egyptian companies (e.g., Abu Qir Fertilizers ABUK at 87.68 EGP vs MOPCO MFPC at 43.80 EGP). When the normalized spread Z-score exceeds +/- 2.0 standard deviations, a mean-reverting long/short trade is triggered.'
  );

  printSubHeader('Pillar 3: Hidden Markov Model (HMM) Market Regime Detection');
  printParagraph(
    'Identifies unobserved market regimes using Gaussian emission probabilities: (1) Bullish Expansion, (2) Range-Bound Neutral, (3) High Volatility Crisis, and (4) Devaluation / Inflation Hedge Surge. The RL agent automatically adjusts its position sizing and stop-loss limits according to the active regime.'
  );

  printSubHeader('Pillar 4: Event-Driven Real-Time NLP Sentiment Engine');
  printParagraph(
    'Aggregates fresh regulatory filings, Central Bank of Egypt (CBE) interest rate statements, and corporate disclosures with Google Search grounding. Headlines are scored (-100 to +100) and translated into action nudges (Buy / Hold / Sell) with institutional rationale.'
  );

  // ==========================================
  // SECTION 7: RISK MANAGEMENT & TRADE LOG
  // ==========================================
  printSectionHeader('SECTION 7', 'RISK MANAGEMENT & TRADE EXECUTION LEDGER');
  printParagraph(
    'Capital preservation is embedded into every order execution:'
  );
  printBullet('Portfolio Cash Accounting', 'Initial capital is set to 100,000 EGP. Buying deducts execution price * shares + 0.15% EGX transaction fees.');
  printBullet('Slippage & Commission Modeling', 'Simulates realistic execution fill drag based on session volume and trade size.');
  printBullet('Maximum Drawdown (MDD)', 'Monitors peak-to-trough capital erosion. If drawdown exceeds 15%, safety brakes reduce position sizes.');
  printBullet('Execution Trade Ledger', 'A persistent tabular ledger logging every step, action taken, executed share quantity, filled price in EGP, and realized profit/loss.');

  // ==========================================
  // SECTION 8: STEP-BY-STEP USER WALKTHROUGH
  // ==========================================
  printSectionHeader('SECTION 8', 'OPERATIONAL STEP-BY-STEP USER GUIDE & FAQ');

  printSubHeader('Quick-Start Tutorial');
  printBullet('Step 1: Select an EGX Asset', 'Click on any equity in the top grid (e.g., ABUK at 87.68 EGP or COMI at 81.20 EGP). The chart and fundamental bar update instantly.');
  printBullet('Step 2: Sync or Calibrate', 'Click "Sync Live" to refresh quotes from Yahoo Finance. If you wish to test a specific price, click "Calibrate Price" and enter your target.');
  printBullet('Step 3: Choose Your Chart Style', 'Toggle between "Candlesticks" and "Line Diagram". Click "Minimize Info" if you prefer an unobstructed view of candles.');
  printBullet('Step 4: Train the RL Agent', 'In the Training Studio panel, choose your Reward Strategy and click "Train 50 Episodes" or "Auto-Play". Watch the reward trajectory rise and Q-value heatmap update.');
  printBullet('Step 5: Verify Convergence', 'Navigate to the "RL Convergence Telemetry" tab in the Institutional Suite. Confirm that TD-error is low and Q-value matrix shows distinct preferences.');
  printBullet('Step 6: Explore Quant Pillars', 'Switch to the "Institutional Quant Suite" to view LightGBM rankings, Kalman Filter spreads, and HMM market regimes.');

  printSubHeader('Frequently Asked Questions (FAQ)');
  printParagraph(
    'Q: Why is ABUK calibrated to 87.68 EGP?\n' +
    'A: Historical Yahoo Finance feeds for ABUK occasionally reflect unadjusted corporate actions or stale values (such as 58.32 or 74.55 EGP). The Estethmer gateway verifies the real EGX market trading price at 87.68 EGP and synchronizes all RL reward calculations accordingly.\n\n' +
    'Q: Can I save my trained agent and replay memory?\n' +
    'A: Yes. Click the "Firebase Cloud" button in the navigation bar to log in with Google and persist your trained Q-table, hyperparameters, and trade history across sessions.\n\n' +
    'Q: How does the agent prevent catastrophic forgetting?\n' +
    'A: By tracking rolling TD-errors, policy entropy, and state-visit frequencies in its 2D Q-matrix. You can inspect the verification checklist directly in the RL Convergence Visualizer tab.'
  );

  // Add footer to final page
  addPageFooter();

  return doc;
}
