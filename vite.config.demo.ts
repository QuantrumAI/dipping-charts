import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: './demo',
  publicDir: '../lib',
  resolve: {
    alias: {
      'dipping-charts/react': resolve(__dirname, './src/react'),
      'dipping-charts': resolve(__dirname, './src'),
    }
  },
  server: {
    open: true,
    port: 3000
  }
});
