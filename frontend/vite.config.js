import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react() , tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimize build performance
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries into separate chunks
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'ui-vendor': ['framer-motion', 'react-hot-toast'],
          'utils-vendor': ['axios', 'clsx', 'tailwind-merge']
        }
      }
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable source maps for debugging in production
    sourcemap: false,
    // Optimize assets
    assetsInlineLimit: 4096,
    // Enable minification
    minify: 'esbuild'
  },
  server: {
    // Improve dev server performance
    hmr: {
      overlay: true
    }
  },
  optimizeDeps: {
    // Pre-bundle dependencies for faster loading
    include: [
      'react',
      'react-dom', 
      'react-router-dom',
      'framer-motion',
      'react-hot-toast',
      'axios',
      'clsx',
      'tailwind-merge'
    ]
  }
})
