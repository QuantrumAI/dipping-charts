# Technical Indicators

Tradingview-lib에 포함된 기술적 지표 사용 가이드입니다.

## 지표 목록

이 라이브러리는 [algotrader](https://github.com/s-stolz/algotrader) 리포지토리의 지표들을 TypeScript로 포팅하여 제공합니다.

### 이동평균 (Moving Averages)

- **SMA (Simple Moving Average)** - 단순이동평균
- **EMA (Exponential Moving Average)** - 지수이동평균

### 모멘텀 지표 (Momentum Indicators)

- **RSI (Relative Strength Index)** - 상대강도지수
- **MACD (Moving Average Convergence Divergence)** - 이동평균수렴확산

### 변동성 지표 (Volatility Indicators)

- **Bollinger Bands** - 볼린저 밴드

### Forex 전용 지표

- **Currency Strength** - 통화 강도 (7개 주요 통화쌍 데이터 필요)

## 사용 예제

### SMA (Simple Moving Average)

```typescript
import { calculateSMA, CandleData } from 'tradingview-lib';

const candles: CandleData[] = [
  // ... 캔들 데이터
];

const sma20 = calculateSMA(candles, {
  period: 20,
  source: 'close', // 'open', 'high', 'low', 'close'
});

// 결과: IndicatorDataPoint[]
// [{ time: 1234567890, value: 100.5 }, ...]
```

### EMA (Exponential Moving Average)

```typescript
import { calculateEMA } from 'tradingview-lib';

const ema12 = calculateEMA(candles, {
  period: 12,
  source: 'close',
});
```

### RSI (Relative Strength Index)

```typescript
import { calculateRSI } from 'tradingview-lib';

const rsi14 = calculateRSI(candles, {
  period: 14,
  source: 'close',
});

// RSI 값은 0-100 사이
```

### MACD

```typescript
import { calculateMACD } from 'tradingview-lib';

const macd = calculateMACD(candles, {
  fastPeriod: 12,
  slowPeriod: 26,
  signalPeriod: 9,
  source: 'close',
});

// 결과: MACDResult
// {
//   macd: IndicatorDataPoint[],
//   signal: IndicatorDataPoint[],
//   histogram: IndicatorDataPoint[]
// }
```

### Bollinger Bands

```typescript
import { calculateBollingerBands } from 'tradingview-lib';

const bbands = calculateBollingerBands(candles, {
  period: 20,
  stdDev: 2,
  source: 'close',
  maType: 'SMA', // 'SMA' 또는 'EMA'
});

// 결과: BollingerBandsResult
// {
//   upper: IndicatorDataPoint[],
//   middle: IndicatorDataPoint[],
//   lower: IndicatorDataPoint[]
// }
```

### Currency Strength (Forex 전용)

```typescript
import { calculateCurrencyStrength, CandleData } from 'tradingview-lib';

// 7개 주요 통화쌍 데이터가 필요합니다
const pairs = {
  EURUSD: eurusdCandles,
  USDJPY: usdjpyCandles,
  USDCHF: usdchfCandles,
  GBPUSD: gbpusdCandles,
  AUDUSD: audusdCandles,
  USDCAD: usdcadCandles,
  NZDUSD: nzdusdCandles,
};

const strength = calculateCurrencyStrength({ pairs });

// 결과: CurrencyStrengthResult
// {
//   EUR: IndicatorDataPoint[],
//   GBP: IndicatorDataPoint[],
//   JPY: IndicatorDataPoint[],
//   AUD: IndicatorDataPoint[],
//   NZD: IndicatorDataPoint[],
//   CAD: IndicatorDataPoint[],
//   CHF: IndicatorDataPoint[],
//   USD: IndicatorDataPoint[]
// }
```

## TradingView Lightweight Charts와 함께 사용하기

```typescript
import { TradingChart, calculateSMA, calculateRSI, generateMockCandles } from 'tradingview-lib';

// 차트 생성
const chart = new TradingChart(document.getElementById('chart')!);

// 캔들 데이터 생성 또는 로드
const candles = generateMockCandles(100);
chart.setData(candles);

// SMA 계산 및 추가
const sma20 = calculateSMA(candles, { period: 20 });
const smaLine = chart.getChart().addLineSeries({
  color: '#2962FF',
  lineWidth: 2,
});
smaLine.setData(sma20);

// RSI 계산 및 별도 패널에 추가
const rsi14 = calculateRSI(candles, { period: 14 });
const rsiLine = chart.getChart().addLineSeries({
  color: '#7E57C2',
  lineWidth: 2,
  priceScaleId: 'rsi',
});
rsiLine.priceScale().applyOptions({
  scaleMargins: {
    top: 0.7,
    bottom: 0,
  },
});
rsiLine.setData(rsi14);
```

## 타입 정의

### IndicatorDataPoint

```typescript
interface IndicatorDataPoint {
  time: number;  // Unix timestamp
  value: number;
}
```

### 옵션 타입

모든 지표는 기본적으로 다음 옵션들을 지원합니다:

```typescript
interface IndicatorOptions {
  source?: 'open' | 'high' | 'low' | 'close';
}
```

각 지표별 구체적인 옵션은 해당 지표의 Options 타입을 참조하세요:
- `SMAOptions`
- `EMAOptions`
- `RSIOptions`
- `MACDOptions`
- `BollingerBandsOptions`
- `CurrencyStrengthOptions`

## 참고사항

1. **데이터 길이**: 각 지표는 최소 필요한 데이터 개수가 있습니다. 예를 들어 SMA(20)은 최소 20개의 캔들이 필요합니다.

2. **시간 정렬**: 캔들 데이터는 시간 순서대로 정렬되어 있어야 합니다.

3. **결과 길이**: 지표 계산 결과의 길이는 입력 데이터보다 짧을 수 있습니다 (warmup 기간 때문).

4. **Currency Strength**: 이 지표는 Forex 거래 전용이며, 7개의 주요 통화쌍 데이터가 모두 필요합니다.

## 출처

이 지표들은 [s-stolz/algotrader](https://github.com/s-stolz/algotrader) 리포지토리의 Python 구현을 TypeScript로 포팅한 것입니다.
