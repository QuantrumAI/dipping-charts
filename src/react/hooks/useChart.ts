import { useEffect, useRef, useState } from 'react';
import type { IChartApi, ISeriesApi, Time } from 'lightweight-charts';
import type { CandleData } from '../../types';
import { filterValidCandles } from '../../utils/validateCandle';

// 전역 LightweightCharts 객체 (커스텀 빌드 - Line Tools 포함)
declare const LightweightCharts: any;

export interface UseChartOptions {
  width?: number;
  height?: number;
}

export interface UseChartReturn {
  chartRef: React.RefObject<HTMLDivElement | null>;
  chart: IChartApi | null;
  candleSeries: ISeriesApi<'Candlestick'> | null;
  volumeSeries: ISeriesApi<'Histogram'> | null;
  setData: (data: CandleData[], shouldFit?: boolean) => void;
}

export function useChart(options: UseChartOptions = {}): UseChartReturn {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const isDestroyedRef = useRef<boolean>(false);

  const [chart, setChart] = useState<IChartApi | null>(null);
  const [candleSeries, setCandleSeries] = useState<ISeriesApi<'Candlestick'> | null>(null);
  const [volumeSeries, setVolumeSeries] = useState<ISeriesApi<'Histogram'> | null>(null);

  // 차트 초기화
  useEffect(() => {
    if (!chartRef.current) return;

    // 전역 LightweightCharts 객체 확인
    if (typeof LightweightCharts === 'undefined') {
      console.error('[useChart] LightweightCharts is not loaded. Make sure to include the script in your HTML.');
      return;
    }

    // 초기화 시 파괴 플래그 리셋
    isDestroyedRef.current = false;

    const { createChart } = LightweightCharts;
    const width = options.width || chartRef.current.clientWidth;
    const height = options.height || 600;

    const chartInstance = createChart(chartRef.current, {
      width,
      height,
      layout: {
        background: { color: '#ffffff' },
        textColor: '#333',
      },
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      crosshair: {
        mode: 0,
      },
      rightPriceScale: {
        borderColor: '#cccccc',
      },
      timeScale: {
        borderColor: '#cccccc',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // 캔들스틱 시리즈
    const candleSeriesInstance = chartInstance.addCandlestickSeries({
      upColor: '#ef4444',
      downColor: '#3b82f6',
      borderUpColor: '#ef4444',
      borderDownColor: '#3b82f6',
      wickUpColor: '#ef4444',
      wickDownColor: '#3b82f6',
    });

    // 거래량 시리즈
    const volumeSeriesInstance = chartInstance.addHistogramSeries({
      color: '#ef4444',
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });

    volumeSeriesInstance.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    chartInstanceRef.current = chartInstance;
    candleSeriesRef.current = candleSeriesInstance;
    volumeSeriesRef.current = volumeSeriesInstance;

    setChart(chartInstance);
    setCandleSeries(candleSeriesInstance);
    setVolumeSeries(volumeSeriesInstance);

    // 리사이즈 핸들러 - width와 height 모두 업데이트
    const handleResize = () => {
      // 차트가 파괴된 경우 무시
      if (isDestroyedRef.current) return;

      if (chartRef.current && chartInstanceRef.current) {
        const newWidth = chartRef.current.clientWidth;
        const newHeight = chartRef.current.clientHeight;
        if (newWidth > 0 && newHeight > 0) {
          try {
            chartInstanceRef.current.applyOptions({
              width: newWidth,
              height: newHeight,
            });
          } catch (e) {
            // 차트가 이미 파괴된 경우 무시
          }
        }
      }
    };

    // ResizeObserver로 컨테이너 크기 변화 감지 (height 포함)
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(chartRef.current);

    // window resize도 백업으로 유지
    window.addEventListener('resize', handleResize);

    return () => {
      // 파괴 플래그 먼저 설정 (다른 effect들이 참조하지 않도록)
      isDestroyedRef.current = true;

      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);

      // refs 정리
      chartInstanceRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;

      // state 정리
      setChart(null);
      setCandleSeries(null);
      setVolumeSeries(null);

      // 차트 파괴
      try {
        chartInstance.remove();
      } catch (e) {
        // 이미 파괴된 경우 무시
      }
    };
  }, [options.width, options.height]);

  // 이전 데이터의 첫번째 timestamp 저장 (타임존 변경 시 오프셋 계산용)
  const prevFirstTimestampRef = useRef<number | null>(null);

  // 데이터 설정 함수
  const setData = (data: CandleData[], shouldFit: boolean = false) => {
    // 차트가 파괴된 경우 무시
    if (isDestroyedRef.current) return;
    if (!candleSeriesRef.current || !volumeSeriesRef.current || !chartInstanceRef.current) return;

    // 데이터가 없거나 빈 배열이면 무시 (에러 방지)
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.warn('[useChart] No data provided, skipping setData');
      return;
    }

    // 현재 visible range 저장 (shouldFit이 false일 때만)
    let savedRange: { from: number; to: number } | null = null;

    if (!shouldFit && data.length > 0 && prevFirstTimestampRef.current !== null) {
      try {
        const visibleRange = chartInstanceRef.current.timeScale().getVisibleLogicalRange();
        if (visibleRange) {
          savedRange = { from: visibleRange.from, to: visibleRange.to };
        }
      } catch (e) {
        // ignore
      }
    }

    const validData = filterValidCandles(data, 'useChart');

    if (validData.length === 0) {
      console.warn('[useChart] No valid candle data to display');
      return;
    }

    // 첫번째 timestamp 저장
    prevFirstTimestampRef.current = validData[0].time as number;

    const candleData = validData.map(c => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    const volumeData = validData.map(c => ({
      time: c.time as Time,
      value: Number.isFinite(c.volume) ? c.volume : 0,  // NaN/Infinity/null/undefined 모두 0으로 처리
      color: c.close >= c.open ? '#ef444466' : '#3b82f666',
    }));

    try {
      // 차트가 파괴된 경우 재확인 (race condition 방지)
      if (isDestroyedRef.current || !candleSeriesRef.current || !volumeSeriesRef.current) {
        return;
      }

      const finalCandleData = candleData.filter(c => {
        const time = typeof c.time === 'number' ? c.time : Number(c.time);
        return Number.isFinite(time) && time > 0 &&
               Number.isFinite(c.open) && Number.isFinite(c.high) &&
               Number.isFinite(c.low) && Number.isFinite(c.close);
      });
      const finalVolumeData = volumeData.filter(v => {
        const time = typeof v.time === 'number' ? v.time : Number(v.time);
        return Number.isFinite(time) && time > 0 && Number.isFinite(v.value);
      });

      if (finalCandleData.length === 0) {
        console.warn('[useChart] No valid candle data after final null check');
        return;
      }

      // 각 setData 호출 전 ref 체크 (unmount 중 호출 방지)
      if (candleSeriesRef.current && !isDestroyedRef.current) {
        candleSeriesRef.current.setData(finalCandleData);
      }
      if (volumeSeriesRef.current && !isDestroyedRef.current) {
        volumeSeriesRef.current.setData(finalVolumeData);
      }

      if (shouldFit && chartInstanceRef.current && !isDestroyedRef.current) {
        chartInstanceRef.current.timeScale().fitContent();
      } else if (savedRange && chartInstanceRef.current && !isDestroyedRef.current) {
        // 저장된 range 복원 (logical range는 인덱스 기반이라 오프셋 불필요)
        try {
          chartInstanceRef.current.timeScale().setVisibleLogicalRange(savedRange);
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      // 차트가 파괴된 경우 에러 무시 (정상 unmount)
      if (!isDestroyedRef.current) {
        console.error('[useChart] Error in setData:', e, 'Data sample:', candleData.slice(0, 3));
      }
    }
  };

  return {
    chartRef,
    chart,
    candleSeries,
    volumeSeries,
    setData,
  };
}
