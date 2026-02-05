/**
 * 난독화된 lightweight-charts Line Tool 결과에서 도구 ID를 추출합니다.
 */
function getToolIdFromResult(result) {
  try {
    return result?.ak?.ji ?? null;
  } catch {
    return null;
  }
}

// Import from chart.js
import {
  chart,
  chartContainer,
  candleSeries,
  volumeSeries,
  currentCandles,
  indicatorSeries,
  indicatorStates,
  dynamicIndicatorSeries,
  loadData,
  toggleSMA20,
  toggleEMA12,
  toggleRSI14,
  toggleMACD,
  toggleBollingerBands
} from './chart.js';

// 시간봉 버튼 이벤트
document.querySelectorAll('.btn-timeframe').forEach(btn => {
  btn.addEventListener('click', () => {
    const timeFrame = btn.dataset.timeframe;

    // active 클래스 토글
    document.querySelectorAll('.btn-timeframe').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // 데이터 로드
    loadData(timeFrame);

    // 보조지표 다시 그리기
    if (typeof applyAllIndicators === 'function') {
      applyAllIndicators();
    }
  });
});

// 반응형
window.addEventListener('resize', () => {
  chart.applyOptions({
    width: chartContainer.clientWidth,
  });
});

// ===== Snap Crosshair Plugin =====
let isShiftPressed = false;

// 커스텀 crosshair 요소 생성
const verticalLine = document.createElement('div');
verticalLine.style.cssText = 'position: absolute; width: 1px; height: 100%; top: 0; background: #2962FF; pointer-events: none; display: none; z-index: 1000;';
chartContainer.appendChild(verticalLine);

const horizontalLine = document.createElement('div');
horizontalLine.style.cssText = 'position: absolute; height: 1px; width: 100%; left: 0; background: #2962FF; pointer-events: none; display: none; z-index: 1000;';
chartContainer.appendChild(horizontalLine);

const priceLabel = document.createElement('div');
priceLabel.style.cssText = 'position: absolute; background: #2962FF; color: white; padding: 4px 8px; font-size: 11px; font-family: monospace; pointer-events: none; display: none; z-index: 1001; transform: translateY(-50%);';
chartContainer.appendChild(priceLabel);

// Shift 키 이벤트
window.addEventListener('keydown', (e) => {
  if (e.key === 'Shift' && !isShiftPressed) {
    isShiftPressed = true;
    // 기본 crosshair 숨기기
    chart.applyOptions({
      crosshair: {
        vertLine: { visible: false },
        horzLine: { visible: false },
      },
    });
  }
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'Shift') {
    isShiftPressed = false;
    // 기본 crosshair 복원
    chart.applyOptions({
      crosshair: {
        vertLine: { visible: true },
        horzLine: { visible: true },
      },
    });
    // 커스텀 crosshair 숨기기
    verticalLine.style.display = 'none';
    horizontalLine.style.display = 'none';
    priceLabel.style.display = 'none';
  }
});

// Crosshair 이동 감지
chart.subscribeCrosshairMove((param) => {
  if (!isShiftPressed || !param.point || !param.time) {
    if (isShiftPressed) {
      verticalLine.style.display = 'none';
      horizontalLine.style.display = 'none';
      priceLabel.style.display = 'none';
    }
    return;
  }

  // 현재 캔들 데이터
  const candleData = param.seriesData.get(candleSeries);
  if (!candleData) return;

  const high = candleData.high;
  const low = candleData.low;

  // coordinateToPrice로 마우스 Y 좌표를 가격으로 변환 (더 정확함)
  const mousePrice = candleSeries.coordinateToPrice(param.point.y);
  if (mousePrice === null) return;

  // 마우스 가격이 high와 low 중 어디에 더 가까운지 비교
  const distToHigh = Math.abs(mousePrice - high);
  const distToLow = Math.abs(mousePrice - low);

  // 더 가까운 가격에 snap
  const snapPrice = distToHigh < distToLow ? high : low;
  const snapY = candleSeries.priceToCoordinate(snapPrice);

  if (snapY === null) return;

  // 커스텀 crosshair 표시
  verticalLine.style.display = 'block';
  verticalLine.style.left = param.point.x + 'px';

  horizontalLine.style.display = 'block';
  horizontalLine.style.top = snapY + 'px';

  // 가격 라벨 - 오른쪽 가격 축에 배치
  priceLabel.style.display = 'block';
  priceLabel.style.top = snapY + 'px';
  priceLabel.style.right = '0px';
  priceLabel.textContent = snapPrice.toFixed(2);
});

// ===== Line Tools =====

// Line Tools 버튼 이벤트
function activateLineTool(toolType, btn) {
  // 모든 Line Tool 버튼 비활성화
  document.querySelectorAll('#trendLineToolBtn, #horizontalLineToolBtn, #verticalLineToolBtn, #rectangleToolBtn, #fibRetracementToolBtn, #textToolBtn').forEach(b => {
    b.classList.remove('active');
  });

  // 이미 활성화된 도구를 다시 클릭하면 비활성화
  if (activeLineTool === toolType) {
    activeLineTool = null;
    return;
  }

  // 새 도구 활성화
  activeLineTool = toolType;
  btn.classList.add('active');

  // 마지막 설정값으로 Line Tool 추가
  chart.addLineTool(toolType, [], {
    line: {
      width: lastToolOptions.lineWidth,
      color: lastToolOptions.lineColor
    }
  });
}

document.getElementById('trendLineToolBtn').addEventListener('click', (e) => {
  activateLineTool('TrendLine', e.target);
});

document.getElementById('horizontalLineToolBtn').addEventListener('click', (e) => {
  activateLineTool('HorizontalLine', e.target);
});

document.getElementById('verticalLineToolBtn').addEventListener('click', (e) => {
  activateLineTool('VerticalLine', e.target);
});

document.getElementById('rectangleToolBtn').addEventListener('click', (e) => {
  activateLineTool('Rectangle', e.target);
});

document.getElementById('fibRetracementToolBtn').addEventListener('click', (e) => {
  activateLineTool('FibRetracement', e.target);
});

document.getElementById('textToolBtn').addEventListener('click', (e) => {
  // 모든 Line Tool 버튼 비활성화
  document.querySelectorAll('#trendLineToolBtn, #horizontalLineToolBtn, #verticalLineToolBtn, #rectangleToolBtn, #fibRetracementToolBtn, #textToolBtn').forEach(b => {
    b.classList.remove('active');
  });

  // 이미 활성화된 도구를 다시 클릭하면 비활성화
  if (activeLineTool === 'Text') {
    activeLineTool = null;
    return;
  }

  // 새 도구 활성화
  activeLineTool = 'Text';
  e.target.classList.add('active');

  // 텍스트 입력 받기 (커스텀 모달 사용)
  showTextModal('Label').then((text) => {
    if (text !== null && text !== '') {
      // 마지막 설정값으로 Text 도구 추가
      chart.addLineTool('Text', [], {
        text: {
          value: text,
          font: {
            color: lastToolOptions.lineColor,
            size: lastToolOptions.lineWidth * 10 // 선 두께에 비례한 텍스트 크기
          }
        }
      });
    } else {
      // 취소하면 버튼 비활성화
      activeLineTool = null;
      e.target.classList.remove('active');
    }
  });
});

