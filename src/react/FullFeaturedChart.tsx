import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useChart } from './hooks/useChart';
import { useIndicators } from './hooks/useIndicators';
import { useLineTools } from './hooks/useLineTools';
import { useShiftSnap } from './hooks/useShiftSnap';
import { IndicatorSettings } from './components/IndicatorSettings';
import type { CandleData } from '../types';
import type { FullFeaturedChartProps, TimeFrame, IndicatorConfigs, IndicatorType, TimeframeAvailability } from './types';
import { isValidCandle, filterValidCandles } from '../utils/validateCandle';
import { getLocaleStrings } from './locale';
import type { LocaleStrings } from './locale';
import './FullFeaturedChart.css';

const DEFAULT_COLORS = ['#26a69a', '#ef5350', '#2196f3', '#ff6f00', '#ab47bc', '#66bb6a', '#ffa726', '#42a5f5'];

const TIMEFRAME_KEYS: { value: TimeFrame; key: keyof LocaleStrings }[] = [
  { value: '1m', key: 'tf_1m' },
  { value: '5m', key: 'tf_5m' },
  { value: '15m', key: 'tf_15m' },
  { value: '30m', key: 'tf_30m' },
  { value: '1h', key: 'tf_1h' },
  { value: '1d', key: 'tf_1d' },
  { value: '1w', key: 'tf_1w' },
  { value: '1M', key: 'tf_1M' },
];

const DEFAULT_TIMEFRAME_AVAILABILITY: TimeframeAvailability = {
  enabled: ['1m', '5m', '15m', '30m', '1h', '1d', '1w', '1M'],
  disabled: [],
  currentSession: 'regular',
};

function getToolLabel(t: LocaleStrings, toolType: string): string {
  const key = `tool_${toolType}` as keyof LocaleStrings;
  const val = t[key];
  return typeof val === 'string' ? val : toolType;
}

// localStorage 지표 설정 저장/복원
function saveIndicatorState(key: string, configs: IndicatorConfigs, checked: Set<IndicatorType>, macdColors: { line: string; signal: string }) {
  try {
    localStorage.setItem(key, JSON.stringify({
      configs,
      checked: Array.from(checked),
      macdColors,
    }));
  } catch (e) {
    // localStorage 오류 무시
  }
}

function loadIndicatorState(key: string): { configs: IndicatorConfigs; checked: Set<IndicatorType>; macdColors: { line: string; signal: string } } | null {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    return {
      configs: parsed.configs,
      checked: new Set(parsed.checked),
      macdColors: parsed.macdColors,
    };
  } catch (e) {
    return null;
  }
}

// 컨텍스트 메뉴 위치를 뷰포트 내에 고정
function clampToViewport(x: number, y: number, menuWidth = 280, menuHeight = 50): { x: number; y: number } {
  const pad = 8;
  return {
    x: Math.max(pad, Math.min(x, window.innerWidth - menuWidth - pad)),
    y: Math.max(pad, Math.min(y, window.innerHeight - menuHeight - pad)),
  };
}

