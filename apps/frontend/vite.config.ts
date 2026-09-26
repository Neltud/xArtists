import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const isSdkDapp = (id: string) =>
  id === '@multiversx/sdk-dapp' || id.startsWith('@multiversx/sdk-dapp/')

export default defineConfig({
  plugins: [react()],
  base: '/xArtists/',
  // Node shims — fixes "process is not defined" on Trade / sdk deps in browser
  define: {
    'process.env': '{}',
    'process.env.NODE_ENV': JSON.stringify(
      process.env.NODE_ENV === 'production' || process.env.CI ? 'production' : 'development',
    ),
    global: 'globalThis',
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
    reportCompressedSize: false,
    chunkSizeWarningLimit: 900,
    assetsInlineLimit: 4096,
    modulePreload: { polyfill: true },
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    rollupOptions: {
      external: (id) => isSdkDapp(id),
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('@walletconnect') || id.includes('sdk-wallet-connect')) return 'wc'
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
})