// 모든 Line Tools 삭제
document.getElementById('removeAllLineToolsBtn').addEventListener('click', () => {
  chart.removeAllLineTools();
  lineToolsMap.clear(); // Map 초기화
  selectedLineToolId = null;
  activeLineTool = null;
  // 모든 버튼 비활성화
  document.querySelectorAll('#trendLineToolBtn, #horizontalLineToolBtn, #verticalLineToolBtn, #rectangleToolBtn, #fibRetracementToolBtn, #textToolBtn').forEach(b => {
    b.classList.remove('active');
  });
});


// ===== Context Menu for Line Tools =====
const contextMenu = document.getElementById('contextMenu');
const widthDisplay = document.getElementById('widthDisplay');
const colorCurrentBtn = document.getElementById('colorCurrentBtn');
const colorCurrentDisplay = document.getElementById('colorCurrentDisplay');
const colorPalette = document.getElementById('colorPalette');

// Line Tools 저장소 (직접 관리)
export let lineToolsMap = new Map(); // lineToolId -> { id, toolType, points, options }
export let selectedLineToolId = null;

// 마지막 설정값 저장 (새 도구에 적용)
export const lastToolOptions = {
  lineWidth: 2,
  lineColor: '#2962FF'
};

// 컨텍스트 메뉴 숨기기
function hideContextMenu() {
  contextMenu.classList.remove('show');
}

// 컨텍스트 메뉴 표시
function showContextMenu(x, y, lineToolId) {
  console.log('📋 showContextMenu 호출:', lineToolId);
  const lineTool = lineToolsMap.get(lineToolId);
  if (!lineTool) {
    console.log('❌ lineToolsMap에서 도구를 찾을 수 없음:', lineToolId);
    return;
  }

  console.log('✅ 도구 찾음:', lineTool.toolType);
  selectedLineToolId = lineToolId;

  // 텍스트 수정 버튼 표시/숨김
  const editTextBtn = contextMenu.querySelector('[data-action="edit-text"]');
  const editTextSeparator = editTextBtn.previousElementSibling;
  if (lineTool.toolType === 'Text') {
    editTextBtn.style.display = 'flex';
    editTextSeparator.style.display = 'block';
  } else {
    editTextBtn.style.display = 'none';
    editTextSeparator.style.display = 'none';
  }

  // 현재 색상 반영
  let currentColor = '#2962FF';
  if (lineTool.options?.line?.color) {
    currentColor = lineTool.options.line.color;
  } else if (lineTool.options?.text?.font?.color) {
    currentColor = lineTool.options.text.font.color;
  }

  // 현재 색상 디스플레이 업데이트
  colorCurrentDisplay.style.background = currentColor;

  // 현재 선 두께 표시
  const currentWidth = lineTool.options?.line?.width || 1;
  widthDisplay.textContent = currentWidth;

  // 메뉴 위치 설정
  contextMenu.style.left = x + 'px';
  contextMenu.style.top = y + 'px';
  contextMenu.classList.add('show');
}

// 차트 외부 클릭 시 메뉴 숨기기
document.addEventListener('click', (e) => {
  if (!contextMenu.contains(e.target)) {
    hideContextMenu();
  }
});

// ESC 키 이벤트
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    // 1. 컨텍스트 메뉴가 열려있을 때: 선택된 도구 삭제
    if (contextMenu.classList.contains('show') && selectedLineToolId !== null && lineToolsMap.has(selectedLineToolId)) {
      console.log('🗑️ ESC - 선택된 도구 삭제:', selectedLineToolId);
      // 기존 도구들을 모두 저장
      const allTools = Array.from(lineToolsMap.values());

      // 선택된 도구 제외
      const remainingTools = allTools.filter(t => t.id !== selectedLineToolId);
      console.log('   남은 도구 개수:', remainingTools.length);

      // 모든 Line Tools 제거
      chart.removeAllLineTools();
      lineToolsMap.clear();

      // 남은 도구들 재생성
      let firstNewId = null;
      remainingTools.forEach((t, index) => {
        const result = chart.addLineTool(t.toolType, t.points, t.options);

        const newId = getToolIdFromResult(result);
        if (newId) {
          console.log('   도구 재생성: 기존 ID', t.id, '→ 새 ID', newId);
          lineToolsMap.set(newId, {
            id: newId,
            toolType: t.toolType,
            points: t.points,
            options: t.options
          });

          // 첫 번째 재생성된 도구의 ID 저장
          if (index === 0) {
            firstNewId = newId;
          }
        }
      });

      // 남은 도구가 있다면 첫 번째 도구를 자동으로 선택
      if (firstNewId !== null) {
        selectedLineToolId = firstNewId;
        console.log('   ✅ 자동 선택된 도구 ID:', selectedLineToolId);
      } else {
        selectedLineToolId = null;
        console.log('   ℹ️ 남은 도구가 없음');
      }
      hideContextMenu();
    }
    // 2. 그리기 도구가 활성화되어 있을 때: 그리기 취소 (점을 찍은 후에도 취소 가능)
    else if (activeLineTool !== null) {
      console.log('⏹️ ESC - 그리기 취소');
      // 진행 중인 그리기 취소 - 모든 도구 제거 후 완성된 것만 재생성
      const completedTools = Array.from(lineToolsMap.values());
      console.log('   완성된 도구 개수:', completedTools.length);
      chart.removeAllLineTools();
      lineToolsMap.clear();

      // 완성된 도구들만 다시 추가
      completedTools.forEach(t => {
        const result = chart.addLineTool(t.toolType, t.points, t.options);
        const newId = getToolIdFromResult(result);
        if (newId) {
          console.log('   도구 재생성: 기존 ID', t.id, '→ 새 ID', newId);
          // 기존 맵의 ID를 새 ID로 교체
          lineToolsMap.set(newId, {
            id: newId,
            toolType: t.toolType,
            points: t.points,
            options: t.options
          });
        }
      });
      console.log('   재생성 완료. lineToolsMap 크기:', lineToolsMap.size);

      activeLineTool = null;
      // 모든 Line Tool 버튼 비활성화
      document.querySelectorAll('#trendLineToolBtn, #horizontalLineToolBtn, #verticalLineToolBtn, #rectangleToolBtn, #fibRetracementToolBtn, #textToolBtn').forEach(b => {
        b.classList.remove('active');
      });
    }
  }
});

// 메뉴 드래그 기능
let isDraggingMenu = false;
let menuDragOffsetX = 0;
let menuDragOffsetY = 0;

contextMenu.addEventListener('mousedown', (e) => {
  // 버튼이나 색상 팔레트 클릭 시에는 드래그 안 함
  if (e.target.classList.contains('context-menu-btn') ||
      e.target.classList.contains('color-current-btn') ||
      e.target.classList.contains('color-current-display') ||
      e.target.classList.contains('color-option') ||
      e.target.classList.contains('width-display')) {
    return;
  }

  isDraggingMenu = true;
  menuDragOffsetX = e.clientX - contextMenu.offsetLeft;
  menuDragOffsetY = e.clientY - contextMenu.offsetTop;
  contextMenu.classList.add('dragging');
  e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
  if (!isDraggingMenu) return;

  const x = e.clientX - menuDragOffsetX;
  const y = e.clientY - menuDragOffsetY;

  contextMenu.style.left = x + 'px';
  contextMenu.style.top = y + 'px';
});

document.addEventListener('mouseup', () => {
  if (isDraggingMenu) {
    isDraggingMenu = false;
    contextMenu.classList.remove('dragging');
  }
});

