# dipping-charts

Financial charting library with technical indicators and drawing tools, built on [TradingView Lightweight Charts](https://github.com/tradingview/lightweight-charts).

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![npm version](https://img.shields.io/npm/v/dipping-charts.svg)](https://www.npmjs.com/package/dipping-charts)

## Features

- **9 Technical Indicators** — SMA, EMA, RSI, MACD, Bollinger Bands, Stochastic, ATR, VWAP, Williams %R
- **6 Drawing Tools** — Trend Line, Horizontal, Vertical, Rectangle, Fibonacci, Text
- **8 Timeframes** — 1m, 5m, 15m, 30m, 1H, D, W, M
- **React Component** — Drop-in `<FullFeaturedChart />` with all features
- **Vanilla TS/JS** — Use the chart engine and indicators without React
- **Realtime Updates** — Push candle updates via props
- **i18n** — English (default) and Korean, extensible
- **TypeScript** — Full type definitions included

## Quick Start

### React

```bash
npm install dipping-charts lightweight-charts
```

Copy the standalone chart script to your `public/` folder:

```bash
cp node_modules/dipping-charts/lib/lightweight-charts.standalone.production.js public/
```

Add it to your `index.html`:

```html
<script src="/lightweight-charts.standalone.production.js"></script>
```

Use the component:

```tsx
import { FullFeaturedChart } from 'dipping-charts/react';
import 'dipping-charts/react/style.css';

function App() {
  return <FullFeaturedChart height={600} data={candles} />;
}
```

### Indicators Only (No React)

```ts
import { sma, ema, rsi, macd, bollingerBands } from 'dipping-charts/indicators';

const closes = candles.map(c => c.close);
const sma20 = sma(closes, 20);
const rsi14 = rsi(closes, 14);
```

## API

### `<FullFeaturedChart />` Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `CandleData[]` | — | OHLCV candle data |
| `height` | `number` | `600` | Chart height in pixels |
| `locale` | `'en' \| 'ko'` | `'en'` | UI language |
| `enableTimeframes` | `boolean` | `true` | Show timeframe buttons |
| `enableIndicators` | `boolean` | `true` | Show indicator panel |
| `enableDrawingTools` | `boolean` | `true` | Show drawing tools |
| `defaultTimeframe` | `TimeFrame` | `'5m'` | Initial timeframe |
| `onTimeframeChange` | `(tf: TimeFrame) => void` | — | Timeframe change callback |
| `realtimeCandle` | `CandleData` | — | Push realtime candle update |
| `loading` | `boolean` | `false` | Show loading overlay |
| `error` | `string \| null` | `null` | Show error overlay |
| `showVolume` | `boolean` | `true` | Show volume bars |
| `priceLines` | `PriceLine[]` | — | Horizontal price lines (e.g. avg cost) |
| `initialLineTools` | `LineTool[]` | — | Restore saved drawings |
| `onLineToolsChange` | `(tools: LineTool[]) => void` | — | Drawing change callback |
| `onDrawingToolClick` | `() => boolean` | — | Gate drawing tool access (return `false` to block) |
| `indicatorStorageKey` | `string` | — | localStorage key for indicator persistence |

### `CandleData`

```ts
interface CandleData {
  time: number;   // Unix timestamp (seconds)
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}
```

### Indicators

All indicator functions accept an array of numbers and return an array of the same length (padded with `NaN` for insufficient data).

```ts
sma(data: number[], period: number): number[]
ema(data: number[], period: number): number[]
rsi(data: number[], period?: number): number[]  // default: 14
macd(data: number[], fast?: number, slow?: number, signal?: number): MACDResult
bollingerBands(data: number[], period?: number, stdDev?: number): BollingerBandsResult
```

## Package Exports

| Entry Point | Description |
|-------------|-------------|
| `dipping-charts` | Core types and utilities |
| `dipping-charts/react` | React component + hooks |
| `dipping-charts/react/style.css` | Component styles |
| `dipping-charts/indicators` | Indicator functions (no React dependency) |
| `dipping-charts/chart` | Low-level chart engine |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Shift + Mouse` | Snap to High/Low |
| `Right Click` | Context menu (color, width) |
| `Double Click` | Edit text annotation |
| `Ctrl/Cmd + Z` | Undo last deleted drawing |
| `Escape` | Cancel active tool / deselect |

## Development

```bash
git clone https://github.com/QuantrumAI/dipping-charts.git
cd dipping-charts
npm install
npm run demo        # Interactive demo
npm test            # Run tests
npm run type-check  # TypeScript check
npm run build       # Build library
```

## Project Structure

```
src/
├── react/              # React component & hooks
│   ├── FullFeaturedChart.tsx
│   ├── FullFeaturedChart.css
│   ├── locale.ts       # i18n (en/ko)
│   ├── components/     # IndicatorSettings, etc.
│   └── hooks/          # useChart, useIndicators, useLineTools, useShiftSnap
├── indicators/         # Pure TS indicator implementations
├── components/         # TradingChart (vanilla)
├── types/              # Shared TypeScript types
└── utils/              # Validation utilities
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and guidelines.

## License

[MIT](./LICENSE) — Copyright (c) 2025 [QuantrumAI](https://github.com/QuantrumAI)

This library includes a custom build of [TradingView Lightweight Charts](https://github.com/tradingview/lightweight-charts) (Apache-2.0).
See [NOTICE](./NOTICE) for third-party license details.
