/**
 * PostgreSQL order-store readiness integration against a disposable CI database.
 * This file deliberately rejects non-local and production-like database URLs.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'

const raw = process.env.TEST_DATABASE_URL || ''
const allowed = (() => {
  try {
    const u = new URL(raw)
    return process.env.ALLOW_EPHEMERAL_MINT_PG_TEST === '1' &&
      u.protocol === 'postgres:' &&
      ['localhost', '127.0.0.1'].includes(u.hostname) &&
      u.pathname === '/xartists_mint_probe'
  } catch { return false }
})()

test('read-only orders readiness reports real PostgreSQL connectivity and schema', {
  skip: !allowed && 'Only runs with explicitly opted-in disposable localhost database',
}, async () => {
  process.env.DATABASE_URL = raw
  process.env.PGSSL = '0'
  const { default: pg } = await import('pg')
  const { probeOrdersStore } = await import('../src/orders.mjs')
  const client = new pg.Client({ connectionString: raw, ssl: false })
  await client.connect()
  try {
    // No table exists at the start; the probe must NOT auto-migrate/write.
    const before = await client.query(
      "SELECT to_regclass('public.paybox_orders') IS NOT NULL AS ready",
    )
    assert.equal(before.rows[0].ready, false)
    const first = await probeOrdersStore({ fresh: true })
    assert.deepEqual(first, { ok: false, backend: 'postgres', table_ready: false })
    const afterProbe = await client.query(
      "SELECT to_regclass('public.paybox_orders') IS NOT NULL AS ready",
    )
    assert.equal(afterProbe.rows[0].ready, false, 'readiness probe must not create schema')

    // Test fixture creates a minimal table in the EPHEMERAL database only.
    await client.query('CREATE TABLE public.paybox_orders (id TEXT PRIMARY KEY)')
    const ready = await probeOrdersStore({ fresh: true })
    assert.deepEqual(ready, { ok: true, backend: 'postgres', table_ready: true })
    assert.deepEqual(await probeOrdersStore(), ready)
    console.log('POSTGRES_READINESS_OK: no DDL during probe; table and connection verified')
  } finally {
    await client.end()
  }
})
