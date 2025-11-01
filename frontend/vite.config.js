import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ✅ Load environment variables (for proxy target)
const backendURL = process.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: backendURL,
        changeOrigin: true,
      }
    }
  }
})
