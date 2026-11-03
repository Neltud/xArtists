/** Public operational order-store probe: read only, never returns DB secrets. */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { startServer } from './server-fixture.mjs'

const endpoint = '/v1/ops/orders-store/status'

test('file fallback is not mistaken for a healthy production PostgreSQL store', async () => {
  const server = await startServer({ DATABASE_URL: '' })
  try {
    const health = await (await fetch(server.base + '/health')).json()
    assert.equal(health.ok, true)
    assert.equal(health.service, 'access-api')
    assert.equal(health.orders_backend, 'file')

    const response = await fetch(server.base + endpoint)
    assert.equal(response.status, 503)
    assert.equal(response.headers.get('content-type')?.includes('application/json'), true)
    assert.equal(response.headers.get('cache-control'), 'no-store')
    assert.deepEqual(await response.json(), {
      ok: false, backend: 'file', table_ready: false,
    })
  } finally { await server.close() }
})

test('unreachable PostgreSQL fails closed and redacts connection details', async () => {
  const server = await startServer({
    DATABASE_URL: 'postgres://probe_user:test-only-password@127.0.0.1:1/fixture_db',
    PGSSL: '0',
  })
  try {
    // /health is process liveness and must not falsely claim DB connectivity.
    const health = await (await fetch(server.base + '/health')).json()
    assert.equal(health.ok, true)
    assert.equal(health.orders_backend, 'postgres')

    const response = await fetch(server.base + endpoint)
    assert.equal(response.status, 503)
    const raw = await response.text()
    assert.deepEqual(JSON.parse(raw), {
      ok: false, backend: 'postgres', table_ready: false,
    })
    assert.equal(raw.includes('test-only-password'), false)
    assert.equal(raw.includes('probe_user'), false)
    assert.equal(raw.includes('127.0.0.1'), false)

    // Repeated calls use the bounded cached result; never reveal errors.
    const duplicate = await fetch(server.base + endpoint)
    assert.equal(duplicate.status, 503)
    assert.equal(await duplicate.text(), raw)
  } finally { await server.close() }
})
