/**
 * 캔들 데이터 타입
 */
export interface CandleData {
  time: number;        // Unix timestamp (seconds)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * 시간봉 타입
 */
export type TimeFrame = '1m' | '5m' | '1h' | '1d' | '1w' | '1M' | '1y';

/**
 * 차트 옵션
 */
export interface ChartOptions {
  width?: number;
  height?: number;
  timeFrame?: TimeFrame;
}
