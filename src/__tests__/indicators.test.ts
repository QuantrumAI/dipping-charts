import { describe, it, expect } from 'vitest';
import { calculateSMA } from '../indicators/sma';
import { calculateEMA } from '../indicators/ema';
import { calculateRSI } from '../indicators/rsi';
import { calculateMACD } from '../indicators/macd';
import { calculateBollingerBands } from '../indicators/bollingerBands';
import { calculateStochastic } from '../indicators/stochastic';
import { calculateATR } from '../indicators/atr';
import { calculateVWAP } from '../indicators/vwap';
import { calculateWilliamsR } from '../indicators/williamsR';
import type { CandleData } from '../types';

// 테스트용 캔들 데이터 생성
function makeCandles(closes: number[], baseTime = 1000): CandleData[] {
  return closes.map((close, i) => ({
    time: baseTime + i * 60,
    open: close,
    high: close + 1,
    low: close - 1,
    close,
    volume: 1000,
  }));
}

// HLC를 개별 지정할 수 있는 캔들 생성 헬퍼
function makeCandlesHLC(
  data: { high: number; low: number; close: number; volume?: number }[],
  baseTime = 1000,
): CandleData[] {
  return data.map((d, i) => ({
    time: baseTime + i * 60,
    open: d.close,
    high: d.high,
    low: d.low,
    close: d.close,
    volume: d.volume ?? 1000,
  }));
}

describe('calculateSMA', () => {
  it('빈 배열에 대해 빈 결과를 반환', () => {
    expect(calculateSMA([], { period: 3 })).toEqual([]);
  });

  it('데이터가 period보다 적으면 빈 결과를 반환', () => {
    const candles = makeCandles([10, 20]);
    expect(calculateSMA(candles, { period: 5 })).toEqual([]);
  });

  it('period=3 일 때 올바른 SMA 계산', () => {
    const candles = makeCandles([10, 20, 30, 40, 50]);
    const result = calculateSMA(candles, { period: 3 });

    expect(result).toHaveLength(3);
    expect(result[0].value).toBeCloseTo(20);  // (10+20+30)/3
    expect(result[1].value).toBeCloseTo(30);  // (20+30+40)/3
    expect(result[2].value).toBeCloseTo(40);  // (30+40+50)/3
  });

  it('period=1 일 때 원본 close 값과 동일', () => {
    const candles = makeCandles([10, 20, 30]);
    const result = calculateSMA(candles, { period: 1 });

    expect(result).toHaveLength(3);
    expect(result[0].value).toBe(10);
    expect(result[1].value).toBe(20);
    expect(result[2].value).toBe(30);
  });

  it('모든 값이 동일할 때 SMA도 동일', () => {
    const candles = makeCandles([50, 50, 50, 50, 50]);
    const result = calculateSMA(candles, { period: 3 });

    result.forEach(r => expect(r.value).toBeCloseTo(50));
  });

  it('time 값이 올바르게 매핑됨', () => {
    const candles = makeCandles([10, 20, 30, 40], 5000);
    const result = calculateSMA(candles, { period: 2 });

    expect(result[0].time).toBe(5060);  // index 1
    expect(result[1].time).toBe(5120);  // index 2
    expect(result[2].time).toBe(5180);  // index 3
  });

  it('source 옵션이 동작함', () => {
    const candles: CandleData[] = [
      { time: 1, open: 100, high: 110, low: 90, close: 105, volume: 1 },
      { time: 2, open: 200, high: 210, low: 190, close: 205, volume: 1 },
      { time: 3, open: 300, high: 310, low: 290, close: 305, volume: 1 },
    ];
    const result = calculateSMA(candles, { period: 3, source: 'open' });

    expect(result[0].value).toBeCloseTo(200); // (100+200+300)/3
  });
});

