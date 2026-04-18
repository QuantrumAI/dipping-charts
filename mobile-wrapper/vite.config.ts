import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { resolve } from 'path';

// Bundles the React entry + CSS into index.html so the Flutter WebView only
// needs two asset files: index.html (app) and
// lightweight-charts.standalone.production.js (engine, loaded via script tag).
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  resolve: {
    alias: {
      'dipping-charts/react': resolve(__dirname, '../src/react'),
      'dipping-charts': resolve(__dirname, '../src'),
    },
  },
  build: {
    outDir: resolve(__dirname, '../mobile-dist'),
    emptyOutDir: true,
    target: 'es2020',
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
