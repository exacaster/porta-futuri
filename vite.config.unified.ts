import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: '.',
  cacheDir: '/tmp/vite-unified-cache',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@admin': path.resolve(__dirname, './src/admin'),
      '@widget': path.resolve(__dirname, './src/widget'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },
  server: {
    port: 5178,
    open: '/admin.html',
    proxy: {
      '/': {
        target: 'http://localhost:5178/admin.html',
        bypass: (req) => {
          // Redirect root to admin.html
          if (req.url === '/') {
            return '/admin.html';
          }
          // Let other requests pass through
          return null;
        }
      }
    }
  },
  build: {
    rollupOptions: {
      input: {
        admin: path.resolve(__dirname, 'admin.html'),
        widget: path.resolve(__dirname, 'index.html'),
      },
    },
  },
});