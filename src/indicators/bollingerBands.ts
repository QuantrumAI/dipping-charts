import { CandleData } from '../types';
import { BollingerBandsOptions, BollingerBandsResult, IndicatorDataPoint } from './types';
import { calculateSMA } from './sma';
import { calculateEMA } from './ema';

/**
 * 표준편차 계산
 */
function calculateStdDev(values: number[], mean: number): number {
  const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Bollinger Bands (볼린저 밴드)
 *
 * @param data - 캔들 데이터 배열
 * @param options - Bollinger Bands 옵션
 * @returns Bollinger Bands 계산 결과 (upper, middle, lower)
 */
export function calculateBollingerBands(
  data: CandleData[],
  options: BollingerBandsOptions = {
    period: 20,
    stdDev: 2,
    source: 'close',
    maType: 'SMA',
  }
): BollingerBandsResult {
  const { period, stdDev, source = 'close', maType = 'SMA' } = options;

  const upper: IndicatorDataPoint[] = [];
  const middle: IndicatorDataPoint[] = [];
  const lower: IndicatorDataPoint[] = [];

  if (data.length < period) {
    return { upper, middle, lower };
  }

  // 중간 밴드 계산 (이동평균)
  let middleValues: IndicatorDataPoint[];

  if (maType === 'EMA') {
    middleValues = calculateEMA(data, { period, source });
  } else {
    middleValues = calculateSMA(data, { period, source });
  }

  // 각 시점의 표준편차 계산 및 밴드 생성
  for (let i = period - 1; i < data.length; i++) {
    const values: number[] = [];
    for (let j = 0; j < period; j++) {
      values.push(data[i - j][source]);
    }

    const middleValue = middleValues[i - (period - 1)].value;
    const standardDeviation = calculateStdDev(values, middleValue);

    const upperValue = middleValue + stdDev * standardDeviation;
    const lowerValue = middleValue - stdDev * standardDeviation;

    upper.push({
      time: data[i].time,
      value: upperValue,
    });

    middle.push({
      time: data[i].time,
      value: middleValue,
    });

    lower.push({
      time: data[i].time,
      value: lowerValue,
    });
  }

  return { upper, middle, lower };
}
