import { CandleData } from '../types';
import { IndicatorDataPoint, EMAOptions } from './types';

/**
 * Exponential Moving Average (지수이동평균)
 *
 * @param data - 캔들 데이터 배열
 * @param options - EMA 옵션 (period: 기간, source: 데이터 소스)
 * @returns EMA 계산 결과
 */
export function calculateEMA(
  data: CandleData[],
  options: EMAOptions = { period: 20, source: 'close' }
): IndicatorDataPoint[] {
  const { period, source = 'close' } = options;
  const result: IndicatorDataPoint[] = [];

  if (data.length < period) {
    return result;
  }

  // 평활 계수 (smoothing factor)
  const multiplier = 2 / (period + 1);

  // 첫 EMA는 SMA로 시작
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i][source];
  }
  let ema = sum / period;

  result.push({
    time: data[period - 1].time,
    value: ema,
  });

  // 이후 EMA 계산
  for (let i = period; i < data.length; i++) {
    ema = (data[i][source] - ema) * multiplier + ema;
    result.push({
      time: data[i].time,
      value: ema,
    });
  }

  return result;
}