// 차트에서 우클릭 이벤트 감지
chartContainer.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  console.log('🖱️ 우클릭 이벤트 발생');
  console.log('   현재 selectedLineToolId:', selectedLineToolId);
  console.log('   lineToolsMap.has(selectedLineToolId):', lineToolsMap.has(selectedLineToolId));
  console.log('   lineToolsMap 전체 ID 목록:', Array.from(lineToolsMap.keys()));

  if (selectedLineToolId !== null && lineToolsMap.has(selectedLineToolId)) {
    console.log('✅ 컨텍스트 메뉴 표시');
    showContextMenu(e.clientX, e.clientY, selectedLineToolId);
  } else if (selectedLineToolId === null && lineToolsMap.size > 0) {
    // 선택된 도구가 없지만 lineToolsMap에 도구가 있는 경우
    // 첫 번째 도구를 자동으로 선택
    const firstToolId = Array.from(lineToolsMap.keys())[0];
    console.log('⚠️ 도구가 선택되지 않음 → 첫 번째 도구 자동 선택:', firstToolId);
    selectedLineToolId = firstToolId;
    showContextMenu(e.clientX, e.clientY, firstToolId);
  } else if (!lineToolsMap.has(selectedLineToolId) && lineToolsMap.size > 0) {
    // selectedLineToolId가 있지만 lineToolsMap에 없는 경우 (ID가 변경됨)
    const firstToolId = Array.from(lineToolsMap.keys())[0];
    console.log('⚠️ 선택된 도구 ID가 유효하지 않음 → 첫 번째 도구 자동 선택:', firstToolId);
    selectedLineToolId = firstToolId;
    showContextMenu(e.clientX, e.clientY, firstToolId);
  } else {
    console.log('❌ 도구가 없음');
  }
});

// Line Tool 이벤트 구독
let lastClickTime = 0;
let lastClickedToolId = null;
const DOUBLE_CLICK_THRESHOLD = 300; // 300ms

// subscribeLineToolsAfterEdit로 도구 저장 및 선택 추적
chart.subscribeLineToolsAfterEdit((params) => {
  console.log('📍 LineToolsAfterEdit 이벤트:', params.stage, params);
  const tool = params.selectedLineTool;
  if (!tool) {
    console.log('⚠️ tool이 없음');
    return;
  }

  const toolId = tool.id;
  console.log('🔧 도구 ID:', toolId, '타입:', tool.toolType, '스테이지:', params.stage);

  // 모든 이벤트에서 도구 정보 저장/업데이트
  lineToolsMap.set(toolId, {
    id: toolId,
    toolType: tool.toolType,
    points: tool.points,
    options: tool.options
  });
  console.log('💾 lineToolsMap 저장 완료. 현재 크기:', lineToolsMap.size);
  console.log('📋 lineToolsMap 내용:', Array.from(lineToolsMap.keys()));

  // 도구 생성 완료 시 버튼 비활성화
  if (params.stage === 'lineToolFinished' || params.stage === 'pathFinished') {
    activeLineTool = null;
    document.querySelectorAll('#trendLineToolBtn, #horizontalLineToolBtn, #verticalLineToolBtn, #rectangleToolBtn, #fibRetracementToolBtn, #textToolBtn').forEach(b => {
      b.classList.remove('active');
    });

    // 도구를 그리자마자 컨텍스트 메뉴 표시 (그린 위치 바로 아래)
    setTimeout(() => {
      if (lineToolsMap.has(toolId) && tool.points && tool.points.length > 0) {
        // 마지막 포인트의 좌표를 픽셀로 변환
        const lastPoint = tool.points[tool.points.length - 1];
        const pixelY = candleSeries.priceToCoordinate(lastPoint.price);
        const timeScale = chart.timeScale();
        const pixelX = timeScale.timeToCoordinate(lastPoint.timestamp);

        if (pixelX !== null && pixelY !== null) {
          const rect = chartContainer.getBoundingClientRect();
          // 도구 위치 바로 아래에 메뉴 표시
          const menuX = rect.left + pixelX - 150; // 툴바 너비 절반 정도 왼쪽으로
          const menuY = rect.top + pixelY + 10; // 도구 아래 10px
          showContextMenu(menuX, menuY, toolId);
        }
      }
    }, 100);
  }

  // 도구 클릭/선택 시
  selectedLineToolId = toolId;
  console.log('✅ selectedLineToolId 업데이트:', selectedLineToolId);

  // 더블 클릭 감지 (텍스트 도구에만 적용)
  const currentTime = Date.now();
  if (currentTime - lastClickTime < DOUBLE_CLICK_THRESHOLD &&
      lastClickedToolId === toolId &&
      tool.toolType === 'Text') {
    // 텍스트 수정 다이얼로그 표시 (커스텀 모달 사용)
    const currentText = tool.options.text?.value || '';
    showTextModal(currentText).then((newText) => {
      if (newText !== null && newText !== '') {
        const updatedOptions = {
          ...tool.options,
          text: {
            ...tool.options.text,
            value: newText,
          }
        };

        // 기존 도구들을 모두 저장
        const allTools = Array.from(lineToolsMap.values());

        // 모든 Line Tools 제거
        chart.removeAllLineTools();
        lineToolsMap.clear();

        // 업데이트된 도구 포함하여 모두 재생성
        let lastNewId = null;
        allTools.forEach(t => {
          const opts = t.id === toolId ? updatedOptions : t.options;
          const result = chart.addLineTool(t.toolType, t.points, opts);

          const newId = getToolIdFromResult(result);
          if (newId) {
            lineToolsMap.set(newId, {
              id: newId,
              toolType: t.toolType,
              points: t.points,
              options: opts
            });

            // 업데이트된 도구의 새 ID 저장
            if (t.id === toolId) {
              lastNewId = newId;
            }
          }
        });

        // 재생성 후 업데이트된 도구의 새 ID를 선택
        selectedLineToolId = lastNewId;
      }
    });
    lastClickTime = 0; // 더블 클릭 후 리셋
    lastClickedToolId = null;
  } else {
    lastClickTime = currentTime;
    lastClickedToolId = toolId;
  }
});

// 선 두께 변경 함수
function updateLineWidth(newWidth) {
  console.log('📏 선 두께 변경:', newWidth);
  if (selectedLineToolId !== null && lineToolsMap.has(selectedLineToolId)) {
    const tool = lineToolsMap.get(selectedLineToolId);
    console.log('   선택된 도구:', selectedLineToolId, tool.toolType);

    let updatedOptions;
    if (tool.toolType === 'Text') {
      // 텍스트 도구의 경우 폰트 크기 업데이트
      updatedOptions = {
        ...tool.options,
        text: {
          ...tool.options.text,
          font: {
            ...tool.options.text?.font,
            size: newWidth * 10, // 선 두께에 비례한 텍스트 크기
          }
        }
      };
    } else {
      // 일반 도구의 경우 선 두께만 업데이트
      updatedOptions = {
        ...tool.options,
        line: {
          ...tool.options.line,
          width: newWidth,
        }
      };
    }

    // 기존 도구들을 모두 저장
    const allTools = Array.from(lineToolsMap.values());
    console.log('   재생성할 도구 개수:', allTools.length);

    // 모든 Line Tools 제거
    chart.removeAllLineTools();
    lineToolsMap.clear();

    // 업데이트된 도구 포함하여 모두 재생성
    let lastNewId = null;
    allTools.forEach(t => {
      const opts = t.id === selectedLineToolId ? updatedOptions : t.options;
      const result = chart.addLineTool(t.toolType, t.points, opts);

      const newId = getToolIdFromResult(result);
      if (newId) {
        console.log('   도구 재생성: 기존 ID', t.id, '→ 새 ID', newId, '타입:', t.toolType);
        lineToolsMap.set(newId, {
          id: newId,
          toolType: t.toolType,
          points: t.points,
          options: opts
        });

        // 업데이트된 도구의 새 ID 저장
        if (t.id === selectedLineToolId) {
          lastNewId = newId;
          console.log('   ✅ 선택된 도구의 새 ID:', newId);
        }
      }
    });

    // 재생성 후 업데이트된 도구의 새 ID를 선택
    selectedLineToolId = lastNewId;
    console.log('   최종 selectedLineToolId:', selectedLineToolId);
    console.log('   최종 lineToolsMap 크기:', lineToolsMap.size);

    // 마지막 설정값에 저장 (새 도구에 적용)
    lastToolOptions.lineWidth = newWidth;

    // 두께 표시 업데이트
    widthDisplay.textContent = newWidth;
  }
}

