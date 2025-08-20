import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createReadStream } from 'fs';

// Demo site Vite configuration for iTelecom e-commerce
export default defineConfig({
  plugins: [
    react(),
    // Custom plugin to serve widget files directly from disk
    {
      name: 'serve-widget-files',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Intercept requests for widget files
          if (req.url?.startsWith('/dist/')) {
            const filePath = path.join(__dirname, req.url);
            
            // Check if file exists
            if (fs.existsSync(filePath)) {
              // Set CORS headers
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
              res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
              
              // Set content type based on file extension
              if (filePath.endsWith('.js')) {
                res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
              } else if (filePath.endsWith('.css')) {
                res.setHeader('Content-Type', 'text/css; charset=utf-8');
              } else if (filePath.endsWith('.json')) {
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
              }
              
              // Stream the file directly
              const stream = createReadStream(filePath);
              stream.pipe(res);
              return; // Don't call next() to prevent Vite from processing
            }
          }
          next();
        });
      },
    },
  ],
  css: {
    postcss: {
      plugins: [
        tailwindcss({ config: './tailwind.config.demo.js' }),
        autoprefixer(),
      ],
    },
  },
  root: '.',
  cacheDir: '.vite-demo',
  publicDir: 'public',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/demo-site'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@components': path.resolve(__dirname, './src/demo-site/components'),
      '@pages': path.resolve(__dirname, './src/demo-site/pages'),
      '@services': path.resolve(__dirname, './src/demo-site/services'),
      '@hooks': path.resolve(__dirname, './src/demo-site/hooks'),
      '@contexts': path.resolve(__dirname, './src/demo-site/contexts'),
      '@utils': path.resolve(__dirname, './src/demo-site/utils'),
      '@styles': path.resolve(__dirname, './src/demo-site/styles'),
    },
  },
  build: {
    outDir: 'dist/demo-site',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
    },
  },
  server: {
    port: 3002,
    open: true,
    cors: {
      origin: '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:54321',
        changeOrigin: true,
      },
    },
    fs: {
      // Allow serving files from project root
      allow: ['.'],
      strict: false,
    },
  },
  preview: {
    port: 3002,
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js',
      'lucide-react',
    ],
  },
});