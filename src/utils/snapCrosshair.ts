import { IChartApi, ISeriesApi, MouseEventParams } from 'lightweight-charts';

/**
 * Snap Crosshair Plugin
 * Shift 키를 누르면 마우스 위치에 따라 High/Low에 snap
 */
export class SnapCrosshairPlugin {
  private chart: IChartApi;
  private series: ISeriesApi<'Candlestick'>;
  private container: HTMLElement;
  private isShiftPressed: boolean = false;

  // 커스텀 crosshair 요소
  private verticalLine: HTMLDivElement;
  private horizontalLine: HTMLDivElement;
  private priceLabel: HTMLDivElement;

  constructor(chart: IChartApi, series: ISeriesApi<'Candlestick'>, container: HTMLElement) {
    this.chart = chart;
    this.series = series;
    this.container = container;

    // 커스텀 crosshair 생성
    this.verticalLine = this.createLine('vertical');
    this.horizontalLine = this.createLine('horizontal');
    this.priceLabel = this.createPriceLabel();

    this.init();
  }

  private createLine(type: 'vertical' | 'horizontal'): HTMLDivElement {
    const line = document.createElement('div');
    line.style.position = 'absolute';
    line.style.backgroundColor = '#2962FF';
    line.style.pointerEvents = 'none';
    line.style.display = 'none';
    line.style.zIndex = '1000';

    if (type === 'vertical') {
      line.style.width = '1px';
      line.style.height = '100%';
      line.style.top = '0';
    } else {
      line.style.height = '1px';
      line.style.width = '100%';
      line.style.left = '0';
    }

    this.container.appendChild(line);
    return line;
  }

  private createPriceLabel(): HTMLDivElement {
    const label = document.createElement('div');
    label.style.position = 'absolute';
    label.style.backgroundColor = '#2962FF';
    label.style.color = 'white';
    label.style.padding = '2px 6px';
    label.style.fontSize = '12px';
    label.style.borderRadius = '3px';
    label.style.pointerEvents = 'none';
    label.style.display = 'none';
    label.style.zIndex = '1001';
    label.style.right = '0';

    this.container.appendChild(label);
    return label;
  }

  private init() {
    // Shift 키 이벤트
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    // Crosshair 이벤트
    this.chart.subscribeCrosshairMove(this.handleCrosshairMove);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Shift') {
      this.isShiftPressed = true;
      // 기본 crosshair 숨기기
      this.chart.applyOptions({
        crosshair: {
          vertLine: { visible: false },
          horzLine: { visible: false },
        },
      });
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'Shift') {
      this.isShiftPressed = false;
      // 기본 crosshair 복원
      this.chart.applyOptions({
        crosshair: {
          vertLine: { visible: true },
          horzLine: { visible: true },
        },
      });
      // 커스텀 crosshair 숨기기
      this.hideCrosshair();
    }
  };

  private handleCrosshairMove = (param: MouseEventParams) => {
    if (!this.isShiftPressed || !param.point || !param.time) {
      if (this.isShiftPressed) {
        this.hideCrosshair();
      }
      return;
    }

    // 현재 캔들 데이터 가져오기
    const seriesData = param.seriesPrices.get(this.series);
    if (!seriesData || typeof seriesData !== 'object' || !('high' in seriesData) || !('low' in seriesData)) {
      this.hideCrosshair();
      return;
    }

    const high = (seriesData as any).high;
    const low = (seriesData as any).low;

    // 차트의 priceScale을 사용해 Y 좌표를 가격으로 변환
    const mouseY = param.point.y;

    // 시리즈의 priceToCoordinate 사용
    const highY = this.series.priceToCoordinate(high);
    const lowY = this.series.priceToCoordinate(low);

    if (highY === null || lowY === null) return;

    // 마우스가 high와 low 중 어디에 더 가까운지 판단
    const distToHigh = Math.abs(mouseY - highY);
    const distToLow = Math.abs(mouseY - lowY);

    const snapPrice = distToHigh < distToLow ? high : low;
    const snapY = distToHigh < distToLow ? highY : lowY;

    // 커스텀 crosshair 표시
    this.showCrosshair(param.point.x, snapY, snapPrice);
  };

  private showCrosshair(x: number, y: number, price: number) {
    // 세로선
    this.verticalLine.style.display = 'block';
    this.verticalLine.style.left = `${x}px`;

    // 가로선
    this.horizontalLine.style.display = 'block';
    this.horizontalLine.style.top = `${y}px`;

    // 가격 라벨
    this.priceLabel.style.display = 'block';
    this.priceLabel.style.top = `${y - 10}px`;
    this.priceLabel.textContent = price.toFixed(2);
  }

  private hideCrosshair() {
    this.verticalLine.style.display = 'none';
    this.horizontalLine.style.display = 'none';
    this.priceLabel.style.display = 'none';
  }

  destroy() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.container.removeChild(this.verticalLine);
    this.container.removeChild(this.horizontalLine);
    this.container.removeChild(this.priceLabel);
  }
}
