import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Vite's dev server doesn't run Vercel serverless functions — forward
    // /api/* to the real deployed one so it works locally too, instead of
    // only once deployed.
    proxy: {
      '/api': {
        target: 'https://onwun-crm-2.vercel.app',
        changeOrigin: true,
      },
    },
  },
})
