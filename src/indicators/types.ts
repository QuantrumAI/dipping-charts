/**
 * 지표 결과의 단일 데이터 포인트
 */
export interface IndicatorDataPoint {
  time: number;
  value: number;
}

/**
 * 다중 라인 지표 결과
 */
export interface MultiLineIndicatorResult {
  [key: string]: IndicatorDataPoint[];
}

/**
 * 지표 옵션 기본 인터페이스
 */
export interface IndicatorOptions {
  source?: 'open' | 'high' | 'low' | 'close';
}

/**
 * SMA 옵션
 */
export interface SMAOptions extends IndicatorOptions {
  period: number;
}

/**
 * EMA 옵션
 */
export interface EMAOptions extends IndicatorOptions {
  period: number;
}

/**
 * RSI 옵션
 */
export interface RSIOptions extends IndicatorOptions {
  period: number;
}

/**
 * MACD 옵션
 */
export interface MACDOptions extends IndicatorOptions {
  fastPeriod: number;
  slowPeriod: number;
  signalPeriod: number;
}

/**
 * MACD 결과
 */
export interface MACDResult {
  macd: IndicatorDataPoint[];
  signal: IndicatorDataPoint[];
  histogram: IndicatorDataPoint[];
}

/**
 * Bollinger Bands 옵션
 */
export interface BollingerBandsOptions extends IndicatorOptions {
  period: number;
  stdDev: number;
  maType?: 'SMA' | 'EMA';
}

/**
 * Bollinger Bands 결과
 */
export interface BollingerBandsResult {
  upper: IndicatorDataPoint[];
  middle: IndicatorDataPoint[];
  lower: IndicatorDataPoint[];
}
