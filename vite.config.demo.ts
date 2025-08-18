import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

// Demo site Vite configuration for iTelecom e-commerce
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'redirect-to-demo',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/') {
            res.writeHead(302, { Location: '/demo.html' });
            res.end();
            return;
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
        main: path.resolve(__dirname, 'demo.html'),
      },
    },
  },
  server: {
    port: 3002,
    open: '/demo.html',
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:54321',
        changeOrigin: true,
      },
    },
    // Redirect root path to demo.html
    middlewareMode: false,
  },
  preview: {
    port: 3002,
  },
  appType: 'mpa',
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