// 선 두께 감소 버튼
contextMenu.querySelector('[data-action="decrease-width"]').addEventListener('click', (e) => {
  e.stopPropagation();
  if (selectedLineToolId !== null && lineToolsMap.has(selectedLineToolId)) {
    const tool = lineToolsMap.get(selectedLineToolId);
    const currentWidth = tool.options?.line?.width || 1;
    const newWidth = Math.max(1, currentWidth - 1); // 최소 1
    updateLineWidth(newWidth);
  }
});

// 선 두께 증가 버튼
contextMenu.querySelector('[data-action="increase-width"]').addEventListener('click', (e) => {
  e.stopPropagation();
  if (selectedLineToolId !== null && lineToolsMap.has(selectedLineToolId)) {
    const tool = lineToolsMap.get(selectedLineToolId);
    const currentWidth = tool.options?.line?.width || 1;
    const newWidth = Math.min(10, currentWidth + 1); // 최대 10
    updateLineWidth(newWidth);
  }
});

// 색상 드롭다운 토글
colorCurrentBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  colorPalette.classList.toggle('show');
});

// 색상 팔레트 외부 클릭시 닫기
document.addEventListener('click', (e) => {
  if (!colorPalette.contains(e.target) && e.target !== colorCurrentBtn && e.target !== colorCurrentDisplay) {
    colorPalette.classList.remove('show');
  }
});

// 색상 옵션 버튼들
colorPalette.querySelectorAll('.color-option').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const color = btn.dataset.color;

    // 현재 색상 디스플레이 업데이트
    colorCurrentDisplay.style.background = color;

    // 팔레트 닫기
    colorPalette.classList.remove('show');

    if (selectedLineToolId !== null && lineToolsMap.has(selectedLineToolId)) {
      console.log('🎨 색상 변경:', color);
      const tool = lineToolsMap.get(selectedLineToolId);
      console.log('   선택된 도구:', selectedLineToolId, tool.toolType);
      let updatedOptions;

      if (tool.toolType === 'Text') {
        // 텍스트 도구는 font.color 변경
        updatedOptions = {
          ...tool.options,
          text: {
            ...tool.options.text,
            font: {
              ...tool.options.text.font,
              color: color,
            }
          }
        };
      } else {
        // 다른 도구들은 line.color 변경
        updatedOptions = {
          ...tool.options,
          line: {
            ...tool.options.line,
            color: color,
          }
        };
      }

      // 기존 도구들을 모두 저장
      const allTools = Array.from(lineToolsMap.values());
      console.log('   재생성할 도구 개수:', allTools.length);

      // 모든 Line Tools 제거
      chart.removeAllLineTools();
      lineToolsMap.clear();

      // 업데이트된 도구 포함하여 모두 재생성
      let lastNewId = null;
      allTools.forEach(t => {
        const opts = t.id === selectedLineToolId ? updatedOptions : t.options;
        const result = chart.addLineTool(t.toolType, t.points, opts);

        const newId = getToolIdFromResult(result);
        if (newId) {
          console.log('   도구 재생성: 기존 ID', t.id, '→ 새 ID', newId, '타입:', t.toolType);
          lineToolsMap.set(newId, {
            id: newId,
            toolType: t.toolType,
            points: t.points,
            options: opts
          });

          // 업데이트된 도구의 새 ID 저장
          if (t.id === selectedLineToolId) {
            lastNewId = newId;
            console.log('   ✅ 선택된 도구의 새 ID:', newId);
          }
        }
      });

      // 재생성 후 업데이트된 도구의 새 ID를 선택
      selectedLineToolId = lastNewId;
      console.log('   최종 selectedLineToolId:', selectedLineToolId);
      console.log('   최종 lineToolsMap 크기:', lineToolsMap.size);

      // 마지막 설정값에 저장 (새 도구에 적용)
      lastToolOptions.lineColor = color;
    }
  });
});

// 텍스트 수정
contextMenu.querySelector('[data-action="edit-text"]').addEventListener('click', (e) => {
  e.stopPropagation();
  if (selectedLineToolId !== null && lineToolsMap.has(selectedLineToolId)) {
    const tool = lineToolsMap.get(selectedLineToolId);
    if (tool.toolType === 'Text') {
      const currentText = tool.options.text?.value || '';
      showTextModal(currentText).then((newText) => {
        if (newText !== null && newText !== '') {
          const updatedOptions = {
            ...tool.options,
            text: {
              ...tool.options.text,
              value: newText,
            }
          };

          // 기존 도구들을 모두 저장
          const allTools = Array.from(lineToolsMap.values());

          // 모든 Line Tools 제거
          chart.removeAllLineTools();
          lineToolsMap.clear();

          // 업데이트된 도구 포함하여 모두 재생성
          let lastNewId = null;
          allTools.forEach(t => {
            const opts = t.id === selectedLineToolId ? updatedOptions : t.options;
            const result = chart.addLineTool(t.toolType, t.points, opts);

            const newId = getToolIdFromResult(result);
            if (newId) {
              lineToolsMap.set(newId, {
                id: newId,
                toolType: t.toolType,
                points: t.points,
                options: opts
              });

              // 업데이트된 도구의 새 ID 저장
              if (t.id === selectedLineToolId) {
                lastNewId = newId;
              }
            }
          });

          // 재생성 후 업데이트된 도구의 새 ID를 선택
          selectedLineToolId = lastNewId;
        }
      });
    }
  }
  hideContextMenu();
});

// 삭제
contextMenu.querySelector('[data-action="delete"]').addEventListener('click', (e) => {
  e.stopPropagation();
  console.log('🗑️ 삭제 버튼 클릭');
  if (selectedLineToolId !== null && lineToolsMap.has(selectedLineToolId)) {
    console.log('   삭제할 도구 ID:', selectedLineToolId);
    // 기존 도구들을 모두 저장
    const allTools = Array.from(lineToolsMap.values());
    console.log('   전체 도구 개수:', allTools.length);

    // 선택된 도구 제외
    const remainingTools = allTools.filter(t => t.id !== selectedLineToolId);
    console.log('   남은 도구 개수:', remainingTools.length);

    // 모든 Line Tools 제거
    chart.removeAllLineTools();
    lineToolsMap.clear();

    // 남은 도구들 재생성
    let firstNewId = null;
    remainingTools.forEach((t, index) => {
      const result = chart.addLineTool(t.toolType, t.points, t.options);

      const newId = getToolIdFromResult(result);
      if (newId) {
        console.log('   도구 재생성: 기존 ID', t.id, '→ 새 ID', newId, '타입:', t.toolType);
        lineToolsMap.set(newId, {
          id: newId,
          toolType: t.toolType,
          points: t.points,
          options: t.options
        });

        // 첫 번째 재생성된 도구의 ID 저장
        if (index === 0) {
          firstNewId = newId;
        }
      }
    });

    console.log('   삭제 완료. 최종 lineToolsMap 크기:', lineToolsMap.size);

    // 남은 도구가 있다면 첫 번째 도구를 자동으로 선택
    if (firstNewId !== null) {
      selectedLineToolId = firstNewId;
      console.log('   ✅ 자동 선택된 도구 ID:', selectedLineToolId);
    } else {
      selectedLineToolId = null;
      console.log('   ℹ️ 남은 도구가 없음');
    }
  }
  hideContextMenu();
});

