import { useCallback, useRef } from 'react';
import type { IChartApi, ISeriesApi, Time } from 'lightweight-charts';
import type { CandleData } from '../../types';
import type { IndicatorConfigs, IndicatorConfig, BollingerBandsConfig, MACDConfig, StochasticConfig, VWAPConfig } from '../types';
import {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateStochastic,
  calculateATR,
  calculateVWAP,
  calculateWilliamsR,
} from '../../indicators';
import { filterValidIndicatorPoints } from '../../utils/validateCandle';

export function useIndicators(chart: IChartApi | null, candles: CandleData[]) {
  const seriesRef = useRef<ISeriesApi<any>[]>([]);

  const applyIndicators = useCallback((configs: IndicatorConfigs, macdColors?: { line: string; signal: string }) => {
    if (!chart || !candles || candles.length === 0) return;

    // 기존 지표 제거
    seriesRef.current.forEach(series => {
      try {
        chart.removeSeries(series);
      } catch (e) {
        // 이미 제거된 시리즈
      }
    });
    seriesRef.current = [];

    const filterIndicatorData = filterValidIndicatorPoints;

    // 동적 scaleMargins 계산 (하단 오실레이터 겹침 방지)
    // 이전 버전 호환: 새 키가 없을 수 있으므로 방어적 접근
    const hasRsi = (configs.rsi?.length ?? 0) > 0;
    const hasMacd = (configs.macd?.length ?? 0) > 0;
    const hasStochastic = (configs.stochastic?.length ?? 0) > 0;
    const hasAtr = (configs.atr?.length ?? 0) > 0;
    const hasWilliamsR = (configs.williamsR?.length ?? 0) > 0;

    // 하단 오실레이터 개수에 따라 scaleMargins 동적 조정
    const oscillatorPanes = [hasRsi, hasMacd, hasStochastic, hasAtr, hasWilliamsR].filter(Boolean).length;
    const paneHeight = oscillatorPanes > 0 ? Math.min(0.2, 0.5 / oscillatorPanes) : 0;

    let nextPaneTop = 1 - (paneHeight * oscillatorPanes);
    const assignMargins = () => {
      const top = nextPaneTop;
      nextPaneTop += paneHeight;
      return { top, bottom: 1 - nextPaneTop };
    };

    const rsiMargins = hasRsi ? assignMargins() : { top: 0.75, bottom: 0 };
    const macdMargins = hasMacd ? assignMargins() : { top: 0.75, bottom: 0 };
    const stochasticMargins = hasStochastic ? assignMargins() : { top: 0.75, bottom: 0 };
    const atrMargins = hasAtr ? assignMargins() : { top: 0.75, bottom: 0 };
    const williamsRMargins = hasWilliamsR ? assignMargins() : { top: 0.75, bottom: 0 };

    // SMA
    configs.sma.forEach((config: IndicatorConfig) => {
      const data = calculateSMA(candles, { period: config.value });
      const validData = filterIndicatorData(data || []);
      if (validData.length > 0) {
        const series = chart.addLineSeries({
          color: config.color,
          lineWidth: config.thickness as any,
          title: `SMA ${config.value}`,
          lastValueVisible: false,
          priceLineVisible: false,
        });
        series.setData(validData.map(d => ({ ...d, time: d.time as Time })));
        seriesRef.current.push(series);
      }
    });

    // EMA
    configs.ema.forEach((config: IndicatorConfig) => {
      const data = calculateEMA(candles, { period: config.value });
      const validData = filterIndicatorData(data || []);
      if (validData.length > 0) {
        const series = chart.addLineSeries({
          color: config.color,
          lineWidth: config.thickness as any,
          title: `EMA ${config.value}`,
          lastValueVisible: false,
          priceLineVisible: false,
        });
        series.setData(validData.map(d => ({ ...d, time: d.time as Time })));
        seriesRef.current.push(series);
      }
    });

    // RSI
    configs.rsi.forEach((config: IndicatorConfig) => {
      const data = calculateRSI(candles, { period: config.value });
      const validData = filterIndicatorData(data || []);
      if (validData.length > 0) {
        const series = chart.addLineSeries({
          color: config.color,
          lineWidth: config.thickness as any,
          title: `RSI ${config.value}`,
          priceScaleId: 'rsi',
          lastValueVisible: true,
          priceLineVisible: false,
        });
        series.priceScale().applyOptions({
          scaleMargins: rsiMargins,
        });
        series.setData(validData.map(d => ({ ...d, time: d.time as Time })));
        // RSI 과매수/과매도 기준선
        const oversold = config.oversold ?? 30;
        const overbought = config.overbought ?? 70;
        series.createPriceLine({
          price: oversold, color: 'rgba(150,150,150,0.4)', lineWidth: 1, lineStyle: 1,
          axisLabelVisible: false, title: '', lineVisible: true,
        });
        series.createPriceLine({
          price: overbought, color: 'rgba(150,150,150,0.4)', lineWidth: 1, lineStyle: 1,
          axisLabelVisible: false, title: '', lineVisible: true,
        });
        seriesRef.current.push(series);
      }
    });

    // MACD
    configs.macd.forEach((config: MACDConfig) => {
      const macdData = calculateMACD(candles, {
        fastPeriod: config.fastPeriod,
        slowPeriod: config.slowPeriod,
        signalPeriod: config.signalPeriod
      });
      const validMacd = filterIndicatorData(macdData.macd || []);
      const validSignal = filterIndicatorData(macdData.signal || []);
      const validHistogram = filterIndicatorData(macdData.histogram || []);

      if (validMacd.length > 0) {
        const macdSeries = chart.addLineSeries({
          color: macdColors?.line || '#2962FF',
          lineWidth: config.thickness as any,
          title: 'MACD',
          priceScaleId: 'macd',
          lastValueVisible: true,
          priceLineVisible: false,
        });
        macdSeries.priceScale().applyOptions({
          scaleMargins: macdMargins,
        });
        macdSeries.setData(validMacd.map(d => ({ ...d, time: d.time as Time })));
        seriesRef.current.push(macdSeries);

        if (validSignal.length > 0) {
          const signalSeries = chart.addLineSeries({
            color: macdColors?.signal || '#FF6D00',
            lineWidth: config.thickness as any,
            title: 'Signal',
            priceScaleId: 'macd',
            lastValueVisible: true,
            priceLineVisible: false,
          });
          signalSeries.setData(validSignal.map(d => ({ ...d, time: d.time as Time })));
          seriesRef.current.push(signalSeries);
        }

        if (validHistogram.length > 0) {
          const histSeries = chart.addHistogramSeries({
            priceScaleId: 'macd',
          });
          const histUp = config.histUpColor || '#26a69a';
          const histDown = config.histDownColor || '#ef5350';
          histSeries.setData(validHistogram.map(d => ({
            time: d.time as Time,
            value: d.value,
            color: d.value >= 0 ? histUp : histDown,
          })));
          seriesRef.current.push(histSeries);
        }
      }
    });

    // Bollinger Bands
    configs.bbands.forEach((config: BollingerBandsConfig) => {
      const bbData = calculateBollingerBands(candles, { period: config.value, stdDev: config.stdDev || 2 });
      const validUpper = filterIndicatorData(bbData.upper || []);
      const validMiddle = filterIndicatorData(bbData.middle || []);
      const validLower = filterIndicatorData(bbData.lower || []);

      if (validUpper.length > 0) {
        const upperSeries = chart.addLineSeries({
          color: config.upperColor || '#F23645',
          lineWidth: 1,
          lineStyle: 1,
          title: 'BB Upper',
          crosshairMarkerVisible: false,
          lastValueVisible: false,
          priceLineVisible: false,
        });
        upperSeries.setData(validUpper.map(d => ({ ...d, time: d.time as Time })));
        seriesRef.current.push(upperSeries);

        if (validMiddle.length > 0) {
          const middleSeries = chart.addLineSeries({
            color: config.middleColor || '#2962FF',
            lineWidth: config.thickness as any,
            lineStyle: 0,
            title: 'BB Middle',
            lastValueVisible: false,
            priceLineVisible: false,
          });
          middleSeries.setData(validMiddle.map(d => ({ ...d, time: d.time as Time })));
          seriesRef.current.push(middleSeries);
        }

        if (validLower.length > 0) {
          const lowerSeries = chart.addLineSeries({
            color: config.lowerColor || '#089981',
            lineWidth: 1,
            lineStyle: 1,
            title: 'BB Lower',
            crosshairMarkerVisible: false,
            lastValueVisible: false,
            priceLineVisible: false,
          });
          lowerSeries.setData(validLower.map(d => ({ ...d, time: d.time as Time })));
          seriesRef.current.push(lowerSeries);
        }
      }
    });

    // Stochastic
    (configs.stochastic ?? []).forEach((config: StochasticConfig) => {
      const stochData = calculateStochastic(candles, {
        kPeriod: config.kPeriod,
        dPeriod: config.dPeriod,
        smooth: config.smooth,
      });
      const validK = filterIndicatorData(stochData.k || []);
      const validD = filterIndicatorData(stochData.d || []);

      if (validK.length > 0) {
        const kSeries = chart.addLineSeries({
          color: config.kColor || '#2962FF',
          lineWidth: config.thickness as any,
          title: '%K',
          priceScaleId: 'stochastic',
          lastValueVisible: true,
          priceLineVisible: false,
        });
        kSeries.priceScale().applyOptions({ scaleMargins: stochasticMargins });
        kSeries.setData(validK.map(d => ({ ...d, time: d.time as Time })));
        seriesRef.current.push(kSeries);

        // Overbought/Oversold lines
        kSeries.createPriceLine({
          price: 80, color: 'rgba(150,150,150,0.4)', lineWidth: 1, lineStyle: 1,
          axisLabelVisible: false, title: '', lineVisible: true,
        });
        kSeries.createPriceLine({
          price: 20, color: 'rgba(150,150,150,0.4)', lineWidth: 1, lineStyle: 1,
          axisLabelVisible: false, title: '', lineVisible: true,
        });

        if (validD.length > 0) {
          const dSeries = chart.addLineSeries({
            color: config.dColor || '#FF6D00',
            lineWidth: config.thickness as any,
            title: '%D',
            priceScaleId: 'stochastic',
            lastValueVisible: true,
            priceLineVisible: false,
          });
          dSeries.setData(validD.map(d => ({ ...d, time: d.time as Time })));
          seriesRef.current.push(dSeries);
        }
      }
    });

    // ATR
    (configs.atr ?? []).forEach((config: IndicatorConfig) => {
      const data = calculateATR(candles, { period: config.value });
      const validData = filterIndicatorData(data || []);
      if (validData.length > 0) {
        const series = chart.addLineSeries({
          color: config.color,
          lineWidth: config.thickness as any,
          title: `ATR ${config.value}`,
          priceScaleId: 'atr',
          lastValueVisible: true,
          priceLineVisible: false,
        });
        series.priceScale().applyOptions({ scaleMargins: atrMargins });
        series.setData(validData.map(d => ({ ...d, time: d.time as Time })));
        seriesRef.current.push(series);
      }
    });

    // VWAP (overlay — same price scale as candles)
    (configs.vwap ?? []).forEach((config: VWAPConfig) => {
      const data = calculateVWAP(candles);
      const validData = filterIndicatorData(data || []);
      if (validData.length > 0) {
        const series = chart.addLineSeries({
          color: config.color || '#E040FB',
          lineWidth: config.thickness as any,
          title: 'VWAP',
          lastValueVisible: false,
          priceLineVisible: false,
        });
        series.setData(validData.map(d => ({ ...d, time: d.time as Time })));
        seriesRef.current.push(series);
      }
    });

    // Williams %R
    (configs.williamsR ?? []).forEach((config: IndicatorConfig) => {
      const data = calculateWilliamsR(candles, { period: config.value });
      const validData = filterIndicatorData(data || []);
      if (validData.length > 0) {
        const series = chart.addLineSeries({
          color: config.color,
          lineWidth: config.thickness as any,
          title: `W%R ${config.value}`,
          priceScaleId: 'williamsR',
          lastValueVisible: true,
          priceLineVisible: false,
        });
        series.priceScale().applyOptions({ scaleMargins: williamsRMargins });
        series.setData(validData.map(d => ({ ...d, time: d.time as Time })));

        // Overbought/Oversold lines
        series.createPriceLine({
          price: -20, color: 'rgba(150,150,150,0.4)', lineWidth: 1, lineStyle: 1,
          axisLabelVisible: false, title: '', lineVisible: true,
        });
        series.createPriceLine({
          price: -80, color: 'rgba(150,150,150,0.4)', lineWidth: 1, lineStyle: 1,
          axisLabelVisible: false, title: '', lineVisible: true,
        });
        seriesRef.current.push(series);
      }
    });
  }, [chart, candles]);

  return { applyIndicators };
}
