import { useCallback, useRef } from 'react';
import type { IChartApi, ISeriesApi, Time } from 'lightweight-charts';
import type { CandleData } from '../../types';
import type { IndicatorConfigs, IndicatorConfig, BollingerBandsConfig, MACDConfig } from '../types';
import {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
} from '../../indicators';

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

    // SMA
    configs.sma.forEach((config: IndicatorConfig) => {
      const data = calculateSMA(candles, { period: config.value });
      if (data && data.length > 0) {
        const series = chart.addLineSeries({
          color: config.color,
          lineWidth: config.thickness as any,
          title: `SMA ${config.value}`,
        });
        series.setData(data.map(d => ({ ...d, time: d.time as Time })));
        seriesRef.current.push(series);
      }
    });

    // EMA
    configs.ema.forEach((config: IndicatorConfig) => {
      const data = calculateEMA(candles, { period: config.value });
      if (data && data.length > 0) {
        const series = chart.addLineSeries({
          color: config.color,
          lineWidth: config.thickness as any,
          title: `EMA ${config.value}`,
        });
        series.setData(data.map(d => ({ ...d, time: d.time as Time })));
        seriesRef.current.push(series);
      }
    });

    // RSI
    configs.rsi.forEach((config: IndicatorConfig) => {
      const data = calculateRSI(candles, { period: config.value });
      if (data && data.length > 0) {
        const series = chart.addLineSeries({
          color: config.color,
          lineWidth: config.thickness as any,
          title: `RSI ${config.value}`,
          priceScaleId: 'rsi',
        });
        series.priceScale().applyOptions({
          scaleMargins: { top: 0.8, bottom: 0 },
        });
        series.setData(data.map(d => ({ ...d, time: d.time as Time })));
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
      if (macdData.macd && macdData.macd.length > 0) {
        const macdSeries = chart.addLineSeries({
          color: macdColors?.line || '#2962FF',
          lineWidth: config.thickness as any,
          title: 'MACD',
          priceScaleId: 'macd',
        });
        macdSeries.priceScale().applyOptions({
          scaleMargins: { top: 0.8, bottom: 0 },
        });
        macdSeries.setData(macdData.macd.map(d => ({ ...d, time: d.time as Time })));
        seriesRef.current.push(macdSeries);

        const signalSeries = chart.addLineSeries({
          color: macdColors?.signal || '#FF6D00',
          lineWidth: config.thickness as any,
          title: 'Signal',
          priceScaleId: 'macd',
        });
        signalSeries.setData(macdData.signal.map(d => ({ ...d, time: d.time as Time })));
        seriesRef.current.push(signalSeries);

        const histSeries = chart.addHistogramSeries({
          color: '#ef4444',
          priceScaleId: 'macd',
        });
        histSeries.setData(macdData.histogram.map(d => ({ ...d, time: d.time as Time })));
        seriesRef.current.push(histSeries);
      }
    });

    // Bollinger Bands
    configs.bbands.forEach((config: BollingerBandsConfig) => {
      const bbData = calculateBollingerBands(candles, { period: config.value, stdDev: config.stdDev || 2 });
      if (bbData.upper && bbData.upper.length > 0) {
        const upperSeries = chart.addLineSeries({
          color: config.upperColor || '#F23645',
          lineWidth: config.thickness as any,
          title: 'BB Upper',
        });
        upperSeries.setData(bbData.upper.map(d => ({ ...d, time: d.time as Time })));
        seriesRef.current.push(upperSeries);

        const middleSeries = chart.addLineSeries({
          color: config.middleColor || '#2962FF',
          lineWidth: config.thickness as any,
          title: 'BB Middle',
        });
        middleSeries.setData(bbData.middle.map(d => ({ ...d, time: d.time as Time })));
        seriesRef.current.push(middleSeries);

        const lowerSeries = chart.addLineSeries({
          color: config.lowerColor || '#089981',
          lineWidth: config.thickness as any,
          title: 'BB Lower',
        });
        lowerSeries.setData(bbData.lower.map(d => ({ ...d, time: d.time as Time })));
        seriesRef.current.push(lowerSeries);
      }
    });
  }, [chart, candles]);

  return { applyIndicators };
}
