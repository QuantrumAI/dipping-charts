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

export type TimeFrame = '1m' | '5m' | '15m' | '30m' | '1h' | '1d' | '1w' | '1M';

// 시장 세션 타입 (KIS 실시간 지원 여부 판단)
export type MarketSession = 'premarket' | 'regular' | 'aftermarket' | 'daymarket' | 'closed';

// 타임프레임 가용성 (시장 상태에 따른 제한)
export interface TimeframeAvailability {
  enabled: TimeFrame[];
  disabled: TimeFrame[];
  currentSession: MarketSession;
}

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

// 수평선(가격 라인) 타입
export interface PriceLine {
  price: number;
  color?: string;
  lineWidth?: number;
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  label?: string;
  labelVisible?: boolean;
  axisLabelVisible?: boolean;
}

export interface FullFeaturedChartProps {
  // 데이터
  data?: CandleData[];

  // 레이아웃
  width?: number;
  height?: number;
  className?: string;

  // 기능 활성화
  enableTimeframes?: boolean;
  enableIndicators?: boolean;
  enableDrawingTools?: boolean;

  // 타임프레임 관련
  defaultTimeframe?: TimeFrame;
  timeframeAvailability?: TimeframeAvailability;
  onTimeframeChange?: (timeframe: TimeFrame) => void;

  // 실시간 업데이트
  realtimeCandle?: CandleData;

  // 로딩/에러 상태
  loading?: boolean;
  error?: string | null;

  // 종목 정보
  symbol?: string;

  // 심볼 옆에 표시할 상태 배지 (React 노드)
  statusBadge?: React.ReactNode;

  // 가격 라인 (평단가 등)
  priceLines?: PriceLine[];

  // 그리기 도구
  initialLineTools?: LineTool[];
  onLineToolsChange?: (tools: LineTool[]) => void;

  /**
   * 그리기 도구 클릭 시 호출되는 콜백
   * false 반환 시 그리기 도구 활성화가 취소됨 (로그인 체크 등에 활용)
   */
  onDrawingToolClick?: () => boolean;
}
