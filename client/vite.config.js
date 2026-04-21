import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'

const renderRedirectsPlugin = {
  name: 'render-redirects',
  closeBundle() {
    fs.writeFileSync('dist/_redirects', '/*  /index.html  200\n', { encoding: 'utf8' })
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
