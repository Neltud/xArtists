/** Real PostgreSQL smoke for private mint store diagnosis, strictly ephemeral CI. */
import test from 'node:test'
import assert from 'node:assert/strict'
import pg from 'pg'
import { inspectMintStore } from '../scripts/check-mint-store.mjs'

const DATABASE_NAME = 'xartists_mint_operator_ci'
const url = String(process.env.TEST_MINT_OPERATOR_DATABASE_URL || '')
let allowed = false
try {
  const parsed = new URL(url)
  allowed = process.env.ALLOW_EPHEMERAL_MINT_OPERATOR_PG_TEST === '1' &&
    parsed.hostname === '127.0.0.1' && parsed.pathname === '/' + DATABASE_NAME &&
    parsed.protocol === 'postgres:'
} catch { /* no database configured */ }

test('operator probe: absent table, actual schema, and restricted role on disposable PG', { skip: !allowed }, async () => {
  const root = new pg.Client({ connectionString: url, ssl: false })
  await root.connect()
  const probe = (connectionString = url) => inspectMintStore(new pg.Client({ connectionString, ssl: false }))
  try {
    assert.deepEqual(await probe(), { ok: false, stage: 'table', reason: 'table_missing' })

    // DDL is EXCLUSIVELY in this test fixture on the uniquely named local CI DB.
    await root.query(`CREATE TABLE public.mint_jobs (
      order_id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      payload JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`)
    assert.deepEqual(await probe(), {
      ok: true, stage: 'complete',
      reason: 'structure_and_declared_permissions_ready', delivery_verified: false,
    })

    await root.query('ALTER TABLE public.mint_jobs DROP COLUMN payload')
    assert.deepEqual(await probe(), { ok: false, stage: 'schema', reason: 'schema_mismatch' })
    await root.query("ALTER TABLE public.mint_jobs ADD COLUMN payload JSONB NOT NULL DEFAULT '{}'::jsonb")

    await root.query("CREATE ROLE xartists_mint_ci_reader LOGIN PASSWORD 'fixture-only-not-production'")
    await root.query('GRANT USAGE ON SCHEMA public TO xartists_mint_ci_reader')
    await root.query('GRANT SELECT, INSERT, UPDATE ON TABLE public.mint_jobs TO xartists_mint_ci_reader')
    const restrictedUrl = new URL(url)
    restrictedUrl.username = 'xartists_mint_ci_reader'
    restrictedUrl.password = 'fixture-only-not-production'
    assert.deepEqual(await probe(restrictedUrl.toString()), {
      ok: false, stage: 'permissions', reason: 'permissions_missing',
    })

    // The operator probe has never created a mint job or a delivery claim.
    const count = await root.query('SELECT COUNT(*)::int AS n FROM public.mint_jobs')
    assert.equal(count.rows[0].n, 0)
  } finally {
    await root.end()
  }
})
