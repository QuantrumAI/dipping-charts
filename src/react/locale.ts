export type Locale = 'en' | 'ko';

export interface LocaleStrings {
  // Timeframe labels
  tf_1m: string;
  tf_5m: string;
  tf_15m: string;
  tf_30m: string;
  tf_1h: string;
  tf_1d: string;
  tf_1w: string;
  tf_1M: string;
  tf_unavailable: string;

  // Drawing tool labels
  tool_TrendLine: string;
  tool_HorizontalLine: string;
  tool_VerticalLine: string;
  tool_Rectangle: string;
  tool_FibRetracement: string;
  tool_Text: string;
  tool_drawing: string;

  // Header buttons
  btn_indicators: string;
  btn_draw: string;
  btn_clearAll: string;

  // Indicator categories
  cat_overlay: string;
  cat_oscillator: string;

  // Indicator names
  ind_sma: string;
  ind_ema: string;
  ind_bbands: string;
  ind_rsi: string;
  ind_macd: string;

  // Indicator descriptions
  ind_sma_desc: string;
  ind_ema_desc: string;
  ind_bbands_desc: string;
  ind_rsi_desc: string;
  ind_macd_desc: string;

  // Indicator settings
  selectIndicator: string;
  enableIndicator: string;
  color: string;
  period: string;
  periodN: (n: number) => string;
  addPeriod: string;
  thickness: string;
  stdDev: string;
  oversold: string;
  overbought: string;
  upper: string;
  middle: string;
  lower: string;
  fast: string;
  slow: string;
  signal: string;
  bullish: string;
  bearish: string;
  colorPaletteTitle: string;

  // Source options
  src_close: string;
  src_open: string;
  src_high: string;
  src_low: string;

  // Chart overlays
  loading: string;
  noData: string;

  // Text modal
  textEdit: string;
  textAdd: string;
  textPlaceholder: string;
  cancel: string;
  confirm: string;
}

const en: LocaleStrings = {
  tf_1m: '1m',
  tf_5m: '5m',
  tf_15m: '15m',
  tf_30m: '30m',
  tf_1h: '1H',
  tf_1d: 'D',
  tf_1w: 'W',
  tf_1M: 'M',
  tf_unavailable: 'Not available in current session',

  tool_TrendLine: 'Trend Line',
  tool_HorizontalLine: 'Horizontal',
  tool_VerticalLine: 'Vertical',
  tool_Rectangle: 'Rectangle',
  tool_FibRetracement: 'Fibonacci',
  tool_Text: 'Text',
  tool_drawing: 'drawing',

  btn_indicators: '+ Indicators',
  btn_draw: '✏️ Draw',
  btn_clearAll: 'Clear All',

  cat_overlay: 'Overlay',
  cat_oscillator: 'Oscillator',

  ind_sma: 'SMA',
  ind_ema: 'EMA',
  ind_bbands: 'Bollinger Bands',
  ind_rsi: 'RSI',
  ind_macd: 'MACD',

  ind_sma_desc: 'Simple moving average over n periods',
  ind_ema_desc: 'Exponential moving average with recent price weighting',
  ind_bbands_desc: 'Volatility bands around a moving average',
  ind_rsi_desc: 'Relative Strength Index — overbought/oversold detection',
  ind_macd_desc: 'Moving Average Convergence Divergence — trend reversal signal',

  selectIndicator: 'Select an indicator',
  enableIndicator: 'Check the box to enable this indicator',
  color: 'Color',
  period: 'Period',
  periodN: (n: number) => `Period ${n}`,
  addPeriod: '+ Add Period',
  thickness: 'Width',
  stdDev: 'Std Dev',
  oversold: 'Oversold',
  overbought: 'Overbought',
  upper: 'Upper',
  middle: 'Middle',
  lower: 'Lower',
  fast: 'Fast',
  slow: 'Slow',
  signal: 'Signal',
  bullish: 'Bullish',
  bearish: 'Bearish',
  colorPaletteTitle: 'Color',

  src_close: 'Close',
  src_open: 'Open',
  src_high: 'High',
  src_low: 'Low',

  loading: 'Loading chart data...',
  noData: 'No chart data',

  textEdit: 'Edit Text',
  textAdd: 'Enter Text',
  textPlaceholder: 'Enter text',
  cancel: 'Cancel',
  confirm: 'OK',
};

const ko: LocaleStrings = {
  tf_1m: '1분',
  tf_5m: '5분',
  tf_15m: '15분',
  tf_30m: '30분',
  tf_1h: '1시간',
  tf_1d: '일',
  tf_1w: '주',
  tf_1M: '월',
  tf_unavailable: '현재 시간대에서 사용할 수 없습니다',

  tool_TrendLine: '추세선',
  tool_HorizontalLine: '수평선',
  tool_VerticalLine: '수직선',
  tool_Rectangle: '사각형',
  tool_FibRetracement: '피보나치',
  tool_Text: '텍스트',
  tool_drawing: '그리는 중',

  btn_indicators: '+ 보조지표',
  btn_draw: '✏️ 그리기',
  btn_clearAll: '전체 삭제',

  cat_overlay: '상단 지표',
  cat_oscillator: '하단 지표',

  ind_sma: '이동평균선',
  ind_ema: '지수이동평균',
  ind_bbands: '볼린저 밴드',
  ind_rsi: 'RSI',
  ind_macd: 'MACD',

  ind_sma_desc: '지난 n일 동안 주가 평균값을 이은 선',
  ind_ema_desc: '최근 가격에 더 큰 가중치를 둔 이동평균선',
  ind_bbands_desc: '가격 변동성을 나타내는 밴드',
  ind_rsi_desc: '상대강도지수 - 과매수/과매도 판단',
  ind_macd_desc: '이동평균 수렴확산 - 추세 전환 신호',

  selectIndicator: '지표를 선택하세요',
  enableIndicator: '체크박스를 클릭하여 지표를 활성화하세요',
  color: '색상',
  period: '기간',
  periodN: (n: number) => `기간${n}`,
  addPeriod: '+ 기간 추가',
  thickness: '두께',
  stdDev: '표준편차',
  oversold: '과매도',
  overbought: '과매수',
  upper: '상단',
  middle: '중간',
  lower: '하단',
  fast: '단기',
  slow: '장기',
  signal: '시그널',
  bullish: '양봉',
  bearish: '음봉',
  colorPaletteTitle: '컬러',

  src_close: '종가',
  src_open: '시가',
  src_high: '고가',
  src_low: '저가',

  loading: '차트 데이터 로딩 중...',
  noData: '차트 데이터가 없습니다',

  textEdit: '텍스트 수정',
  textAdd: '텍스트 입력',
  textPlaceholder: '텍스트를 입력하세요',
  cancel: '취소',
  confirm: '확인',
};

const locales: Record<Locale, LocaleStrings> = { en, ko };

export function getLocaleStrings(locale: Locale = 'en'): LocaleStrings {
  return locales[locale] || locales.en;
}
