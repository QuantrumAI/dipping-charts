/**
 * ==========================================
 * Currency Strength (통화 강도) - Forex 전용 고급 지표
 * ==========================================
 *
 * 주의:
 * - 이 지표는 FullFeaturedChart에서 사용하지 않습니다.
 * - Forex 거래 전용 고급 지표입니다.
 * - 7개의 주요 통화쌍 데이터가 필요합니다 (EURUSD, USDJPY, USDCHF, GBPUSD, AUDUSD, USDCAD, NZDUSD).
 * - 고급 사용자가 직접 import하여 사용할 수 있도록 제공됩니다.
 *
 * 사용 예시:
 * ```typescript
 * import { calculateCurrencyStrength } from 'dipping-charts/indicators';
 *
 * const result = calculateCurrencyStrength({
 *   pairs: {
 *     EURUSD: eurusdData,
 *     USDJPY: usdjpyData,
 *     // ... 나머지 통화쌍
 *   }
 * });
 * ```
 */

import { CandleData } from '../types';
import { IndicatorDataPoint } from './types';

/**
 * Currency Strength 옵션
 *
 * 참고: 이 지표는 Forex 전용이며, 여러 통화쌍의 데이터가 필요합니다.
 */
export interface CurrencyStrengthOptions {
  /** 통화쌍 데이터 맵 (예: { 'EURUSD': [...], 'USDJPY': [...], ... }) */
  pairs: {
    EURUSD?: CandleData[];
    USDJPY?: CandleData[];
    USDCHF?: CandleData[];
    GBPUSD?: CandleData[];
    AUDUSD?: CandleData[];
    USDCAD?: CandleData[];
    NZDUSD?: CandleData[];
  };
}

/**
 * Currency Strength 결과
 */
export interface CurrencyStrengthResult {
  EUR: IndicatorDataPoint[];
  GBP: IndicatorDataPoint[];
  JPY: IndicatorDataPoint[];
  AUD: IndicatorDataPoint[];
  NZD: IndicatorDataPoint[];
  CAD: IndicatorDataPoint[];
  CHF: IndicatorDataPoint[];
  USD: IndicatorDataPoint[];
}

/**
 * 가격 변화율 계산
 */
function calculateChange(prevVal: number, currVal: number): number {
  return ((currVal - prevVal) / ((currVal + prevVal) / 2)) * 10000;
}

/**
 * 곱셈 기반 변화율 계산
 */
function calculateChangeMultiply(
  prevVal1: number,
  currVal1: number,
  prevVal2: number,
  currVal2: number
): number {
  return calculateChange(prevVal1 * prevVal2, currVal1 * currVal2);
}

/**
 * 나눗셈 기반 변화율 계산
 */
function calculateChangeDivide(
  prevVal1: number,
  currVal1: number,
  prevVal2: number,
  currVal2: number
): number {
  return calculateChange(prevVal1 / prevVal2, currVal1 / currVal2);
}

/**
 * Currency Strength (통화 강도)
 *
 * 참고: 이 지표는 Forex 거래 전용입니다.
 * 7개의 주요 통화쌍 데이터가 필요합니다: EURUSD, USDJPY, USDCHF, GBPUSD, AUDUSD, USDCAD, NZDUSD
 *
 * @param options - Currency Strength 옵션 (통화쌍 데이터)
 * @returns 각 통화의 강도 지표
 */