describe('calculateEMA', () => {
  it('빈 배열에 대해 빈 결과를 반환', () => {
    expect(calculateEMA([], { period: 3 })).toEqual([]);
  });

  it('데이터가 period보다 적으면 빈 결과를 반환', () => {
    const candles = makeCandles([10, 20]);
    expect(calculateEMA(candles, { period: 5 })).toEqual([]);
  });

  it('첫 EMA 값은 SMA와 동일', () => {
    const candles = makeCandles([10, 20, 30, 40, 50]);
    const result = calculateEMA(candles, { period: 3 });

    // 첫 EMA = SMA(3) = (10+20+30)/3 = 20
    expect(result[0].value).toBeCloseTo(20);
  });

  it('결과 길이가 올바름 (data.length - period + 1)', () => {
    const candles = makeCandles([10, 20, 30, 40, 50]);
    const result = calculateEMA(candles, { period: 3 });

    expect(result).toHaveLength(3);
  });

  it('EMA는 최근 값에 더 높은 가중치를 부여', () => {
    const candles = makeCandles([10, 10, 10, 100]);
    const smaResult = calculateSMA(candles, { period: 3 });
    const emaResult = calculateEMA(candles, { period: 3 });

    // 100으로 급등할 때, EMA는 SMA보다 더 높아야 함 (최근 가격에 가중치)
    expect(emaResult[1].value).toBeGreaterThan(smaResult[1].value);
  });
});

describe('calculateRSI', () => {
  it('빈 배열에 대해 빈 결과를 반환', () => {
    expect(calculateRSI([], { period: 14 })).toEqual([]);
  });

  it('데이터가 부족하면 빈 결과를 반환', () => {
    const candles = makeCandles([10, 20, 30]);
    expect(calculateRSI(candles, { period: 14 })).toEqual([]);
  });

  it('RSI 값은 0~100 범위 내', () => {
    const prices = Array.from({ length: 50 }, (_, i) => 100 + Math.sin(i * 0.5) * 20);
    const candles = makeCandles(prices);
    const result = calculateRSI(candles, { period: 14 });

    result.forEach(r => {
      expect(r.value).toBeGreaterThanOrEqual(0);
      expect(r.value).toBeLessThanOrEqual(100);
    });
  });

  it('모두 상승하면 RSI가 높음', () => {
    const prices = Array.from({ length: 20 }, (_, i) => 100 + i * 2);
    const candles = makeCandles(prices);
    const result = calculateRSI(candles, { period: 5 });

    // 지속적 상승 -> RSI가 매우 높아야 함
    const lastRSI = result[result.length - 1].value;
    expect(lastRSI).toBeGreaterThan(90);
  });

  it('모두 하락하면 RSI가 낮음', () => {
    const prices = Array.from({ length: 20 }, (_, i) => 200 - i * 2);
    const candles = makeCandles(prices);
    const result = calculateRSI(candles, { period: 5 });

    const lastRSI = result[result.length - 1].value;
    expect(lastRSI).toBeLessThan(10);
  });
});

describe('calculateMACD', () => {
  it('빈 배열에 대해 빈 결과를 반환', () => {
    const result = calculateMACD([]);
    expect(result.macd).toEqual([]);
    expect(result.signal).toEqual([]);
    expect(result.histogram).toEqual([]);
  });

  it('데이터가 부족하면 빈 결과를 반환', () => {
    const candles = makeCandles(Array.from({ length: 10 }, (_, i) => 100 + i));
    const result = calculateMACD(candles, { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 });
    expect(result.macd).toEqual([]);
  });

  it('충분한 데이터로 MACD, Signal, Histogram 모두 생성', () => {
    const prices = Array.from({ length: 60 }, (_, i) => 100 + Math.sin(i * 0.2) * 10);
    const candles = makeCandles(prices);
    const result = calculateMACD(candles, { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 });

    expect(result.macd.length).toBeGreaterThan(0);
    expect(result.signal.length).toBeGreaterThan(0);
    expect(result.histogram.length).toBeGreaterThan(0);
  });

  it('Signal과 Histogram 길이가 동일', () => {
    const prices = Array.from({ length: 60 }, (_, i) => 100 + Math.sin(i * 0.2) * 10);
    const candles = makeCandles(prices);
    const result = calculateMACD(candles, { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 });

    expect(result.signal.length).toBe(result.histogram.length);
    // signal과 histogram의 시간이 일치해야 함
    for (let i = 0; i < result.signal.length; i++) {
      expect(result.signal[i].time).toBe(result.histogram[i].time);
    }
  });
});

