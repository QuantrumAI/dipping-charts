import type { CandleData } from '../types';
import type { StochasticOptions, StochasticResult, IndicatorDataPoint } from './types';

/**
 * Simple Moving Average helper (internal)
 */
function sma(values: number[], period: number): number[] {
  const result: number[] = [];
  if (values.length < period) return result;
  let sum = 0;
  for (let i = 0; i < period; i++) sum += values[i];
  result.push(sum / period);
  for (let i = period; i < values.length; i++) {
    sum += values[i] - values[i - period];
    result.push(sum / period);
  }
  return result;
}

/**
 * Stochastic Oscillator
 *
 * 1. Fast %K = (Close - Lowest Low) / (Highest High - Lowest Low) * 100
 * 2. %K = SMA(Fast %K, smooth)
 * 3. %D = SMA(%K, dPeriod)
 *
 * @param candles OHLCV data
 * @param options kPeriod (lookback for high/low), dPeriod (signal smoothing), smooth (%K smoothing)
 * @returns StochasticResult with k and d arrays
 */
export function calculateStochastic(
  candles: CandleData[],
  options: StochasticOptions = { kPeriod: 14, dPeriod: 3, smooth: 3 },
): StochasticResult {
  const { kPeriod, dPeriod, smooth } = options;
  const empty: StochasticResult = { k: [], d: [] };

  if (!candles || candles.length < kPeriod) return empty;

  // Step 1: Fast %K
  const fastK: number[] = [];
  const fastKTimes: number[] = [];
  for (let i = kPeriod - 1; i < candles.length; i++) {
    let hh = -Infinity;
    let ll = Infinity;
    for (let j = i - kPeriod + 1; j <= i; j++) {
      if (candles[j].high > hh) hh = candles[j].high;
      if (candles[j].low < ll) ll = candles[j].low;
    }
    const range = hh - ll;
    fastK.push(range === 0 ? 50 : ((candles[i].close - ll) / range) * 100);
    fastKTimes.push(candles[i].time);
  }

  // Step 2: %K = SMA(Fast %K, smooth)
  const kValues = sma(fastK, smooth);
  const kStartIdx = smooth - 1;

  // Step 3: %D = SMA(%K, dPeriod)
  const dValues = sma(kValues, dPeriod);
  const dStartIdx = dPeriod - 1;

  // Build %K result
  const kResult: IndicatorDataPoint[] = kValues.map((v, i) => ({
    time: fastKTimes[kStartIdx + i],
    value: v,
  }));

  // Build %D result (aligned with %K)
  const dResult: IndicatorDataPoint[] = dValues.map((v, i) => ({
    time: fastKTimes[kStartIdx + dStartIdx + i],
    value: v,
  }));

  return { k: kResult, d: dResult };
}
