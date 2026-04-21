import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const renderRedirectsPlugin = {
  name: 'render-redirects',
  apply: 'build',
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: '_redirects',
      source: '/*  /index.html  200\n',
    })
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), renderRedirectsPlugin],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})