describe('calculateBollingerBands', () => {
  it('빈 배열에 대해 빈 결과를 반환', () => {
    const result = calculateBollingerBands([]);
    expect(result.upper).toEqual([]);
    expect(result.middle).toEqual([]);
    expect(result.lower).toEqual([]);
  });

  it('데이터가 부족하면 빈 결과를 반환', () => {
    const candles = makeCandles([10, 20, 30]);
    const result = calculateBollingerBands(candles, { period: 20, stdDev: 2 });
    expect(result.upper).toEqual([]);
  });

  it('upper > middle > lower 관계가 성립', () => {
    const prices = Array.from({ length: 30 }, (_, i) => 100 + Math.sin(i * 0.5) * 5);
    const candles = makeCandles(prices);
    const result = calculateBollingerBands(candles, { period: 20, stdDev: 2 });

    for (let i = 0; i < result.middle.length; i++) {
      expect(result.upper[i].value).toBeGreaterThan(result.middle[i].value);
      expect(result.middle[i].value).toBeGreaterThan(result.lower[i].value);
    }
  });

  it('middle band는 SMA와 동일', () => {
    const prices = Array.from({ length: 25 }, (_, i) => 100 + i);
    const candles = makeCandles(prices);
    const bbResult = calculateBollingerBands(candles, { period: 5, stdDev: 2 });
    const smaResult = calculateSMA(candles, { period: 5 });

    for (let i = 0; i < bbResult.middle.length; i++) {
      expect(bbResult.middle[i].value).toBeCloseTo(smaResult[i].value);
    }
  });

  it('모든 값이 동일하면 upper와 lower가 middle과 같음 (표준편차=0)', () => {
    const candles = makeCandles(Array(25).fill(100));
    const result = calculateBollingerBands(candles, { period: 5, stdDev: 2 });

    for (let i = 0; i < result.middle.length; i++) {
      expect(result.upper[i].value).toBeCloseTo(100);
      expect(result.middle[i].value).toBeCloseTo(100);
      expect(result.lower[i].value).toBeCloseTo(100);
    }
  });

  it('세 밴드 모두 같은 시간을 가짐', () => {
    const prices = Array.from({ length: 30 }, (_, i) => 100 + i);
    const candles = makeCandles(prices);
    const result = calculateBollingerBands(candles, { period: 20, stdDev: 2 });

    for (let i = 0; i < result.middle.length; i++) {
      expect(result.upper[i].time).toBe(result.middle[i].time);
      expect(result.middle[i].time).toBe(result.lower[i].time);
    }
  });
});

