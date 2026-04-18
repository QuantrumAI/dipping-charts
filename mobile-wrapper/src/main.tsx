import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
// @ts-ignore — alias resolved by Vite config
import { FullFeaturedChart } from 'dipping-charts/react';
// @ts-ignore — alias resolved by Vite config
import 'dipping-charts/react/FullFeaturedChart.css';
// @ts-ignore — matches the React source types
import type { CandleData, TimeFrame } from 'dipping-charts/src/types';

// ----------------------------------------------------------------------------
// URL param contract (Flutter → WebView):
//   ?symbol=QQQ
//   &timeframe=1d            (optional, default 1d)
//   &apiBase=https://dippinginlabs.com/api/v1
//   &token=<JWT bearer, no "Bearer " prefix>
//   &theme=dark|light        (optional, default dark)
//   &avgPrice=588.63         (optional — draws a horizontal avg-price line)
//   &locale=ko|en            (optional, default ko)
// ----------------------------------------------------------------------------

interface BootParams {
  symbol: string;
  timeframe: TimeFrame;
  apiBase: string;
  token: string | null;
  theme: 'dark' | 'light';
  locale: 'ko' | 'en';
  avgPrice: number | null;
  // When provided, the host (Flutter) has already fetched candles and we
  // skip the in-WebView network call — WebViews loaded from file:// origin
  // cannot talk to the Django CORS-protected API directly.
  candles: CandleData[] | null;
  // Drawings + indicator picks synced from the web app's settings. Mobile
  // disables the drawing toolbar (`enableDrawingTools={false}`) so these
  // render read-only.
  lineTools: any[] | null;
  indicatorState: any | null;
}

function parseParams(): BootParams {
  const p = new URLSearchParams(window.location.search);
  const symbol = (p.get('symbol') ?? '').toUpperCase();
  const tfRaw = (p.get('timeframe') ?? '1d') as TimeFrame;
  const apiBase = p.get('apiBase') ?? 'https://dippinginlabs.com/api/v1';
  const token = p.get('token');
  const theme = (p.get('theme') === 'light' ? 'light' : 'dark') as 'dark' | 'light';
  const locale = (p.get('locale') === 'en' ? 'en' : 'ko') as 'ko' | 'en';
  const avgRaw = p.get('avgPrice');
  const avgPrice = avgRaw && !Number.isNaN(parseFloat(avgRaw)) ? parseFloat(avgRaw) : null;
  return {
    symbol,
    timeframe: tfRaw,
    apiBase,
    token,
    theme,
    locale,
    avgPrice,
    candles: null,
    lineTools: null,
    indicatorState: null,
  };
}

// Intraday 5/15/30/60-min bars come from `/candles/aggregated/?interval=N`
// which resamples the raw 1-min stream server-side. Daily+ use the plain
// `/candles/?timeframe=...` endpoint. Returns [path-suffix, query-params].
function backendEndpoint(tf: TimeFrame): { path: string; params: Record<string, string> } {
  const limit = '300';
  switch (tf) {
    case '1m':
      return { path: 'candles/', params: { timeframe: '1m', limit } };
    case '5m':
      return { path: 'candles/aggregated/', params: { interval: '5', limit } };
    case '15m':
      return { path: 'candles/aggregated/', params: { interval: '15', limit } };
    case '30m':
      return { path: 'candles/aggregated/', params: { interval: '30', limit } };
    case '1h':
      return { path: 'candles/aggregated/', params: { interval: '60', limit } };
    case '1d':
      return { path: 'candles/', params: { timeframe: '1d', limit } };
    case '1w':
      return { path: 'candles/', params: { timeframe: '1w', limit } };
    case '1M':
      return { path: 'candles/', params: { timeframe: '1M', limit } };
    case '1y':
      return { path: 'candles/', params: { timeframe: '1Y', limit } };
  }
}

