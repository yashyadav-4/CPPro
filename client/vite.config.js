import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React — almost never changes
          'vendor-react':    ['react', 'react-dom', 'react-router-dom'],
          // Three.js stack — very large, changes only on version bumps
          'vendor-three':    ['three', '@react-three/fiber', '@react-three/drei'],
          // Heavy daily-topic libs — isolated so /daily route doesn't block other pages
          'vendor-mermaid':  ['mermaid'],
          'vendor-prism':    ['react-syntax-highlighter'],
          'vendor-markdown': ['react-markdown', 'remark-gfm'],
          // UI utilities
          'vendor-charts':   ['recharts'],
          'vendor-motion':   ['framer-motion'],
          'vendor-icons':    ['lucide-react'],
        },
      },
    },
  },
})
