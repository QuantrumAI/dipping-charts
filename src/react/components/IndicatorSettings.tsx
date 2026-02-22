import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { IndicatorType, IndicatorConfig, BollingerBandsConfig, MACDConfig, StochasticConfig, VWAPConfig, IndicatorConfigs } from '../types';
import type { Locale, LocaleStrings } from '../locale';
import { getLocaleStrings } from '../locale';

const COLOR_PALETTE = [
  '#3C4043', '#1A73E8', '#9334E6', '#B80000', '#E37400', '#F9AB00', '#007B83', '#1E8E3E',
  '#5F6368', '#4285F4', '#A142F4', '#D93025', '#F57C00', '#FDD835', '#12B5CB', '#34A853',
  '#9AA0A6', '#8AB4F8', '#C58AF9', '#EE675C', '#FF8A65', '#FFB300', '#4DB6AC', '#81C995',
  '#DADCE0', '#AECBFA', '#D7AEFB', '#F28B82', '#FFAB91', '#FFD54F', '#80DEEA', '#A5D6A7'
];

const DEFAULT_COLORS = ['#26a69a', '#ef5350', '#2196f3', '#ff6f00', '#ab47bc', '#66bb6a', '#ffa726', '#42a5f5'];

function getIndicatorInfo(t: LocaleStrings) {
  return {
    sma: { title: t.ind_sma, desc: t.ind_sma_desc, defaultValue: 20 },
    ema: { title: t.ind_ema, desc: t.ind_ema_desc, defaultValue: 12 },
    rsi: { title: t.ind_rsi, desc: t.ind_rsi_desc, defaultValue: 14 },
    macd: { title: t.ind_macd, desc: t.ind_macd_desc, defaultValue: 26 },
    bbands: { title: t.ind_bbands, desc: t.ind_bbands_desc, defaultValue: 20 },
    stochastic: { title: t.ind_stochastic, desc: t.ind_stochastic_desc, defaultValue: 14 },
    atr: { title: t.ind_atr, desc: t.ind_atr_desc, defaultValue: 14 },
    vwap: { title: t.ind_vwap, desc: t.ind_vwap_desc, defaultValue: 0 },
    williamsR: { title: t.ind_williamsR, desc: t.ind_williamsR_desc, defaultValue: 14 },
  };
}

interface ColorPalettePopupProps {
  currentColor: string;
  onSelect: (color: string) => void;
  onClose: () => void;
  position: { top: number; left: number };
  colorTitle?: string;
}

