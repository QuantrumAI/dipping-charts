import type { CandleData } from '../types';
import type { WilliamsROptions, IndicatorDataPoint } from './types';

/**
 * Williams %R
 *
 * %R = (Highest High - Close) / (Highest High - Lowest Low) * -100
 *
 * Range: -100 to 0
 *   - Above -20: overbought
 *   - Below -80: oversold
 *
 * @param candles OHLCV data
 * @param options period (default 14)
 * @returns IndicatorDataPoint[]
 */
export function calculateWilliamsR(
  candles: CandleData[],
  options: WilliamsROptions = { period: 14 },
): IndicatorDataPoint[] {
  const { period } = options;
  const result: IndicatorDataPoint[] = [];

  if (!candles || candles.length < period) return result;

  for (let i = period - 1; i < candles.length; i++) {
    let hh = -Infinity;
    let ll = Infinity;
    for (let j = i - period + 1; j <= i; j++) {
      if (candles[j].high > hh) hh = candles[j].high;
      if (candles[j].low < ll) ll = candles[j].low;
    }
    const range = hh - ll;
    const wr = range === 0 ? -50 : ((hh - candles[i].close) / range) * -100;

    result.push({
      time: candles[i].time,
      value: wr,
    });
  }

  return result;
}
