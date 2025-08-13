import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: '.',
  cacheDir: '/tmp/vite-admin-cache',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@admin': path.resolve(__dirname, './src/admin'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@api': path.resolve(__dirname, './src/api'),
    },
  },
  build: {
    outDir: 'dist/admin',
    base: './',
    rollupOptions: {
      input: {
        admin: path.resolve(__dirname, 'admin.html'),
      },
    },
  },
  base: './',
  server: {
    port: 5174,
    open: '/admin.html',
    headers: {
      'Cache-Control': 'no-store',
    },
  },
});