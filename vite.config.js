import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ command }) => ({
  base: process.env.VITE_BASE_PATH || '/',
  define: {
    'import.meta.env.VITE_ADMIN_USERNAME': JSON.stringify(process.env.ADMIN_USERNAME || ''),
    'import.meta.env.VITE_ADMIN_PASSWORD': command === 'build' ? '""' : JSON.stringify(process.env.ADMIN_PASSWORD || ''),
  },
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${process.env.PORT || 3000}`,
        changeOrigin: true,
        timeout: 30000,
        proxyTimeout: 30000,
        onError: (err) => {
          console.error('[VITE PROXY ERROR]', err.code, err.message);
        },
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
  },
}))
