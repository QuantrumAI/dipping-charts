import { CandleData } from '../types';
import { IndicatorDataPoint, SMAOptions } from './types';

/**
 * Simple Moving Average (단순이동평균)
 *
 * @param data - 캔들 데이터 배열
 * @param options - SMA 옵션 (period: 기간, source: 데이터 소스)
 * @returns SMA 계산 결과
 */
export function calculateSMA(
  data: CandleData[],
  options: SMAOptions = { period: 20, source: 'close' }
): IndicatorDataPoint[] {
  const { period, source = 'close' } = options;
  const result: IndicatorDataPoint[] = [];

  if (data.length < period) {
    return result;
  }

  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j][source];
    }
    const sma = sum / period;

    result.push({
      time: data[i].time,
      value: sma,
    });
  }

  return result;
}
