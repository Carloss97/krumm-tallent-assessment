/* global process */
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const base = env.VITE_BASE_PATH || '/';
  return defineConfig({
    plugins: [react()],
    base,
  server: {
    host: '127.0.0.1',
    port: 5180,
    strictPort: true,
    allowedHosts: ['.trycloudflare.com', 'localhost', '127.0.0.1'],
    open: true,
    // Only enable API proxy during local development. This prevents the
    // preview server from attempting to proxy requests when the backend
    // is not running (which caused ECONNREFUSED errors).
    proxy: mode === 'development' ? {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      }
    } : undefined
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: true,
    testTimeout: 30000,
    hookTimeout: 30000,
    isolate: true,
    threads: true,
    maxThreads: 2,
    minThreads: 1,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html'],
      reportsDirectory: './coverage',
      thresholds: {
        lines: 40,
        functions: 40,
        branches: 30,
        statements: 40,
      },
    },
  },
  });
}

