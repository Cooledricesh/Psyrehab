import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { readFileSync } from 'fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/store': path.resolve(__dirname, './src/store'),
      '@/assets': path.resolve(__dirname, './src/assets'),
    },
  },
  build: {
    // Output directory
    outDir: 'dist',
    // Generate source maps for production debugging
    sourcemap: true,
    // Optimize build performance
    target: 'es2020',
    // Chunk size warning limit (500kb)
    chunkSizeWarningLimit: 500,
    // Rollup options for better tree shaking and chunking
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor libraries into their own chunks
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          query: ['@tanstack/react-query'],
          ui: ['@radix-ui/react-slot', 'class-variance-authority', 'clsx', 'tailwind-merge'],
        },
      },
    },
    // Minification options
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
      },
    },
  },
  // Development server configuration
  server: {
    port: 5173,
    host: true,
    strictPort: true,
    // HTTPS configuration for development
    https: process.env.VITE_SSL_CERT && process.env.VITE_SSL_KEY ? {
      cert: readFileSync(process.env.VITE_SSL_CERT),
      key: readFileSync(process.env.VITE_SSL_KEY),
    } : false, // Only enable HTTPS if certificates are explicitly provided
    // Allow all hosts for ngrok tunneling
    hmr: {
      host: 'localhost',
    },
    // Proxy API requests to Express server
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  // Preview server configuration
  preview: {
    port: 4173,
    strictPort: true,
    host: true,
    // HTTPS for preview mode as well
    https: process.env.VITE_SSL_CERT && process.env.VITE_SSL_KEY ? {
      cert: readFileSync(process.env.VITE_SSL_CERT),
      key: readFileSync(process.env.VITE_SSL_KEY),
    } : false,
  },
  // Define environment variables for build optimization
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
  },
})
