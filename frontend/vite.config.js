import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['buffer', 'crypto', 'stream', 'util'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  optimizeDeps: {
    exclude: ['@imgly/background-removal'],
  },
  server: {
    proxy: {
      '/api/pump': {
        target: 'https://frontend-api-v3.pump.fun',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/pump/, ''),
        secure: true,
      },
      '/api/ipfs': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/api/health': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
