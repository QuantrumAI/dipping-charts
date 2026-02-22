import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FullFeaturedChart } from '../react/FullFeaturedChart';
import type { CandleData } from '../types';

// Sample candle data
function sampleCandles(count = 30): CandleData[] {
  return Array.from({ length: count }, (_, i) => ({
    time: 1000 + i * 60,
    open: 100 + i,
    high: 105 + i,
    low: 95 + i,
    close: 102 + i,
    volume: 1000 + i * 10,
  }));
}

describe('FullFeaturedChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders without crashing', async () => {
    const { container } = render(<FullFeaturedChart />);
    await waitFor(() => {
      expect(container.querySelector('.container')).toBeInTheDocument();
    });
  });

  it('shows loading overlay when loading=true', async () => {
    render(<FullFeaturedChart loading={true} />);
    await waitFor(() => {
      expect(screen.getByText('Loading chart data...')).toBeInTheDocument();
    });
  });

  it('shows error overlay when error is set', async () => {
    render(<FullFeaturedChart error="Something went wrong" />);
    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  it('shows empty overlay when no data and not loading', async () => {
    render(<FullFeaturedChart data={[]} />);
    await waitFor(() => {
      expect(screen.getByText('No chart data')).toBeInTheDocument();
    });
  });

  it('renders timeframe buttons when enableTimeframes=true', async () => {
    render(<FullFeaturedChart enableTimeframes={true} />);
    await waitFor(() => {
      expect(screen.getByText('1m')).toBeInTheDocument();
      expect(screen.getByText('5m')).toBeInTheDocument();
      expect(screen.getByText('D')).toBeInTheDocument();
    });
  });

  it('calls onTimeframeChange when timeframe button is clicked', async () => {
    const onTfChange = vi.fn();
    render(<FullFeaturedChart enableTimeframes={true} onTimeframeChange={onTfChange} />);
    await waitFor(() => {
      fireEvent.click(screen.getByText('1m'));
      expect(onTfChange).toHaveBeenCalledWith('1m');
    });
  });

  it('opens indicator dropdown on click', async () => {
    render(<FullFeaturedChart enableIndicators={true} data={sampleCandles()} />);
    await waitFor(() => {
      fireEvent.click(screen.getByText('+ Indicators'));
      expect(screen.getByText('SMA')).toBeInTheDocument();
      expect(screen.getByText('Stochastic')).toBeInTheDocument();
      expect(screen.getByText('ATR')).toBeInTheDocument();
      expect(screen.getByText('VWAP')).toBeInTheDocument();
      expect(screen.getByText('Williams %R')).toBeInTheDocument();
    });
  });

  it('uses Korean locale when locale="ko"', async () => {
    render(<FullFeaturedChart locale="ko" enableTimeframes={true} />);
    await waitFor(() => {
      expect(screen.getByText('1분')).toBeInTheDocument();
      expect(screen.getByText('5분')).toBeInTheDocument();
      expect(screen.getByText('+ 보조지표')).toBeInTheDocument();
    });
  });

  it('hides timeframe buttons when enableTimeframes=false', async () => {
    render(<FullFeaturedChart enableTimeframes={false} />);
    await waitFor(() => {
      expect(screen.queryByText('1m')).not.toBeInTheDocument();
    });
  });

  it('hides indicator button when enableIndicators=false', async () => {
    render(<FullFeaturedChart enableIndicators={false} />);
    await waitFor(() => {
      expect(screen.queryByText('+ Indicators')).not.toBeInTheDocument();
    });
  });

  // =============================================
  // 지표 생성/삭제 UI 흐름 테스트
  // =============================================
  describe('indicator toggle (create/delete)', () => {
    const NEW_INDICATORS = [
      { name: 'Stochastic', type: 'stochastic' },
      { name: 'ATR', type: 'atr' },
      { name: 'VWAP', type: 'vwap' },
      { name: 'Williams %R', type: 'williamsR' },
    ] as const;

    for (const { name, type } of NEW_INDICATORS) {
      it(`${name}: 체크박스 클릭으로 활성화 후 설정 패널 표시`, async () => {
        const onStateChange = vi.fn();
        render(
          <FullFeaturedChart
            enableIndicators={true}
            data={sampleCandles()}
            onIndicatorStateChange={onStateChange}
          />
        );

        // 드롭다운 열기
        await waitFor(() => {
          fireEvent.click(screen.getByText('+ Indicators'));
        });

        // 지표 항목 찾아서 이름 클릭 → selectedIndicator 설정
        const indicatorItem = screen.getByText(name);
        fireEvent.click(indicatorItem);

        // 체크박스 클릭 → 활성화
        const checkboxes = indicatorItem.closest('.indicator-item')?.querySelector('.indicator-checkbox');
        expect(checkboxes).toBeTruthy();
        fireEvent.click(checkboxes!);

        // 활성화 후 onIndicatorStateChange 콜백에서 해당 지표의 checked 포함 확인
        await waitFor(() => {
          expect(onStateChange).toHaveBeenCalled();
          const lastCall = onStateChange.mock.calls[onStateChange.mock.calls.length - 1][0];
          expect(lastCall.checked).toContain(type);
          // configs에 해당 지표 배열이 비어있지 않은지 확인
          expect(lastCall.configs[type].length).toBeGreaterThan(0);
        });
      });

      it(`${name}: 체크박스 재클릭으로 비활성화`, async () => {
        const onStateChange = vi.fn();
        render(
          <FullFeaturedChart
            enableIndicators={true}
            data={sampleCandles()}
            onIndicatorStateChange={onStateChange}
          />
        );

        // 드롭다운 열기
        await waitFor(() => {
          fireEvent.click(screen.getByText('+ Indicators'));
        });

        const indicatorItem = screen.getByText(name);
        fireEvent.click(indicatorItem);
        const checkbox = indicatorItem.closest('.indicator-item')?.querySelector('.indicator-checkbox');

        // 활성화
        fireEvent.click(checkbox!);
        // 비활성화
        fireEvent.click(checkbox!);

        await waitFor(() => {
          const lastCall = onStateChange.mock.calls[onStateChange.mock.calls.length - 1][0];
          expect(lastCall.checked).not.toContain(type);
          expect(lastCall.configs[type]).toHaveLength(0);
        });
      });
    }
  });

  it('이전 버전 localStorage (새 키 없음)에서도 크래시 없이 동작', async () => {
    // 이전 버전의 저장 형식: stochastic/atr/vwap/williamsR 키 없음
    const oldState = {
      configs: { sma: [], ema: [], rsi: [], macd: [], bbands: [] },
      checked: [],
      macdColors: { line: '#2962FF', signal: '#FF6D00' },
    };
    localStorage.setItem('test-key', JSON.stringify(oldState));

    // 크래시 없이 렌더링
    const { container } = render(
      <FullFeaturedChart
        enableIndicators={true}
        indicatorStorageKey="test-key"
        data={sampleCandles()}
      />
    );

    await waitFor(() => {
      expect(container.querySelector('.container')).toBeInTheDocument();
    });

    // 드롭다운 열어서 새 지표 활성화도 가능해야 함
    fireEvent.click(screen.getByText('+ Indicators'));
    const vwapItem = screen.getByText('VWAP');
    fireEvent.click(vwapItem);
    const checkbox = vwapItem.closest('.indicator-item')?.querySelector('.indicator-checkbox');
    fireEvent.click(checkbox!);

    // 크래시 없이 VWAP이 활성화 상태인지 확인
    await waitFor(() => {
      expect(vwapItem.closest('.indicator-item')?.classList.contains('checked')).toBe(true);
    });
  });
});
