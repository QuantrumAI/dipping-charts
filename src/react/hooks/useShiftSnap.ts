import { useEffect, useState, useRef, useCallback } from 'react';
import type { IChartApi, ISeriesApi } from 'lightweight-charts';
import type { CandleData } from '../../types';

/**
 * useShiftSnap Hook
 * Shift 키를 누르면 차트의 crosshair가 가장 가까운 high/low 가격에 스냅됩니다.
 * Shift Snap 시각적 피드백을 위한 horizontal line을 표시합니다.
 */
export function useShiftSnap(
  chart: IChartApi | null,
  candleSeries: ISeriesApi<'Candlestick'> | null,
  candles: CandleData[]
) {
  const [shiftPressed, setShiftPressed] = useState(false);
  const [snapPrice, setSnapPrice] = useState<number | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const snapLineRef = useRef<any>(null);

  // Shift 키 핸들러
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift' && !shiftPressed) {
        setShiftPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setShiftPressed(false);
        setSnapPrice(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [shiftPressed]);

  // 가장 가까운 high/low 찾기
  const findNearestHighLow = useCallback((time: number, price: number): number | null => {
    if (candles.length === 0) return null;

    // 해당 시간의 캔들 찾기
    const candle = candles.find(c => {
      const candleTime = typeof c.time === 'number' ? c.time : new Date(c.time).getTime() / 1000;
      return Math.abs(candleTime - time) < 1; // Allow 1 second tolerance
    });

    if (!candle) return null;

    // high와 low 중 더 가까운 것 선택
    const distToHigh = Math.abs(candle.high - price);
    const distToLow = Math.abs(candle.low - price);

    return distToHigh < distToLow ? candle.high : candle.low;
  }, [candles]);

  // Crosshair move 구독 및 snap line 표시
  useEffect(() => {
    if (!chart || !candleSeries || !shiftPressed) {
      // Shift가 해제되면 구독 해제 및 snap line 제거
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      if (snapLineRef.current && candleSeries) {
        candleSeries.removePriceLine(snapLineRef.current);
        snapLineRef.current = null;
      }
      return;
    }

    // Shift가 눌리면 구독 시작
    const handleCrosshairMove = (param: any) => {
      if (!param.time) return;

      const time = typeof param.time === 'number' ? param.time : new Date(param.time).getTime() / 1000;

      // 현재 가격 가져오기
      const seriesData = param.seriesData?.get(candleSeries);
      if (!seriesData) return;

      const currentPrice = (seriesData.close + seriesData.open) / 2;
      const snappedPrice = findNearestHighLow(time, currentPrice);

      if (snappedPrice !== null && snappedPrice !== snapPrice) {
        setSnapPrice(snappedPrice);

        // 기존 snap line 제거
        if (snapLineRef.current) {
          candleSeries.removePriceLine(snapLineRef.current);
        }

        // 새로운 snap line 추가 (시각적 피드백)
        snapLineRef.current = candleSeries.createPriceLine({
          price: snappedPrice,
          color: '#2962FF',
          lineWidth: 1 as any,
          lineStyle: 2 as any, // Dashed
          lineVisible: true,
          axisLabelVisible: true,
          title: 'Snap',
        });
      }
    };

    const unsub = chart.subscribeCrosshairMove(handleCrosshairMove);
    unsubscribeRef.current = unsub as any;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      if (snapLineRef.current && candleSeries) {
        candleSeries.removePriceLine(snapLineRef.current);
        snapLineRef.current = null;
      }
    };
  }, [chart, candleSeries, shiftPressed, snapPrice, findNearestHighLow]);

  return { shiftPressed, snapPrice };
}
