import { useEffect, useRef, useState } from 'react';
import type { IChartApi, ISeriesApi, Time } from 'lightweight-charts';
import type { CandleData } from '../../types';

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
      color: '#26a69a',
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
      if (chartRef.current && chartInstanceRef.current) {
        const newWidth = chartRef.current.clientWidth;
        const newHeight = chartRef.current.clientHeight;
        if (newWidth > 0 && newHeight > 0) {
          chartInstanceRef.current.applyOptions({
            width: newWidth,
            height: newHeight,
          });
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
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      chartInstance.remove();
    };
  }, [options.width, options.height]);

  // 데이터 설정 함수
  const setData = (data: CandleData[], shouldFit: boolean = false) => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current) return;

    const candleData = data.map(c => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    const volumeData = data.map(c => ({
      time: c.time as Time,
      value: c.volume,
      color: c.close >= c.open ? '#ef444466' : '#3b82f666',
    }));

    candleSeriesRef.current.setData(candleData);
    volumeSeriesRef.current.setData(volumeData);

    if (chartInstanceRef.current && shouldFit) {
      chartInstanceRef.current.timeScale().fitContent();
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
