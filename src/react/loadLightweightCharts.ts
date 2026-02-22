/**
 * Auto-loads the LightweightCharts standalone script if not already present.
 *
 * Resolution order:
 * 1. window.LightweightCharts already exists → resolve immediately
 * 2. Try script paths in order:
 *    a. /lightweight-charts.standalone.production.js
 *    b. /lib/lightweight-charts.standalone.production.js
 * 3. Cache the promise so concurrent callers share the same load
 * 4. Reset cache on failure so retry is possible
 */

declare global {
  interface Window {
    LightweightCharts?: any;
  }
}

let loadPromise: Promise<any> | null = null;

const SCRIPT_PATHS = [
  '/lightweight-charts.standalone.production.js',
  '/lib/lightweight-charts.standalone.production.js',
];

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      script.remove();
      reject(new Error(`Failed to load script: ${src}`));
    };
    document.head.appendChild(script);
  });
}

export function loadLightweightCharts(): Promise<any> {
  // Already loaded
  if (typeof window !== 'undefined' && window.LightweightCharts) {
    return Promise.resolve(window.LightweightCharts);
  }

  // Return cached promise if loading in progress
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    // Try each path in order
    for (const path of SCRIPT_PATHS) {
      try {
        await loadScript(path);
        if (window.LightweightCharts) {
          return window.LightweightCharts;
        }
      } catch {
        // try next path
      }
    }
    throw new Error(
      '[loadLightweightCharts] Could not load LightweightCharts from any known path. ' +
      'Please include the standalone script in your HTML or place it at one of: ' +
      SCRIPT_PATHS.join(', ')
    );
  })();

  // Reset cache on failure so retry is possible
  loadPromise.catch(() => {
    loadPromise = null;
  });

  return loadPromise;
}
