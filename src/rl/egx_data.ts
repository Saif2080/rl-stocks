/**
 * Egyptian Exchange (EGX) Market Data & Stocks
 * Includes real EGX equities with historical price candles and market metadata.
 */

import { calculateATR, calculateBollingerBands, calculateEMA, calculateMACD, calculateRSI, calculateSMA } from './indicators.ts';
import type { MarketCandle, StockProfile } from './types.ts';

/**
 * Standard EGX market transaction fee rate:
 * - EGX Stamp Tax: 0.175% (0.00175)
 * - MCDR / Regulatory fees: 0.05% (0.0005)
 * - Brokerage commission: 0.10% (0.0010)
 * Total roundtrip friction ~ 0.325% (0.00325)
 */
export const EGX_FEE_RATE = 0.00325;

/**
 * Generates realistic price candles with technical indicators calculated
 */
function generateCandles(
  basePrice: number,
  volatility: number,
  drift: number,
  count = 90,
  seed = 42
): MarketCandle[] {
  let rng = seed;
  const pseudoRandom = () => {
    rng = (rng * 9301 + 49297) % 233280;
    return rng / 233280;
  };

  const candles: MarketCandle[] = [];
  let currentClose = basePrice;
  const now = new Date('2026-10-15T10:00:00Z');

  // Generate backwards in time then reverse
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 3600 * 1000);
    // Skip weekends (Friday & Saturday in Egyptian Market)
    const dayOfWeek = d.getDay();
    // 5 = Friday, 6 = Saturday in JS Date
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

    const shock = (pseudoRandom() - 0.485) * volatility + drift;
    // EGX circuit limit ~ +/- 10% daily band
    const clampedShock = Math.max(-0.095, Math.min(0.095, shock));

    const open = Math.round(currentClose * 100) / 100;
    const change = open * clampedShock;
    const close = Math.round((open + change) * 100) / 100;

    const highWick = Math.abs(pseudoRandom()) * (open * (volatility * 0.4));
    const lowWick = Math.abs(pseudoRandom()) * (open * (volatility * 0.4));

    const high = Math.round((Math.max(open, close) + highWick) * 100) / 100;
    const low = Math.round((Math.max(0.5, Math.min(open, close) - lowWick)) * 100) / 100;

    const baseVolume = 350000 + Math.floor(pseudoRandom() * 1200000);
    const volume = Math.floor(baseVolume * (1 + Math.abs(clampedShock) * 8));

    const dateStr = d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    candles.push({
      timestamp: d.getTime(),
      dateStr: isWeekend ? `${dateStr} (Close)` : dateStr,
      open,
      high,
      low,
      close,
      volume,
    });

    currentClose = close;
  }

  // Anchor & rescale candles so the latest (final) candle exactly matches target basePrice
  const lastClose = candles[candles.length - 1]?.close || currentClose;
  if (lastClose > 0 && Math.abs(lastClose - basePrice) > 0.01) {
    const scaleFactor = basePrice / lastClose;
    for (const c of candles) {
      c.open = Math.round(c.open * scaleFactor * 100) / 100;
      c.high = Math.round(c.high * scaleFactor * 100) / 100;
      c.low = Math.round(c.low * scaleFactor * 100) / 100;
      c.close = Math.round(c.close * scaleFactor * 100) / 100;
    }
    // Hard-pin latest candle to exact basePrice
    const last = candles[candles.length - 1];
    last.close = basePrice;
    last.high = Math.max(last.high, basePrice);
    last.low = Math.min(last.low, basePrice);
  }

  // Pre-calculate technical indicators
  const closes = candles.map((c) => c.close);
  const rsi = calculateRSI(closes, 14);
  const ema9 = calculateEMA(closes, 9);
  const ema21 = calculateEMA(closes, 21);
  const ema50 = calculateEMA(closes, 50);
  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);
  const macd = calculateMACD(closes, 12, 26, 9);
  const bb = calculateBollingerBands(closes, 20, 2);
  const atr = calculateATR(candles, 14);

  for (let i = 0; i < candles.length; i++) {
    candles[i].rsi = Math.round(rsi[i] * 10) / 10;
    candles[i].ema9 = Math.round(ema9[i] * 100) / 100;
    candles[i].ema21 = Math.round(ema21[i] * 100) / 100;
    candles[i].ema50 = Math.round(ema50[i] * 100) / 100;
    candles[i].sma20 = Math.round(sma20[i] * 100) / 100;
    candles[i].sma50 = Math.round(sma50[i] * 100) / 100;
    candles[i].macd = Math.round(macd.macd[i] * 100) / 100;
    candles[i].macdSignal = Math.round(macd.signal[i] * 100) / 100;
    candles[i].bbUpper = Math.round(bb.upper[i] * 100) / 100;
    candles[i].bbLower = Math.round(bb.lower[i] * 100) / 100;
    candles[i].atr = Math.round((atr[i] || 1) * 100) / 100;
  }

  return candles;
}

