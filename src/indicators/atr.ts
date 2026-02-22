import type { CandleData } from '../types';
import type { ATROptions, IndicatorDataPoint } from './types';

/**
 * Average True Range (ATR) — Wilder's smoothing (RMA)
 *
 * TR = max(H-L, |H-prevC|, |L-prevC|)
 * First ATR = SMA(TR, period)
 * Subsequent ATR = (prevATR * (period-1) + TR) / period
 *
 * @param candles OHLCV data
 * @param options period (default 14)
 * @returns IndicatorDataPoint[]
 */
export function calculateATR(
  candles: CandleData[],
  options: ATROptions = { period: 14 },
): IndicatorDataPoint[] {
  const { period } = options;
  const result: IndicatorDataPoint[] = [];

  if (!candles || candles.length < period + 1) return result;

  // Calculate True Range values (starts from index 1)
  const trValues: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose),
    );
    trValues.push(tr);
  }

  // First ATR = SMA of first `period` TR values
  let atr = 0;
  for (let i = 0; i < period; i++) {
    atr += trValues[i];
  }
  atr /= period;

  result.push({
    time: candles[period].time,
    value: atr,
  });

  // Wilder smoothing (RMA)
  for (let i = period; i < trValues.length; i++) {
    atr = (atr * (period - 1) + trValues[i]) / period;
    result.push({
      time: candles[i + 1].time,
      value: atr,
    });
  }

  return result;
}
