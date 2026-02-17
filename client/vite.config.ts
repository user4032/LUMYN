import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  root: __dirname,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@services': path.resolve(__dirname, './src/services'),
      '@store': path.resolve(__dirname, './src/store'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@api': path.resolve(__dirname, './src/api'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@i18n': path.resolve(__dirname, './src/i18n'),
      '@assets': path.resolve(__dirname, './src/assets'),
    },
  },
  server: {
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/auth': {
        target: 'http://localhost:4777',
        changeOrigin: true,
      },
      '/users': {
        target: 'http://localhost:4777',
        changeOrigin: true,
      },
      '/friends': {
        target: 'http://localhost:4777',
        changeOrigin: true,
      },
      '/servers': {
        target: 'http://localhost:4777',
        changeOrigin: true,
      },
      '/messages': {
        target: 'http://localhost:4777',
        changeOrigin: true,
      },
      '/chats': {
        target: 'http://localhost:4777',
        changeOrigin: true,
      },
      '/notifications': {
        target: 'http://localhost:4777',
        changeOrigin: true,
      },
      '/threads': {
        target: 'http://localhost:4777',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:4777',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:4777',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