function ColorPalettePopup({ currentColor, onSelect, onClose, position, colorTitle = 'Color' }: ColorPalettePopupProps) {
  const paletteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (paletteRef.current && !paletteRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // 약간의 지연 후 이벤트 리스너 등록 (현재 클릭 이벤트가 완료된 후)
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const paletteElement = (
    <div
      ref={paletteRef}
      className="color-palette-popup show"
      style={{
        top: position.top,
        left: position.left
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="color-palette-title">{colorTitle}</div>
      <div className="color-palette-grid">
        {COLOR_PALETTE.map(color => (
          <div
            key={color}
            className={`color-palette-item ${color === currentColor ? 'selected' : ''}`}
            style={{ background: color }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(color);
              onClose();
            }}
          />
        ))}
      </div>
    </div>
  );

  // Portal을 사용해 document.body에 직접 렌더링
  return createPortal(paletteElement, document.body);
}

interface IndicatorSettingsProps {
  indicator: IndicatorType | null;
  configs: IndicatorConfigs;
  isChecked: boolean;
  onConfigChange: (indicator: IndicatorType, configs: any[]) => void;
  macdColors: { line: string; signal: string };
  onMacdColorsChange: (colors: { line: string; signal: string }) => void;
  locale?: Locale;
}

export function IndicatorSettings({
  indicator,
  configs,
  isChecked,
  onConfigChange,
  macdColors,
  onMacdColorsChange,
  locale: localeProp = 'en',
}: IndicatorSettingsProps) {
  const t = getLocaleStrings(localeProp);
  const INDICATOR_INFO = getIndicatorInfo(t);
  const [colorPaletteOpen, setColorPaletteOpen] = useState<{ index?: number; type?: string; position: { top: number; left: number } } | null>(null);

  if (!indicator) {
    return <div className="indicator-empty-state">{t.selectIndicator}</div>;
  }

  const info = INDICATOR_INFO[indicator];
  const config = configs[indicator];

  if (!isChecked || config.length === 0) {
    return (
      <div>
        <div className="indicator-settings-title">{info.title}</div>
        <div className="indicator-settings-desc">{info.desc}</div>
        <div className="indicator-empty-state">{t.enableIndicator}</div>
      </div>
    );
  }

  const handleColorClick = (e: React.MouseEvent, index?: number, type?: string) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setColorPaletteOpen({
      index,
      type,
      position: { top: rect.bottom + 5, left: rect.left }
    });
  };

  // RSI
  if (indicator === 'rsi') {
    const rsiConfig = config[0] as IndicatorConfig;
    return (
      <div>
        <div className="indicator-settings-title">{info.title}</div>
        <div className="indicator-settings-desc">{info.desc}</div>
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{t.color}</div>
              <div
                className="period-color-picker"
                style={{ background: rsiConfig.color, width: '100%', height: 40, cursor: 'pointer', borderRadius: 6, border: '1px solid #e0e0e0' }}
                onClick={(e) => handleColorClick(e, 0)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{t.period}</div>
              <input
                type="number"
                value={rsiConfig.value}
                onChange={(e) => onConfigChange(indicator, [{ ...rsiConfig, value: parseInt(e.target.value) || 14 }])}
                min="1"
                max="500"
                style={{ width: '100%', padding: 8, border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 14, height: 40, boxSizing: 'border-box' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{t.oversold}</div>
              <input
                type="number"
                value={rsiConfig.oversold ?? 30}
                onChange={(e) => onConfigChange(indicator, [{ ...rsiConfig, oversold: parseInt(e.target.value) || 30 }])}
                min="0"
                max="100"
                style={{ width: '100%', padding: 8, border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 14, height: 40, boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{t.overbought}</div>
              <input
                type="number"
                value={rsiConfig.overbought ?? 70}
                onChange={(e) => onConfigChange(indicator, [{ ...rsiConfig, overbought: parseInt(e.target.value) || 70 }])}
                min="0"
                max="100"
                style={{ width: '100%', padding: 8, border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 14, height: 40, boxSizing: 'border-box' }}
              />
            </div>
          </div>
        </div>
        {colorPaletteOpen && colorPaletteOpen.index === 0 && (
          <ColorPalettePopup
            currentColor={rsiConfig.color}
            onSelect={(color) => onConfigChange(indicator, [{ ...rsiConfig, color }])}
            onClose={() => setColorPaletteOpen(null)}
            position={colorPaletteOpen.position}
            colorTitle={t.colorPaletteTitle}
          />
        )}
      </div>
    );
  }

  // MACD
  if (indicator === 'macd') {
    const macdConfig = config[0] as MACDConfig;
    return (
      <div>
        <div className="indicator-settings-title">{info.title}</div>
        <div className="indicator-settings-desc">{info.desc}</div>
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{t.ind_macd}</div>
              <div
                className="period-color-picker"
                style={{ background: macdColors.line, width: '100%', height: 40, cursor: 'pointer', borderRadius: 6, border: '1px solid #e0e0e0' }}
                onClick={(e) => handleColorClick(e, undefined, 'macd-line')}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{t.signal}</div>
              <div
                className="period-color-picker"
                style={{ background: macdColors.signal, width: '100%', height: 40, cursor: 'pointer', borderRadius: 6, border: '1px solid #e0e0e0' }}
                onClick={(e) => handleColorClick(e, undefined, 'macd-signal')}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{t.bullish}</div>
              <div
                className="period-color-picker"
                style={{ background: macdConfig.histUpColor || '#26a69a', width: '100%', height: 40, cursor: 'pointer', borderRadius: 6, border: '1px solid #e0e0e0' }}
                onClick={(e) => handleColorClick(e, undefined, 'hist-up')}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{t.bearish}</div>
              <div
                className="period-color-picker"
                style={{ background: macdConfig.histDownColor || '#ef5350', width: '100%', height: 40, cursor: 'pointer', borderRadius: 6, border: '1px solid #e0e0e0' }}
                onClick={(e) => handleColorClick(e, undefined, 'hist-down')}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{t.fast}</div>
              <input
                type="number"
                value={macdConfig.fastPeriod}
                onChange={(e) => onConfigChange(indicator, [{ ...macdConfig, fastPeriod: parseInt(e.target.value) || 12 }])}
                min="1"
                max="500"
                style={{ width: '100%', padding: 8, border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 14, height: 40, boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{t.slow}</div>
              <input
                type="number"
                value={macdConfig.slowPeriod}
                onChange={(e) => onConfigChange(indicator, [{ ...macdConfig, slowPeriod: parseInt(e.target.value) || 26 }])}
                min="1"
                max="500"
                style={{ width: '100%', padding: 8, border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 14, height: 40, boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{t.signal}</div>
              <input
                type="number"
                value={macdConfig.signalPeriod}
                onChange={(e) => onConfigChange(indicator, [{ ...macdConfig, signalPeriod: parseInt(e.target.value) || 9 }])}
                min="1"
                max="500"
                style={{ width: '100%', padding: 8, border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 14, height: 40, boxSizing: 'border-box' }}
              />
            </div>
          </div>
        </div>
        {colorPaletteOpen && colorPaletteOpen.type === 'macd-line' && (
          <ColorPalettePopup
            currentColor={macdColors.line}
            onSelect={(color) => onMacdColorsChange({ ...macdColors, line: color })}
            onClose={() => setColorPaletteOpen(null)}
            position={colorPaletteOpen.position}
            colorTitle={t.colorPaletteTitle}
          />
        )}
        {colorPaletteOpen && colorPaletteOpen.type === 'macd-signal' && (
          <ColorPalettePopup
            currentColor={macdColors.signal}
            onSelect={(color) => onMacdColorsChange({ ...macdColors, signal: color })}
            onClose={() => setColorPaletteOpen(null)}
            position={colorPaletteOpen.position}
            colorTitle={t.colorPaletteTitle}
          />
        )}
        {colorPaletteOpen && colorPaletteOpen.type === 'hist-up' && (
          <ColorPalettePopup
            currentColor={macdConfig.histUpColor || '#26a69a'}
            onSelect={(color) => onConfigChange(indicator, [{ ...macdConfig, histUpColor: color }])}
            onClose={() => setColorPaletteOpen(null)}
            position={colorPaletteOpen.position}
            colorTitle={t.colorPaletteTitle}
          />
        )}
        {colorPaletteOpen && colorPaletteOpen.type === 'hist-down' && (
          <ColorPalettePopup
            currentColor={macdConfig.histDownColor || '#ef5350'}
            onSelect={(color) => onConfigChange(indicator, [{ ...macdConfig, histDownColor: color }])}
            onClose={() => setColorPaletteOpen(null)}
            position={colorPaletteOpen.position}
            colorTitle={t.colorPaletteTitle}
          />
        )}
      </div>
    );
  }

  // Bollinger Bands
  if (indicator === 'bbands') {
    const bbConfig = config[0] as BollingerBandsConfig;
    return (
      <div>
        <div className="indicator-settings-title">{info.title}</div>
        <div className="indicator-settings-desc">{info.desc}</div>
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{t.upper}</div>
              <div
                className="period-color-picker"
                style={{ background: bbConfig.upperColor, width: '100%', height: 40, cursor: 'pointer', borderRadius: 6, border: '1px solid #e0e0e0' }}
                onClick={(e) => handleColorClick(e, undefined, 'bb-upper')}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{t.middle}</div>
              <div
                className="period-color-picker"
                style={{ background: bbConfig.middleColor, width: '100%', height: 40, cursor: 'pointer', borderRadius: 6, border: '1px solid #e0e0e0' }}
                onClick={(e) => handleColorClick(e, undefined, 'bb-middle')}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{t.lower}</div>
              <div
                className="period-color-picker"
                style={{ background: bbConfig.lowerColor, width: '100%', height: 40, cursor: 'pointer', borderRadius: 6, border: '1px solid #e0e0e0' }}
                onClick={(e) => handleColorClick(e, undefined, 'bb-lower')}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{t.period}</div>
              <input
                type="number"
                value={bbConfig.value}
                onChange={(e) => onConfigChange(indicator, [{ ...bbConfig, value: parseInt(e.target.value) || 20 }])}
                min="1"
                max="500"
                style={{ width: '100%', padding: 8, border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 14, height: 40 }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{t.stdDev}</div>
              <input
                type="number"
                value={bbConfig.stdDev}
                onChange={(e) => onConfigChange(indicator, [{ ...bbConfig, stdDev: parseFloat(e.target.value) || 2 }])}
                min="0.5"
                max="5"
                step="0.1"
                style={{ width: '100%', padding: 8, border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 14, height: 40 }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{t.thickness}</div>
              <div
                style={{ width: '100%', height: 40, border: '1px solid #e0e0e0', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 500, cursor: 'pointer', background: 'white' }}
                onClick={() => onConfigChange(indicator, [{ ...bbConfig, thickness: (bbConfig.thickness % 5) + 1 }])}
              >
                {bbConfig.thickness}px
              </div>
            </div>
          </div>
        </div>
        {colorPaletteOpen && colorPaletteOpen.type === 'bb-upper' && (
          <ColorPalettePopup
            currentColor={bbConfig.upperColor}
            onSelect={(color) => onConfigChange(indicator, [{ ...bbConfig, upperColor: color }])}
            onClose={() => setColorPaletteOpen(null)}
            position={colorPaletteOpen.position}
            colorTitle={t.colorPaletteTitle}
          />
        )}
        {colorPaletteOpen && colorPaletteOpen.type === 'bb-middle' && (
          <ColorPalettePopup
            currentColor={bbConfig.middleColor}
            onSelect={(color) => onConfigChange(indicator, [{ ...bbConfig, middleColor: color }])}
            onClose={() => setColorPaletteOpen(null)}
            position={colorPaletteOpen.position}
            colorTitle={t.colorPaletteTitle}
          />
        )}
        {colorPaletteOpen && colorPaletteOpen.type === 'bb-lower' && (
          <ColorPalettePopup
            currentColor={bbConfig.lowerColor}
            onSelect={(color) => onConfigChange(indicator, [{ ...bbConfig, lowerColor: color }])}
            onClose={() => setColorPaletteOpen(null)}
            position={colorPaletteOpen.position}
            colorTitle={t.colorPaletteTitle}
          />
        )}
      </div>
    );
  }

  // Stochastic
  if (indicator === 'stochastic') {
    const stochConfig = config[0] as StochasticConfig;
    return (
      <div>
        <div className="indicator-settings-title">{info.title}</div>
        <div className="indicator-settings-desc">{info.desc}</div>
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{t.kLine}</div>
              <div
                className="period-color-picker"
                style={{ background: stochConfig.kColor, width: '100%', height: 40, cursor: 'pointer', borderRadius: 6, border: '1px solid #e0e0e0' }}
                onClick={(e) => handleColorClick(e, undefined, 'stoch-k')}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{t.dLine}</div>
              <div
                className="period-color-picker"
                style={{ background: stochConfig.dColor, width: '100%', height: 40, cursor: 'pointer', borderRadius: 6, border: '1px solid #e0e0e0' }}
                onClick={(e) => handleColorClick(e, undefined, 'stoch-d')}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{t.kPeriod}</div>
              <input
                type="number"
                value={stochConfig.kPeriod}
                onChange={(e) => onConfigChange(indicator, [{ ...stochConfig, kPeriod: parseInt(e.target.value) || 14 }])}
                min="1" max="500"
                style={{ width: '100%', padding: 8, border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 14, height: 40, boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{t.dPeriod}</div>
              <input
                type="number"
                value={stochConfig.dPeriod}
                onChange={(e) => onConfigChange(indicator, [{ ...stochConfig, dPeriod: parseInt(e.target.value) || 3 }])}
                min="1" max="500"
                style={{ width: '100%', padding: 8, border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 14, height: 40, boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{t.smooth}</div>
              <input
                type="number"
                value={stochConfig.smooth}
                onChange={(e) => onConfigChange(indicator, [{ ...stochConfig, smooth: parseInt(e.target.value) || 3 }])}
                min="1" max="500"
                style={{ width: '100%', padding: 8, border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 14, height: 40, boxSizing: 'border-box' }}
              />
            </div>
          </div>
        </div>
        {colorPaletteOpen && colorPaletteOpen.type === 'stoch-k' && (
          <ColorPalettePopup
            currentColor={stochConfig.kColor}
            onSelect={(color) => onConfigChange(indicator, [{ ...stochConfig, kColor: color }])}
            onClose={() => setColorPaletteOpen(null)}
            position={colorPaletteOpen.position}
            colorTitle={t.colorPaletteTitle}
          />
        )}
        {colorPaletteOpen && colorPaletteOpen.type === 'stoch-d' && (
          <ColorPalettePopup
            currentColor={stochConfig.dColor}
            onSelect={(color) => onConfigChange(indicator, [{ ...stochConfig, dColor: color }])}
            onClose={() => setColorPaletteOpen(null)}
            position={colorPaletteOpen.position}
            colorTitle={t.colorPaletteTitle}
          />
        )}
      </div>
    );
  }

  // VWAP
  if (indicator === 'vwap') {
    const vwapConfig = config[0] as VWAPConfig;
    return (
      <div>
        <div className="indicator-settings-title">{info.title}</div>
        <div className="indicator-settings-desc">{info.desc}</div>
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{t.color}</div>
              <div
                className="period-color-picker"
                style={{ background: vwapConfig.color, width: '100%', height: 40, cursor: 'pointer', borderRadius: 6, border: '1px solid #e0e0e0' }}
                onClick={(e) => handleColorClick(e, 0)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{t.thickness}</div>
              <div
                style={{ width: '100%', height: 40, border: '1px solid #e0e0e0', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 500, cursor: 'pointer', background: 'white' }}
                onClick={() => onConfigChange(indicator, [{ ...vwapConfig, thickness: (vwapConfig.thickness % 5) + 1 }])}
              >
                {vwapConfig.thickness}px
              </div>
            </div>
          </div>
        </div>
        {colorPaletteOpen && colorPaletteOpen.index === 0 && (
          <ColorPalettePopup
            currentColor={vwapConfig.color}
            onSelect={(color) => onConfigChange(indicator, [{ ...vwapConfig, color }])}
            onClose={() => setColorPaletteOpen(null)}
            position={colorPaletteOpen.position}
            colorTitle={t.colorPaletteTitle}
          />
        )}
      </div>
    );
  }

  // ATR, Williams %R — single period indicator (like RSI but without oversold/overbought)
  if (indicator === 'atr' || indicator === 'williamsR') {
    const singleConfig = config[0] as IndicatorConfig;
    return (
      <div>
        <div className="indicator-settings-title">{info.title}</div>
        <div className="indicator-settings-desc">{info.desc}</div>
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{t.color}</div>
              <div
                className="period-color-picker"
                style={{ background: singleConfig.color, width: '100%', height: 40, cursor: 'pointer', borderRadius: 6, border: '1px solid #e0e0e0' }}
                onClick={(e) => handleColorClick(e, 0)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{t.period}</div>
              <input
                type="number"
                value={singleConfig.value}
                onChange={(e) => onConfigChange(indicator, [{ ...singleConfig, value: parseInt(e.target.value) || 14 }])}
                min="1" max="500"
                style={{ width: '100%', padding: 8, border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 14, height: 40, boxSizing: 'border-box' }}
              />
            </div>
          </div>
        </div>
        {colorPaletteOpen && colorPaletteOpen.index === 0 && (
          <ColorPalettePopup
            currentColor={singleConfig.color}
            onSelect={(color) => onConfigChange(indicator, [{ ...singleConfig, color }])}
            onClose={() => setColorPaletteOpen(null)}
            position={colorPaletteOpen.position}
            colorTitle={t.colorPaletteTitle}
          />
        )}
      </div>
    );
  }

  // SMA, EMA - 다중 기간 지원
  return (
    <div>
      <div className="indicator-settings-title">{info.title}</div>
      <div className="indicator-settings-desc">{info.desc}</div>
      {(config as IndicatorConfig[]).map((cfg, index) => (
        <div key={index} className="indicator-period-row">
          <span className="period-label-col">{t.periodN(index + 1)}</span>
          <div
            className="period-color-picker"
            style={{ background: cfg.color, cursor: 'pointer' }}
            onClick={(e) => handleColorClick(e, index)}
          />
          <div
            className="period-thickness-display"
            onClick={() => {
              const newConfigs = [...(config as IndicatorConfig[])];
              newConfigs[index] = { ...newConfigs[index], thickness: (newConfigs[index].thickness % 5) + 1 };
              onConfigChange(indicator, newConfigs);
            }}
          >
            {cfg.thickness}px
          </div>
          <select
            className="period-source-dropdown"
            value={cfg.source}
            onChange={(e) => {
              const newConfigs = [...(config as IndicatorConfig[])];
              newConfigs[index] = { ...newConfigs[index], source: e.target.value as any };
              onConfigChange(indicator, newConfigs);
            }}
          >
            <option value="close">{t.src_close}</option>
            <option value="open">{t.src_open}</option>
            <option value="high">{t.src_high}</option>
            <option value="low">{t.src_low}</option>
          </select>
          <input
            type="number"
            className="period-value-field"
            value={cfg.value}
            onChange={(e) => {
              const newConfigs = [...(config as IndicatorConfig[])];
              newConfigs[index] = { ...newConfigs[index], value: parseInt(e.target.value) || 1 };
              onConfigChange(indicator, newConfigs);
            }}
            min="1"
            max="500"
          />
          {config.length > 1 && (
            <button
              className="period-delete-btn"
              onClick={() => {
                const newConfigs = (config as IndicatorConfig[]).filter((_, i) => i !== index);
                onConfigChange(indicator, newConfigs);
              }}
            >
              ×
            </button>
          )}
        </div>
      ))}
      <button
        className="add-period-button"
        onClick={() => {
          const lastConfig = (config as IndicatorConfig[])[config.length - 1];
          const nextColorIdx = (DEFAULT_COLORS.indexOf(lastConfig.color) + 1) % DEFAULT_COLORS.length;
          onConfigChange(indicator, [
            ...(config as IndicatorConfig[]),
            {
              color: DEFAULT_COLORS[nextColorIdx],
              thickness: 2,
              source: 'close' as const,
              value: info.defaultValue
            }
          ]);
        }}
      >
        {t.addPeriod}
      </button>
      {colorPaletteOpen && colorPaletteOpen.index !== undefined && (
        <ColorPalettePopup
          currentColor={(config as IndicatorConfig[])[colorPaletteOpen.index].color}
          onSelect={(color) => {
            const newConfigs = [...(config as IndicatorConfig[])];
            newConfigs[colorPaletteOpen.index!] = { ...newConfigs[colorPaletteOpen.index!], color };
            onConfigChange(indicator, newConfigs);
          }}
          onClose={() => setColorPaletteOpen(null)}
          position={colorPaletteOpen.position}
          colorTitle={t.colorPaletteTitle}
        />
      )}
    </div>
  );
}
