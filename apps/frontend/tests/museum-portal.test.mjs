import assert from 'node:assert/strict'
import { test } from 'node:test'
import { loadSource } from './load-source.mjs'

test('museum uses loadTextureWithFallback', () => {
  const src = loadSource('src/components/museum/MuseumWebGLHallLive.tsx')
  assert.match(src, /loadTextureWithFallback/)
})

test('texture helper exposes CORS fallback chain', () => {
  const src = loadSource('src/lib/loadTextureWithFallback.ts')
  assert.match(src, /corsSafeUrls|weserv|wsrv/)
})
