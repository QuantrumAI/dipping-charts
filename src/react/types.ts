import type { CandleData } from '../types';

export interface IndicatorConfig {
  color: string;
  thickness: number;
  source: 'close' | 'open' | 'high' | 'low';
  value: number;
}

export interface BollingerBandsConfig extends IndicatorConfig {
  upperColor: string;
  middleColor: string;
  lowerColor: string;
  stdDev: number;
}

export interface MACDConfig {
  fastPeriod: number;
  slowPeriod: number;
  signalPeriod: number;
  thickness: number;
}

export type IndicatorType = 'sma' | 'ema' | 'rsi' | 'macd' | 'bbands';

export interface IndicatorConfigs {
  sma: IndicatorConfig[];
  ema: IndicatorConfig[];
  rsi: IndicatorConfig[];
  macd: MACDConfig[];
  bbands: BollingerBandsConfig[];
}

export type TimeFrame = '1m' | '5m' | '1h' | '1d' | '1w' | '1M';

export type LineToolType = 'TrendLine' | 'HorizontalLine' | 'VerticalLine' | 'Rectangle' | 'FibRetracement' | 'Text';

export interface LineToolOptions {
  line?: {
    width: number;
    color: string;
  };
  text?: {
    value: string;
    font?: {
      color: string;
      size: number;
    };
  };
}

export interface LineTool {
  id: string;
  toolType: LineToolType;
  points: any[];
  options: LineToolOptions;
}

export interface FullFeaturedChartProps {
  data?: CandleData[];
  width?: number;
  height?: number;
  className?: string;
  enableTimeframes?: boolean;
  enableIndicators?: boolean;
  enableDrawingTools?: boolean;
}
