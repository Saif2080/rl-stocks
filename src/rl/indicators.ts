/**
 * Pure Mathematical Technical Indicators for Stock Market Analysis
 */

export function calculateSMA(data: number[], period: number): number[] {
  if (data.length === 0) return [];
  const result: number[] = new Array(data.length);
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
    if (i >= period) {
      sum -= data[i - period];
      result[i] = Math.round((sum / period) * 100) / 100;
    } else {
      result[i] = Math.round((sum / (i + 1)) * 100) / 100;
    }
  }
  return result;
}

export function calculateEMA(data: number[], period: number): number[] {
  if (data.length === 0) return [];
  const result: number[] = new Array(data.length);
  const k = 2 / (period + 1);

  // Initialize first EMA with simple moving average of first 'period' elements or data[0]
  let sum = 0;
  const initialPeriod = Math.min(period, data.length);
  for (let i = 0; i < initialPeriod; i++) {
    sum += data[i];
    result[i] = sum / (i + 1);
  }

  for (let i = initialPeriod; i < data.length; i++) {
    result[i] = data[i] * k + result[i - 1] * (1 - k);
  }

  return result;
}

export function calculateRSI(closes: number[], period = 14): number[] {
  if (closes.length === 0) return [];
  const result: number[] = new Array(closes.length).fill(50);
  if (closes.length <= 1) return result;

  let gains = 0;
  let losses = 0;

  const limit = Math.min(period + 1, closes.length);
  for (let i = 1; i < limit; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  if (closes.length > period) {
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result[period] = 100 - 100 / (1 + rs);
  }

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      result[i] = 100;
    } else {
      const rs = avgGain / avgLoss;
      result[i] = Math.max(0, Math.min(100, 100 - 100 / (1 + rs)));
    }
  }

  // Smooth initial values
  for (let i = 0; i < Math.min(period, closes.length); i++) {
    result[i] = result[period] || 50;
  }

  return result;
}

export function calculateMACD(
  closes: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): { macd: number[]; signal: number[]; hist: number[] } {
  if (closes.length === 0) {
    return { macd: [], signal: [], hist: [] };
  }

  const fastEMA = calculateEMA(closes, fastPeriod);
  const slowEMA = calculateEMA(closes, slowPeriod);

  const macdLine: number[] = new Array(closes.length);
  for (let i = 0; i < closes.length; i++) {
    macdLine[i] = fastEMA[i] - slowEMA[i];
  }

  const signalLine = calculateEMA(macdLine, signalPeriod);
  const hist: number[] = new Array(closes.length);
  for (let i = 0; i < closes.length; i++) {
    hist[i] = macdLine[i] - signalLine[i];
  }

  return { macd: macdLine, signal: signalLine, hist };
}

export function calculateBollingerBands(
  closes: number[],
  period = 20,
  stdDevMultiplier = 2
): { upper: number[]; middle: number[]; lower: number[] } {
  const length = closes.length;
  const upper = new Array<number>(length);
  const middle = new Array<number>(length);
  const lower = new Array<number>(length);

  for (let i = 0; i < length; i++) {
    const start = Math.max(0, i - period + 1);
    const window = closes.slice(start, i + 1);
    const mean = window.reduce((a, b) => a + b, 0) / window.length;

    let variance = 0;
    for (const val of window) {
      variance += Math.pow(val - mean, 2);
    }
    const stdDev = Math.sqrt(variance / window.length);

    middle[i] = mean;
    upper[i] = mean + stdDevMultiplier * stdDev;
    lower[i] = mean - stdDevMultiplier * stdDev;
  }

  return { upper, middle, lower };
}

export function calculateATR(
  candles: { high: number; low: number; close: number }[],
  period = 14
): number[] {
  if (candles.length === 0) return [];
  const tr: number[] = new Array(candles.length);
  tr[0] = candles[0].high - candles[0].low;

  for (let i = 1; i < candles.length; i++) {
    const hl = candles[i].high - candles[i].low;
    const hc = Math.abs(candles[i].high - candles[i - 1].close);
    const lc = Math.abs(candles[i].low - candles[i - 1].close);
    tr[i] = Math.max(hl, hc, lc);
  }

  return calculateEMA(tr, period);
}
