/** Cross-origin access is limited to official xArtists public frontends. */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { startServer } from './server-fixture.mjs'

const PAGES = 'https://neltud.github.io'
const RENDER = 'https://xartists-services-and-products.onrender.com'

test('both public frontend origins can read JSON, including a direct Render deep-link', async () => {
  const server = await startServer({ CORS_ORIGIN: PAGES })
  try {
    for (const origin of [PAGES, RENDER]) {
      const response = await fetch(server.base + '/v1/tro/bridge/status', {
        headers: { Origin: origin },
      })
      assert.equal(response.status, 200)
      assert.equal(response.headers.get('access-control-allow-origin'), origin)
      assert.match(response.headers.get('vary') || '', /origin/i)
      assert.equal(response.headers.get('access-control-allow-credentials'), null)
      const body = await response.json()
      assert.equal(body.bridge.status, 'disabled')
      assert.equal(body.sale.directSaleLive, false)
    }
  } finally { await server.close() }
})

test('untrusted origins receive no CORS grant and no credentials header', async () => {
  const server = await startServer({ CORS_ORIGIN: PAGES })
  try {
    for (const origin of ['https://attacker.example', 'null', 'https://neltud.github.io.evil.example']) {
      const response = await fetch(server.base + '/health', { headers: { Origin: origin } })
      assert.equal(response.status, 200)
      assert.equal(response.headers.get('access-control-allow-origin'), null)
      assert.match(response.headers.get('vary') || '', /origin/i)
      assert.equal(response.headers.get('access-control-allow-credentials'), null)
    }
  } finally { await server.close() }
})

test('OPTIONS preflight grants only exact official origin, with no live business action', async () => {
  const server = await startServer({ CORS_ORIGIN: PAGES })
  try {
    for (const origin of [PAGES, RENDER]) {
      const response = await fetch(server.base + '/v1/tro/bridge/status', {
        method: 'OPTIONS',
        headers: { Origin: origin, 'Access-Control-Request-Method': 'GET' },
      })
      assert.equal(response.status, 204)
      assert.equal(response.headers.get('access-control-allow-origin'), origin)
      assert.match(response.headers.get('access-control-allow-methods') || '', /GET/)
    }
    const blocked = await fetch(server.base + '/v1/tro/bridge/status', {
      method: 'OPTIONS',
      headers: { Origin: 'https://evil.example', 'Access-Control-Request-Method': 'GET' },
    })
    assert.equal(blocked.status, 204)
    assert.equal(blocked.headers.get('access-control-allow-origin'), null)
  } finally { await server.close() }
})
