// 차트 컴포넌트
export { TradingChart } from './components/TradingChart';

// 유틸리티
export { generateMockCandles, generateAllTimeFrames } from './utils/mockData';

// 타입
export type { CandleData, TimeFrame, ChartOptions } from './types';

// 기술적 지표
export {
  // 타입
  type IndicatorDataPoint,
  type MultiLineIndicatorResult,
  type IndicatorOptions,
  type SMAOptions,
  type EMAOptions,
  type RSIOptions,
  type MACDOptions,
  type MACDResult,
  type BollingerBandsOptions,
  type BollingerBandsResult,
  type StochasticOptions,
  type StochasticResult,
  type ATROptions,
  type VWAPOptions,
  type WilliamsROptions,
  type CurrencyStrengthOptions,
  type CurrencyStrengthResult,
  // 이동평균
  calculateSMA,
  calculateEMA,
  // 모멘텀 지표
  calculateRSI,
  calculateMACD,
  // 변동성 지표
  calculateBollingerBands,
  calculateATR,
  // 오실레이터
  calculateStochastic,
  calculateWilliamsR,
  // 거래량 지표
  calculateVWAP,
  // Forex 전용 지표
  calculateCurrencyStrength,
} from './indicators';
