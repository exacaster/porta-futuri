import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'redirect-to-admin',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/') {
            res.writeHead(302, { Location: '/admin.html' });
            res.end();
            return;
          }
          next();
        });
      },
    },
  ],
  root: '.',
  cacheDir: '.vite-admin',
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
    rollupOptions: {
      input: {
        admin: path.resolve(__dirname, 'admin.html'),
      },
    },
  },
  base: '/',
  server: {
    port: 5174,
    open: '/admin.html',
    headers: {
      'Cache-Control': 'no-store',
    },
    // Serve the dist folder as static files during development
    fs: {
      allow: ['..', '.', './dist'],
    },
    // Redirect root path to admin.html
    middlewareMode: false,
  },
  preview: {
    port: 5174,
  },
  appType: 'mpa',
  // Configure public directory to serve static files
  publicDir: 'public',
});