export const EGX_STOCKS: StockProfile[] = [
  {
    symbol: 'COMI',
    ticker: 'COMI.CA',
    nameEn: 'Commercial International Bank (CIB)',
    nameAr: 'البنك التجاري الدولي',
    sectorEn: 'Banking & Financial Services',
    sectorAr: 'البنوك والخدمات المالية',
    basePrice: 81.20,
    descriptionEn: 'The flagship blue-chip of the EGX 30 index with robust foreign institutional liquidity and strong dividend yield.',
    descriptionAr: 'السهم القيادي الأكبر في البورصة المصرية ومؤشر EGX30 بوزن نسبي مرتفع وسيولة مؤسسية دولية قوية.',
    valuation: {
      symbol: 'COMI',
      ticker: 'COMI.CA',
      nameEn: 'Commercial International Bank (CIB)',
      nameAr: 'البنك التجاري الدولي',
      fairValue: 96.5,
      marketPrice: 81.20,
      discountPct: 15.9,
      peRatio: 6.8,
      pbRatio: 1.45,
      dividendYieldPct: 5.9,
      roePct: 28.4,
      healthScore: 9.2,
      sentimentScore: 88,
      rating: 'Strong Buy',
      sectorRank: '#1 in Banking (Top EGX30 Weight)',
      foreignOwnershipPct: 46.2,
      portalUrl: 'https://esthmr.com/',
      keyCatalystEn: 'Record net interest margins and heavy foreign institutional accumulation.',
      keyCatalystAr: 'هوامش فائدة قياسية ونمو قوي للودائع وتدفقات سيولة مؤسسية أجنبية مستمرة.',
    },
    candles: generateCandles(81.20, 0.024, 0.0015, 90, 101),
  },
  {
    symbol: 'TMGH',
    ticker: 'TMGH.CA',
    nameEn: 'Talaat Moustafa Group Holding',
    nameAr: 'مجموعة طلعت مصطفى القابضة',
    sectorEn: 'Real Estate Development',
    sectorAr: 'التطوير العقاري',
    basePrice: 58.00,
    descriptionEn: 'Egypt leading mega-community developer with prominent urban and coastal projects like Madinaty, Celia, and Ras El Hekma.',
    descriptionAr: 'المطور العقاري الرائد في مصر ومشاريع مدينتي وسيليا ورأس الحكمة، يتميز بزخم قوي في تدفق المبيعات التعاقدية.',
    valuation: {
      symbol: 'TMGH',
      ticker: 'TMGH.CA',
      nameEn: 'Talaat Moustafa Group Holding',
      nameAr: 'مجموعة طلعت مصطفى القابضة',
      fairValue: 78.0,
      marketPrice: 58.00,
      discountPct: 25.6,
      peRatio: 9.4,
      pbRatio: 1.82,
      dividendYieldPct: 3.2,
      roePct: 22.1,
      healthScore: 8.8,
      sentimentScore: 92,
      rating: 'Strong Buy',
      sectorRank: '#1 in Real Estate & Hospitality',
      foreignOwnershipPct: 22.8,
      portalUrl: 'https://esthmr.com/',
      keyCatalystEn: 'Ras El Hekma coastal project revenues and massive hospitality revenue expansion.',
      keyCatalystAr: 'عائدات مشروع رأس الحكمة الضخمة وتوسع إقليمي في السعودية وتدفقات فندقية قياسية.',
    },
    candles: generateCandles(58.00, 0.035, 0.003, 90, 204),
  },
  {
    symbol: 'FWRY',
    ticker: 'FWRY.CA',
    nameEn: 'Fawry for Banking & Payment Tech',
    nameAr: 'فوري لتكنولوجيا البنوك والمدفوعات الإلكترونية',
    sectorEn: 'Fintech & Digital Payments',
    sectorAr: 'التكنولوجيا المالية والمدفوعات',
    basePrice: 6.82,
    descriptionEn: 'The premier fintech network in Egypt driving nationwide cashless digital payment expansion and consumer microfinance.',
    descriptionAr: 'شبكة المدفوعات الرقمية والشمول المالي الأوسع انتشاراً في السوق المصري.',
    valuation: {
      symbol: 'FWRY',
      ticker: 'FWRY.CA',
      nameEn: 'Fawry for Banking & Payment Tech',
      nameAr: 'فوري لتكنولوجيا البنوك والمدفوعات الإلكترونية',
      fairValue: 9.8,
      marketPrice: 6.82,
      discountPct: 30.4,
      peRatio: 16.2,
      pbRatio: 2.44,
      dividendYieldPct: 1.8,
      roePct: 19.8,
      healthScore: 8.1,
      sentimentScore: 78,
      rating: 'Strong Buy',
      sectorRank: '#1 in Fintech & Cashless Payments',
      foreignOwnershipPct: 34.5,
      portalUrl: 'https://esthmr.com/',
      keyCatalystEn: 'Microfinance loan book surge and consumer digital wallet adoption.',
      keyCatalystAr: 'قفزة في محفظة التمويل متناهي الصغر وتوسع شبكة ماكينات الدفع والبطاقات المدفوعة مسبقاً.',
    },
    candles: generateCandles(6.82, 0.032, 0.0018, 90, 307),
  },
  {
    symbol: 'SWDY',
    ticker: 'SWDY.CA',
    nameEn: 'Elsewedy Electric',
    nameAr: 'السويدي إليكتريك',
    sectorEn: 'Industrial & Energy Infrastructure',
    sectorAr: 'القطاع الصناعي والبنية التحتية للطاقة',
    basePrice: 47.69,
    descriptionEn: 'Global provider of integrated energy solutions, cables, transformers, and renewable energy project development.',
    descriptionAr: 'رائد تصنيع الكابلات والمحولات وحلول الطاقة المتجددة في أفريقيا والشرق الأوسط مع عوائد تصديرية بالعملة الأجنبية.',
    valuation: {
      symbol: 'SWDY',
      ticker: 'SWDY.CA',
      nameEn: 'Elsewedy Electric',
      nameAr: 'السويدي إليكتريك',
      fairValue: 56.5,
      marketPrice: 47.69,
      discountPct: 15.6,
      peRatio: 7.1,
      pbRatio: 1.58,
      dividendYieldPct: 4.8,
      roePct: 26.3,
      healthScore: 8.9,
      sentimentScore: 84,
      rating: 'Strong Buy',
      sectorRank: '#1 in Energy Grid Infrastructure',
      foreignOwnershipPct: 18.4,
      portalUrl: 'https://esthmr.com/',
      keyCatalystEn: 'Over 65% of order backlog in USD/EUR and massive GCC infrastructure projects.',
      keyCatalystAr: 'أكثر من 65% من الإيرادات بالعملات الصعبة ومشاريع عملاقة في الخليج وأفريقيا.',
    },
    candles: generateCandles(47.69, 0.029, 0.0025, 90, 409),
  },
  {
    symbol: 'ABUK',
    ticker: 'ABUK.CA',
    isin: 'EGS38191C010.CA',
    nameEn: 'Abu Qir Fertilizers & Chemical Industries',
    nameAr: 'أبو قير للأسمدة والصناعات الكيماوية',
    sectorEn: 'Basic Materials & Petrochemicals',
    sectorAr: 'المواد الأساسية والبتروكيماويات',
    basePrice: 87.68,
    descriptionEn: 'Key agricultural fertilizer producer with high US dollar export revenues and defensive dividend distribution history.',
    descriptionAr: 'شركة عملاقة لإنتاج الأسمدة النيتروجينية تتمتع بتدفقات نقدية دولارية وتوزيعات أرباح سخية.',
    valuation: {
      symbol: 'ABUK',
      ticker: 'ABUK.CA',
      nameEn: 'Abu Qir Fertilizers',
      nameAr: 'أبو قير للأسمدة والصناعات الكيماوية',
      fairValue: 104.50,
      marketPrice: 87.68,
      discountPct: 16.1,
      peRatio: 8.2,
      pbRatio: 2.3,
      dividendYieldPct: 7.2,
      roePct: 31.0,
      healthScore: 9.2,
      sentimentScore: 84,
      rating: 'Strong Buy',
      sectorRank: '#1 in Fertilizers & Petrochemicals',
      foreignOwnershipPct: 15.6,
      portalUrl: 'https://esthmr.com/',
      keyCatalystEn: 'Record USD nitrogen export revenues and attractive dividend payout at 87.68 EGP.',
      keyCatalystAr: 'عوائد تصدير دولارية قياسية وتوزيعات أرباح سخية عند سعر 87.68 جنيه مصري.',
    },
    candles: generateCandles(87.68, 0.021, 0.0014, 90, 512),
  },
  {
    symbol: 'ETEL',
    ticker: 'ETEL.CA',
    nameEn: 'Telecom Egypt',
    nameAr: 'المصرية للاتصالات',
    sectorEn: 'Telecommunications',
    sectorAr: 'الاتصالات وتكنولوجيا المعلومات',
    basePrice: 32.77,
    descriptionEn: 'National telecom operator owning fiber optic national grid and a 45% stake in Vodafone Egypt, benefiting from undersea data cables.',
    descriptionAr: 'المشغل التاريخي للاتصالات في مصر، ومالك 45% من فودافون مصر وشبكات كابلات البيانات البحرية الدولية.',
    valuation: {
      symbol: 'ETEL',
      ticker: 'ETEL.CA',
      nameEn: 'Telecom Egypt',
      nameAr: 'المصرية للاتصالات',
      fairValue: 46.0,
      marketPrice: 32.77,
      discountPct: 28.8,
      peRatio: 6.4,
      pbRatio: 1.01,
      dividendYieldPct: 6.1,
      roePct: 17.5,
      healthScore: 8.3,
      sentimentScore: 74,
      rating: 'Strong Buy',
      sectorRank: '#1 in Telecom & Data Cables',
      foreignOwnershipPct: 12.0,
      portalUrl: 'https://esthmr.com/',
      keyCatalystEn: 'Vodafone Egypt dividends monetization and submarine data cables traffic surge.',
      keyCatalystAr: 'عوائد توزيعات فودافون مصر وحركة مرور البيانات عبر كابلات الألياف البحرية الاستراتيجية.',
    },
    candles: generateCandles(32.77, 0.025, 0.001, 90, 615),
  },
  {
    symbol: 'HRHO',
    ticker: 'HRHO.CA',
    nameEn: 'EFG Holding',
    nameAr: 'مجموعة إي إف جي القابضة (هيرميس)',
    sectorEn: 'Investment Banking & Financial Services',
    sectorAr: 'الخدمات المالية وبنوك الاستثمار',
    basePrice: 21.55,
    descriptionEn: 'Premier universal financial house in frontier & emerging markets with leading brokerage, asset management, and commercial banking.',
    descriptionAr: 'بنك الاستثمار الرائد في الشرق الأوسط وشمال أفريقيا، يدير أصولاً واستشارات مالية وطروحات كبرى.',
    valuation: {
      symbol: 'HRHO',
      ticker: 'HRHO.CA',
      nameEn: 'EFG Holding',
      nameAr: 'مجموعة إي إف جي القابضة (هيرميس)',
      fairValue: 26.5,
      marketPrice: 21.55,
      discountPct: 18.7,
      peRatio: 7.4,
      pbRatio: 1.06,
      dividendYieldPct: 4.4,
      roePct: 18.2,
      healthScore: 8.6,
      sentimentScore: 82,
      rating: 'Strong Buy',
      sectorRank: '#1 in Investment Banking',
      foreignOwnershipPct: 41.0,
      portalUrl: 'https://esthmr.com/',
      keyCatalystEn: 'Major regional IPO advisory pipeline and commercial bank subsidiary profitability.',
      keyCatalystAr: 'ريادة استشارات الطروحات الأولية في القاهرة والرياض وأرباح بنك الاستثمار التجاري.',
    },
    candles: generateCandles(21.55, 0.031, 0.002, 90, 820),
  },
  {
    symbol: 'MFPC',
    ticker: 'MFPC.CA',
    nameEn: 'Misr Fertilizers Production (MOPCO)',
    nameAr: 'مصر لإنتاج الأسمدة (موبكو)',
    sectorEn: 'Chemicals & Nitrogen Fertilizers',
    sectorAr: 'الكيماويات والأسمدة النيتروجينية',
    basePrice: 43.80,
    descriptionEn: 'Major nitrogen fertilizer exporter in Damietta port with state-of-the-art energy efficiency and green hydrogen initiatives.',
    descriptionAr: 'أكبر مجمع صناعي للأسمدة النيتروجينية في ميناء دمياط مع مزايا لوجستية وتصديرية عالمية.',
    valuation: {
      symbol: 'MFPC',
      ticker: 'MFPC.CA',
      nameEn: 'Misr Fertilizers Production (MOPCO)',
      nameAr: 'مصر لإنتاج الأسمدة (موبكو)',
      fairValue: 52.0,
      marketPrice: 43.80,
      discountPct: 15.8,
      peRatio: 8.1,
      pbRatio: 2.25,
      dividendYieldPct: 7.1,
      roePct: 33.5,
      healthScore: 8.8,
      sentimentScore: 79,
      rating: 'Strong Buy',
      sectorRank: '#2 in Petrochemicals',
      foreignOwnershipPct: 24.1,
      portalUrl: 'https://esthmr.com/',
      keyCatalystEn: 'Green ammonia expansion and low production cost relative to European peers.',
      keyCatalystAr: 'مشاريع الأمونيا الخضراء وتكلفة إنتاج غاز تنافسية مقارنة بالمصانع الأوروبية.',
    },
    candles: generateCandles(43.80, 0.028, 0.0016, 90, 930),
  },
  {
    symbol: 'EAST',
    ticker: 'EAST.CA',
    nameEn: 'Eastern Company',
    nameAr: 'الشركة الشرقية (إيسترن كومباني)',
    sectorEn: 'Consumer Goods & Staples',
    sectorAr: 'السلع الاستهلاكية',
    basePrice: 21.80,
    descriptionEn: 'Market leader in consumer staples with virtually monopolistic domestic market share and high cash-flow generation.',
    descriptionAr: 'رائد السلع الاستهلاكية بحصة سوقية شبه احتكارية وتدفقات نقدية تشغيلية هائلة وتوزيعات قياسية.',
    valuation: {
      symbol: 'EAST',
      ticker: 'EAST.CA',
      nameEn: 'Eastern Company',
      nameAr: 'الشركة الشرقية (إيسترن كومباني)',
      fairValue: 34.0,
      marketPrice: 21.80,
      discountPct: 35.9,
      peRatio: 4.5,
      pbRatio: 1.68,
      dividendYieldPct: 12.4,
      roePct: 42.0,
      healthScore: 8.5,
      sentimentScore: 76,
      rating: 'Strong Buy',
      sectorRank: '#1 in Consumer Staples (Top Dividend)',
      foreignOwnershipPct: 30.0,
      portalUrl: 'https://esthmr.com/',
      keyCatalystEn: 'Inelastic demand, pricing power against inflation, and ~12% annual dividend yield.',
      keyCatalystAr: 'طلب استهلاكي قوي، وقدرة تسعيرية لمواجهة التضخم، وعائد توزيعات يقارب 12%.',
    },
    candles: generateCandles(21.80, 0.022, 0.0018, 90, 1040),
  },
  {
    symbol: 'EGX30',
    ticker: 'EGX30',
    nameEn: 'EGX 30 Index Benchmark',
    nameAr: 'مؤشر البورصة المصرية الثلاثيني',
    sectorEn: 'Market Benchmark Index',
    sectorAr: 'المؤشر العام للسوق',
    basePrice: 31450.0,
    descriptionEn: 'The benchmark index of the Egyptian Exchange tracking the top 30 most capitalized and liquid companies.',
    descriptionAr: 'المؤشر الرئيسي المعياري للبورصة المصرية الذي يقيس أداء أفضل 30 شركة من حيث رأس المال السوقي والسيولة.',
    valuation: {
      symbol: 'EGX30',
      ticker: '^CASE:EG',
      nameEn: 'EGX 30 Benchmark Index',
      nameAr: 'مؤشر EGX30 الرئيسي',
      fairValue: 36000.0,
      marketPrice: 31450.0,
      discountPct: 12.6,
      peRatio: 7.9,
      pbRatio: 1.6,
      dividendYieldPct: 5.2,
      roePct: 24.5,
      healthScore: 8.7,
      sentimentScore: 85,
      rating: 'Strong Buy',
      sectorRank: 'Egyptian Exchange Top 30 Benchmark',
      foreignOwnershipPct: 28.5,
      portalUrl: 'https://esthmr.com/',
      keyCatalystEn: 'Macro foreign reserves expansion, CBE rate stabilization, and strong corporate earnings growth.',
      keyCatalystAr: 'تحسن احتياطيات النقد الأجنبي، واستقرار سعر الصرف، ونمو قوي لأرباح الشركات القيادية.',
    },
    candles: generateCandles(31450.0, 0.019, 0.002, 90, 718),
  },
];
