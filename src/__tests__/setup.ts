/// <reference types="vitest/globals" />
import '@testing-library/jest-dom';

// Mock ResizeObserver (not available in jsdom)
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as any).ResizeObserver = MockResizeObserver;

// Mock LightweightCharts
const mockPriceScale = () => ({
  applyOptions: vi.fn(),
});

const mockSeries = () => ({
  setData: vi.fn(),
  applyOptions: vi.fn(),
  createPriceLine: vi.fn(),
  removePriceLine: vi.fn(),
  priceScale: mockPriceScale,
  options: vi.fn(),
});

const mockTimeScale = () => ({
  fitContent: vi.fn(),
  getVisibleLogicalRange: vi.fn(() => null),
  setVisibleLogicalRange: vi.fn(),
});

const mockChart = {
  addCandlestickSeries: vi.fn(() => mockSeries()),
  addHistogramSeries: vi.fn(() => mockSeries()),
  addLineSeries: vi.fn(() => mockSeries()),
  applyOptions: vi.fn(),
  timeScale: mockTimeScale,
  remove: vi.fn(),
  removeSeries: vi.fn(),
  addLineTool: vi.fn(),
  // Line tools methods
  subscribeLineToolsAfterEdit: vi.fn(),
  unsubscribeLineToolsAfterEdit: vi.fn(),
  removeLineTool: vi.fn(),
  removeAllLineTools: vi.fn(),
  getLineTools: vi.fn(() => []),
};

(globalThis as any).LightweightCharts = {
  createChart: vi.fn(() => mockChart),
};

// Also set on window for loadLightweightCharts
if (typeof window !== 'undefined') {
  (window as any).LightweightCharts = (globalThis as any).LightweightCharts;
}
