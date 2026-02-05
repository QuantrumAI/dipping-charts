import { describe, it, expect, vi } from 'vitest';
import {
  isValidCandle,
  filterValidCandles,
  isValidIndicatorPoint,
  filterValidIndicatorPoints,
} from '../utils/validateCandle';
import type { CandleData } from '../types';

const validCandle: CandleData = {
  time: 1000,
  open: 100,
  high: 110,
  low: 90,
  close: 105,
  volume: 5000,
};

describe('isValidCandle', () => {
  it('유효한 캔들은 true', () => {
    expect(isValidCandle(validCandle)).toBe(true);
  });

  it('time이 0이면 false', () => {
    expect(isValidCandle({ ...validCandle, time: 0 })).toBe(false);
  });

  it('time이 음수면 false', () => {
    expect(isValidCandle({ ...validCandle, time: -100 })).toBe(false);
  });

  it('time이 NaN이면 false', () => {
    expect(isValidCandle({ ...validCandle, time: NaN })).toBe(false);
  });

  it('time이 Infinity면 false', () => {
    expect(isValidCandle({ ...validCandle, time: Infinity })).toBe(false);
  });

  it('open이 NaN이면 false', () => {
    expect(isValidCandle({ ...validCandle, open: NaN })).toBe(false);
  });

  it('high가 Infinity면 false', () => {
    expect(isValidCandle({ ...validCandle, high: Infinity })).toBe(false);
  });

  it('low가 -Infinity면 false', () => {
    expect(isValidCandle({ ...validCandle, low: -Infinity })).toBe(false);
  });

  it('close가 NaN이면 false', () => {
    expect(isValidCandle({ ...validCandle, close: NaN })).toBe(false);
  });

  it('null 필드가 있으면 false', () => {
    expect(isValidCandle({ ...validCandle, open: null as any })).toBe(false);
  });

  it('undefined 필드가 있으면 false', () => {
    expect(isValidCandle({ ...validCandle, close: undefined as any })).toBe(false);
  });
});

describe('filterValidCandles', () => {
  it('모두 유효하면 전부 반환', () => {
    const candles = [validCandle, { ...validCandle, time: 2000 }];
    expect(filterValidCandles(candles)).toHaveLength(2);
  });

  it('유효하지 않은 캔들을 필터링', () => {
    const candles = [
      validCandle,
      { ...validCandle, time: 2000, open: NaN },
      { ...validCandle, time: 3000 },
    ];
    expect(filterValidCandles(candles)).toHaveLength(2);
  });

  it('빈 배열에 대해 빈 배열 반환', () => {
    expect(filterValidCandles([])).toEqual([]);
  });

  it('필터링 시 콘솔 경고 출력', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const candles = [validCandle, { ...validCandle, time: 2000, open: NaN }];
    filterValidCandles(candles, 'TestLabel');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('TestLabel')
    );
    warnSpy.mockRestore();
  });

  it('모두 유효하면 경고를 출력하지 않음', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    filterValidCandles([validCandle]);
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

describe('isValidIndicatorPoint', () => {
  it('유효한 포인트는 true', () => {
    expect(isValidIndicatorPoint({ time: 1000, value: 50 })).toBe(true);
  });

  it('value가 NaN이면 false', () => {
    expect(isValidIndicatorPoint({ time: 1000, value: NaN })).toBe(false);
  });

  it('value가 Infinity면 false', () => {
    expect(isValidIndicatorPoint({ time: 1000, value: Infinity })).toBe(false);
  });

  it('time이 null이면 false', () => {
    expect(isValidIndicatorPoint({ time: null as any, value: 50 })).toBe(false);
  });

  it('value가 null이면 false', () => {
    expect(isValidIndicatorPoint({ time: 1000, value: null as any })).toBe(false);
  });

  it('value가 0은 유효', () => {
    expect(isValidIndicatorPoint({ time: 1000, value: 0 })).toBe(true);
  });

  it('음수 값도 유효', () => {
    expect(isValidIndicatorPoint({ time: 1000, value: -50 })).toBe(true);
  });
});

describe('filterValidIndicatorPoints', () => {
  it('유효하지 않은 포인트를 필터링', () => {
    const points = [
      { time: 1000, value: 50 },
      { time: 2000, value: NaN },
      { time: 3000, value: 60 },
      { time: 4000, value: Infinity },
    ];
    const result = filterValidIndicatorPoints(points);
    expect(result).toHaveLength(2);
    expect(result[0].value).toBe(50);
    expect(result[1].value).toBe(60);
  });

  it('빈 배열에 대해 빈 배열 반환', () => {
    expect(filterValidIndicatorPoints([])).toEqual([]);
  });
});
