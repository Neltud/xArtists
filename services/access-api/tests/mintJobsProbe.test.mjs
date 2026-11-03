/** Read-only mint jobs HTTP probe: never expose secrets or modify schema. */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { startServer } from './server-fixture.mjs'

const endpoint = '/v1/ops/mint-jobs-store/status'

test('file backend is not a valid mint_jobs readiness signal', async () => {
  const server = await startServer({ DATABASE_URL: '' })
  try {
    const response = await fetch(server.base + endpoint)
    assert.equal(response.status, 503)
    assert.equal(response.headers.get('cache-control'), 'no-store')
    assert.deepEqual(await response.json(), {
      ok: false, backend: 'file', table_ready: false,
    })
  } finally { await server.close() }
})

test('unreachable database fails closed with no credential exposure', async () => {
  const server = await startServer({
    DATABASE_URL: 'postgres://test_user:topsecret@127.0.0.1:1/fixture_db',
    PGSSL: '0',
  })
  try {
    const response = await fetch(server.base + endpoint)
    assert.equal(response.status, 503)
    const raw = await response.text()
    assert.deepEqual(JSON.parse(raw), {
      ok: false, backend: 'postgres', table_ready: false,
    })
    assert.equal(raw.includes('topsecret'), false)
    assert.equal(raw.includes('test_user'), false)
    assert.equal(raw.includes('127.0.0.1'), false)
    const cached = await fetch(server.base + endpoint)
    assert.equal(cached.status, 503)
    assert.equal(await cached.text(), raw)
  } finally { await server.close() }
})
