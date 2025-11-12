import { CandleData, TimeFrame } from '../types';

/**
 * 시간봉에 따른 시간 간격 (초 단위)
 */
const TIME_INTERVALS: Record<TimeFrame, number> = {
  '1m': 60,                    // 1분
  '5m': 300,                   // 5분
  '1h': 3600,                  // 1시간
  '1d': 86400,                 // 1일
  '1w': 604800,                // 1주
  '1M': 2592000,               // 1개월 (30일)
  '1y': 31536000,              // 1년
};

/**
 * 가상의 캔들 데이터 생성
 */
export function generateMockCandles(
  timeFrame: TimeFrame,
  count: number = 100,
  basePrice: number = 100
): CandleData[] {
  const candles: CandleData[] = [];
  const interval = TIME_INTERVALS[timeFrame];
  const now = Math.floor(Date.now() / 1000);

  let currentPrice = basePrice;

  for (let i = count - 1; i >= 0; i--) {
    const time = now - (i * interval);

    // 가격 변동 (-2% ~ +2%)
    const priceChange = currentPrice * (Math.random() * 0.04 - 0.02);
    currentPrice += priceChange;

    // OHLC 생성
    const open = currentPrice;
    const close = currentPrice + (Math.random() * 4 - 2);
    const high = Math.max(open, close) + Math.random() * 2;
    const low = Math.min(open, close) - Math.random() * 2;

    // 거래량 (랜덤)
    const volume = Math.floor(Math.random() * 1000000) + 100000;

    candles.push({
      time,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
    });

    currentPrice = close;
  }

  return candles;
}

/**
 * 모든 시간봉 데이터 생성
 */
export function generateAllTimeFrames(basePrice: number = 150): Record<TimeFrame, CandleData[]> {
  return {
    '1m': generateMockCandles('1m', 200, basePrice),
    '5m': generateMockCandles('5m', 200, basePrice),
    '1h': generateMockCandles('1h', 168, basePrice),  // 1주일
    '1d': generateMockCandles('1d', 365, basePrice),  // 1년
    '1w': generateMockCandles('1w', 52, basePrice),   // 1년
    '1M': generateMockCandles('1M', 24, basePrice),   // 2년
    '1y': generateMockCandles('1y', 10, basePrice),   // 10년
  };
}