// =============================================
// Stochastic Oscillator
// =============================================
describe('calculateStochastic', () => {
  it('빈 배열에 대해 빈 결과를 반환', () => {
    const result = calculateStochastic([]);
    expect(result.k).toEqual([]);
    expect(result.d).toEqual([]);
  });

  it('데이터가 kPeriod보다 적으면 빈 결과를 반환', () => {
    const candles = makeCandles([10, 20, 30]);
    const result = calculateStochastic(candles, { kPeriod: 14, dPeriod: 3, smooth: 3 });
    expect(result.k).toEqual([]);
  });

  it('%K 값이 0~100 범위 내', () => {
    const prices = Array.from({ length: 30 }, (_, i) => 100 + Math.sin(i * 0.5) * 20);
    const candles = makeCandles(prices);
    const result = calculateStochastic(candles, { kPeriod: 5, dPeriod: 3, smooth: 3 });

    result.k.forEach(r => {
      expect(r.value).toBeGreaterThanOrEqual(0);
      expect(r.value).toBeLessThanOrEqual(100);
    });
  });

  it('%D 값이 0~100 범위 내', () => {
    const prices = Array.from({ length: 30 }, (_, i) => 100 + Math.sin(i * 0.5) * 20);
    const candles = makeCandles(prices);
    const result = calculateStochastic(candles, { kPeriod: 5, dPeriod: 3, smooth: 3 });

    result.d.forEach(r => {
      expect(r.value).toBeGreaterThanOrEqual(0);
      expect(r.value).toBeLessThanOrEqual(100);
    });
  });

  it('%D 길이가 %K보다 짧거나 같음', () => {
    const prices = Array.from({ length: 30 }, (_, i) => 100 + i);
    const candles = makeCandles(prices);
    const result = calculateStochastic(candles, { kPeriod: 5, dPeriod: 3, smooth: 3 });

    expect(result.d.length).toBeLessThanOrEqual(result.k.length);
    expect(result.d.length).toBeGreaterThan(0);
  });

  it('지속 상승 시 %K가 높음', () => {
    const prices = Array.from({ length: 20 }, (_, i) => 100 + i * 2);
    const candles = makeCandles(prices);
    const result = calculateStochastic(candles, { kPeriod: 5, dPeriod: 3, smooth: 1 });

    const lastK = result.k[result.k.length - 1].value;
    expect(lastK).toBeGreaterThan(80);
  });
});

// =============================================
// ATR (Average True Range)
// =============================================
describe('calculateATR', () => {
  it('빈 배열에 대해 빈 결과를 반환', () => {
    expect(calculateATR([])).toEqual([]);
  });

  it('데이터가 period+1 보다 적으면 빈 결과를 반환', () => {
    const candles = makeCandles([10, 20, 30]);
    expect(calculateATR(candles, { period: 14 })).toEqual([]);
  });

  it('ATR 값이 항상 양수', () => {
    const data = makeCandlesHLC([
      { high: 110, low: 90, close: 100 },
      { high: 115, low: 95, close: 105 },
      { high: 120, low: 100, close: 110 },
      { high: 108, low: 88, close: 95 },
      { high: 105, low: 85, close: 90 },
      { high: 112, low: 92, close: 108 },
    ]);
    const result = calculateATR(data, { period: 3 });

    expect(result.length).toBeGreaterThan(0);
    result.forEach(r => {
      expect(r.value).toBeGreaterThan(0);
    });
  });

  it('변동 없는 데이터에서 ATR이 0에 가까움', () => {
    // H=101, L=99, C=100 이면 TR=2 (H-L)
    const data = makeCandlesHLC(
      Array(10).fill({ high: 101, low: 99, close: 100 }),
    );
    const result = calculateATR(data, { period: 3 });

    expect(result.length).toBeGreaterThan(0);
    result.forEach(r => {
      expect(r.value).toBeCloseTo(2, 1);
    });
  });

  it('결과 길이가 올바름', () => {
    const data = makeCandlesHLC(
      Array.from({ length: 20 }, (_, i) => ({
        high: 110 + i,
        low: 90 + i,
        close: 100 + i,
      })),
    );
    const result = calculateATR(data, { period: 5 });
    // TR starts from index 1, first ATR at index period, then continues
    expect(result.length).toBe(20 - 5);
  });
});