export function calculateCurrencyStrength(
  options: CurrencyStrengthOptions
): CurrencyStrengthResult {
  const { pairs } = options;

  // 필수 통화쌍 체크
  const requiredPairs = ['EURUSD', 'USDJPY', 'USDCHF', 'GBPUSD', 'AUDUSD', 'USDCAD', 'NZDUSD'] as const;
  for (const pair of requiredPairs) {
    if (!pairs[pair] || pairs[pair]!.length === 0) {
      throw new Error(`Missing required currency pair: ${pair}`);
    }
  }

  const eurusd = pairs.EURUSD!;
  const usdjpy = pairs.USDJPY!;
  const usdchf = pairs.USDCHF!;
  const gbpusd = pairs.GBPUSD!;
  const audusd = pairs.AUDUSD!;
  const usdcad = pairs.USDCAD!;
  const nzdusd = pairs.NZDUSD!;

  // 모든 데이터의 길이가 같은지 확인
  const minLength = Math.min(
    eurusd.length,
    usdjpy.length,
    usdchf.length,
    gbpusd.length,
    audusd.length,
    usdcad.length,
    nzdusd.length
  );

  const result: CurrencyStrengthResult = {
    EUR: [],
    GBP: [],
    JPY: [],
    AUD: [],
    NZD: [],
    CAD: [],
    CHF: [],
    USD: [],
  };

  // 각 통화의 누적 강도 추적
  const cumulativeStrength = {
    EUR: 0,
    GBP: 0,
    JPY: 0,
    AUD: 0,
    NZD: 0,
    CAD: 0,
    CHF: 0,
    USD: 0,
  };

  for (let i = 1; i < minLength; i++) {
    // 직접 거래쌍
    const eurusdVal = calculateChange(eurusd[i - 1].close, eurusd[i].close);
    const gbpusdVal = calculateChange(gbpusd[i - 1].close, gbpusd[i].close);
    const usdjpyVal = calculateChange(usdjpy[i - 1].close, usdjpy[i].close);
    const audusdVal = calculateChange(audusd[i - 1].close, audusd[i].close);
    const nzdusdVal = calculateChange(nzdusd[i - 1].close, nzdusd[i].close);
    const usdcadVal = calculateChange(usdcad[i - 1].close, usdcad[i].close);
    const usdchfVal = calculateChange(usdchf[i - 1].close, usdchf[i].close);

    // 파생 거래쌍
    const eurgbpVal = calculateChangeDivide(eurusd[i].close, eurusd[i - 1].close, gbpusd[i].close, gbpusd[i - 1].close);
    const eurjpyVal = calculateChangeMultiply(eurusd[i].close, eurusd[i - 1].close, usdjpy[i].close, usdjpy[i - 1].close);
    const euraudVal = calculateChangeDivide(eurusd[i].close, eurusd[i - 1].close, audusd[i].close, audusd[i - 1].close);
    const eurnzdVal = calculateChangeDivide(eurusd[i].close, eurusd[i - 1].close, nzdusd[i].close, nzdusd[i - 1].close);
    const eurcadVal = calculateChangeDivide(eurusd[i].close, eurusd[i - 1].close, usdcad[i].close, usdcad[i - 1].close);
    const eurchfVal = calculateChangeMultiply(eurusd[i].close, eurusd[i - 1].close, usdchf[i].close, usdchf[i - 1].close);

    const gbpjpyVal = calculateChangeMultiply(gbpusd[i].close, gbpusd[i - 1].close, usdjpy[i].close, usdjpy[i - 1].close);
    const gbpaudVal = calculateChangeDivide(gbpusd[i].close, gbpusd[i - 1].close, audusd[i].close, audusd[i - 1].close);
    const gbpnzdVal = calculateChangeDivide(gbpusd[i].close, gbpusd[i - 1].close, nzdusd[i].close, nzdusd[i - 1].close);
    const gbpcadVal = calculateChangeDivide(gbpusd[i].close, gbpusd[i - 1].close, usdcad[i].close, usdcad[i - 1].close);
    const gbpchfVal = calculateChangeMultiply(gbpusd[i].close, gbpusd[i - 1].close, usdchf[i].close, usdchf[i - 1].close);

    const jpyaudVal = calculateChangeDivide(usdjpy[i].close, usdjpy[i - 1].close, audusd[i].close, audusd[i - 1].close);
    const jpynzdVal = calculateChangeDivide(usdjpy[i].close, usdjpy[i - 1].close, nzdusd[i].close, nzdusd[i - 1].close);
    const jpycadVal = calculateChangeDivide(usdjpy[i].close, usdjpy[i - 1].close, usdcad[i].close, usdcad[i - 1].close);
    const jpychfVal = calculateChangeDivide(usdjpy[i].close, usdjpy[i - 1].close, usdchf[i].close, usdchf[i - 1].close);

    const audnzdVal = calculateChangeDivide(audusd[i].close, audusd[i - 1].close, nzdusd[i].close, nzdusd[i - 1].close);
    const audcadVal = calculateChangeDivide(audusd[i].close, audusd[i - 1].close, usdcad[i].close, usdcad[i - 1].close);
    const audchfVal = calculateChangeMultiply(audusd[i].close, audusd[i - 1].close, usdchf[i].close, usdchf[i - 1].close);

    const nzdcadVal = calculateChangeDivide(nzdusd[i].close, nzdusd[i - 1].close, usdcad[i].close, usdcad[i - 1].close);
    const nzdchfVal = calculateChangeMultiply(nzdusd[i].close, nzdusd[i - 1].close, usdchf[i].close, usdchf[i - 1].close);

    const cadchfVal = calculateChangeMultiply(usdcad[i].close, usdcad[i - 1].close, usdchf[i].close, usdchf[i - 1].close);

    // 각 통화의 평균 강도 계산
    const strengthEUR = (eurusdVal + eurgbpVal + eurjpyVal + euraudVal + eurnzdVal + eurcadVal + eurchfVal) / 7;
    const strengthGBP = (gbpusdVal - eurgbpVal + gbpjpyVal + gbpaudVal + gbpnzdVal + gbpcadVal + gbpchfVal) / 7;
    const strengthJPY = (usdjpyVal - eurjpyVal - gbpjpyVal - jpyaudVal - jpynzdVal - jpycadVal - jpychfVal) / 7;
    const strengthAUD = (audusdVal - euraudVal - gbpaudVal + jpyaudVal - audnzdVal - audcadVal - audchfVal) / 7;
    const strengthNZD = (nzdusdVal - eurnzdVal - gbpnzdVal + jpynzdVal + audnzdVal - nzdcadVal - nzdchfVal) / 7;
    const strengthCAD = (usdcadVal - eurcadVal - gbpcadVal + jpycadVal + audcadVal + nzdcadVal - cadchfVal) / 7;
    const strengthCHF = (usdchfVal - eurchfVal - gbpchfVal + jpychfVal + audchfVal + nzdchfVal + cadchfVal) / 7;
    const strengthUSD = (-eurusdVal - gbpusdVal + usdjpyVal - audusdVal - nzdusdVal + usdcadVal + usdchfVal) / 7;

    // 누적
    cumulativeStrength.EUR += strengthEUR;
    cumulativeStrength.GBP += strengthGBP;
    cumulativeStrength.JPY += strengthJPY;
    cumulativeStrength.AUD += strengthAUD;
    cumulativeStrength.NZD += strengthNZD;
    cumulativeStrength.CAD += strengthCAD;
    cumulativeStrength.CHF += strengthCHF;
    cumulativeStrength.USD += strengthUSD;

    const time = eurusd[i].time;

    result.EUR.push({ time, value: cumulativeStrength.EUR });
    result.GBP.push({ time, value: cumulativeStrength.GBP });
    result.JPY.push({ time, value: cumulativeStrength.JPY });
    result.AUD.push({ time, value: cumulativeStrength.AUD });
    result.NZD.push({ time, value: cumulativeStrength.NZD });
    result.CAD.push({ time, value: cumulativeStrength.CAD });
    result.CHF.push({ time, value: cumulativeStrength.CHF });
    result.USD.push({ time, value: cumulativeStrength.USD });
  }

  return result;
}
