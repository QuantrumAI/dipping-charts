import { useEffect, useRef, useState } from 'react';
import type { IChartApi, ISeriesApi, Time } from 'lightweight-charts';
import type { CandleData } from '../../types';
import { filterValidCandles } from '../../utils/validateCandle';
import { loadLightweightCharts } from '../loadLightweightCharts';

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
  const cleanupRef = useRef<(() => void) | null>(null);

  const [chart, setChart] = useState<IChartApi | null>(null);
  const [candleSeries, setCandleSeries] = useState<ISeriesApi<'Candlestick'> | null>(null);
  const [volumeSeries, setVolumeSeries] = useState<ISeriesApi<'Histogram'> | null>(null);

  // 차트 초기화
  useEffect(() => {
    if (!chartRef.current) return;

    let cancelled = false;

    // 초기화 시 파괴 플래그 리셋
    isDestroyedRef.current = false;

    const init = async () => {
      // 자동 로딩 시도 (이미 로드되어 있으면 즉시 resolve)
      let LWC: any;
      try {
        LWC = await loadLightweightCharts();
      } catch {
        // 폴백: 전역 LightweightCharts 확인 (수동 script 태그)
        if (typeof LightweightCharts !== 'undefined') {
          LWC = LightweightCharts;
        } else {
          console.error('[useChart] LightweightCharts is not loaded. Make sure to include the script in your HTML or place the standalone JS in a known path.');
          return;
        }
      }

      if (cancelled || !chartRef.current) return;

    const { createChart } = LWC;
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

    // ──────────────────────────────────────────────
    // Y축(가격축) 독립 휠 줌 핸들러
    // ──────────────────────────────────────────────

    // 탐색 기준 상수
    // ChartModel은 50+ 메서드를 보유하고, Signal 객체는 ~5개이므로 20으로 필터링
    const MIN_CHARTMODEL_METHODS = 20;
    // X축 줌은 barSpacing의 10%씩 변화. Y축은 scaleTo 내부 공식
    // (scaleCoeff = (start + h*0.2) / (x + h*0.2))에 의해 0.05 → ~6.7%/step
    const Y_ZOOM_SENSITIVITY = 0.05;

    // 내부 객체 캐시 (model, pane, priceScale)
    let cachedInternals: { model: any; pane: any; priceScale: any } | null = null;

    /**
     * LWC 내부 객체를 리플렉션으로 탐색한다.
     *
     * 모든 탐색은 인스턴스 프로퍼티 순회와 프로토타입 시그니처 매칭만 사용하며,
     * 내부 메서드를 호출하지 않아 상태 오염 위험이 없다.
     *
     * 탐색 경로:
     *   PriceScaleApi → chartWidget → ChartModel → Pane → PriceScale
     *
     * 각 단계에서 객체를 식별하는 기준:
     *   - ChartModel: 배열 프로퍼티 + 20개 이상 메서드 + 3,3,2-arg 스케일 메서드 패턴
     *   - Pane: 배열 원소 중 'right'/'left' 문자열을 가진 PriceScale 하위 객체 보유
     *   - PriceScale: Pane의 인스턴스 프로퍼티 중 'right' 문자열 프로퍼티를 가진 객체
     */
    function discoverInternals(): { model: any; pane: any; priceScale: any } | null {
      try {
        const psApi = chartInstance.priceScale('right');

        // ── Step 1: PriceScaleApi → chartWidget ──
        // PriceScaleApi 인스턴스의 첫 번째 object 프로퍼티가 chartWidget이다.
        let chartWidget: any = null;
        for (const key of Object.getOwnPropertyNames(psApi)) {
          const val = psApi[key];
          if (val && typeof val === 'object') {
            chartWidget = val;
            break;
          }
        }
        if (!chartWidget) {
          console.warn('[useChart] Y-axis zoom: chartWidget not found on PriceScaleApi');
          return null;
        }

        // ── Step 2: chartWidget → ChartModel ──
        // ChartModel은 chartWidget의 인스턴스 프로퍼티 중 다음을 동시에 만족하는 객체:
        //   a) 배열 인스턴스 프로퍼티 보유 (panes 목록)
        //   b) 프로토타입에 MIN_CHARTMODEL_METHODS 이상의 메서드
        //   c) 3-arg, 3-arg, 2-arg 연속 메서드 패턴 (startScalePrice/scalePriceTo/endScalePrice)
        // 참고: startScrollPrice/scrollPriceTo/endScrollPrice도 동일한 3,3,2 패턴이지만,
        //       LWC 소스에서 scale 메서드가 scroll보다 먼저 정의되므로 first-match가 정확하다.
        let model: any = null;
        let scaleMethodNames: [string, string, string] | null = null;

        for (const key of Object.getOwnPropertyNames(chartWidget)) {
          const val = chartWidget[key];
          if (!val || typeof val !== 'object' || Array.isArray(val)
              || val instanceof HTMLElement || val instanceof Node) continue;

          // 조건 a) 배열 프로퍼티 확인
          let hasArrayProp = false;
          for (const prop of Object.getOwnPropertyNames(val)) {
            if (Array.isArray(val[prop]) && val[prop].length > 0) {
              hasArrayProp = true;
              break;
            }
          }
          if (!hasArrayProp) continue;

          // 조건 b) 메서드 수 확인
          const proto = Object.getPrototypeOf(val);
          if (!proto) continue;
          const methods = Object.getOwnPropertyNames(proto)
            .filter(k => typeof val[k] === 'function');
          if (methods.length < MIN_CHARTMODEL_METHODS) continue;

          // 조건 c) 3,3,2-arg 스케일 메서드 패턴
          for (let i = 0; i < methods.length - 2; i++) {
            if (val[methods[i]].length === 3 && val[methods[i + 1]].length === 3 && val[methods[i + 2]].length === 2) {
              scaleMethodNames = [methods[i], methods[i + 1], methods[i + 2]];
              break;
            }
          }
          if (scaleMethodNames) {
            model = val;
            break;
          }
        }
        if (!model || !scaleMethodNames) {
          console.warn('[useChart] Y-axis zoom: ChartModel not found on chartWidget');
          return null;
        }

        // ── Step 3: ChartModel → Pane ──
        // ChartModel은 복수의 배열 프로퍼티를 보유 (panes, series 등).
        // Pane 객체는 PriceScale 하위 객체를 인스턴스 프로퍼티로 보유하는 것으로 식별한다.
        // PriceScale은 인스턴스 프로퍼티 중 'right' 또는 'left' 문자열을 가진 객체이다.
        let pane: any = null;

        for (const key of Object.getOwnPropertyNames(model)) {
          if (!Array.isArray(model[key]) || model[key].length === 0) continue;
          const candidate = model[key][0];
          if (!candidate || typeof candidate !== 'object') continue;

          // 후보 객체의 인스턴스 프로퍼티에서 PriceScale 존재 여부 확인
          let hasPriceScaleProp = false;
          for (const prop of Object.getOwnPropertyNames(candidate)) {
            const sub = candidate[prop];
            if (!sub || typeof sub !== 'object' || Array.isArray(sub)) continue;
            // PriceScale은 인스턴스 프로퍼티에 'right' 또는 'left' 문자열을 보유
            for (const subProp of Object.getOwnPropertyNames(sub)) {
              if (sub[subProp] === 'right' || sub[subProp] === 'left') {
                hasPriceScaleProp = true;
                break;
              }
            }
            if (hasPriceScaleProp) break;
          }
          if (hasPriceScaleProp) {
            pane = candidate;
            break;
          }
        }
        if (!pane) {
          console.warn('[useChart] Y-axis zoom: Pane not found in ChartModel');
          return null;
        }

        // ── Step 4: Pane → priceScale (오른쪽 가격축) ──
        // Pane의 인스턴스 프로퍼티 중 'right' 문자열 프로퍼티를 가진 객체가 rightPriceScale이다.
        // 메서드 호출 없이 인스턴스 프로퍼티만 순회하므로 상태 오염 위험이 없다.
        let priceScale: any = null;
        for (const key of Object.getOwnPropertyNames(pane)) {
          const val = pane[key];
          if (!val || typeof val !== 'object' || Array.isArray(val)) continue;
          for (const prop of Object.getOwnPropertyNames(val)) {
            if (val[prop] === 'right') {
              priceScale = val;
              break;
            }
          }
          if (priceScale) break;
        }
        if (!priceScale) {
          console.warn('[useChart] Y-axis zoom: right PriceScale not found on Pane');
          return null;
        }

        // scaleMethodNames를 model 객체에 래핑하여 반환
        const wrappedModel = {
          startScalePrice: (p: any, ps: any, x: number) => model[scaleMethodNames![0]](p, ps, x),
          scalePriceTo: (p: any, ps: any, x: number) => model[scaleMethodNames![1]](p, ps, x),
          endScalePrice: (p: any, ps: any) => model[scaleMethodNames![2]](p, ps),
        };

        return { model: wrappedModel, pane, priceScale };
      } catch (e) {
        console.warn('[useChart] Y-axis zoom: discovery failed with error:', e);
        return null;
      }
    }

    function getInternals() {
      if (!cachedInternals) {
        cachedInternals = discoverInternals();
      }
      return cachedInternals;
    }

    /**
     * 가격축(Y축) 영역에서의 휠 이벤트 핸들러.
     * capture phase에서 등록하여 LWC 내장 핸들러보다 먼저 실행되고,
     * stopPropagation으로 LWC의 시간축 줌을 차단한다.
     */
    function handlePriceAxisWheel(e: WheelEvent) {
      const container = chartRef.current;
      if (!container || !chartInstanceRef.current) return;

      // 오른쪽 가격축 너비 확인
      let priceAxisWidth: number;
      try {
        priceAxisWidth = chartInstanceRef.current.priceScale('right').width();
      } catch {
        return;
      }
      if (priceAxisWidth <= 0) return;

      // 마우스가 가격축 영역 위에 있는지 확인
      const rect = container.getBoundingClientRect();
      const priceAxisLeft = rect.right - priceAxisWidth;
      if (
        e.clientX < priceAxisLeft || e.clientX > rect.right ||
        e.clientY < rect.top || e.clientY > rect.bottom
      ) {
        return; // 메인 차트 영역 → LWC 기본 동작에 위임
      }

      // 내부 객체 탐색
      const internals = getInternals();
      if (!internals) return;

      // LWC 내장 핸들러 차단
      e.stopPropagation();
      e.preventDefault();

      const { model, pane, priceScale } = internals;

      // 휠 델타 정규화 (LWC 내장 핸들러와 동일한 방식)
      let multiplier = 1;
      if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) multiplier = 32;
      else if (e.deltaMode === WheelEvent.DOM_DELTA_PAGE) multiplier = 120;

      const rawDelta = -(multiplier * e.deltaY / 100);
      const zoomDirection = Math.sign(rawDelta) * Math.min(1, Math.abs(rawDelta));
      if (zoomDirection === 0) return;

      // 줌 좌표 계산
      const chartHeight = rect.height;
      const centerY = chartHeight / 2;
      const zoomDelta = zoomDirection * chartHeight * Y_ZOOM_SENSITIVITY;

      // 내부 API로 Y축만 줌 (autoScale 자동 해제됨)
      try {
        model.startScalePrice(pane, priceScale, centerY);
        model.scalePriceTo(pane, priceScale, centerY - zoomDelta);
        model.endScalePrice(pane, priceScale);
      } catch (err) {
        console.warn('[useChart] Y-axis zoom: scale operation failed:', err);
        cachedInternals = null;
      }
    }

    /**
     * 가격축 영역 더블클릭 핸들러.
     * autoScale을 다시 활성화하여 가격 범위를 자동 조정 모드로 복귀시킨다.
     */
    function handlePriceAxisDblClick(e: MouseEvent) {
      const container = chartRef.current;
      if (!container || !chartInstanceRef.current) return;

      let priceAxisWidth: number;
      try {
        priceAxisWidth = chartInstanceRef.current.priceScale('right').width();
      } catch {
        return;
      }
      if (priceAxisWidth <= 0) return;

      const rect = container.getBoundingClientRect();
      const priceAxisLeft = rect.right - priceAxisWidth;
      if (
        e.clientX < priceAxisLeft || e.clientX > rect.right ||
        e.clientY < rect.top || e.clientY > rect.bottom
      ) {
        return;
      }

      // autoScale 복원
      try {
        chartInstanceRef.current.priceScale('right').applyOptions({
          autoScale: true,
        });
      } catch (err) {
        console.warn('[useChart] Y-axis zoom reset: failed to restore autoScale:', err);
      }
    }

    // 이벤트 리스너 등록
    chartRef.current.addEventListener('wheel', handlePriceAxisWheel, { capture: true, passive: false });
    chartRef.current.addEventListener('dblclick', handlePriceAxisDblClick, { capture: true });

    cleanupRef.current = () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);

      // Y축 줌 이벤트 리스너 해제
      if (chartRef.current) {
        chartRef.current.removeEventListener('wheel', handlePriceAxisWheel, { capture: true } as EventListenerOptions);
        chartRef.current.removeEventListener('dblclick', handlePriceAxisDblClick, { capture: true } as EventListenerOptions);
      }

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
    }; // end of init()

    init();

    return () => {
      cancelled = true;
      // 파괴 플래그 먼저 설정 (다른 effect들이 참조하지 않도록)
      isDestroyedRef.current = true;

      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
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
