import type { CandleData, TimeFrame } from '../types';
import type { Locale } from './locale';
export type { TimeFrame, Locale };

export interface IndicatorConfig {
  color: string;
  thickness: number;
  source: 'close' | 'open' | 'high' | 'low';
  value: number;
  // RSI 전용: 과매수/과매도 기준선
  overbought?: number;
  oversold?: number;
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
  // 히스토그램 양/음 색상
  histUpColor?: string;
  histDownColor?: string;
}

export interface StochasticConfig {
  kPeriod: number;
  dPeriod: number;
  smooth: number;
  kColor: string;
  dColor: string;
  thickness: number;
}

export interface VWAPConfig {
  color: string;
  thickness: number;
}

export type IndicatorType = 'sma' | 'ema' | 'rsi' | 'macd' | 'bbands' | 'stochastic' | 'atr' | 'vwap' | 'williamsR';

export interface IndicatorConfigs {
  sma: IndicatorConfig[];
  ema: IndicatorConfig[];
  rsi: IndicatorConfig[];
  macd: MACDConfig[];
  bbands: BollingerBandsConfig[];
  stochastic: StochasticConfig[];
  atr: IndicatorConfig[];
  vwap: VWAPConfig[];
  williamsR: IndicatorConfig[];
}

// TimeFrame is re-exported from ../types above

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

export type ChartTheme = 'light' | 'dark';

export interface FullFeaturedChartProps {
  /** UI language. Defaults to 'en'. */
  locale?: Locale;

  /** Color theme. Defaults to 'light'. */
  theme?: ChartTheme;

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

  // 볼륨 표시 여부
  showVolume?: boolean;

  // 지표 설정 localStorage 키 (설정 시 자동 저장/복원)
  indicatorStorageKey?: string;

  // 지표 설정 외부 연동 (백엔드 저장 등)
  initialIndicatorState?: {
    configs: IndicatorConfigs;
    checked: IndicatorType[];
    macdColors: { line: string; signal: string };
  };
  onIndicatorStateChange?: (state: {
    configs: IndicatorConfigs;
    checked: IndicatorType[];
    macdColors: { line: string; signal: string };
  }) => void;

  /**
   * 그리기 도구 클릭 시 호출되는 콜백
   * false 반환 시 그리기 도구 활성화가 취소됨 (로그인 체크 등에 활용)
   */
  onDrawingToolClick?: () => boolean;
}