// ===== Dropdown Menu Functionality =====
const indicatorBtn = document.getElementById('indicatorBtn');
const indicatorMenu = document.getElementById('indicatorMenu');
const drawingBtn = document.getElementById('drawingBtn');
const drawingMenu = document.getElementById('drawingMenu');

// Toggle indicator dropdown
indicatorBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  indicatorMenu.classList.toggle('show');
  drawingMenu.classList.remove('show');
});

// Toggle drawing dropdown
drawingBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  drawingMenu.classList.toggle('show');
  indicatorMenu.classList.remove('show');
});

// Close dropdowns and color palettes when clicking outside
document.addEventListener('click', () => {
  indicatorMenu.classList.remove('show');
  drawingMenu.classList.remove('show');
  // 색상 팔레트 닫기
  document.querySelectorAll('.color-palette-popup').forEach(p => p.remove());
  document.querySelectorAll('.period-color-picker').forEach(b => b.classList.remove('palette-active'));
});

// Prevent dropdown from closing when clicking inside menu (except for menu items)
indicatorMenu.addEventListener('click', (e) => {
  if (!e.target.classList.contains('dropdown-item')) {
    e.stopPropagation();
  }
});
drawingMenu.addEventListener('click', (e) => {
  if (!e.target.classList.contains('dropdown-item')) {
    e.stopPropagation();
  }
});

// Connect dropdown items to existing button handlers
// Drawing tools
document.querySelectorAll('#drawingMenu .dropdown-item').forEach(item => {
  item.addEventListener('click', () => {
    const btnId = item.id;
    const originalBtn = document.getElementById(btnId);
    if (originalBtn) {
      originalBtn.click();
    }
    // Close dropdown after selection
    drawingMenu.classList.remove('show');
  });
});

// ===== Indicator Settings in Dropdown =====
const indicatorSettingsSide = document.getElementById('indicatorSettingsSide');

// 지표별 설정 저장
export const indicatorConfigs = {
  sma: [],
  ema: [],
  rsi: [],
  macd: [],
  bbands: []
};

// 지표별 기본 정보
export const indicatorInfo = {
  sma: { title: '이동평균선', desc: '지난 n일 동안 주가 평균값을 이은 선', defaultValue: 20 },
  ema: { title: '지수이동평균', desc: '최근 가격에 더 큰 가중치를 둔 이동평균선', defaultValue: 12 },
  rsi: { title: 'RSI', desc: '상대강도지수 - 과매수/과매도 판단', defaultValue: 14 },
  macd: { title: 'MACD', desc: '이동평균 수렴확산 - 추세 전환 신호', defaultValue: 26 },
  bbands: { title: '볼린저 밴드', desc: '가격 변동성을 나타내는 밴드', defaultValue: 20 }
};

// 색상 팔레트 (32색)
export const colorPaletteOptions = [
  // Row 1: 어두운 톤
  '#3C4043', '#1A73E8', '#9334E6', '#B80000', '#E37400', '#F9AB00', '#007B83', '#1E8E3E',
  // Row 2: 기본 톤
  '#5F6368', '#4285F4', '#A142F4', '#D93025', '#F57C00', '#F9AB00', '#12B5CB', '#34A853',
  // Row 3: 밝은 톤
  '#9AA0A6', '#8AB4F8', '#C58AF9', '#EE675C', '#FF8A65', '#FFB300', '#4DB6AC', '#81C995',
  // Row 4: 연한 톤
  '#DADCE0', '#AECBFA', '#D7AEFB', '#F28B82', '#FFAB91', '#FFD54F', '#80DEEA', '#A5D6A7'
];

// 기본 색상 (기존 호환용)
export const colorOptions = ['#26a69a', '#ef5350', '#2196f3', '#ff6f00', '#ab47bc', '#66bb6a', '#ffa726', '#42a5f5'];

export let currentSelectedIndicator = null;

// 지표 아이템 클릭 이벤트
document.querySelectorAll('.indicator-item').forEach(item => {
  item.addEventListener('click', (e) => {
    // 체크박스 클릭이면 토글
    if (e.target.classList.contains('indicator-checkbox')) {
      item.classList.toggle('checked');
      const indicator = item.dataset.indicator;

      if (!item.classList.contains('checked')) {
        // 체크 해제 - 지표 삭제
        indicatorConfigs[indicator] = [];
        applyAllIndicators(); // 즉시 차트에서 제거
      } else {
        // 체크 - 기본 설정 추가
        if (indicatorConfigs[indicator].length === 0) {
          // 이동평균선과 지수이동평균은 4개 기간 기본값
          if (indicator === 'sma' || indicator === 'ema') {
            const periods = [5, 20, 60, 120];
            periods.forEach((period, idx) => {
              indicatorConfigs[indicator].push({
                color: colorOptions[idx % colorOptions.length],
                thickness: 1,
                source: 'close',
                value: period
              });
            });
          } else if (indicator === 'bbands') {
            // 볼린저 밴드는 각 라인 색상 설정 포함
            indicatorConfigs[indicator].push({
              color: colorOptions[0],
              thickness: 2,
              source: 'close',
              value: indicatorInfo[indicator].defaultValue,
              upperColor: '#F23645',
              middleColor: '#2962FF',
              lowerColor: '#089981',
              stdDev: 2
            });
          } else {
            // 다른 지표는 기본값 하나만
            const thickness = (indicator === 'rsi' || indicator === 'macd') ? 2 : 1;
            indicatorConfigs[indicator].push({
              color: colorOptions[0],
              thickness: thickness,
              source: 'close',
              value: indicatorInfo[indicator].defaultValue
            });
          }
          applyAllIndicators(); // 즉시 차트에 추가
        }
      }
    }

    // 선택 상태 업데이트
    document.querySelectorAll('.indicator-item').forEach(i => i.classList.remove('selected'));
    item.classList.add('selected');
    currentSelectedIndicator = item.dataset.indicator;

    // 오른쪽 설정 화면 렌더링
    renderIndicatorSettings(currentSelectedIndicator);
  });
});

