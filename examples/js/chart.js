const { createChart } = LightweightCharts;

// 시간봉에 따른 시간 간격 (초)
const TIME_INTERVALS = {
  '1m': 60,
  '5m': 300,
  '1h': 3600,
  '1d': 86400,
  '1w': 604800,
  '1M': 2592000,
  '1y': 31536000,
};

// 가상 데이터 생성
function generateMockCandles(timeFrame, count = 100, basePrice = 150) {
  const candles = [];
  const interval = TIME_INTERVALS[timeFrame];
  const now = Math.floor(Date.now() / 1000);
  let currentPrice = basePrice;

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

// 차트 생성
export const chartContainer = document.getElementById('chart');
window.chartContainer = chartContainer;

export const chart = createChart(chartContainer, {
  width: chartContainer.clientWidth,
  height: 600,
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
window.chart = chart;

// 캔들스틱 시리즈
export const candleSeries = chart.addCandlestickSeries({
  upColor: '#ef4444',
  downColor: '#3b82f6',
  borderUpColor: '#ef4444',
  borderDownColor: '#3b82f6',
  wickUpColor: '#ef4444',
  wickDownColor: '#3b82f6',
});
window.candleSeries = candleSeries;

// 거래량 시리즈
export const volumeSeries = chart.addHistogramSeries({
  color: '#26a69a',
  priceFormat: { type: 'volume' },
  priceScaleId: '',
});
window.volumeSeries = volumeSeries;

volumeSeries.priceScale().applyOptions({
  scaleMargins: {
    top: 0.8,
    bottom: 0,
  },
});

// Line Tools 관련 변수
export let activeLineTool = null;
window.activeLineTool = null;

// 지표 시리즈 관리
export let currentCandles = [];
window.currentCandles = [];

export let dynamicIndicatorSeries = []; // 동적으로 추가된 지표들
window.dynamicIndicatorSeries = [];

export const indicatorSeries = {
  sma20: null,
  ema12: null,
  rsi14: null,
  macdLine: null,
  macdSignal: null,
  macdHist: null,
  bbUpper: null,
  bbMiddle: null,
  bbLower: null,
};
window.indicatorSeries = indicatorSeries;

export const indicatorStates = {
  sma20: false,
  ema12: false,
  rsi14: false,
  macd: false,
  bbands: false,
};
window.indicatorStates = indicatorStates;

// 데이터 로드
export function loadData(timeFrame) {
  const candles = generateMockCandles(timeFrame, 200);
  currentCandles = candles;
  window.currentCandles = candles;

  const candleData = candles.map(c => ({
    time: c.time,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
  }));

  const volumeData = candles.map(c => ({
    time: c.time,
    value: c.volume,
    color: c.close >= c.open ? '#ef444466' : '#3b82f666',
  }));

  candleSeries.setData(candleData);
  volumeSeries.setData(volumeData);
  chart.timeScale().fitContent();

  // 활성화된 지표 다시 로드
  if (indicatorStates.sma20) updateSMA20();
  if (indicatorStates.ema12) updateEMA12();
  if (indicatorStates.rsi14) updateRSI14();
  if (indicatorStates.macd) updateMACD();
  if (indicatorStates.bbands) updateBollingerBands();

}

// ===== Indicator Toggle Functions =====

function updateSMA20() {
  const smaData = calculateSMA(currentCandles, { period: 20 });
  if (indicatorSeries.sma20) {
    indicatorSeries.sma20.setData(smaData);
  }
}

export function toggleSMA20() {
  indicatorStates.sma20 = !indicatorStates.sma20;
  const btn = document.getElementById('sma20Btn');

  if (indicatorStates.sma20) {
    btn.classList.add('active');
    if (!indicatorSeries.sma20) {
      indicatorSeries.sma20 = chart.addLineSeries({
        color: '#2962FF',
        lineWidth: 2,
        title: 'SMA(20)',
      });
    }
    updateSMA20();
  } else {
    btn.classList.remove('active');
    if (indicatorSeries.sma20) {
      chart.removeSeries(indicatorSeries.sma20);
      indicatorSeries.sma20 = null;
    }
  }
}

function updateEMA12() {
  const emaData = calculateEMA(currentCandles, { period: 12 });
  if (indicatorSeries.ema12) {
    indicatorSeries.ema12.setData(emaData);
  }
}

export function toggleEMA12() {
  indicatorStates.ema12 = !indicatorStates.ema12;
  const btn = document.getElementById('ema12Btn');

  if (indicatorStates.ema12) {
    btn.classList.add('active');
    if (!indicatorSeries.ema12) {
      indicatorSeries.ema12 = chart.addLineSeries({
        color: '#E91E63',
        lineWidth: 2,
        title: 'EMA(12)',
      });
    }
    updateEMA12();
  } else {
    btn.classList.remove('active');
    if (indicatorSeries.ema12) {
      chart.removeSeries(indicatorSeries.ema12);
      indicatorSeries.ema12 = null;
    }
  }
}

function updateRSI14() {
  const rsiData = calculateRSI(currentCandles, { period: 14 });
  if (indicatorSeries.rsi14) {
    indicatorSeries.rsi14.setData(rsiData);
  }
}

export function toggleRSI14() {
  indicatorStates.rsi14 = !indicatorStates.rsi14;
  const btn = document.getElementById('rsi14Btn');

  if (indicatorStates.rsi14) {
    btn.classList.add('active');
    if (!indicatorSeries.rsi14) {
      indicatorSeries.rsi14 = chart.addLineSeries({
        color: '#7E57C2',
        lineWidth: 2,
        title: 'RSI(14)',
        priceScaleId: 'rsi',
      });
      indicatorSeries.rsi14.priceScale().applyOptions({
        scaleMargins: {
          top: 0.7,
          bottom: 0,
        },
      });
    }
    updateRSI14();
  } else {
    btn.classList.remove('active');
    if (indicatorSeries.rsi14) {
      chart.removeSeries(indicatorSeries.rsi14);
      indicatorSeries.rsi14 = null;
    }
  }
}

function updateMACD() {
  const macdData = calculateMACD(currentCandles, { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 });
  if (indicatorSeries.macdLine) {
    indicatorSeries.macdLine.setData(macdData.macd);
    indicatorSeries.macdSignal.setData(macdData.signal);
    indicatorSeries.macdHist.setData(macdData.histogram);
  }
}

export function toggleMACD() {
  indicatorStates.macd = !indicatorStates.macd;
  const btn = document.getElementById('macdBtn');

  if (indicatorStates.macd) {
    btn.classList.add('active');
    if (!indicatorSeries.macdLine) {
      indicatorSeries.macdHist = chart.addHistogramSeries({
        color: '#26a69a',
        priceFormat: { type: 'price', precision: 5, minMove: 0.00001 },
        priceScaleId: 'macd',
      });
      indicatorSeries.macdLine = chart.addLineSeries({
        color: '#2962FF',
        lineWidth: 2,
        title: 'MACD',
        priceFormat: { type: 'price', precision: 5, minMove: 0.00001 },
        priceScaleId: 'macd',
      });
      indicatorSeries.macdSignal = chart.addLineSeries({
        color: '#FF6D00',
        lineWidth: 2,
        title: 'Signal',
        priceFormat: { type: 'price', precision: 5, minMove: 0.00001 },
        priceScaleId: 'macd',
      });
      indicatorSeries.macdLine.priceScale().applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });
    }
    updateMACD();
  } else {
    btn.classList.remove('active');
    if (indicatorSeries.macdLine) {
      chart.removeSeries(indicatorSeries.macdLine);
      chart.removeSeries(indicatorSeries.macdSignal);
      chart.removeSeries(indicatorSeries.macdHist);
      indicatorSeries.macdLine = null;
      indicatorSeries.macdSignal = null;
      indicatorSeries.macdHist = null;
    }
  }
}

function updateBollingerBands() {
  const bbData = calculateBollingerBands(currentCandles, { period: 20, stdDev: 2 });
  if (indicatorSeries.bbUpper) {
    indicatorSeries.bbUpper.setData(bbData.upper);
    indicatorSeries.bbMiddle.setData(bbData.middle);
    indicatorSeries.bbLower.setData(bbData.lower);
  }
}

export function toggleBollingerBands() {
  indicatorStates.bbands = !indicatorStates.bbands;
  const btn = document.getElementById('bbandsBtn');

  if (indicatorStates.bbands) {
    btn.classList.add('active');
    if (!indicatorSeries.bbUpper) {
      indicatorSeries.bbUpper = chart.addLineSeries({
        color: '#F23645',
        lineWidth: 2,
        title: 'BB Upper',
      });
      indicatorSeries.bbMiddle = chart.addLineSeries({
        color: '#2962FF',
        lineWidth: 2,
        title: 'BB Middle',
      });
      indicatorSeries.bbLower = chart.addLineSeries({
        color: '#089981',
        lineWidth: 2,
        title: 'BB Lower',
      });
    }
    updateBollingerBands();
  } else {
    btn.classList.remove('active');
    if (indicatorSeries.bbUpper) {
      chart.removeSeries(indicatorSeries.bbUpper);
      chart.removeSeries(indicatorSeries.bbMiddle);
      chart.removeSeries(indicatorSeries.bbLower);
      indicatorSeries.bbUpper = null;
      indicatorSeries.bbMiddle = null;
      indicatorSeries.bbLower = null;
    }
  }
}

// 초기 로드 (5분봉)
loadData('5m');
