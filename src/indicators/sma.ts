import { CandleData } from '../types';
import { IndicatorDataPoint, SMAOptions } from './types';

/**
 * Simple Moving Average (단순이동평균)
 *
 * 슬라이딩 윈도우 방식으로 O(n) 시간 복잡도로 계산합니다.
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

  // 첫 번째 윈도우의 합 계산
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i][source];
  }

  result.push({
    time: data[period - 1].time,
    value: sum / period,
  });

  // 슬라이딩 윈도우: 새 값 추가, 오래된 값 제거
  for (let i = period; i < data.length; i++) {
    sum += data[i][source] - data[i - period][source];

    result.push({
      time: data[i].time,
      value: sum / period,
    });
  }

  return result;
}