function renderIndicatorSettings(indicator) {
  if (!indicator) {
    indicatorSettingsSide.innerHTML = '<div class="indicator-empty-state">지표를 선택하세요</div>';
    return;
  }

  const info = indicatorInfo[indicator];
  const configs = indicatorConfigs[indicator];

  let html = `
    <div class="indicator-settings-title">${info.title}</div>
    <div class="indicator-settings-desc">${info.desc}</div>
  `;

  if (configs.length === 0) {
    html += '<div class="indicator-empty-state">체크박스를 클릭하여 지표를 활성화하세요</div>';
  } else {
    // 하단 지표 (RSI, MACD)는 간단한 UI
    if (indicator === 'rsi') {
      const config = configs[0];
      html += `
        <div style="margin-top: 16px;">
          <div style="display: flex; gap: 12px; align-items: flex-start;">
            <div style="flex: 1;">
              <div style="font-size: 13px; color: #666; margin-bottom: 8px;">색상</div>
              <div class="period-color-picker rsi-color-picker" data-indicator="${indicator}" data-index="0" style="background: ${config.color}; width: 100%; height: 40px;"></div>
            </div>
            <div style="flex: 1;">
              <div style="font-size: 13px; color: #666; margin-bottom: 8px;">기간</div>
              <input type="number" class="period-value-field" data-indicator="${indicator}" data-index="0" value="${config.value}" min="1" max="500" style="width: 100%; padding: 8px; border: 1px solid #e0e0e0; border-radius: 6px; font-size: 14px; height: 40px; box-sizing: border-box;">
            </div>
          </div>
        </div>
      `;
    } else if (indicator === 'macd') {
      const config = configs[0];
      html += `
        <div style="margin-top: 16px;">
          <!-- 색상 설정 (한 줄) -->
          <div style="display: flex; gap: 8px; margin-bottom: 12px;">
            <div style="flex: 1;">
              <div style="font-size: 13px; color: #666; margin-bottom: 8px;">MACD</div>
              <div class="period-color-picker macd-line-color-picker" data-macd-type="line" style="background: #2962FF; width: 100%; height: 40px;"></div>
            </div>
            <div style="flex: 1;">
              <div style="font-size: 13px; color: #666; margin-bottom: 8px;">Signal</div>
              <div class="period-color-picker macd-signal-color-picker" data-macd-type="signal" style="background: #FF6D00; width: 100%; height: 40px;"></div>
            </div>
          </div>

          <!-- 파라미터 설정 (한 줄) -->
          <div style="display: flex; gap: 8px;">
            <div style="flex: 1;">
              <div style="font-size: 13px; color: #666; margin-bottom: 8px;">단기</div>
              <input type="number" class="macd-fast-field" value="12" min="1" max="500" style="width: 100%; padding: 8px; border: 1px solid #e0e0e0; border-radius: 6px; font-size: 14px; height: 40px; box-sizing: border-box;">
            </div>
            <div style="flex: 1;">
              <div style="font-size: 13px; color: #666; margin-bottom: 8px;">장기</div>
              <input type="number" class="macd-slow-field" value="26" min="1" max="500" style="width: 100%; padding: 8px; border: 1px solid #e0e0e0; border-radius: 6px; font-size: 14px; height: 40px; box-sizing: border-box;">
            </div>
            <div style="flex: 1;">
              <div style="font-size: 13px; color: #666; margin-bottom: 8px;">시그널</div>
              <input type="number" class="macd-signal-field" value="9" min="1" max="500" style="width: 100%; padding: 8px; border: 1px solid #e0e0e0; border-radius: 6px; font-size: 14px; height: 40px; box-sizing: border-box;">
            </div>
          </div>
        </div>
      `;
    } else if (indicator === 'bbands') {
      const config = configs[0];
      html += `
        <div style="margin-top: 16px;">
          <!-- 색상 설정 (한 줄) -->
          <div style="display: flex; gap: 8px; margin-bottom: 12px;">
            <div style="flex: 1;">
              <div style="font-size: 13px; color: #666; margin-bottom: 8px;">상단</div>
              <div class="period-color-picker bbands-upper-color-picker" data-bbands-type="upper" style="background: ${config.upperColor || '#F23645'}; width: 100%; height: 40px;"></div>
            </div>
            <div style="flex: 1;">
              <div style="font-size: 13px; color: #666; margin-bottom: 8px;">중간</div>
              <div class="period-color-picker bbands-middle-color-picker" data-bbands-type="middle" style="background: ${config.middleColor || '#2962FF'}; width: 100%; height: 40px;"></div>
            </div>
            <div style="flex: 1;">
              <div style="font-size: 13px; color: #666; margin-bottom: 8px;">하단</div>
              <div class="period-color-picker bbands-lower-color-picker" data-bbands-type="lower" style="background: ${config.lowerColor || '#089981'}; width: 100%; height: 40px;"></div>
            </div>
          </div>

          <!-- 파라미터 설정 (한 줄) -->
          <div style="display: flex; gap: 8px;">
            <div style="flex: 1;">
              <div style="font-size: 13px; color: #666; margin-bottom: 8px;">기간</div>
              <input type="number" class="bbands-period-field" value="${config.value || 20}" min="1" max="500" style="width: 100%; padding: 8px; border: 1px solid #e0e0e0; border-radius: 6px; font-size: 14px; height: 40px; box-sizing: border-box;">
            </div>
            <div style="flex: 1;">
              <div style="font-size: 13px; color: #666; margin-bottom: 8px;">표준편차</div>
              <input type="number" class="bbands-stddev-field" value="${config.stdDev || 2}" min="0.5" max="5" step="0.1" style="width: 100%; padding: 8px; border: 1px solid #e0e0e0; border-radius: 6px; font-size: 14px; height: 40px; box-sizing: border-box;">
            </div>
            <div style="flex: 1;">
              <div style="font-size: 13px; color: #666; margin-bottom: 8px;">두께</div>
              <div class="bbands-thickness-display" style="width: 100%; height: 40px; border: 1px solid #e0e0e0; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 500; cursor: pointer; user-select: none; background: white;">${config.thickness || 2}px</div>
            </div>
          </div>
        </div>
      `;
    } else {
      // 상단 지표 (SMA, EMA, BBands)는 기존 UI
      configs.forEach((config, index) => {
        html += `
          <div class="indicator-period-row">
            <span class="period-label-col">기간${index + 1}</span>
            <div class="period-color-picker" data-indicator="${indicator}" data-index="${index}" style="background: ${config.color};"></div>
            <div class="period-thickness-display" data-indicator="${indicator}" data-index="${index}">${config.thickness}px</div>
            <select class="period-source-dropdown" data-indicator="${indicator}" data-index="${index}">
              <option value="close" ${config.source === 'close' ? 'selected' : ''}>종가</option>
              <option value="open" ${config.source === 'open' ? 'selected' : ''}>시가</option>
              <option value="high" ${config.source === 'high' ? 'selected' : ''}>고가</option>
              <option value="low" ${config.source === 'low' ? 'selected' : ''}>저가</option>
            </select>
            <input type="number" class="period-value-field" data-indicator="${indicator}" data-index="${index}" value="${config.value}" min="1" max="500">
            ${configs.length > 1 ? `<button class="period-delete-btn" data-indicator="${indicator}" data-index="${index}">×</button>` : ''}
          </div>
        `;
      });

      html += `
        <button class="add-period-button" data-indicator="${indicator}">
          + 기간 추가
        </button>
      `;
    }
  }

  indicatorSettingsSide.innerHTML = html;
  attachIndicatorSettingsEvents();
}