// Backend candle shape: { timestamp: ISO string, open, high, low, close, volume }
async function fetchCandles(
  { symbol, apiBase, token }: BootParams,
  tf: TimeFrame,
): Promise<CandleData[]> {
  if (!symbol) return [];
  const { path, params } = backendEndpoint(tf);
  const url = new URL(`${apiBase.replace(/\/$/, '')}/stocks/${symbol}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const data = await res.json();
  const raw: any[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.candles)
      ? data.candles
      : [];
  const out: CandleData[] = [];
  for (const r of raw) {
    const ts = typeof r?.timestamp === 'string'
      ? Math.floor(new Date(r.timestamp).getTime() / 1000)
      : typeof r?.time === 'number'
        ? r.time
        : null;
    if (ts == null || Number.isNaN(ts)) continue;
    const open = Number(r?.open);
    const high = Number(r?.high);
    const low = Number(r?.low);
    const close = Number(r?.close);
    const volume = Number(r?.volume ?? 0);
    if ([open, high, low, close].some((v) => Number.isNaN(v))) continue;
    out.push({ time: ts, open, high, low, close, volume });
  }
  // Backend may not guarantee ordering; lightweight-charts requires ascending.
  out.sort((a, b) => a.time - b.time);
  // Dedup identical timestamps keeping the later entry.
  const seen = new Map<number, CandleData>();
  for (const c of out) seen.set(c.time, c);
  return Array.from(seen.values());
}

function App({ boot }: { boot: BootParams }) {
  const [timeframe, setTimeframe] = useState<TimeFrame>(boot.timeframe);
  const [candles, setCandles] = useState<CandleData[]>(boot.candles ?? []);
  const [loading, setLoading] = useState(boot.candles == null);
  const [error, setError] = useState<string | null>(null);

  // Keep local state in sync when the host re-injects params (e.g. on
  // timeframe change replies, avgPrice changes, symbol nav).
  useEffect(() => {
    if (boot.candles != null) {
      setCandles(boot.candles);
      setLoading(false);
      setError(null);
    }
  }, [boot.candles]);

  const load = useCallback(
    async (tf: TimeFrame) => {
      // When Flutter pre-loaded candles we never reach this path for the
      // initial render. Only runs if the wrapper is opened in a browser
      // (dev) or asked to fetch directly.
      if (boot.candles != null) return;
      setLoading(true);
      setError(null);
      try {
        const data = await fetchCandles(boot, tf);
        setCandles(data);
      } catch (err) {
        console.error('[chart] fetch failed', err);
        setError('차트 데이터를 불러오지 못했어요');
      } finally {
        setLoading(false);
      }
    },
    [boot],
  );

  useEffect(() => {
    if (boot.candles != null) return;
    void load(timeframe);
  }, [load, timeframe, boot.candles]);

  const handleTimeframeChange = useCallback((tf: TimeFrame) => {
    setTimeframe(tf);
    // Ask host for new candles when the user switches timeframe. If host
    // doesn't handle the message we silently stay on the current data.
    try {
      (window as any).FlutterChannel?.postMessage(
        JSON.stringify({ type: 'timeframe', value: tf }),
      );
    } catch {
      /* ignore */
    }
  }, []);

  const priceLines = useMemo(() => {
    if (boot.avgPrice == null) return undefined;
    return [
      {
        price: boot.avgPrice,
        color: '#FF9F43',
        lineWidth: 2,
        lineStyle: 'dashed' as const,
        label: `평단 ${boot.avgPrice.toFixed(2)}`,
        axisLabelVisible: true,
      },
    ];
  }, [boot.avgPrice]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <FullFeaturedChart
        key={`${boot.symbol}-${timeframe}`}
        locale={boot.locale}
        theme={boot.theme}
        symbol={boot.symbol}
        data={candles}
        loading={loading}
        error={error}
        defaultTimeframe={timeframe}
        onTimeframeChange={handleTimeframeChange}
        enableTimeframes={true}
        enableIndicators={true}
        // Drawing tools are a desktop dropdown — keep off on mobile until we
        // rewrite the toolbar for touch. Existing drawings still render via
        // `initialLineTools` (useLineTools draws them regardless of toolbar).
        enableDrawingTools={false}
        showVolume={true}
        priceLines={priceLines}
        // Drawings + indicator state synced from the PC web app.
        initialLineTools={boot.lineTools ?? undefined}
        initialIndicatorState={boot.indicatorState ?? undefined}
        // Keeps mobile-only indicator tweaks isolated per symbol; we never
        // write these back to the backend (that's the PC app's job).
        indicatorStorageKey={`chart-indicators-${boot.symbol}`}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Boot gate.
//
// Flutter's webview_flutter cannot append a query string to loadFlutterAsset,
// so we expose `window.__startDippingChart(params)` which the host Flutter
// side calls via runJavaScript() after the page finishes loading. This also
// lets the host push updated params (symbol/timeframe change, token refresh)
// without navigating.
//
// When opened directly in a browser with `?symbol=…` we auto-start with URL
// query params so the wrapper is still testable standalone via `npm run dev`.
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    __startDippingChart?: (params: Partial<BootParams>) => void;
    __LIGHTWEIGHT_CHARTS_READY__?: boolean;
  }
}

let rootInstance: ReactDOM.Root | null = null;

function showBootError(msg: string) {
  const el = document.getElementById('boot-error');
  if (!el) return;
  el.style.display = 'block';
  el.textContent = msg;
}

function render(boot: BootParams) {
  const rootEl = document.getElementById('root');
  if (!rootEl) {
    showBootError('차트 컨테이너를 찾을 수 없어요.');
    return;
  }
  if (!(window as any).LightweightCharts) {
    showBootError('LightweightCharts 엔진이 로드되지 않았어요.');
    return;
  }
  if (!rootInstance) {
    rootInstance = ReactDOM.createRoot(rootEl);
  }
  rootInstance.render(<App boot={boot} />);
}

function normalizeBoot(partial: Partial<BootParams>): BootParams {
  const fallback = parseParams();
  return {
    symbol: (partial.symbol ?? fallback.symbol ?? '').toUpperCase(),
    timeframe: (partial.timeframe ?? fallback.timeframe) as TimeFrame,
    apiBase: partial.apiBase ?? fallback.apiBase,
    token: partial.token ?? fallback.token,
    theme: (partial.theme ?? fallback.theme) as 'dark' | 'light',
    locale: (partial.locale ?? fallback.locale) as 'ko' | 'en',
    avgPrice: partial.avgPrice ?? fallback.avgPrice,
    candles: partial.candles ?? null,
    lineTools: partial.lineTools ?? null,
    indicatorState: partial.indicatorState ?? null,
  };
}

window.__startDippingChart = (params) => {
  try {
    render(normalizeBoot(params ?? {}));
  } catch (err) {
    console.error('[chart] boot failed', err);
    showBootError('차트를 초기화하지 못했어요.');
  }
};

// Dev fallback — when opened with ?symbol= in a browser, just boot.
if (window.location.search && parseParams().symbol) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => render(parseParams()), {
      once: true,
    });
  } else {
    render(parseParams());
  }
}
