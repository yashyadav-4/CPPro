import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'

// Writes _redirects with guaranteed LF endings so Render's parser doesn't choke on Windows CRLF
const renderRedirectsPlugin = {
  name: 'render-redirects',
  closeBundle() {
    const outDir = path.resolve(__dirname, 'dist')
    fs.writeFileSync(path.join(outDir, '_redirects'), '/*  /index.html  200\n', { encoding: 'utf8' })
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
