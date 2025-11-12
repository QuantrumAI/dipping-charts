import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useChart } from './hooks/useChart';
import { useIndicators } from './hooks/useIndicators';
import { useLineTools } from './hooks/useLineTools';
import { useShiftSnap } from './hooks/useShiftSnap';
import { IndicatorSettings } from './components/IndicatorSettings';
import type { CandleData } from '../types';
import type { FullFeaturedChartProps, TimeFrame, IndicatorConfigs, IndicatorType } from './types';
import './FullFeaturedChart.css';

const DEFAULT_COLORS = ['#26a69a', '#ef5350', '#2196f3', '#ff6f00', '#ab47bc', '#66bb6a', '#ffa726', '#42a5f5'];

const TIME_INTERVALS: Record<TimeFrame, number> = {
  '1m': 60,
  '5m': 300,
  '1h': 3600,
  '1d': 86400,
  '1w': 604800,
  '1M': 2592000,
};

function generateMockData(timeFrame: TimeFrame, count: number): CandleData[] {
  const candles: CandleData[] = [];
  const interval = TIME_INTERVALS[timeFrame];
  const now = Math.floor(Date.now() / 1000);
  let currentPrice = 150;

  for (let i = count - 1; i >= 0; i--) {
    const time = now - (i * interval);
    const priceChange = currentPrice * (Math.random() * 0.04 - 0.02);
    currentPrice += priceChange;

    const open = currentPrice;
    const close = currentPrice + (Math.random() * 4 - 2);
    const high = Math.max(open, close) + Math.random() * 2;
    const low = Math.min(open, close) - Math.random() * 2;
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

export function FullFeaturedChart({
  data,
  width,
  height = 600,
  className = '',
  enableTimeframes = true,
  enableIndicators = true,
  enableDrawingTools = true,
}: FullFeaturedChartProps) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('5m');
  const [candleData, setCandleData] = useState<CandleData[]>([]);
  const [indicatorDropdownOpen, setIndicatorDropdownOpen] = useState(false);
  const [drawingDropdownOpen, setDrawingDropdownOpen] = useState(false);
  const [textModalOpen, setTextModalOpen] = useState(false);
  const [textModalValue, setTextModalValue] = useState('');
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [contextMenuDragging, setContextMenuDragging] = useState(false);
  const [contextMenuDragOffset, setContextMenuDragOffset] = useState({ x: 0, y: 0 });
  const [colorPaletteOpen, setColorPaletteOpen] = useState(false);

  // 지표 설정
  const [indicatorConfigs, setIndicatorConfigs] = useState<IndicatorConfigs>({
    sma: [],
    ema: [],
    rsi: [],
    macd: [],
    bbands: []
  });
  const [checkedIndicators, setCheckedIndicators] = useState<Set<IndicatorType>>(new Set());
  const [selectedIndicator, setSelectedIndicator] = useState<IndicatorType | null>(null);
  const [macdColors, setMacdColors] = useState({ line: '#2962FF', signal: '#FF6D00' });

  const { chartRef, chart, candleSeries, setData: setChartData } = useChart({ width, height });
  const { applyIndicators } = useIndicators(chart, candleData);

  // Line tools with auto context menu
  const handleToolFinished = useCallback((_tool: any) => {
    // Auto-show context menu when tool is finished
    // Position at center of screen
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setContextMenuPos({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      });
      setContextMenuOpen(true);
    }
  }, []);

  const lineTools = useLineTools(chart, { onToolFinished: handleToolFinished });
  useShiftSnap(chart, candleSeries, candleData);

  const containerRef = useRef<HTMLDivElement>(null);

  // 데이터 로드
  useEffect(() => {
    if (data && data.length > 0) {
      setCandleData(data);
    } else {
      setCandleData(generateMockData(timeFrame, 200));
    }
  }, [data, timeFrame]);

  // 차트에 데이터 설정 (초기 로드 또는 타임프레임 변경 시에만 fitContent)
  const isInitialLoad = useRef(true);
  const prevTimeFrameRef = useRef(timeFrame);
  useEffect(() => {
    if (candleData.length > 0) {
      const shouldFit = isInitialLoad.current || prevTimeFrameRef.current !== timeFrame;
      setChartData(candleData, shouldFit);
      isInitialLoad.current = false;
      prevTimeFrameRef.current = timeFrame;
    }
  }, [candleData, setChartData, timeFrame]);

  // 지표 적용
  useEffect(() => {
    applyIndicators(indicatorConfigs, macdColors);
  }, [indicatorConfigs, candleData, applyIndicators, macdColors]);

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
        const configs = periods.map((period, idx) => ({
          color: DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
          thickness: 1,
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

  // 컨텍스트 메뉴 표시
  const showContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (lineTools.selectedToolId) {
      setContextMenuPos({ x: e.clientX, y: e.clientY });
      setContextMenuOpen(true);
    }
  }, [lineTools.selectedToolId]);

  // ESC 키 핸들러
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (contextMenuOpen && lineTools.selectedToolId) {
          lineTools.removeSelectedTool();
          setContextMenuOpen(false);
        } else if (lineTools.activeToolType) {
          lineTools.activateTool(lineTools.activeToolType);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [contextMenuOpen, lineTools]);

  // 텍스트 도구 활성화
  const handleTextToolClick = () => {
    setTextModalValue('Label');
    setTextModalOpen(true);
  };

  // 텍스트 모달 확인
  const handleTextModalConfirm = () => {
    if (textModalValue) {
      lineTools.addTextTool(textModalValue);
    }
    setTextModalOpen(false);
    setTextModalValue('');
  };

  // 컨텍스트 메뉴 드래그 시작
  const handleContextMenuMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.context-menu-btn') ||
        (e.target as HTMLElement).closest('.color-picker-dropdown')) {
      return; // 버튼 클릭 시에는 드래그 안 함
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

  // 더블클릭으로 텍스트 편집
  const handleChartDoubleClick = useCallback((_e: React.MouseEvent) => {
    if (lineTools.selectedTool && lineTools.selectedTool.toolType === 'Text') {
      const newText = prompt('텍스트 수정', lineTools.selectedTool.options.text?.value || '');
      if (newText) {
        lineTools.updateText(newText);
      }
    }
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
    <div className={`container ${className}`} ref={containerRef}>
      {/* 헤더 */}
      <div className="header">
        <div className="header-left">
          {enableTimeframes && (
            <div className="timeframe-group">
              {(['1m', '5m', '1h', '1d', '1w', '1M'] as TimeFrame[]).map(tf => (
                <button
                  key={tf}
                  className={`btn-timeframe ${timeFrame === tf ? 'active' : ''}`}
                  onClick={() => setTimeFrame(tf)}
                >
                  {tf === '1m' ? '1분' : tf === '5m' ? '5분' : tf === '1h' ? '1시간' :
                   tf === '1d' ? '일' : tf === '1w' ? '주' : '월'}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="header-right">
          {enableIndicators && (
            <div className="dropdown">
              <button className="btn-text" onClick={() => {
                setIndicatorDropdownOpen(!indicatorDropdownOpen);
                setDrawingDropdownOpen(false);
              }}>
                + 보조지표
              </button>
              {indicatorDropdownOpen && (
                <div className="dropdown-menu show" id="indicatorMenu">
                  <div className="indicator-menu-layout">
                    <div className="indicator-list-side">
                      <div className="indicator-category">상단 지표</div>
                      <div
                        className={`indicator-item ${checkedIndicators.has('sma') ? 'checked' : ''} ${selectedIndicator === 'sma' ? 'selected' : ''}`}
                        onClick={() => setSelectedIndicator('sma')}
                      >
                        <span>이동평균선</span>
                        <div className="indicator-checkbox" onClick={(e) => { e.stopPropagation(); toggleIndicator('sma'); setSelectedIndicator('sma'); }}></div>
                      </div>
                      <div
                        className={`indicator-item ${checkedIndicators.has('ema') ? 'checked' : ''} ${selectedIndicator === 'ema' ? 'selected' : ''}`}
                        onClick={() => setSelectedIndicator('ema')}
                      >
                        <span>지수이동평균</span>
                        <div className="indicator-checkbox" onClick={(e) => { e.stopPropagation(); toggleIndicator('ema'); setSelectedIndicator('ema'); }}></div>
                      </div>
                      <div
                        className={`indicator-item ${checkedIndicators.has('bbands') ? 'checked' : ''} ${selectedIndicator === 'bbands' ? 'selected' : ''}`}
                        onClick={() => setSelectedIndicator('bbands')}
                      >
                        <span>볼린저 밴드</span>
                        <div className="indicator-checkbox" onClick={(e) => { e.stopPropagation(); toggleIndicator('bbands'); setSelectedIndicator('bbands'); }}></div>
                      </div>
                      <div className="indicator-category">하단 지표</div>
                      <div
                        className={`indicator-item ${checkedIndicators.has('rsi') ? 'checked' : ''} ${selectedIndicator === 'rsi' ? 'selected' : ''}`}
                        onClick={() => setSelectedIndicator('rsi')}
                      >
                        <span>RSI</span>
                        <div className="indicator-checkbox" onClick={(e) => { e.stopPropagation(); toggleIndicator('rsi'); setSelectedIndicator('rsi'); }}></div>
                      </div>
                      <div
                        className={`indicator-item ${checkedIndicators.has('macd') ? 'checked' : ''} ${selectedIndicator === 'macd' ? 'selected' : ''}`}
                        onClick={() => setSelectedIndicator('macd')}
                      >
                        <span>MACD</span>
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
                        />
                      ) : (
                        <div className="indicator-empty-state">지표를 선택하세요</div>
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
                setDrawingDropdownOpen(!drawingDropdownOpen);
                setIndicatorDropdownOpen(false);
              }}>
                <span className="tossface">✏️</span> 그리기
              </button>
              {drawingDropdownOpen && (
                <div className="dropdown-menu show">
                  <button className="dropdown-item" onClick={() => { lineTools.activateTool('TrendLine'); setDrawingDropdownOpen(false); }}>
                    <span className="item-icon tossface">📏</span>
                    <span>추세선</span>
                  </button>
                  <button className="dropdown-item" onClick={() => { lineTools.activateTool('HorizontalLine'); setDrawingDropdownOpen(false); }}>
                    <span className="item-icon tossface">➖</span>
                    <span>수평선</span>
                  </button>
                  <button className="dropdown-item" onClick={() => { lineTools.activateTool('VerticalLine'); setDrawingDropdownOpen(false); }}>
                    <span className="item-icon">|</span>
                    <span>수직선</span>
                  </button>
                  <button className="dropdown-item" onClick={() => { lineTools.activateTool('Rectangle'); setDrawingDropdownOpen(false); }}>
                    <span className="item-icon tossface">▭</span>
                    <span>사각형</span>
                  </button>
                  <button className="dropdown-item" onClick={() => { lineTools.activateTool('FibRetracement'); setDrawingDropdownOpen(false); }}>
                    <span className="item-icon">Φ</span>
                    <span>피보나치</span>
                  </button>
                  <button className="dropdown-item" onClick={() => { handleTextToolClick(); setDrawingDropdownOpen(false); }}>
                    <span className="item-icon">T</span>
                    <span>텍스트</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {enableDrawingTools && (
            <>
              <div className="separator"></div>
              <button className="btn-delete" onClick={lineTools.removeAllTools}>전체 삭제</button>
            </>
          )}
        </div>
      </div>

      {/* 차트 */}
      <div
        ref={chartRef}
        style={{ width: '100%', height: `${height}px` }}
        onContextMenu={showContextMenu}
        onDoubleClick={handleChartDoubleClick}
      />

      {/* 텍스트 모달 */}
      {textModalOpen && (
        <div className="modal-overlay" onClick={() => setTextModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">텍스트 입력</div>
            <input
              type="text"
              className="modal-input"
              value={textModalValue}
              onChange={(e) => setTextModalValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTextModalConfirm();
                if (e.key === 'Escape') setTextModalOpen(false);
              }}
              placeholder="텍스트를 입력하세요"
              autoFocus
            />
            <div className="modal-buttons">
              <button className="modal-btn modal-btn-cancel" onClick={() => setTextModalOpen(false)}>취소</button>
              <button className="modal-btn modal-btn-confirm" onClick={handleTextModalConfirm}>확인</button>
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
              <button className="context-menu-btn" onClick={() => {
                const newText = prompt('텍스트 수정', lineTools.selectedTool?.options.text?.value || '');
                if (newText) lineTools.updateText(newText);
              }}>T</button>
            </>
          )}
          <div className="context-menu-separator"></div>
          <button className="context-menu-btn danger" onClick={() => { lineTools.removeSelectedTool(); setContextMenuOpen(false); }}>🗑️</button>
        </div>
      )}
    </div>
  );
}
