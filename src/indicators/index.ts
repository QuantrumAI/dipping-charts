/**
 * Technical Indicators for Tradingview-lib
 *
 * 이 모듈은 다양한 기술적 지표 계산 함수를 제공합니다.
 * tradingview-lightweight-charts와 함께 사용할 수 있습니다.
 */

// 타입 정의
export * from './types';

// 이동평균
export { calculateSMA } from './sma';
export { calculateEMA } from './ema';

// 모멘텀 지표
export { calculateRSI } from './rsi';
export { calculateMACD } from './macd';

// 변동성 지표
export { calculateBollingerBands } from './bollingerBands';

// Forex 전용 지표
export { calculateCurrencyStrength } from './currencyStrength';
export type { CurrencyStrengthOptions, CurrencyStrengthResult } from './currencyStrength';
