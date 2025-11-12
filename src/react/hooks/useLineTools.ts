import { useState, useRef, useCallback, useEffect } from 'react';
import type { IChartApi } from 'lightweight-charts';
import type { LineToolType, LineTool, LineToolOptions } from '../types';

declare const LightweightCharts: any;

export interface UseLineToolsOptions {
  onToolFinished?: (tool: LineTool) => void;
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
  }, [chart]);

  // 선택된 도구 삭제
  const removeSelectedTool = useCallback(() => {
    if (!chart || !selectedToolId) return;

    const allTools = Array.from(toolsRef.current.values());
    const remainingTools = allTools.filter(t => t.id !== selectedToolId);

    (chart as any).removeAllLineTools();
    toolsRef.current.clear();

    remainingTools.forEach(t => {
      const result = (chart as any).addLineTool(t.toolType, t.points, t.options);
      if (result && result.ak && result.ak.ji) {
        const newId = result.ak.ji;
        toolsRef.current.set(newId, {
          id: newId,
          toolType: t.toolType,
          points: t.points,
          options: t.options
        });
      }
    });

    setTools(new Map(toolsRef.current));
    setSelectedToolId(remainingTools.length > 0 ? Array.from(toolsRef.current.keys())[0] : null);
  }, [chart, selectedToolId]);

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

    const allTools = Array.from(toolsRef.current.values());
    (chart as any).removeAllLineTools();
    toolsRef.current.clear();

    let lastNewId: string | null = null;
    allTools.forEach(t => {
      const opts = t.id === selectedToolId ? updatedOptions : t.options;
      const result = (chart as any).addLineTool(t.toolType, t.points, opts);

      if (result && result.ak && result.ak.ji) {
        const newId = result.ak.ji;
        toolsRef.current.set(newId, {
          id: newId,
          toolType: t.toolType,
          points: t.points,
          options: opts
        });

        if (t.id === selectedToolId) {
          lastNewId = newId;
        }
      }
    });

    setTools(new Map(toolsRef.current));
    setSelectedToolId(lastNewId);
    lastOptionsRef.current.line = { ...lastOptionsRef.current.line, width: newWidth, color: lastOptionsRef.current.line?.color || '#2962FF' };
  }, [chart, selectedToolId]);

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

    const allTools = Array.from(toolsRef.current.values());
    (chart as any).removeAllLineTools();
    toolsRef.current.clear();

    let lastNewId: string | null = null;
    allTools.forEach(t => {
      const opts = t.id === selectedToolId ? updatedOptions : t.options;
      const result = (chart as any).addLineTool(t.toolType, t.points, opts);

      if (result && result.ak && result.ak.ji) {
        const newId = result.ak.ji;
        toolsRef.current.set(newId, {
          id: newId,
          toolType: t.toolType,
          points: t.points,
          options: opts
        });

        if (t.id === selectedToolId) {
          lastNewId = newId;
        }
      }
    });

    setTools(new Map(toolsRef.current));
    setSelectedToolId(lastNewId);
    lastOptionsRef.current.line = { ...lastOptionsRef.current.line, color, width: lastOptionsRef.current.line?.width || 2 };
  }, [chart, selectedToolId]);

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

    const allTools = Array.from(toolsRef.current.values());
    (chart as any).removeAllLineTools();
    toolsRef.current.clear();

    let lastNewId: string | null = null;
    allTools.forEach(t => {
      const opts = t.id === selectedToolId ? updatedOptions : t.options;
      const result = (chart as any).addLineTool(t.toolType, t.points, opts);

      if (result && result.ak && result.ak.ji) {
        const newId = result.ak.ji;
        toolsRef.current.set(newId, {
          id: newId,
          toolType: t.toolType,
          points: t.points,
          options: opts
        });

        if (t.id === selectedToolId) {
          lastNewId = newId;
        }
      }
    });

    setTools(new Map(toolsRef.current));
    setSelectedToolId(lastNewId);
  }, [chart, selectedToolId]);

  // Update callback ref
  useEffect(() => {
    onToolFinishedRef.current = options?.onToolFinished;
  }, [options?.onToolFinished]);

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
  };
}
