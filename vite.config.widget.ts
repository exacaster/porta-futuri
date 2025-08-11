import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Widget-specific Vite configuration for < 50KB bundle
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@widget': path.resolve(__dirname, './src/widget'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/widget/index.tsx'),
      name: 'PortaFuturi',
      fileName: 'widget',
      formats: ['iife'],
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
        inlineDynamicImports: true,
        // Ensure single file output for widget
        manualChunks: undefined,
      },
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log'],
      },
      mangle: {
        safari10: true,
      },
      format: {
        comments: false,
      },
    },
    // Target < 50KB compressed
    chunkSizeWarningLimit: 50,
    cssCodeSplit: false,
    sourcemap: false,
  },
  define: {
    'process.env.NODE_ENV': '"production"',
  },
})