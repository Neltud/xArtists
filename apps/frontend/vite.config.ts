import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/xArtists/',
  resolve: {
    alias: {
      // sdk-dapp@3 main points at ./__commonjs (dir) — break Vite entry resolution
      '@multiversx/sdk-dapp': path.resolve(__dirname, 'node_modules/@multiversx/sdk-dapp'),
    },
  },
  optimizeDeps: {
    exclude: ['@multiversx/sdk-dapp'],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2020',
    cssCodeSplit: true,
    sourcemap: false,
    minify: 'esbuild',
    reportCompressedSize: true,
    chunkSizeWarningLimit: 900,
    assetsInlineLimit: 4096,
    modulePreload: { polyfill: true },
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('@multiversx')) return 'mx-sdk'
          if (id.includes('@tanstack')) return 'virtual'
          if (id.includes('react-router')) return 'router'
          if (id.includes('react-dom') || id.includes('/react/')) return 'react'
        },
      },
    },
  },
  esbuild: {
    drop: process.env.NODE_ENV === 'production' || process.env.CI ? ['console', 'debugger'] : [],
    legalComments: 'none',
  },
  server: {
    port: 3000,
  },
})
