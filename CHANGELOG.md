# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-02-23

Initial open-source release.

### Added

- **9 Technical Indicators**
  - SMA (Simple Moving Average)
  - EMA (Exponential Moving Average)
  - RSI (Relative Strength Index)
  - MACD (Moving Average Convergence Divergence)
  - Bollinger Bands
  - Stochastic Oscillator (%K / %D)
  - ATR (Average True Range, Wilder's RMA)
  - VWAP (Volume Weighted Average Price)
  - Williams %R
- **6 Drawing Tools** — Trend Line, Horizontal, Vertical, Rectangle, Fibonacci, Text
- **8 Timeframes** — 1m, 5m, 15m, 30m, 1H, D, W, M
- **React Component** — `<FullFeaturedChart />` with indicators, drawing tools, timeframes, overlays
- **Vanilla TS/JS** — Indicator functions usable without React
- **Realtime Updates** — Push candle updates via `realtimeCandle` prop
- **Drawing Persistence** — Save/restore drawings via `initialLineTools` / `onLineToolsChange`
- **Indicator Persistence** — Save/restore indicator state via `indicatorStorageKey` or `onIndicatorStateChange`
- **i18n** — English (default) and Korean
- **Keyboard Shortcuts** — Shift+Mouse snap, Ctrl+Z undo, Escape cancel, context menu
- **Standalone JS Auto-loading** — `loadLightweightCharts()` removes the need for manual `<script>` tags
- **Full TypeScript Definitions**
- **109 Unit Tests** — Indicator accuracy, React component, backwards compatibility
