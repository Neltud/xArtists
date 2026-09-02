import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/xArtists/',
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
      external: (id) => id.includes('@multiversx/sdk-dapp'),
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('@multiversx') && !id.includes('sdk-dapp')) return 'mx-sdk'
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
