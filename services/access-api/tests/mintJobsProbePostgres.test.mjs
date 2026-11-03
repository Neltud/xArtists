/** Isolated PostgreSQL test; NEVER accepts arbitrary remote DATABASE_URL. */
import assert from 'node:assert/strict'
import { test } from 'node:test'

const raw = process.env.TEST_MINT_READINESS_DATABASE_URL || ''
const allowed = (() => {
  try {
    const u = new URL(raw)
    return process.env.ALLOW_EPHEMERAL_MINT_READINESS_PG_TEST === '1' &&
      u.protocol === 'postgres:' &&
      ['localhost', '127.0.0.1'].includes(u.hostname) &&
      u.pathname === '/xartists_mint_readiness_probe'
  } catch { return false }
})()

test('mint_jobs readiness checks actual configured DB without schema writes', {
  skip: !allowed && 'Only disposable local PostgreSQL fixture accepted',
}, async () => {
  process.env.DATABASE_URL = raw
  process.env.PGSSL = '0'
  const { default: pg } = await import('pg')
  const { probeMintJobsStore } = await import('../src/mintDispatch.mjs')
  const client = new pg.Client({ connectionString: raw, ssl: false })
  await client.connect()
  try {
    const count = () => client.query(
      "SELECT to_regclass('public.mint_jobs') IS NOT NULL AS ready",
    )
    assert.equal((await count()).rows[0].ready, false)
    const first = await probeMintJobsStore({ fresh: true })
    assert.deepEqual(first, { ok: false, backend: 'postgres', table_ready: false })
    assert.equal((await count()).rows[0].ready, false, 'probe must not create table')

    await client.query('CREATE TABLE public.mint_jobs (order_id TEXT PRIMARY KEY)')
    const ready = await probeMintJobsStore({ fresh: true })
    assert.deepEqual(ready, { ok: true, backend: 'postgres', table_ready: true })
    assert.deepEqual(await probeMintJobsStore(), ready)
    assert.equal((await count()).rows[0].ready, true)
    console.log('MINT_JOBS_SCHEMA_READINESS_OK: no DDL from probe; only safe boolean returned')
  } finally {
    await client.end()
  }
})