// =============================================
// VWAP (Volume Weighted Average Price)
// =============================================
describe('calculateVWAP', () => {
  it('빈 배열에 대해 빈 결과를 반환', () => {
    expect(calculateVWAP([])).toEqual([]);
  });

  it('단일 캔들에서 VWAP = typical price', () => {
    const candles = makeCandlesHLC([
      { high: 110, low: 90, close: 100, volume: 1000 },
    ]);
    const result = calculateVWAP(candles);

    expect(result).toHaveLength(1);
    const tp = (110 + 90 + 100) / 3;
    expect(result[0].value).toBeCloseTo(tp);
  });

  it('동일 가격/볼륨이면 VWAP이 일정', () => {
    const candles = makeCandlesHLC(
      Array(5).fill({ high: 110, low: 90, close: 100, volume: 1000 }),
    );
    const result = calculateVWAP(candles);

    const tp = (110 + 90 + 100) / 3;
    result.forEach(r => {
      expect(r.value).toBeCloseTo(tp);
    });
  });

  it('높은 볼륨 캔들 쪽으로 VWAP이 치우침', () => {
    const candles = makeCandlesHLC([
      { high: 110, low: 90, close: 100, volume: 100 },    // TP=100
      { high: 210, low: 190, close: 200, volume: 10000 },  // TP=200
    ]);
    const result = calculateVWAP(candles);

    // VWAP should be much closer to 200 than 100
    expect(result[1].value).toBeGreaterThan(190);
  });

  it('결과 길이가 입력 길이와 동일', () => {
    const candles = makeCandlesHLC(
      Array.from({ length: 10 }, (_, i) => ({
        high: 110 + i,
        low: 90 + i,
        close: 100 + i,
        volume: 1000,
      })),
    );
    const result = calculateVWAP(candles);
    expect(result).toHaveLength(10);
  });

  it('time 값이 올바르게 매핑됨', () => {
    const candles = makeCandlesHLC(
      [
        { high: 110, low: 90, close: 100, volume: 1000 },
        { high: 120, low: 100, close: 110, volume: 2000 },
      ],
      5000,
    );
    const result = calculateVWAP(candles);
    expect(result[0].time).toBe(5000);
    expect(result[1].time).toBe(5060);
  });
});

// =============================================
// Williams %R
// =============================================
describe('calculateWilliamsR', () => {
  it('빈 배열에 대해 빈 결과를 반환', () => {
    expect(calculateWilliamsR([])).toEqual([]);
  });

  it('데이터가 period보다 적으면 빈 결과를 반환', () => {
    const candles = makeCandles([10, 20, 30]);
    expect(calculateWilliamsR(candles, { period: 14 })).toEqual([]);
  });

  it('Williams %R 값은 -100~0 범위', () => {
    const prices = Array.from({ length: 30 }, (_, i) => 100 + Math.sin(i * 0.5) * 20);
    const candles = makeCandles(prices);
    const result = calculateWilliamsR(candles, { period: 5 });

    result.forEach(r => {
      expect(r.value).toBeGreaterThanOrEqual(-100);
      expect(r.value).toBeLessThanOrEqual(0);
    });
  });

  it('지속 상승 시 Williams %R이 0에 가까움', () => {
    const prices = Array.from({ length: 20 }, (_, i) => 100 + i * 2);
    const candles = makeCandles(prices);
    const result = calculateWilliamsR(candles, { period: 5 });

    const lastWR = result[result.length - 1].value;
    expect(lastWR).toBeGreaterThan(-20);
  });

  it('지속 하락 시 Williams %R이 -100에 가까움', () => {
    const prices = Array.from({ length: 20 }, (_, i) => 200 - i * 2);
    const candles = makeCandles(prices);
    const result = calculateWilliamsR(candles, { period: 5 });

    const lastWR = result[result.length - 1].value;
    expect(lastWR).toBeLessThan(-80);
  });

  it('결과 길이가 올바름 (data.length - period + 1)', () => {
    const prices = Array.from({ length: 20 }, (_, i) => 100 + i);
    const candles = makeCandles(prices);
    const result = calculateWilliamsR(candles, { period: 5 });

    expect(result).toHaveLength(16); // 20 - 5 + 1
  });
});