function attachIndicatorSettingsEvents() {
  // 색상 변경 - 팔레트 표시
  document.querySelectorAll('.period-color-picker').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const indicator = btn.dataset.indicator;
      const index = parseInt(btn.dataset.index);

      // 현재 색상 가져오기
      let currentColor;
      if (btn.classList.contains('macd-line-color-picker') || btn.classList.contains('macd-signal-color-picker')) {
        currentColor = btn.style.background;
      } else if (indicator && index !== undefined) {
        currentColor = indicatorConfigs[indicator][index].color;
      } else {
        currentColor = '#26a69a';
      }

      // 이미 이 버튼이 팔레트를 열어놓았는지 확인
      const existingPalette = document.querySelector('.color-palette-popup');
      if (existingPalette && btn.classList.contains('palette-active')) {
        // 같은 버튼 다시 클릭 시 팔레트 닫기
        existingPalette.remove();
        btn.classList.remove('palette-active');
        return;
      }

      // 기존 팔레트 제거 및 모든 버튼의 active 상태 제거
      document.querySelectorAll('.color-palette-popup').forEach(p => p.remove());
      document.querySelectorAll('.period-color-picker').forEach(b => b.classList.remove('palette-active'));

      // 현재 버튼을 active로 표시
      btn.classList.add('palette-active');

      // 버튼 위치 계산
      const rect = btn.getBoundingClientRect();

      // 팔레트 HTML 생성 (버튼 바로 아래)
      let paletteHTML = `
        <div class="color-palette-popup show" style="top: ${rect.bottom + 5}px; left: ${rect.left}px;">
          <div class="color-palette-title">컬러</div>
          <div class="color-palette-grid">
      `;

      colorPaletteOptions.forEach(color => {
        const selected = color === currentColor ? 'selected' : '';
        paletteHTML += `<div class="color-palette-item ${selected}" style="background: ${color};" data-color="${color}"></div>`;
      });

      paletteHTML += `
          </div>
        </div>
      `;

      // body에 팔레트 추가
      document.body.insertAdjacentHTML('beforeend', paletteHTML);

      // 팔레트 아이템 클릭 이벤트
      const palette = document.querySelector('.color-palette-popup');
      palette.querySelectorAll('.color-palette-item').forEach(item => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          const selectedColor = item.dataset.color;

          // MACD 색상 picker인 경우
          if (btn.classList.contains('macd-line-color-picker') || btn.classList.contains('macd-signal-color-picker')) {
            btn.style.background = selectedColor;
            palette.remove();
            btn.classList.remove('palette-active');
            applyAllIndicators();
          } else if (btn.classList.contains('bbands-upper-color-picker') ||
                     btn.classList.contains('bbands-middle-color-picker') ||
                     btn.classList.contains('bbands-lower-color-picker')) {
            // 볼린저 밴드 색상 picker인 경우
            btn.style.background = selectedColor;
            const bbandsType = btn.dataset.bbandsType;
            const config = indicatorConfigs['bbands'][0];
            if (bbandsType === 'upper') {
              config.upperColor = selectedColor;
            } else if (bbandsType === 'middle') {
              config.middleColor = selectedColor;
            } else if (bbandsType === 'lower') {
              config.lowerColor = selectedColor;
            }
            palette.remove();
            btn.classList.remove('palette-active');
            applyAllIndicators();
          } else if (indicator && index !== undefined) {
            // 일반 지표인 경우
            indicatorConfigs[indicator][index].color = selectedColor;
            palette.remove();
            btn.classList.remove('palette-active');
            renderIndicatorSettings(indicator);
            applyAllIndicators();
          }
        });
      });
    });
  });

  // 두께 변경
  document.querySelectorAll('.period-thickness-display').forEach(btn => {
    btn.addEventListener('click', () => {
      const indicator = btn.dataset.indicator;
      const index = parseInt(btn.dataset.index);
      indicatorConfigs[indicator][index].thickness = (indicatorConfigs[indicator][index].thickness % 5) + 1;
      renderIndicatorSettings(indicator);
      applyAllIndicators(); // 즉시 차트에 반영
    });
  });

  // 소스 변경
  document.querySelectorAll('.period-source-dropdown').forEach(select => {
    select.addEventListener('change', (e) => {
      const indicator = select.dataset.indicator;
      const index = parseInt(select.dataset.index);
      indicatorConfigs[indicator][index].source = e.target.value;
      applyAllIndicators(); // 즉시 차트에 반영
    });
  });

  // 값 변경
  document.querySelectorAll('.period-value-field').forEach(input => {
    input.addEventListener('change', (e) => {
      const indicator = input.dataset.indicator;
      const index = parseInt(input.dataset.index);
      indicatorConfigs[indicator][index].value = parseInt(e.target.value) || 1;
      applyAllIndicators(); // 즉시 차트에 반영
    });
  });

  // 삭제
  document.querySelectorAll('.period-delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const indicator = btn.dataset.indicator;
      const index = parseInt(btn.dataset.index);
      indicatorConfigs[indicator].splice(index, 1);
      renderIndicatorSettings(indicator);
      applyAllIndicators(); // 즉시 차트에 반영
    });
  });

  // 기간 추가
  document.querySelectorAll('.add-period-button').forEach(btn => {
    btn.addEventListener('click', () => {
      const indicator = btn.dataset.indicator;
      const lastConfig = indicatorConfigs[indicator][indicatorConfigs[indicator].length - 1];
      const nextColorIdx = (colorOptions.indexOf(lastConfig.color) + 1) % colorOptions.length;
      indicatorConfigs[indicator].push({
        color: colorOptions[nextColorIdx],
        thickness: 1,
        source: 'close',
        value: indicatorInfo[indicator].defaultValue
      });
      renderIndicatorSettings(indicator);
      applyAllIndicators(); // 즉시 차트에 반영
    });
  });

  // MACD 파라미터 변경
  const macdFast = document.querySelector('.macd-fast-field');
  const macdSlow = document.querySelector('.macd-slow-field');
  const macdSignal = document.querySelector('.macd-signal-field');

  if (macdFast) {
    macdFast.addEventListener('change', () => {
      applyAllIndicators();
    });
  }
  if (macdSlow) {
    macdSlow.addEventListener('change', () => {
      applyAllIndicators();
    });
  }
  if (macdSignal) {
    macdSignal.addEventListener('change', () => {
      applyAllIndicators();
    });
  }

  // Bollinger Bands 파라미터 변경
  const bbandsPeriod = document.querySelector('.bbands-period-field');
  const bbandsStdDev = document.querySelector('.bbands-stddev-field');
  const bbandsThickness = document.querySelector('.bbands-thickness-display');

  if (bbandsPeriod) {
    bbandsPeriod.addEventListener('change', (e) => {
      const config = indicatorConfigs['bbands'][0];
      config.value = parseInt(e.target.value) || 20;
      applyAllIndicators();
    });
  }
  if (bbandsStdDev) {
    bbandsStdDev.addEventListener('change', (e) => {
      const config = indicatorConfigs['bbands'][0];
      config.stdDev = parseFloat(e.target.value) || 2;
      applyAllIndicators();
    });
  }
  if (bbandsThickness) {
    bbandsThickness.addEventListener('click', () => {
      const config = indicatorConfigs['bbands'][0];
      config.thickness = (config.thickness % 5) + 1;
      renderIndicatorSettings('bbands');
      applyAllIndicators();
    });
  }
}

