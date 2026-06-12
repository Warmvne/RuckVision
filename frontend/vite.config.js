import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/matches': 'http://localhost:8000',
      '/segments': 'http://localhost:8000',
      '/stats': 'http://localhost:8000',
      '/hls': 'http://localhost:8000',
      '/thumbnails': 'http://localhost:8000',
      '/videos': 'http://localhost:8000',
    }
  }
})
