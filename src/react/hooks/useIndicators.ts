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

    // SMA
    configs.sma.forEach((config: IndicatorConfig) => {
      const data = calculateSMA(candles, { period: config.value });
      const validData = filterIndicatorData(data || []);
      if (validData.length > 0) {
        const series = chart.addLineSeries({
          color: config.color,
          lineWidth: config.thickness as any,
          title: `SMA ${config.value}`,
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
        });
        series.priceScale().applyOptions({
          scaleMargins: { top: 0.8, bottom: 0 },
        });
        series.setData(validData.map(d => ({ ...d, time: d.time as Time })));
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
        });
        macdSeries.priceScale().applyOptions({
          scaleMargins: { top: 0.8, bottom: 0 },
        });
        macdSeries.setData(validMacd.map(d => ({ ...d, time: d.time as Time })));
        seriesRef.current.push(macdSeries);

        if (validSignal.length > 0) {
          const signalSeries = chart.addLineSeries({
            color: macdColors?.signal || '#FF6D00',
            lineWidth: config.thickness as any,
            title: 'Signal',
            priceScaleId: 'macd',
          });
          signalSeries.setData(validSignal.map(d => ({ ...d, time: d.time as Time })));
          seriesRef.current.push(signalSeries);
        }

        if (validHistogram.length > 0) {
          const histSeries = chart.addHistogramSeries({
            color: '#ef4444',
            priceScaleId: 'macd',
          });
          histSeries.setData(validHistogram.map(d => ({ ...d, time: d.time as Time })));
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
          lineWidth: config.thickness as any,
          title: 'BB Upper',
        });
        upperSeries.setData(validUpper.map(d => ({ ...d, time: d.time as Time })));
        seriesRef.current.push(upperSeries);

        if (validMiddle.length > 0) {
          const middleSeries = chart.addLineSeries({
            color: config.middleColor || '#2962FF',
            lineWidth: config.thickness as any,
            title: 'BB Middle',
          });
          middleSeries.setData(validMiddle.map(d => ({ ...d, time: d.time as Time })));
          seriesRef.current.push(middleSeries);
        }

        if (validLower.length > 0) {
          const lowerSeries = chart.addLineSeries({
            color: config.lowerColor || '#089981',
            lineWidth: config.thickness as any,
            title: 'BB Lower',
          });
          lowerSeries.setData(validLower.map(d => ({ ...d, time: d.time as Time })));
          seriesRef.current.push(lowerSeries);
        }
      }
    });
  }, [chart, candles]);

  return { applyIndicators };
}