// 드롭다운이 닫힐 때 체크박스 상태 동기화
document.addEventListener('click', (e) => {
  if (!indicatorMenu.contains(e.target) && !indicatorBtn.contains(e.target)) {
    if (indicatorMenu.classList.contains('show')) {
      // 체크박스 상태 기반으로 indicatorConfigs 재구성
      document.querySelectorAll('.indicator-item').forEach(item => {
        const indicator = item.dataset.indicator;
        if (item.classList.contains('checked')) {
          // 체크되어 있는데 설정이 비어있으면 기본값 추가
          if (indicatorConfigs[indicator].length === 0) {
            // 이동평균선과 지수이동평균은 4개 기간 기본값
            if (indicator === 'sma' || indicator === 'ema') {
              const periods = [5, 20, 60, 120];
              periods.forEach((period, idx) => {
                indicatorConfigs[indicator].push({
                  color: colorOptions[idx % colorOptions.length],
                  thickness: 1,
                  source: 'close',
                  value: period
                });
              });
            } else if (indicator === 'bbands') {
              // 볼린저 밴드는 각 라인 색상 설정 포함
              indicatorConfigs[indicator].push({
                color: colorOptions[0],
                thickness: 2,
                source: 'close',
                value: indicatorInfo[indicator].defaultValue,
                upperColor: '#F23645',
                middleColor: '#2962FF',
                lowerColor: '#089981',
                stdDev: 2
              });
            } else {
              // 다른 지표는 기본값 하나만
              const thickness = (indicator === 'rsi' || indicator === 'macd') ? 2 : 1;
              indicatorConfigs[indicator].push({
                color: colorOptions[0],
                thickness: thickness,
                source: 'close',
                value: indicatorInfo[indicator].defaultValue
              });
            }
          }
        } else {
          // 체크 해제되어 있으면 설정 비우기
          indicatorConfigs[indicator] = [];
        }
      });

      indicatorMenu.classList.remove('show');
    }
  }
});

function applyAllIndicators() {
  // 기존 동적 지표 제거
  window.dynamicIndicatorSeries.forEach(series => {
    window.chart.removeSeries(series);
  });
  window.dynamicIndicatorSeries.length = 0; // 배열 비우기

  Object.keys(indicatorConfigs).forEach(type => {
    indicatorConfigs[type].forEach(config => {
      let data;

      if (type === 'sma') {
        data = calculateSMA(window.currentCandles, { period: config.value });
        if (data && data.length > 0) {
          const series = window.chart.addLineSeries({
            color: config.color,
            lineWidth: config.thickness,
            title: `SMA ${config.value}`,
          });
          series.setData(data);
          window.dynamicIndicatorSeries.push(series);
        }
      } else if (type === 'ema') {
        data = calculateEMA(window.currentCandles, { period: config.value });
        if (data && data.length > 0) {
          const series = window.chart.addLineSeries({
            color: config.color,
            lineWidth: config.thickness,
            title: `EMA ${config.value}`,
          });
          series.setData(data);
          window.dynamicIndicatorSeries.push(series);
        }
      } else if (type === 'rsi') {
        data = calculateRSI(window.currentCandles, { period: config.value });
        if (data && data.length > 0) {
          const series = window.chart.addLineSeries({
            color: config.color,
            lineWidth: config.thickness,
            title: `RSI ${config.value}`,
            priceScaleId: 'rsi',
          });
          series.priceScale().applyOptions({
            scaleMargins: { top: 0.8, bottom: 0 },
          });
          series.setData(data);
          window.dynamicIndicatorSeries.push(series);
        }
      } else if (type === 'macd') {
        // MACD 파라미터와 색상을 UI에서 읽기
        const fastField = document.querySelector('.macd-fast-field');
        const slowField = document.querySelector('.macd-slow-field');
        const signalField = document.querySelector('.macd-signal-field');
        const macdColorPicker = document.querySelector('.macd-line-color-picker');
        const signalColorPicker = document.querySelector('.macd-signal-color-picker');

        const fastPeriod = fastField ? parseInt(fastField.value) || 12 : 12;
        const slowPeriod = slowField ? parseInt(slowField.value) || 26 : 26;
        const signalPeriod = signalField ? parseInt(signalField.value) || 9 : 9;
        const macdColor = macdColorPicker ? macdColorPicker.style.background : '#2962FF';
        const signalColor = signalColorPicker ? signalColorPicker.style.background : '#FF6D00';

        const macdData = calculateMACD(window.currentCandles, { fastPeriod, slowPeriod, signalPeriod });
        if (macdData.macd && macdData.macd.length > 0) {
          const macdSeries = window.chart.addLineSeries({
            color: macdColor,
            lineWidth: config.thickness,
            title: 'MACD',
            priceScaleId: 'macd',
          });
          macdSeries.priceScale().applyOptions({
            scaleMargins: { top: 0.8, bottom: 0 },
          });
          macdSeries.setData(macdData.macd);
          window.dynamicIndicatorSeries.push(macdSeries);

          // Signal line
          const signalSeries = window.chart.addLineSeries({
            color: signalColor,
            lineWidth: config.thickness,
            title: 'Signal',
            priceScaleId: 'macd',
          });
          signalSeries.setData(macdData.signal);
          window.dynamicIndicatorSeries.push(signalSeries);

          // Histogram
          const histSeries = window.chart.addHistogramSeries({
            color: '#26a69a',
            priceScaleId: 'macd',
          });
          histSeries.setData(macdData.histogram);
          window.dynamicIndicatorSeries.push(histSeries);
        }
      } else if (type === 'bbands') {
        const stdDev = config.stdDev || 2;
        const bbData = calculateBollingerBands(window.currentCandles, { period: config.value, stdDev });
        if (bbData.upper && bbData.upper.length > 0) {
          // 볼린저 밴드는 각 라인마다 다른 색상 사용
          const upperColor = config.upperColor || '#F23645'; // 빨강
          const middleColor = config.middleColor || '#2962FF'; // 파랑
          const lowerColor = config.lowerColor || '#089981'; // 초록

          const upperSeries = window.chart.addLineSeries({
            color: upperColor,
            lineWidth: config.thickness,
            title: 'BB Upper',
          });
          upperSeries.setData(bbData.upper);
          window.dynamicIndicatorSeries.push(upperSeries);

          const middleSeries = window.chart.addLineSeries({
            color: middleColor,
            lineWidth: config.thickness,
            title: 'BB Middle',
          });
          middleSeries.setData(bbData.middle);
          window.dynamicIndicatorSeries.push(middleSeries);

          const lowerSeries = window.chart.addLineSeries({
            color: lowerColor,
            lineWidth: config.thickness,
            title: 'BB Lower',
          });
          lowerSeries.setData(bbData.lower);
          window.dynamicIndicatorSeries.push(lowerSeries);
        }
      }
    });
  });
}

// ===== Custom Text Modal Functionality =====
// ===== Custom Text Modal Functionality =====
const textModal = document.getElementById('textModal');
const textInput = document.getElementById('textInput');
const textModalConfirm = document.getElementById('textModalConfirm');
const textModalCancel = document.getElementById('textModalCancel');

let textModalResolve = null;

function showTextModal(defaultValue = '') {
  return new Promise((resolve) => {
    textModalResolve = resolve;
    textInput.value = defaultValue;
    textModal.style.display = 'flex';
    setTimeout(() => {
      textInput.focus();
      textInput.select();
    }, 100);
  });
}

function hideTextModal() {
  textModal.style.display = 'none';
  textInput.value = '';
}

// Confirm button
textModalConfirm.addEventListener('click', () => {
  const value = textInput.value;
  hideTextModal();
  if (textModalResolve) {
    textModalResolve(value);
    textModalResolve = null;
  }
});

// Cancel button
textModalCancel.addEventListener('click', () => {
  hideTextModal();
  if (textModalResolve) {
    textModalResolve(null);
    textModalResolve = null;
  }
});

// Enter key to confirm
textInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    textModalConfirm.click();
  } else if (e.key === 'Escape') {
    e.preventDefault();
    textModalCancel.click();
  }
});

// Close modal when clicking overlay
textModal.addEventListener('click', (e) => {
  if (e.target === textModal) {
    textModalCancel.click();
  }
});
