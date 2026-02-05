import { createChart, IChartApi, ISeriesApi, CandlestickData, HistogramData } from 'lightweight-charts';
import { CandleData, ChartOptions } from '../types';
import { filterValidCandles } from '../utils/validateCandle';

/**
 * TradingView 스타일 차트
 */
export class TradingChart {
  private chart: IChartApi;
  private candleSeries: ISeriesApi<'Candlestick'>;
  private volumeSeries: ISeriesApi<'Histogram'>;

  constructor(container: HTMLElement, options: ChartOptions = {}) {
    // 차트 생성
    this.chart = createChart(container, {
      width: options.width || container.clientWidth,
      height: options.height || 600,
      layout: {
        background: { color: '#ffffff' },
        textColor: '#333',
      },
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      crosshair: {
        mode: 0, // 0 = Normal (자연스러운 움직임), 1 = Magnet (snap)
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

    // 캔들스틱 시리즈 추가
    this.candleSeries = this.chart.addCandlestickSeries({
      upColor: '#ef4444',
      downColor: '#3b82f6',
      borderUpColor: '#ef4444',
      borderDownColor: '#3b82f6',
      wickUpColor: '#ef4444',
      wickDownColor: '#3b82f6',
    });

    // 거래량 시리즈 추가 (하단)
    this.volumeSeries = this.chart.addHistogramSeries({
      color: '#ef4444',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    });

    this.volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    // 반응형 처리
    window.addEventListener('resize', () => {
      this.chart.applyOptions({
        width: container.clientWidth,
      });
    });

    // Shift 키로 snap 모드 전환
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Shift') {
        this.chart.applyOptions({
          crosshair: { mode: 1 }, // Magnet mode
        });
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'Shift') {
        this.chart.applyOptions({
          crosshair: { mode: 0 }, // Normal mode
        });
      }
    });
  }

  /**
   * 캔들 데이터 설정
   */
  setData(candles: CandleData[]) {
    const validCandles = filterValidCandles(candles, 'TradingChart');

    if (validCandles.length === 0) {
      console.warn('[TradingChart] No valid candle data to display');
      return;
    }

    // 캔들 데이터 변환
    const candleData: CandlestickData[] = validCandles.map(candle => ({
      time: candle.time as any,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }));

    // 거래량 데이터 변환
    const volumeData: HistogramData[] = validCandles.map(candle => ({
      time: candle.time as any,
      value: candle.volume ?? 0,
      color: candle.close >= candle.open ? '#ef444466' : '#3b82f666',
    }));

    this.candleSeries.setData(candleData);
    this.volumeSeries.setData(volumeData);

    // 차트 범위 자동 조정
    this.chart.timeScale().fitContent();
  }

  /**
   * 차트 제거
   */
  destroy() {
    this.chart.remove();
  }

  /**
   * 차트 인스턴스 반환
   */
  getChart(): IChartApi {
    return this.chart;
  }
}
