import { CandleData } from '../types';
import { MACDOptions, MACDResult, IndicatorDataPoint } from './types';

/**
 * EMA 계산 헬퍼 함수
 */
function calculateEMAValues(values: number[], period: number): number[] {
  const result: number[] = [];

  if (values.length < period) {
    return result;
  }

  const multiplier = 2 / (period + 1);

  // 첫 EMA는 SMA로 시작
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += values[i];
  }
  let ema = sum / period;
  result.push(ema);

  // 이후 EMA 계산
  for (let i = period; i < values.length; i++) {
    ema = (values[i] - ema) * multiplier + ema;
    result.push(ema);
  }

  return result;
}

/**
 * Moving Average Convergence Divergence (이동평균수렴확산)
 *
 * @param data - 캔들 데이터 배열
 * @param options - MACD 옵션
 * @returns MACD 계산 결과 (macd, signal, histogram)
 */
export function calculateMACD(
  data: CandleData[],
  options: MACDOptions = {
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    source: 'close',
  }
): MACDResult {
  const { fastPeriod, slowPeriod, signalPeriod, source = 'close' } = options;

  const macdLine: IndicatorDataPoint[] = [];
  const signalLine: IndicatorDataPoint[] = [];
  const histogram: IndicatorDataPoint[] = [];

  if (data.length < slowPeriod) {
    return { macd: macdLine, signal: signalLine, histogram };
  }

  // 소스 데이터 추출
  const sourceValues = data.map(candle => candle[source]);

  // Fast EMA와 Slow EMA 계산
  const fastEMA = calculateEMAValues(sourceValues, fastPeriod);
  const slowEMA = calculateEMAValues(sourceValues, slowPeriod);

  // MACD Line 계산 (Fast EMA - Slow EMA)
  const macdValues: number[] = [];
  const startIndex = slowPeriod - 1;

  for (let i = 0; i < slowEMA.length; i++) {
    const macdValue = fastEMA[i + (fastPeriod - slowPeriod)] - slowEMA[i];
    macdValues.push(macdValue);

    macdLine.push({
      time: data[startIndex + i].time,
      value: macdValue,
    });
  }

  // Signal Line 계산 (MACD의 EMA)
  const signalValues = calculateEMAValues(macdValues, signalPeriod);

  for (let i = 0; i < signalValues.length; i++) {
    const signalValue = signalValues[i];
    const macdValue = macdValues[i + (signalPeriod - 1)];
    const histValue = macdValue - signalValue;

    signalLine.push({
      time: data[startIndex + i + (signalPeriod - 1)].time,
      value: signalValue,
    });

    histogram.push({
      time: data[startIndex + i + (signalPeriod - 1)].time,
      value: histValue,
    });
  }

  return {
    macd: macdLine,
    signal: signalLine,
    histogram,
  };
}
