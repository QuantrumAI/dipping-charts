import { CandleData } from '../types';
import { IndicatorDataPoint, RSIOptions } from './types';

/**
 * Relative Strength Index (상대강도지수)
 *
 * @param data - 캔들 데이터 배열
 * @param options - RSI 옵션 (period: 기간, source: 데이터 소스)
 * @returns RSI 계산 결과
 */
export function calculateRSI(
  data: CandleData[],
  options: RSIOptions = { period: 14, source: 'close' }
): IndicatorDataPoint[] {
  const { period, source = 'close' } = options;
  const result: IndicatorDataPoint[] = [];

  if (data.length < period + 1) {
    return result;
  }

  const gains: number[] = [];
  const losses: number[] = [];

  // 가격 변화 계산
  for (let i = 1; i < data.length; i++) {
    const change = data[i][source] - data[i - 1][source];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? -change : 0);
  }

  // 첫 번째 평균 계산 (SMA)
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 0; i < period; i++) {
    avgGain += gains[i];
    avgLoss += losses[i];
  }

  avgGain /= period;
  avgLoss /= period;

  // 첫 번째 RSI
  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  let rsi = 100 - 100 / (1 + rs);

  result.push({
    time: data[period].time,
    value: rsi,
  });

  // 이후 RSI 계산 (EMA 방식)
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;

    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi = 100 - 100 / (1 + rs);

    result.push({
      time: data[i + 1].time,
      value: rsi,
    });
  }

  return result;
}
