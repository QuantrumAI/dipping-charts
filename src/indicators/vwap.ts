import type { CandleData } from '../types';
import type { VWAPOptions, IndicatorDataPoint } from './types';

/**
 * Volume Weighted Average Price (VWAP)
 *
 * TP = (High + Low + Close) / 3
 * VWAP = Cumulative(TP * Volume) / Cumulative(Volume)
 *
 * @param candles OHLCV data
 * @param _options reserved for future use
 * @returns IndicatorDataPoint[]
 */
export function calculateVWAP(
  candles: CandleData[],
  _options: VWAPOptions = {},
): IndicatorDataPoint[] {
  const result: IndicatorDataPoint[] = [];

  if (!candles || candles.length === 0) return result;

  let cumulativeTPV = 0;
  let cumulativeVol = 0;

  for (let i = 0; i < candles.length; i++) {
    const tp = (candles[i].high + candles[i].low + candles[i].close) / 3;
    const vol = candles[i].volume;
    cumulativeTPV += tp * vol;
    cumulativeVol += vol;

    if (cumulativeVol === 0) continue;

    result.push({
      time: candles[i].time,
      value: cumulativeTPV / cumulativeVol,
    });
  }

  return result;
}
