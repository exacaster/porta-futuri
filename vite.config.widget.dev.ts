import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Widget-specific Vite configuration for development (includes React)
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
    outDir: 'dist',
    rollupOptions: {
      // Include React in the bundle for development
      external: [],
      output: {
        inlineDynamicImports: true,
        // Ensure single file output for widget
        manualChunks: undefined,
      },
    },
    minify: false,
    // Include source maps for debugging
    sourcemap: true,
    cssCodeSplit: false,
  },
  define: {
    'process.env.NODE_ENV': '"development"',
  },
})