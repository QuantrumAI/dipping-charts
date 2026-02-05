import type { CandleData } from '../types';

/**
 * 단일 캔들이 유효한지 검사합니다.
 * lightweight-charts는 null/NaN/Infinity를 허용하지 않으므로
 * OHLC와 time 필드 모두 유한한 숫자인지 확인합니다.
 */
export function isValidCandle(c: CandleData): boolean {
  const time = typeof c.time === 'number' ? c.time : Number(c.time);
  return (
    Number.isFinite(time) && time > 0 &&
    Number.isFinite(c.open) &&
    Number.isFinite(c.high) &&
    Number.isFinite(c.low) &&
    Number.isFinite(c.close)
  );
}

/**
 * 유효하지 않은 캔들을 필터링합니다.
 * 제거된 건수가 있으면 콘솔 경고를 출력합니다.
 */
export function filterValidCandles(data: CandleData[], label?: string): CandleData[] {
  const valid = data.filter(isValidCandle);
  if (valid.length !== data.length) {
    console.warn(`[${label ?? 'filterValidCandles'}] Filtered out ${data.length - valid.length} candles with invalid values`);
  }
  return valid;
}

/**
 * 인디케이터 데이터 포인트가 유효한지 검사합니다.
 */
export function isValidIndicatorPoint(d: { time: number; value: number }): boolean {
  return (
    d.time != null &&
    d.value != null &&
    Number.isFinite(d.value) &&
    Number.isFinite(typeof d.time === 'number' ? d.time : Number(d.time))
  );
}

/**
 * 유효하지 않은 인디케이터 데이터 포인트를 필터링합니다.
 */
export function filterValidIndicatorPoints(data: Array<{ time: number; value: number }>): Array<{ time: number; value: number }> {
  return data.filter(isValidIndicatorPoint);
}
