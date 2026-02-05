import { useState, useRef, useCallback, useEffect } from 'react';
import type { IChartApi } from 'lightweight-charts';
import type { LineToolType, LineTool, LineToolOptions } from '../types';
import { getToolIdFromResult } from '../../utils/getToolId';

export interface UseLineToolsOptions {
  onToolFinished?: (tool: LineTool) => void;
  onToolsChange?: (tools: LineTool[]) => void;
  initialTools?: LineTool[];
}

export function useLineTools(chart: IChartApi | null, options?: UseLineToolsOptions) {
  const [activeToolType, setActiveToolType] = useState<LineToolType | null>(null);
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [tools, setTools] = useState<Map<string, LineTool>>(new Map());

  const toolsRef = useRef<Map<string, LineTool>>(new Map());
  const lastOptionsRef = useRef<LineToolOptions>({
    line: { width: 2, color: '#2962FF' }
  });
  const onToolFinishedRef = useRef(options?.onToolFinished);
  const onToolsChangeRef = useRef(options?.onToolsChange);
  const initialToolsLoadedRef = useRef(false);

  // 도구 변경 알림 함수
  const notifyToolsChange = useCallback(() => {
    if (onToolsChangeRef.current) {
      const toolsArray = Array.from(toolsRef.current.values());
      onToolsChangeRef.current(toolsArray);
    }
  }, []);

  // --- 공통 리빌드 헬퍼 ---

  /** 모든 도구를 제거 후 재생성하며, targetToolId의 옵션만 updatedOptions로 교체 */
  const rebuildToolsWithUpdate = useCallback((targetToolId: string, updatedOptions: LineToolOptions): string | null => {
    if (!chart) return null;

    const allTools = Array.from(toolsRef.current.values());
    (chart as any).removeAllLineTools();
    toolsRef.current.clear();

    let newTargetId: string | null = null;
    allTools.forEach(t => {
      const opts = t.id === targetToolId ? updatedOptions : t.options;
      const result = (chart as any).addLineTool(t.toolType, t.points, opts);
      const newId = getToolIdFromResult(result);
      if (newId) {
        toolsRef.current.set(newId, {
          id: newId,
          toolType: t.toolType,
          points: t.points,
          options: opts
        });
        if (t.id === targetToolId) {
          newTargetId = newId;
        }
      }
    });

    setTools(new Map(toolsRef.current));
    return newTargetId;
  }, [chart]);

  /** excludeId를 제외한 도구들만 재생성 */
  const rebuildToolsExcluding = useCallback((excludeId: string): string | null => {
    if (!chart) return null;

    const allTools = Array.from(toolsRef.current.values());
    const remainingTools = allTools.filter(t => t.id !== excludeId);

    (chart as any).removeAllLineTools();
    toolsRef.current.clear();

    remainingTools.forEach(t => {
      const result = (chart as any).addLineTool(t.toolType, t.points, t.options);
      const newId = getToolIdFromResult(result);
      if (newId) {
        toolsRef.current.set(newId, {
          id: newId,
          toolType: t.toolType,
          points: t.points,
          options: t.options
        });
      }
    });

    setTools(new Map(toolsRef.current));
    return toolsRef.current.size > 0 ? Array.from(toolsRef.current.keys())[0] : null;
  }, [chart]);

  // 모든 도구를 배열로 내보내기
  const exportTools = useCallback((): LineTool[] => {
    return Array.from(toolsRef.current.values());
  }, []);

  // 저장된 도구 불러오기
  const loadTools = useCallback((savedTools: LineTool[]) => {
    if (!chart || !savedTools || savedTools.length === 0) return;

    // 기존 도구 제거
    (chart as any).removeAllLineTools();
    toolsRef.current.clear();

    // 저장된 도구 복원
    savedTools.forEach(t => {
      const result = (chart as any).addLineTool(t.toolType, t.points, t.options);
      const newId = getToolIdFromResult(result);
      if (newId) {
        toolsRef.current.set(newId, {
          id: newId,
          toolType: t.toolType,
          points: t.points,
          options: t.options
        });
      }
    });

    setTools(new Map(toolsRef.current));
    setSelectedToolId(null);
  }, [chart]);

  // 초기 도구 로드 (차트 준비 후)
  useEffect(() => {
    if (!chart || initialToolsLoadedRef.current) return;
    if (options?.initialTools && options.initialTools.length > 0) {
      initialToolsLoadedRef.current = true;
      // 차트가 완전히 준비될 때까지 약간 대기
      setTimeout(() => {
        loadTools(options.initialTools!);
      }, 100);
    }
  }, [chart, options?.initialTools, loadTools]);

  // Line Tool 활성화
  const activateTool = useCallback((toolType: LineToolType) => {
    if (!chart) return;

    if (activeToolType === toolType) {
      setActiveToolType(null);
      return;
    }

    setActiveToolType(toolType);

    if (toolType === 'Text') {
      // 텍스트는 모달 입력 필요
      return;
    }

    (chart as any).addLineTool(toolType, [], {
      line: {
        width: lastOptionsRef.current.line?.width || 2,
        color: lastOptionsRef.current.line?.color || '#2962FF'
      }
    });
  }, [chart, activeToolType]);

  // 텍스트 도구 추가
  const addTextTool = useCallback((text: string) => {
    if (!chart || !text) return;

    (chart as any).addLineTool('Text', [], {
      text: {
        value: text,
        font: {
          color: lastOptionsRef.current.line?.color || '#2962FF',
          size: (lastOptionsRef.current.line?.width || 2) * 10
        }
      }
    });
  }, [chart]);

  // 모든 도구 제거
  const removeAllTools = useCallback(() => {
    if (!chart) return;
    (chart as any).removeAllLineTools();
    toolsRef.current.clear();
    setTools(new Map());
    setSelectedToolId(null);
    setActiveToolType(null);
    notifyToolsChange();
  }, [chart, notifyToolsChange]);

  // 선택된 도구 삭제
  const removeSelectedTool = useCallback(() => {
    if (!chart || !selectedToolId) return;
    const firstRemainingId = rebuildToolsExcluding(selectedToolId);
    setSelectedToolId(firstRemainingId);
    notifyToolsChange();
  }, [chart, selectedToolId, rebuildToolsExcluding, notifyToolsChange]);

  // 선 두께 변경
  const updateLineWidth = useCallback((newWidth: number) => {
    if (!chart || !selectedToolId || !toolsRef.current.has(selectedToolId)) return;

    const tool = toolsRef.current.get(selectedToolId)!;
    let updatedOptions: LineToolOptions;

    if (tool.toolType === 'Text') {
      updatedOptions = {
        ...tool.options,
        text: {
          value: tool.options.text?.value || '',
          font: {
            ...tool.options.text?.font,
            color: tool.options.text?.font?.color || '#2962FF',
            size: newWidth * 10,
          }
        }
      };
    } else {
      updatedOptions = {
        ...tool.options,
        line: {
          ...tool.options.line,
          width: newWidth,
          color: tool.options.line?.color || '#2962FF'
        }
      };
    }

    const newId = rebuildToolsWithUpdate(selectedToolId, updatedOptions);
    setSelectedToolId(newId);
    lastOptionsRef.current.line = { ...lastOptionsRef.current.line, width: newWidth, color: lastOptionsRef.current.line?.color || '#2962FF' };
  }, [chart, selectedToolId, rebuildToolsWithUpdate]);

  // 색상 변경
  const updateColor = useCallback((color: string) => {
    if (!chart || !selectedToolId || !toolsRef.current.has(selectedToolId)) return;

    const tool = toolsRef.current.get(selectedToolId)!;
    let updatedOptions: LineToolOptions;

    if (tool.toolType === 'Text') {
      updatedOptions = {
        ...tool.options,
        text: {
          value: tool.options.text?.value || '',
          font: {
            ...tool.options.text?.font,
            color: color,
            size: tool.options.text?.font?.size || 20
          }
        }
      };
    } else {
      updatedOptions = {
        ...tool.options,
        line: {
          ...tool.options.line,
          color: color,
          width: tool.options.line?.width || 2
        }
      };
    }

    const newId = rebuildToolsWithUpdate(selectedToolId, updatedOptions);
    setSelectedToolId(newId);
    lastOptionsRef.current.line = { ...lastOptionsRef.current.line, color, width: lastOptionsRef.current.line?.width || 2 };
  }, [chart, selectedToolId, rebuildToolsWithUpdate]);

  // 텍스트 수정
  const updateText = useCallback((newText: string) => {
    if (!chart || !selectedToolId || !toolsRef.current.has(selectedToolId)) return;

    const tool = toolsRef.current.get(selectedToolId)!;
    if (tool.toolType !== 'Text') return;

    const updatedOptions: LineToolOptions = {
      ...tool.options,
      text: {
        ...tool.options.text,
        value: newText,
      }
    };

    const newId = rebuildToolsWithUpdate(selectedToolId, updatedOptions);
    setSelectedToolId(newId);
  }, [chart, selectedToolId, rebuildToolsWithUpdate]);

  // Update callback refs
  useEffect(() => {
    onToolFinishedRef.current = options?.onToolFinished;
    onToolsChangeRef.current = options?.onToolsChange;
  }, [options?.onToolFinished, options?.onToolsChange]);

  // LineTools 이벤트 구독
  useEffect(() => {
    if (!chart) return;

    const handleLineToolsAfterEdit = (params: any) => {
      const tool = params.selectedLineTool;
      if (!tool) return;

      const toolId = tool.id;

      const lineTool: LineTool = {
        id: toolId,
        toolType: tool.toolType,
        points: tool.points,
        options: tool.options
      };

      toolsRef.current.set(toolId, lineTool);

      setTools(new Map(toolsRef.current));
      setSelectedToolId(toolId);

      if (params.stage === 'lineToolFinished' || params.stage === 'pathFinished') {
        setActiveToolType(null);
        // Call onToolFinished callback
        if (onToolFinishedRef.current) {
          onToolFinishedRef.current(lineTool);
        }
        // Notify tools change
        notifyToolsChange();
      }
    };

    (chart as any).subscribeLineToolsAfterEdit(handleLineToolsAfterEdit);

    return () => {
      // cleanup
    };
  }, [chart]);

  const selectedTool = selectedToolId ? toolsRef.current.get(selectedToolId) : null;
  const currentWidth = selectedTool?.options?.line?.width || 2;
  const currentColor = selectedTool?.options?.line?.color ||
                       selectedTool?.options?.text?.font?.color || '#2962FF';

  return {
    activeToolType,
    selectedToolId,
    selectedTool,
    currentWidth,
    currentColor,
    tools,
    activateTool,
    addTextTool,
    removeAllTools,
    removeSelectedTool,
    updateLineWidth,
    updateColor,
    updateText,
    setSelectedToolId,
    exportTools,
    loadTools,
  };
}