export function FullFeaturedChart({
  locale: localeProp = 'en',
  data,
  width,
  height = 600,
  className = '',
  enableTimeframes = true,
  enableIndicators = true,
  enableDrawingTools = true,
  defaultTimeframe = '5m',
  timeframeAvailability = DEFAULT_TIMEFRAME_AVAILABILITY,
  onTimeframeChange,
  realtimeCandle,
  loading = false,
  error = null,
  symbol: _symbol,
  statusBadge,
  priceLines,
  initialLineTools,
  onLineToolsChange,
  onDrawingToolClick,
  showVolume = true,
  indicatorStorageKey,
  initialIndicatorState,
  onIndicatorStateChange,
}: FullFeaturedChartProps) {
  const t = getLocaleStrings(localeProp);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>(defaultTimeframe);
  const [candleData, setCandleData] = useState<CandleData[]>([]);
  const [indicatorDropdownOpen, setIndicatorDropdownOpen] = useState(false);
  const [drawingDropdownOpen, setDrawingDropdownOpen] = useState(false);
  const [textModalOpen, setTextModalOpen] = useState(false);
  const [textModalValue, setTextModalValue] = useState('');
  const [textModalMode, setTextModalMode] = useState<'add' | 'edit'>('add');
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [contextMenuDragging, setContextMenuDragging] = useState(false);
  const [contextMenuDragOffset, setContextMenuDragOffset] = useState({ x: 0, y: 0 });
  const [colorPaletteOpen, setColorPaletteOpen] = useState(false);

  // 지표 설정 (우선순위: initialIndicatorState > localStorage > 기본값)
  const localState = indicatorStorageKey ? loadIndicatorState(indicatorStorageKey) : null;
  const restoredConfigs = initialIndicatorState?.configs || localState?.configs || { sma: [], ema: [], rsi: [], macd: [], bbands: [] };
  const restoredChecked = initialIndicatorState?.checked
    ? new Set(initialIndicatorState.checked)
    : localState?.checked || new Set<IndicatorType>();
  const restoredMacdColors = initialIndicatorState?.macdColors || localState?.macdColors || { line: '#2962FF', signal: '#FF6D00' };

  const [indicatorConfigs, setIndicatorConfigs] = useState<IndicatorConfigs>(restoredConfigs);
  const [checkedIndicators, setCheckedIndicators] = useState<Set<IndicatorType>>(restoredChecked);
  const [selectedIndicator, setSelectedIndicator] = useState<IndicatorType | null>(null);
  const [macdColors, setMacdColors] = useState(restoredMacdColors);

  const { chartRef, chart, candleSeries, volumeSeries, setData: setChartData } = useChart({ width, height });
  const { applyIndicators } = useIndicators(chart, candleData);

  // 볼륨 시리즈 표시/숨김
  useEffect(() => {
    if (volumeSeries) {
      try {
        volumeSeries.applyOptions({
          visible: showVolume,
        });
      } catch (e) {
        // 차트 파괴 시 무시
      }
    }
  }, [volumeSeries, showVolume]);

  // Line tools with auto context menu (뷰포트 바운더리 적용)
  const handleToolFinished = useCallback((_tool: any) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const pos = clampToViewport(rect.left + rect.width / 2, rect.top + rect.height / 2);
      setContextMenuPos(pos);
      setContextMenuOpen(true);
    }
  }, []);

  const lineTools = useLineTools(chart, {
    onToolFinished: handleToolFinished,
    onToolsChange: onLineToolsChange,
    initialTools: initialLineTools,
  });
  useShiftSnap(chart, candleSeries, candleData);

  // Undo 히스토리 (도구 삭제 복원용)
  const undoStackRef = useRef<{ toolType: string; points: any[]; options: any }[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);

  // 타임프레임 변경 핸들러
  const handleTimeframeChange = useCallback((tf: TimeFrame) => {
    if (timeframeAvailability.disabled.includes(tf)) {
      return;
    }
    setTimeFrame(tf);
    onTimeframeChange?.(tf);
  }, [timeframeAvailability.disabled, onTimeframeChange]);

  // 외부 데이터 사용 (null/NaN 값 필터링)
  useEffect(() => {
    if (data && data.length > 0) {
      const validData = filterValidCandles(data, 'FullFeaturedChart');
      setCandleData(validData);
    }
  }, [data]);

  // 실시간 캔들 업데이트
  useEffect(() => {
    if (realtimeCandle && candleData.length > 0) {
      if (!isValidCandle(realtimeCandle)) {
        console.warn('[FullFeaturedChart] Skipping realtime candle with invalid values:', realtimeCandle);
        return;
      }

      setCandleData(prev => {
        const lastCandle = prev[prev.length - 1];
        const newData = lastCandle && lastCandle.time === realtimeCandle.time
          ? [...prev.slice(0, -1), realtimeCandle]
          : [...prev, realtimeCandle];
        return newData.filter(isValidCandle);
      });
    }
  }, [realtimeCandle]);

  // 차트에 데이터 설정 (초기 로드 또는 타임프레임 변경 시에만 fitContent)
  const isInitialLoad = useRef(true);
  const prevTimeFrameRef = useRef(timeFrame);
  useEffect(() => {
    if (candleData.length > 0) {
      const shouldFit = isInitialLoad.current || prevTimeFrameRef.current !== timeFrame;
      try {
        const validatedData = candleData.filter(isValidCandle);
        if (validatedData.length > 0) {
          setChartData(validatedData, shouldFit);
        } else {
          console.warn('[FullFeaturedChart] No valid data to display after final validation');
        }
      } catch (err) {
        console.error('[FullFeaturedChart] Error setting chart data:', err);
      }
      isInitialLoad.current = false;
      prevTimeFrameRef.current = timeFrame;
    }
  }, [candleData, setChartData, timeFrame]);

  // 지표 적용
  useEffect(() => {
    applyIndicators(indicatorConfigs, macdColors);
  }, [indicatorConfigs, candleData, applyIndicators, macdColors]);

  // 지표 설정 자동 저장 (localStorage + 외부 콜백)
  const indicatorInitRef = useRef(false);
  useEffect(() => {
    // 초기 마운트 시에는 콜백 호출 안 함 (로드한 값을 다시 저장하지 않도록)
    if (!indicatorInitRef.current) {
      indicatorInitRef.current = true;
      return;
    }
    if (indicatorStorageKey) {
      saveIndicatorState(indicatorStorageKey, indicatorConfigs, checkedIndicators, macdColors);
    }
    if (onIndicatorStateChange) {
      onIndicatorStateChange({
        configs: indicatorConfigs,
        checked: Array.from(checkedIndicators) as IndicatorType[],
        macdColors,
      });
    }
  }, [indicatorConfigs, checkedIndicators, macdColors, indicatorStorageKey, onIndicatorStateChange]);

  // 가격 라인 (평단가 등) 적용
  const priceLineRefsRef = useRef<any[]>([]);
  useEffect(() => {
    if (!candleSeries) return;

    // 기존 가격 라인 제거
    priceLineRefsRef.current.forEach((line) => {
      try {
        candleSeries.removePriceLine(line);
      } catch (e) {
        // 이미 제거된 경우 무시
      }
    });
    priceLineRefsRef.current = [];

    // 새 가격 라인 추가
    if (priceLines && priceLines.length > 0) {
      priceLines.forEach((priceLine) => {
        const lineStyleMap: Record<string, number> = {
          solid: 0, // LineStyle.Solid
          dashed: 1, // LineStyle.Dashed
          dotted: 3, // LineStyle.Dotted
        };

        const line = candleSeries.createPriceLine({
          price: priceLine.price,
          color: priceLine.color || '#FF9800',
          lineWidth: (priceLine.lineWidth || 2) as 1 | 2 | 3 | 4,
          lineStyle: lineStyleMap[priceLine.lineStyle || 'dashed'] || 1,
          lineVisible: true,
          axisLabelVisible: priceLine.axisLabelVisible !== false,
          title: priceLine.label || '',
        });
        priceLineRefsRef.current.push(line);
      });
    }

    return () => {
      const linesToRemove = [...priceLineRefsRef.current];
      priceLineRefsRef.current = [];

      linesToRemove.forEach((line) => {
        try {
          if (candleSeries && typeof candleSeries.options === 'function') {
            candleSeries.removePriceLine(line);
          }
        } catch (e) {
          // 차트가 이미 파괴된 경우 무시
        }
      });
    };
  }, [candleSeries, priceLines]);

  // 지표 체크박스 토글
  const toggleIndicator = useCallback((indicator: IndicatorType) => {
    const newChecked = new Set(checkedIndicators);

    if (newChecked.has(indicator)) {
      newChecked.delete(indicator);
      setIndicatorConfigs(prev => ({ ...prev, [indicator]: [] }));
    } else {
      newChecked.add(indicator);

      // 기본 설정 추가
      if (indicator === 'sma' || indicator === 'ema') {
        const periods = [5, 20, 60, 120];
        const thicknesses = [2, 2, 1, 1];
        const configs = periods.map((period, idx) => ({
          color: DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
          thickness: thicknesses[idx] || 1,
          source: 'close' as const,
          value: period
        }));
        setIndicatorConfigs(prev => ({ ...prev, [indicator]: configs }));
      } else if (indicator === 'bbands') {
        setIndicatorConfigs(prev => ({
          ...prev,
          bbands: [{
            color: DEFAULT_COLORS[0],
            thickness: 2,
            source: 'close' as const,
            value: 20,
            upperColor: '#F23645',
            middleColor: '#2962FF',
            lowerColor: '#089981',
            stdDev: 2
          }]
        }));
      } else if (indicator === 'macd') {
        setIndicatorConfigs(prev => ({
          ...prev,
          macd: [{
            fastPeriod: 12,
            slowPeriod: 26,
            signalPeriod: 9,
            thickness: 2
          }]
        }));
      } else {
        // RSI
        setIndicatorConfigs(prev => ({
          ...prev,
          [indicator]: [{
            color: DEFAULT_COLORS[0],
            thickness: 2,
            source: 'close' as const,
            value: 14
          }]
        }));
      }
    }

    setCheckedIndicators(newChecked);
  }, [checkedIndicators]);

  // 컨텍스트 메뉴 표시 (뷰포트 바운더리 적용)
  const showContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (lineTools.selectedToolId) {
      const pos = clampToViewport(e.clientX, e.clientY);
      setContextMenuPos(pos);
      setContextMenuOpen(true);
    }
  }, [lineTools.selectedToolId]);

  // 키보드 핸들러 (ESC + Ctrl+Z undo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // input/textarea 내부에서는 무시
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'Escape') {
        if (textModalOpen) {
          setTextModalOpen(false);
          return;
        }
        if (contextMenuOpen && lineTools.selectedToolId) {
          lineTools.removeSelectedTool();
          setContextMenuOpen(false);
        } else if (lineTools.activeToolType) {
          lineTools.activateTool(lineTools.activeToolType);
        }
      }

      // Ctrl+Z: 마지막 삭제된 도구 복원
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        const lastDeleted = undoStackRef.current.pop();
        if (lastDeleted && chart) {
          (chart as any).addLineTool(lastDeleted.toolType, lastDeleted.points, lastDeleted.options);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [contextMenuOpen, lineTools, textModalOpen, chart]);

  // 텍스트 도구 활성화
  const handleTextToolClick = () => {
    setTextModalValue('Label');
    setTextModalMode('add');
    setTextModalOpen(true);
  };

  // 텍스트 모달 확인
  const handleTextModalConfirm = () => {
    if (textModalValue) {
      if (textModalMode === 'edit') {
        lineTools.updateText(textModalValue);
      } else {
        lineTools.addTextTool(textModalValue);
      }
    }
    setTextModalOpen(false);
    setTextModalValue('');
  };

  // 텍스트 편집 (모달 사용 - prompt() 대체)
  const openTextEditModal = useCallback(() => {
    if (lineTools.selectedTool?.toolType === 'Text') {
      setTextModalValue(lineTools.selectedTool.options.text?.value || '');
      setTextModalMode('edit');
      setTextModalOpen(true);
    }
  }, [lineTools.selectedTool]);

  // 컨텍스트 메뉴 드래그 시작
  const handleContextMenuMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.context-menu-btn') ||
        (e.target as HTMLElement).closest('.color-picker-dropdown')) {
      return;
    }

    setContextMenuDragging(true);
    setContextMenuDragOffset({
      x: e.clientX - contextMenuPos.x,
      y: e.clientY - contextMenuPos.y
    });
    e.preventDefault();
  };

  // 컨텍스트 메뉴 드래그
  useEffect(() => {
    if (!contextMenuDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setContextMenuPos({
        x: e.clientX - contextMenuDragOffset.x,
        y: e.clientY - contextMenuDragOffset.y
      });
    };

    const handleMouseUp = () => {
      setContextMenuDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [contextMenuDragging, contextMenuDragOffset]);

  // 더블클릭으로 텍스트 편집 (모달 사용)
  const handleChartDoubleClick = useCallback((_e: React.MouseEvent) => {
    if (lineTools.selectedTool && lineTools.selectedTool.toolType === 'Text') {
      setTextModalValue(lineTools.selectedTool.options.text?.value || '');
      setTextModalMode('edit');
      setTextModalOpen(true);
    }
  }, [lineTools]);

  // 도구 삭제 시 undo 스택에 저장
  const handleRemoveSelectedTool = useCallback(() => {
    if (lineTools.selectedTool) {
      undoStackRef.current.push({
        toolType: lineTools.selectedTool.toolType,
        points: lineTools.selectedTool.points,
        options: lineTools.selectedTool.options,
      });
    }
    lineTools.removeSelectedTool();
    setContextMenuOpen(false);
  }, [lineTools]);

  // Outside click 핸들러 (드롭다운 및 컨텍스트 메뉴 닫기)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // 색상 팔레트 내부 클릭은 무시
      if (target.closest('.color-palette-popup')) {
        return;
      }

      // 지표 드롭다운 닫기
      if (indicatorDropdownOpen && !target.closest('.dropdown')) {
        setIndicatorDropdownOpen(false);
      }

      // 그리기 드롭다운 닫기
      if (drawingDropdownOpen && !target.closest('.dropdown')) {
        setDrawingDropdownOpen(false);
      }

      // 컨텍스트 메뉴 닫기
      if (contextMenuOpen && !target.closest('.context-menu')) {
        setContextMenuOpen(false);
        setColorPaletteOpen(false);
      }

      // 색상 팔레트 닫기
      if (colorPaletteOpen && !target.closest('.color-picker-dropdown')) {
        setColorPaletteOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [indicatorDropdownOpen, drawingDropdownOpen, contextMenuOpen, colorPaletteOpen]);

  return (
    <div
      className={`container ${className}`}
      ref={containerRef}
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      {/* 헤더 */}
      <div className="header">
        <div className="header-left">
          {enableTimeframes && (
            <div className="timeframe-group">
              {TIMEFRAME_KEYS.map(({ value: tf, key }) => {
                const isDisabled = timeframeAvailability.disabled.includes(tf);
                const isActive = timeFrame === tf;
                return (
                  <button
                    key={tf}
                    className={`btn-timeframe ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                    onClick={() => handleTimeframeChange(tf)}
                    disabled={isDisabled}
                    title={isDisabled ? t.tf_unavailable : undefined}
                  >
                    {t[key] as string}
                  </button>
                );
              })}
            </div>
          )}
          {statusBadge}
        </div>

        <div className="header-right">
          {/* 활성 그리기 도구 피드백 배지 */}
          {enableDrawingTools && lineTools.activeToolType && (
            <div className="active-tool-badge">
              {getToolLabel(t, lineTools.activeToolType)} {t.tool_drawing}
            </div>
          )}

          {enableIndicators && (
            <div className="dropdown">
              <button className="btn-text" onClick={() => {
                setIndicatorDropdownOpen(!indicatorDropdownOpen);
                setDrawingDropdownOpen(false);
              }}>
                {t.btn_indicators}
              </button>
              {indicatorDropdownOpen && (
                <div className="dropdown-menu show" id="indicatorMenu">
                  <div className="indicator-menu-layout">
                    <div className="indicator-list-side">
                      <div className="indicator-category">{t.cat_overlay}</div>
                      <div
                        className={`indicator-item ${checkedIndicators.has('sma') ? 'checked' : ''} ${selectedIndicator === 'sma' ? 'selected' : ''}`}
                        onClick={() => setSelectedIndicator('sma')}
                      >
                        <span>{t.ind_sma}</span>
                        <div className="indicator-checkbox" onClick={(e) => { e.stopPropagation(); toggleIndicator('sma'); setSelectedIndicator('sma'); }}></div>
                      </div>
                      <div
                        className={`indicator-item ${checkedIndicators.has('ema') ? 'checked' : ''} ${selectedIndicator === 'ema' ? 'selected' : ''}`}
                        onClick={() => setSelectedIndicator('ema')}
                      >
                        <span>{t.ind_ema}</span>
                        <div className="indicator-checkbox" onClick={(e) => { e.stopPropagation(); toggleIndicator('ema'); setSelectedIndicator('ema'); }}></div>
                      </div>
                      <div
                        className={`indicator-item ${checkedIndicators.has('bbands') ? 'checked' : ''} ${selectedIndicator === 'bbands' ? 'selected' : ''}`}
                        onClick={() => setSelectedIndicator('bbands')}
                      >
                        <span>{t.ind_bbands}</span>
                        <div className="indicator-checkbox" onClick={(e) => { e.stopPropagation(); toggleIndicator('bbands'); setSelectedIndicator('bbands'); }}></div>
                      </div>
                      <div className="indicator-category">{t.cat_oscillator}</div>
                      <div
                        className={`indicator-item ${checkedIndicators.has('rsi') ? 'checked' : ''} ${selectedIndicator === 'rsi' ? 'selected' : ''}`}
                        onClick={() => setSelectedIndicator('rsi')}
                      >
                        <span>{t.ind_rsi}</span>
                        <div className="indicator-checkbox" onClick={(e) => { e.stopPropagation(); toggleIndicator('rsi'); setSelectedIndicator('rsi'); }}></div>
                      </div>
                      <div
                        className={`indicator-item ${checkedIndicators.has('macd') ? 'checked' : ''} ${selectedIndicator === 'macd' ? 'selected' : ''}`}
                        onClick={() => setSelectedIndicator('macd')}
                      >
                        <span>{t.ind_macd}</span>
                        <div className="indicator-checkbox" onClick={(e) => { e.stopPropagation(); toggleIndicator('macd'); setSelectedIndicator('macd'); }}></div>
                      </div>
                    </div>
                    <div className="indicator-settings-side">
                      {selectedIndicator ? (
                        <IndicatorSettings
                          indicator={selectedIndicator}
                          configs={indicatorConfigs}
                          isChecked={checkedIndicators.has(selectedIndicator)}
                          onConfigChange={(indicator, configs) => {
                            setIndicatorConfigs(prev => ({ ...prev, [indicator]: configs }));
                          }}
                          macdColors={macdColors}
                          onMacdColorsChange={setMacdColors}
                          locale={localeProp}
                        />
                      ) : (
                        <div className="indicator-empty-state">{t.selectIndicator}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {enableDrawingTools && (
            <div className="dropdown">
              <button className="btn-text" onClick={() => {
                if (onDrawingToolClick && !onDrawingToolClick()) {
                  return;
                }
                setDrawingDropdownOpen(!drawingDropdownOpen);
                setIndicatorDropdownOpen(false);
              }}>
                {t.btn_draw}
              </button>
              {drawingDropdownOpen && (
                <div className="dropdown-menu show">
                  <button className="dropdown-item" onClick={() => { lineTools.activateTool('TrendLine'); setDrawingDropdownOpen(false); }}>
                    <span className="item-icon tossface">📏</span>
                    <span>{t.tool_TrendLine}</span>
                  </button>
                  <button className="dropdown-item" onClick={() => { lineTools.activateTool('HorizontalLine'); setDrawingDropdownOpen(false); }}>
                    <span className="item-icon tossface">➖</span>
                    <span>{t.tool_HorizontalLine}</span>
                  </button>
                  <button className="dropdown-item" onClick={() => { lineTools.activateTool('VerticalLine'); setDrawingDropdownOpen(false); }}>
                    <span className="item-icon">|</span>
                    <span>{t.tool_VerticalLine}</span>
                  </button>
                  <button className="dropdown-item" onClick={() => { lineTools.activateTool('Rectangle'); setDrawingDropdownOpen(false); }}>
                    <span className="item-icon tossface">▭</span>
                    <span>{t.tool_Rectangle}</span>
                  </button>
                  <button className="dropdown-item" onClick={() => { lineTools.activateTool('FibRetracement'); setDrawingDropdownOpen(false); }}>
                    <span className="item-icon">Φ</span>
                    <span>{t.tool_FibRetracement}</span>
                  </button>
                  <button className="dropdown-item" onClick={() => { handleTextToolClick(); setDrawingDropdownOpen(false); }}>
                    <span className="item-icon">T</span>
                    <span>{t.tool_Text}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {enableDrawingTools && (
            <>
              <div className="separator"></div>
              <button className="btn-delete" onClick={lineTools.removeAllTools}>{t.btn_clearAll}</button>
            </>
          )}
        </div>
      </div>

      {/* 차트 */}
      <div className="chart-wrapper" style={{ position: 'relative', flex: 1, minHeight: 0 }}>
        <div
          ref={chartRef}
          style={{ width: '100%', height: '100%' }}
          onContextMenu={showContextMenu}
          onDoubleClick={handleChartDoubleClick}
        />

        {loading && (
          <div className="chart-overlay loading-overlay">
            <div className="loading-spinner"></div>
            <span>{t.loading}</span>
          </div>
        )}

        {error && (
          <div className="chart-overlay error-overlay">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && candleData.length === 0 && (
          <div className="chart-overlay empty-overlay">
            <span>{t.noData}</span>
          </div>
        )}
      </div>

      {textModalOpen && (
        <div className="modal-overlay show" onClick={() => setTextModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">{textModalMode === 'edit' ? t.textEdit : t.textAdd}</div>
            <input
              type="text"
              className="modal-input"
              value={textModalValue}
              onChange={(e) => setTextModalValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTextModalConfirm();
                if (e.key === 'Escape') setTextModalOpen(false);
              }}
              placeholder={t.textPlaceholder}
              autoFocus
            />
            <div className="modal-buttons">
              <button className="modal-btn modal-btn-cancel" onClick={() => setTextModalOpen(false)}>{t.cancel}</button>
              <button className="modal-btn modal-btn-confirm" onClick={handleTextModalConfirm}>{t.confirm}</button>
            </div>
          </div>
        </div>
      )}

      {/* 컨텍스트 메뉴 */}
      {contextMenuOpen && lineTools.selectedTool && (
        <div
          className="context-menu show"
          style={{
            left: contextMenuPos.x,
            top: contextMenuPos.y,
            cursor: contextMenuDragging ? 'grabbing' : 'grab'
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={handleContextMenuMouseDown}
        >
          <button className="context-menu-btn" onClick={() => lineTools.updateLineWidth(Math.max(1, lineTools.currentWidth - 1))}>−</button>
          <div className="width-display">{lineTools.currentWidth}</div>
          <button className="context-menu-btn" onClick={() => lineTools.updateLineWidth(Math.min(10, lineTools.currentWidth + 1))}>+</button>
          <div className="context-menu-separator"></div>
          <div className="color-picker-dropdown">
            <button className="color-current-btn" onClick={() => setColorPaletteOpen(!colorPaletteOpen)}>
              <div className="color-current-display" style={{ background: lineTools.currentColor }}></div>
            </button>
            {colorPaletteOpen && (
              <div className="color-palette show">
                {['#000000', '#ef4444', '#2962FF', '#22c55e', '#eab308', '#a855f7', '#f97316'].map(color => (
                  <button
                    key={color}
                    className="color-option"
                    style={{ background: color }}
                    onClick={() => {
                      lineTools.updateColor(color);
                      setColorPaletteOpen(false);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
          {lineTools.selectedTool.toolType === 'Text' && (
            <>
              <div className="context-menu-separator"></div>
              <button className="context-menu-btn" onClick={openTextEditModal}>T</button>
            </>
          )}
          <div className="context-menu-separator"></div>
          <button className="context-menu-btn danger" onClick={handleRemoveSelectedTool}>🗑️</button>
        </div>
      )}
    </div>
  );
}
